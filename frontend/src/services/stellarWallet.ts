import {
  StellarWalletsKit,
  Networks,
  type ModuleInterface,
} from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';

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
    console.log('[StellarWalletsKit] Initialized successfully with modules:', modules.length);
  } catch (err) {
    console.warn('[StellarWalletsKit] Initialization fallback:', err);
  }
}

export async function openWalletModal(): Promise<string> {
  initStellarWalletsKit();
  try {
    const { address } = await StellarWalletsKit.authModal();
    return address;
  } catch (error: any) {
    console.error('[StellarWalletsKit] authModal error:', error);
    throw error;
  }
}

export async function signChallengeMessage(message: string, address: string): Promise<string> {
  initStellarWalletsKit();
  try {
    const result = await StellarWalletsKit.signMessage(message, {
      address,
      networkPassphrase: Networks.TESTNET,
    });
    return result.signedMessage;
  } catch (error: any) {
    console.error('[StellarWalletsKit] signMessage error:', error);
    throw error;
  }
}

export async function disconnectStellarWallet(): Promise<void> {
  try {
    await StellarWalletsKit.disconnect();
  } catch (err) {
    console.warn('[StellarWalletsKit] disconnect error:', err);
  }
}

export { StellarWalletsKit, Networks };
