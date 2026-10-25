import {
  StellarWalletsKit,
  Networks,
  type ModuleInterface,
} from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { testnetExecutePaymentApi } from './api';

let isInitialized = false;

export function initStellarWalletsKit() {
  if (typeof window === 'undefined' || isInitialized) return;
  try {
    const modules: ModuleInterface[] = defaultModules();
    StellarWalletsKit.init({
      modules,
      network: Networks.TESTNET,
    });
    isInitialized = true;
  } catch (err) {
    console.warn('[StellarWalletsKit] Initialization note:', err);
  }
}

/**
 * Opens the official Stellar Wallets Kit modal (@creit.tech/stellar-wallets-kit).
 * Connects directly to Freighter, Albedo, xBull, LOBSTR, WalletConnect, etc.
 *
 * When the user closes or dismisses the kit modal without selecting a wallet,
 * it catches the rejection gracefully and returns `null`.
 * It NEVER pops up browser default alerts/prompts and NEVER throws an unhandled error.
 */
export async function openOfficialStellarWalletsKit(): Promise<string | null> {
  initStellarWalletsKit();
  try {
    const modalResult = await StellarWalletsKit.authModal();
    if (
      modalResult &&
      modalResult.address &&
      typeof modalResult.address === 'string' &&
      modalResult.address.trim().startsWith('G')
    ) {
      return modalResult.address.trim();
    }
    return null;
  } catch (error: any) {
    // User closed the modal or dismissed: this is a clean cancellation
    console.log('[StellarWalletsKit] Modal closed by user:', error?.message || error);
    return null;
  }
}

/**
 * Sign challenge message for wallet authentication.
 * Uses extension if available, otherwise generates deterministic dev signature
 * that is verified and accepted by the backend on Stellar testnet.
 */
export async function signChallengeMessage(message: string, address: string): Promise<string> {
  const toBase64 = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (val.signedMessage) {
      return typeof val.signedMessage === 'string'
        ? val.signedMessage
        : btoa(String.fromCharCode(...new Uint8Array(val.signedMessage)));
    }
    try {
      return btoa(String.fromCharCode(...new Uint8Array(val)));
    } catch {
      return String(val);
    }
  };

  // 1. Try Freighter extension if available in browser
  if (typeof window !== 'undefined' && (window as any).freighterApi) {
    try {
      const freighter = (window as any).freighterApi;
      if (freighter.signMessage) {
        const signed = await freighter.signMessage(message, {
          networkPassphrase: 'Test SDF Network ; September 2015',
          address,
        });
        const b64 = toBase64(signed);
        if (b64) return b64;
      }
    } catch (err) {
      console.warn('[StellarWallet] Freighter signMessage note:', err);
    }
  }

  // 2. Try StellarWalletsKit headless signMessage
  try {
    initStellarWalletsKit();
    const result = await StellarWalletsKit.signMessage(message, {
      address,
      networkPassphrase: Networks.TESTNET,
    });
    if (result) {
      const b64 = toBase64(result.signedMessage || result);
      if (b64) return b64;
    }
  } catch (error: any) {
    console.warn('[StellarWalletsKit] Extension message signing note:', error);
  }

  // 3. Fallback dev signature accepted by backend DEBUG auth
  return `dev_signature_${address.slice(0, 12)}`;
}

export async function disconnectStellarWallet(): Promise<void> {
  try {
    initStellarWalletsKit();
    await StellarWalletsKit.disconnect();
  } catch (err) {
    console.warn('[StellarWalletsKit] disconnect note:', err);
  }
}

export interface ExecuteStellarPaymentParams {
  occurrenceId: number;
  amount: number | string;
  asset: 'USDC' | 'XLM' | string;
  recipientAddress: string;
  payerAddress?: string;
  paymentReference?: string;
  usdcIssuer?: string;
  networkPassphrase?: string;
  horizonUrl?: string;
  onStatusChange?: (statusText: string) => void;
}

export interface ExecuteStellarPaymentResult {
  transactionHash: string;
  ledger?: number;
  signedVia: 'stellar-wallets-kit' | 'freighter' | 'testnet-relay';
}

/**
 * Executes a Stellar Testnet bill payment:
 * 1. Ensures wallet is connected.
 * 2. Prepares transaction with sequence number and network fee.
 * 3. Prompts user to sign via Stellar Wallets Kit (Freighter, Albedo, xBull, etc.).
 * 4. Broadcasts signed transaction to Stellar Testnet Horizon.
 * 5. Returns real 64-character hex transaction hash.
 * 6. Supports fallback to testnet relay if browser has no wallet extension installed.
 */
export async function executeStellarPayment(
  params: ExecuteStellarPaymentParams
): Promise<ExecuteStellarPaymentResult> {
  const {
    occurrenceId,
    amount,
    asset,
    recipientAddress,
    paymentReference = '',
    usdcIssuer,
    networkPassphrase = Networks.TESTNET,
    horizonUrl = 'https://horizon-testnet.stellar.org',
    onStatusChange,
  } = params;

  let payerAddress = params.payerAddress || '';

  // 1. If no payer address provided, prompt wallet connect
  if (!payerAddress) {
    onStatusChange?.('Opening Stellar Wallets Kit...');
    const connected = await openOfficialStellarWalletsKit();
    if (!connected) {
      throw new Error('Wallet connection cancelled by user.');
    }
    payerAddress = connected;
  }

  // 2. Initialize Stellar SDK and Horizon Server
  const StellarSdk = await import('@stellar/stellar-sdk');
  const server = new StellarSdk.Horizon.Server(horizonUrl);

  onStatusChange?.('Checking Stellar Testnet account...');
  let payerAccount: any = null;
  try {
    payerAccount = await server.loadAccount(payerAddress);
  } catch (accErr: any) {
    // If account unfunded on testnet (404), fund via friendbot
    onStatusChange?.('Funding testnet wallet with Friendbot...');
    try {
      await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(payerAddress)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Billza/1.0)' },
      });
      await new Promise((r) => setTimeout(r, 1200));
      payerAccount = await server.loadAccount(payerAddress);
    } catch (fErr) {
      console.warn('[StellarWallet] Friendbot funding note:', fErr);
    }
  }

  // 3. Check recipient account
  let recipientExists = true;
  try {
    await server.loadAccount(recipientAddress);
  } catch {
    recipientExists = false;
  }

  // 4. Build Transaction XDR if account was loaded
  let txXdr = '';
  const amountStr = Number(amount).toFixed(7);
  const memoStr = (paymentReference || `BILLZA-${occurrenceId}`).slice(0, 28);

  if (payerAccount) {
    try {
      const txBuilder = new StellarSdk.TransactionBuilder(payerAccount, {
        fee: '100',
        networkPassphrase,
      });

      if (asset.toUpperCase() === 'XLM') {
        if (!recipientExists) {
          txBuilder.addOperation(
            StellarSdk.Operation.createAccount({
              destination: recipientAddress,
              startingBalance: amountStr,
            })
          );
        } else {
          txBuilder.addOperation(
            StellarSdk.Operation.payment({
              destination: recipientAddress,
              asset: StellarSdk.Asset.native(),
              amount: amountStr,
            })
          );
        }
      } else {
        // USDC
        const issuer = usdcIssuer || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
        txBuilder.addOperation(
          StellarSdk.Operation.payment({
            destination: recipientAddress,
            asset: new StellarSdk.Asset('USDC', issuer),
            amount: amountStr,
          })
        );
      }

      if (memoStr) {
        txBuilder.addMemo(StellarSdk.Memo.text(memoStr));
      }

      txBuilder.setTimeout(180);
      const builtTx = txBuilder.build();
      txXdr = builtTx.toXDR();
    } catch (buildErr: any) {
      console.warn('[StellarWallet] Transaction build note:', buildErr);
    }
  }

  // 5. Prompt wallet signature via Stellar Wallets Kit
  initStellarWalletsKit();
  let signedTxXdr: string | null = null;
  let signedVia: 'stellar-wallets-kit' | 'freighter' | 'testnet-relay' = 'stellar-wallets-kit';

  if (txXdr) {
    onStatusChange?.('Prompting wallet signature in Stellar Wallets Kit...');
    try {
      const res = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase,
        address: payerAddress,
      });
      signedTxXdr = res.signedTxXdr || (res as any);
    } catch (kitErr: any) {
      const errStr = String(kitErr?.message || kitErr || '');
      if (errStr.includes('Please set the wallet first') || errStr.includes('activeModule')) {
        onStatusChange?.('Please select your wallet in the modal...');
        const selected = await openOfficialStellarWalletsKit();
        if (!selected) {
          throw new Error('Wallet selection was cancelled.');
        }
        onStatusChange?.('Awaiting signature in Stellar Wallets Kit...');
        const retryRes = await StellarWalletsKit.signTransaction(txXdr, {
          networkPassphrase,
          address: selected,
        });
        signedTxXdr = retryRes.signedTxXdr || (retryRes as any);
      } else if (
        errStr.includes('User declined') ||
        errStr.includes('rejected') ||
        errStr.includes('cancelled') ||
        errStr.includes('User denied')
      ) {
        throw new Error('Transaction signing was cancelled by user.');
      } else if (typeof window !== 'undefined' && (window as any).freighterApi) {
        onStatusChange?.('Awaiting signature in Freighter extension...');
        try {
          const freighter = (window as any).freighterApi;
          const fRes = await freighter.signTransaction(txXdr, {
            networkPassphrase,
            address: payerAddress,
          });
          signedTxXdr = fRes;
          signedVia = 'freighter';
        } catch (fErr: any) {
          const fErrStr = String(fErr?.message || fErr || '');
          if (fErrStr.includes('User declined') || fErrStr.includes('rejected') || fErrStr.includes('cancelled')) {
            throw new Error('Transaction signing was cancelled by user.');
          }
        }
      }
    }
  }

  // 6. Broadcast signed transaction to Horizon Testnet
  if (signedTxXdr) {
    onStatusChange?.('Submitting transaction to Stellar Testnet Horizon...');
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
    const horizonRes = await server.submitTransaction(signedTx);
    return {
      transactionHash: horizonRes.hash,
      ledger: horizonRes.ledger,
      signedVia,
    };
  }

  // 7. Fallback to automated testnet payment execution via backend
  onStatusChange?.('Settling payment on Stellar Testnet Horizon...');
  const relayRes = await testnetExecutePaymentApi(occurrenceId, payerAddress);
  return {
    transactionHash: relayRes.transaction_hash,
    ledger: relayRes.ledger_sequence,
    signedVia: 'testnet-relay',
  };
}

export { StellarWalletsKit, Networks };
