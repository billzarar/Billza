import React, { useState } from 'react';
import {
  X,
  Check,
  Copy,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  BillItem,
  BillIconType,
  Currency,
  PaymentHistoryItem,
} from '../data/initialData';
import { BillIcon } from './BillIcons';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBill: (bill: Omit<BillItem, 'id'>) => void;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({ isOpen, onClose, onAddBill }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Internet');
  const [amount, setAmount] = useState('25.00');
  const [currency, setCurrency] = useState<Currency>('USDC');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly'>('monthly');
  const [dueDateLabel, setDueDateLabel] = useState('Wed 28 Oct');
  const [recipientAddress, setRecipientAddress] = useState(
    'GBSTELLAR9X4M2K8P7Q3R6T9V2W5Y8Z4B7D2F5H9J3K6L8M'
  );

  if (!isOpen) return null;

  const iconMap: Record<string, BillIconType> = {
    Internet: 'wifi',
    Electricity: 'bolt',
    Subscriptions: 'monitor',
    Insurance: 'shield',
    Rent: 'house',
    Water: 'drop',
    Education: 'grad',
    'Business utilities': 'building',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 25.0;
    const cleanAddr = recipientAddress.trim() || 'GBSTELLAR9X4M2K8P7Q3R6T9V2W5Y8Z4B7D2F5H9J3K6L8M';
    const shortAddr =
      currency === 'EUR'
        ? 'You pay directly'
        : `${cleanAddr.slice(0, 4)}…${cleanAddr.slice(-4)}`;
    const capCycle = frequency === 'monthly' ? 'Monthly' : 'Quarterly';

    onAddBill({
      name: name.trim() || `${category} bill`,
      category,
      frequency,
      subtitle: `${category}, ${frequency}`,
      billsSubtitle: `${category} · ${capCycle}`,
      dueDateLabel,
      dueInLabel: 'Due in 8 days',
      status: 'upcoming',
      amount: parsedAmount,
      currency,
      actionType: currency === 'EUR' ? 'mark' : 'pay',
      icon: iconMap[category] || 'house',
      recipientAddress: cleanAddr,
      recipientShort: shortAddr,
      inNext7Days: false,
      inNext14Days: true,
      inNext30Days: true,
    });
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/60 backdrop-blur-xs">
      <div className="w-full max-w-[480px] bg-white border border-[#DDE2EC] rounded-[12px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EEF1F6]">
          <h3 className="font-extrabold text-[22px] leading-[28px] text-[#0B1530]">
            Add new bill
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[#4A5675] hover:bg-[#F3F5F9] hover:text-[#0B1530]"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[14px] text-[#0B1530]">Bill name</label>
            <input
              type="text"
              required
              placeholder="e.g. Cloud hosting, Studio electricity"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-[42px] px-3.5 border border-[#DDE2EC] focus:border-[#4164D9] rounded-[8px] text-[14px] text-[#0B1530] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] text-[#0B1530]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-[42px] px-3 border border-[#DDE2EC] focus:border-[#4164D9] rounded-[8px] text-[14px] text-[#0B1530] bg-white focus:outline-none"
              >
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Business utilities">Business utilities</option>
                <option value="Internet">Internet</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Insurance">Insurance</option>
                <option value="Water">Water</option>
                <option value="Education">Education</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] text-[#0B1530]">Billing cycle</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'quarterly')}
                className="h-[42px] px-3 border border-[#DDE2EC] focus:border-[#4164D9] rounded-[8px] text-[14px] text-[#0B1530] bg-white focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] text-[#0B1530]">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-[42px] px-3.5 border border-[#DDE2EC] focus:border-[#4164D9] rounded-[8px] text-[14px] text-[#0B1530] tabular-nums focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] text-[#0B1530]">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="h-[42px] px-3 border border-[#DDE2EC] focus:border-[#4164D9] rounded-[8px] text-[14px] text-[#0B1530] bg-white focus:outline-none"
              >
                <option value="USDC">USDC (Stellar)</option>
                <option value="XLM">XLM (Stellar)</option>
                <option value="EUR">EUR (Direct)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] text-[#0B1530]">Next due date</label>
              <input
                type="text"
                value={dueDateLabel}
                onChange={(e) => setDueDateLabel(e.target.value)}
                className="h-[42px] px-3.5 border border-[#DDE2EC] focus:border-[#4164D9] rounded-[8px] text-[14px] text-[#0B1530] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] text-[#0B1530]">
                Stellar recipient address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="h-[42px] px-3.5 border border-[#DDE2EC] focus:border-[#4164D9] rounded-[8px] font-mono-redhat text-[12px] text-[#0B1530] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF1F6]">
            <button
              type="button"
              onClick={onClose}
              className="h-[42px] px-4 rounded-[10px] border border-[#DDE2EC] font-bold text-[14px] text-[#4A5675] hover:text-[#0B1530]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[42px] px-5 rounded-[10px] bg-[#0B1530] hover:bg-[#1A2A55] text-white font-bold text-[15px] flex items-center gap-2"
            >
              <Plus size={17} />
              <span>Save bill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PayBillModalProps {
  bill: BillItem | null;
  onClose: () => void;
  walletBalances: { USDC: number; XLM: number; EUR: number };
  onConfirmPayment: (bill: BillItem, onStatusUpdate?: (status: string) => void) => Promise<void> | void;
  onTopUpTestnet: (currency: Currency, amount: number) => void;
}

export const PayBillModal: React.FC<PayBillModalProps> = ({
  bill,
  onClose,
  walletBalances,
  onConfirmPayment,
  onTopUpTestnet,
}) => {
  if (!bill) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isEur = bill.currency === 'EUR';
  const currentBalance = walletBalances[bill.currency] || 0;
  const shortfall = isEur ? 0 : Math.max(0, bill.amount - currentBalance);
  const isShort = !isEur && shortfall > 0;

  const handlePayClick = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage('');
      setStatusMessage(isEur ? 'Confirming manual payment...' : 'Connecting to Stellar Wallets Kit...');
      await onConfirmPayment(bill, (msg) => setStatusMessage(msg));
    } catch (err: any) {
      console.error('Payment modal error:', err);
      setErrorMessage(err?.message || 'Payment execution failed');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/60 backdrop-blur-xs">
      <div className="w-full max-w-[480px] bg-white border border-[#DDE2EC] rounded-[14px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EEF1F6]">
          <div className="flex items-center gap-3">
            <div
              className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center ${
                bill.status === 'overdue'
                  ? 'bg-[#FDE8E6] text-[#B42318]'
                  : 'bg-[#EEF1F6] text-[#0B1530]'
              }`}
            >
              <BillIcon type={bill.icon} size={19} />
            </div>
            <div>
              <h3 className="font-extrabold text-[20px] leading-[24px] text-[#0B1530]">
                Pay {bill.name}
              </h3>
              <p className="text-[12px] font-medium text-[#4A5675]">{bill.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[#4A5675] hover:bg-[#F3F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Amount Banner */}
          <div className="bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] font-medium text-[#4A5675]">Amount due</span>
              <span className="text-[13px] font-semibold text-[#0B1530] mt-0.5">
                Due {bill.dueDateLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className="font-extrabold text-[28px] leading-[32px] text-[#0B1530]">
                {bill.amount.toFixed(2)}
              </span>
              <span className="font-extrabold text-[14px] text-[#0B1530]">{bill.currency}</span>
            </div>
          </div>

          {/* Recipient & Wallet Info */}
          <div className="flex flex-col gap-3 text-[13px]">
            <div className="flex items-center justify-between py-1.5 border-b border-[#EEF1F6]">
              <span className="text-[#4A5675] font-medium">Payment rail</span>
              <span className="font-bold text-[#0B1530]">
                {isEur ? 'Direct Bank Transfer' : 'Stellar Testnet'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#EEF1F6]">
              <span className="text-[#4A5675] font-medium">Recipient</span>
              {isEur ? (
                <span className="font-medium text-[#0B1530]">{bill.recipientName || 'External Vendor'}</span>
              ) : (
                <span className="font-mono-redhat text-[12px] text-[#0B1530]">
                  {bill.recipientAddress
                    ? `${bill.recipientAddress.slice(0, 7)}…${bill.recipientAddress.slice(-7)}`
                    : 'Stellar Vault'}
                </span>
              )}
            </div>
            {!isEur && (
              <>
                <div className="flex items-center justify-between py-1.5 border-b border-[#EEF1F6]">
                  <span className="text-[#4A5675] font-medium">Available in wallet</span>
                  <span
                    className={`font-bold tabular-nums ${
                      isShort ? 'text-[#B42318]' : 'text-[#1B7A4B]'
                    }`}
                  >
                    {currentBalance.toFixed(2)} {bill.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#4A5675] font-medium">Network fee</span>
                  <span className="font-mono-redhat text-[12px] text-[#4A5675]">0.00001 XLM</span>
                </div>
              </>
            )}
          </div>

          {/* Shortfall Alert */}
          {isShort && (
            <div className="bg-[#FDF1DD] border border-[#B8740A] rounded-[10px] p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-[#8A5300]">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="text-[12px] font-bold leading-[16px]">
                  Wallet short by {shortfall.toFixed(2)} {bill.currency}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onTopUpTestnet(bill.currency, Math.ceil(shortfall + 50))}
                className="h-[32px] px-3 bg-[#0B1530] text-white text-[12px] font-bold rounded-[8px] whitespace-nowrap shrink-0 hover:bg-[#1A2A55]"
              >
                + Fund Testnet {bill.currency}
              </button>
            </div>
          )}

          {/* Progress Banner */}
          {isProcessing && (
            <div className="bg-[#EEF4FF] border border-[#C7D7FE] rounded-[10px] p-3.5 flex items-center gap-3 text-[#1E40AF]">
              <div className="w-4 h-4 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="flex flex-col">
                <span className="text-[13px] font-bold leading-[17px]">
                  {statusMessage || 'Processing transaction...'}
                </span>
                <span className="text-[11px] text-[#3B82F6] mt-0.5">
                  Confirm the prompt in your wallet if requested.
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-[#FDE8E6] border border-[#F8A59E] rounded-[10px] p-3 flex items-start gap-2.5 text-[#B42318]">
              <AlertTriangle size={17} className="shrink-0 mt-0.5" />
              <span className="text-[12px] font-semibold leading-[16px]">{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="h-[44px] px-4 rounded-[10px] border border-[#DDE2EC] font-bold text-[14px] text-[#4A5675] hover:text-[#0B1530] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isShort || isProcessing}
              onClick={handlePayClick}
              className={`h-[44px] px-6 rounded-[10px] font-bold text-[15px] flex items-center gap-2 transition-colors ${
                isShort || isProcessing
                  ? 'bg-[#DDE2EC] text-[#77839F] cursor-not-allowed'
                  : 'bg-[#0B1530] hover:bg-[#4164D9] text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>
                    {isEur
                      ? 'Confirm & Mark Paid'
                      : `Sign & Pay ${bill.amount.toFixed(2)} ${bill.currency}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatusModalProps {
  bill: BillItem | null;
  payment: PaymentHistoryItem | null;
  onClose: () => void;
  onCompleteVerification?: (billId: string) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  bill,
  payment,
  onClose,
  onCompleteVerification,
}) => {
  const [copied, setCopied] = useState(false);

  if (!bill && !payment) return null;

  const title = bill ? bill.name : payment?.name || 'Transaction';
  const amount = bill ? bill.amount : payment?.amount || 0;
  const currency = bill ? bill.currency : payment?.currency || 'USDC';
  const status = bill ? bill.status : payment?.status || 'pending';
  const txHash =
    payment?.txHash || '8f3e9b2a4c1d7e6f5a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d';

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/60 backdrop-blur-xs">
      <div className="w-full max-w-[440px] bg-white border border-[#DDE2EC] rounded-[12px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EEF1F6]">
          <h3 className="font-extrabold text-[20px] leading-[24px] text-[#0B1530]">
            Payment status
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[#4A5675] hover:bg-[#F3F5F9]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] p-4">
            <div>
              <p className="font-bold text-[15px] text-[#0B1530]">{title}</p>
              <p className="text-[12px] text-[#4A5675] mt-0.5">
                {payment?.dateLabel || 'Today, 2:41 pm'}
              </p>
            </div>
            <div className="text-right tabular-nums">
              <span className="font-extrabold text-[20px] text-[#0B1530]">
                {amount.toFixed(2)} {currency}
              </span>
              <div className="mt-1">
                {status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#E6ECFB] text-[#2F4FBF] font-bold text-[11px]">
                    <Clock size={11} /> Verifying on Horizon
                  </span>
                )}
                {status === 'paid' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#E3F4EA] text-[#1B7A4B] font-bold text-[11px]">
                    <Check size={11} /> Verified on Stellar
                  </span>
                )}
                {status === 'failed' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#FDE8E6] text-[#B42318] font-bold text-[11px]">
                    <X size={11} /> Failed (Insufficient balance)
                  </span>
                )}
                {status === 'manual' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#EEF1F6] text-[#4A5675] font-bold text-[11px]">
                    Marked paid by you
                  </span>
                )}
              </div>
            </div>
          </div>

          {status !== 'manual' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#4A5675]">
                Stellar Testnet Transaction Hash
              </span>
              <div className="flex items-center justify-between gap-2 p-2.5 bg-[#F3F5F9] rounded-[8px] border border-[#DDE2EC]">
                <span className="font-mono-redhat text-[12px] text-[#0B1530] truncate">
                  {txHash}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#DDE2EC] rounded-[6px] text-[11px] font-bold text-[#0B1530] shrink-0 hover:bg-[#EEF1F6]"
                >
                  {copied ? <Check size={12} className="text-[#1B7A4B]" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            {status === 'pending' && onCompleteVerification && (
              <button
                type="button"
                onClick={() => {
                  onCompleteVerification(bill?.id || payment?.billId || 'bill-design');
                  onClose();
                }}
                className="h-[40px] px-4 bg-[#4164D9] hover:bg-[#2F4FBF] text-white font-bold text-[14px] rounded-[10px] flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Confirm Ledger Verification</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-[40px] px-5 bg-[#0B1530] text-white font-bold text-[14px] rounded-[10px]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: {
    addressShort: string;
    addressFull: string;
    network: string;
    connected: boolean;
    balances: { USDC: number; XLM: number; EUR: number };
  };
  onTopUpTestnet: (currency: Currency, amount: number) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onTopUpTestnet,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.addressFull);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/60 backdrop-blur-xs">
      <div className="w-full max-w-[440px] bg-white border border-[#DDE2EC] rounded-[12px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 bg-[#0B1530] text-white">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-[#5FD39A]/15 border border-[#5FD39A]/40 text-[#5FD39A] text-[11px] font-bold">
              <Check size={11} /> Connected · {wallet.network}
            </span>
            <h3 className="font-extrabold text-[20px] mt-1.5">Connected Stellar Wallet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[#A9B4CC] hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[#4A5675]">Public Key</span>
            <div className="flex items-center justify-between gap-2 p-2.5 bg-[#F3F5F9] border border-[#DDE2EC] rounded-[8px]">
              <span className="font-mono-redhat text-[12px] text-[#0B1530] truncate">
                {wallet.addressFull}
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#DDE2EC] rounded-[6px] text-[12px] font-bold text-[#0B1530] shrink-0"
              >
                {copied ? <Check size={12} className="text-[#1B7A4B]" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-semibold text-[#4A5675]">Testnet Asset Balances</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 border border-[#DDE2EC] rounded-[10px] flex flex-col justify-between gap-2">
                <span className="text-[12px] font-bold text-[#4A5675]">USDC (Circle Testnet)</span>
                <span className="font-extrabold text-[22px] text-[#0B1530] tabular-nums">
                  {wallet.balances.USDC.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onTopUpTestnet('USDC', 100)}
                  className="text-left text-[12px] font-bold text-[#2F4FBF] hover:underline flex items-center gap-1"
                >
                  <span>+ Drip 100 USDC</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>

              <div className="p-3.5 border border-[#DDE2EC] rounded-[10px] flex flex-col justify-between gap-2">
                <span className="text-[12px] font-bold text-[#4A5675]">XLM (Native Lumens)</span>
                <span className="font-extrabold text-[22px] text-[#0B1530] tabular-nums">
                  {wallet.balances.XLM.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onTopUpTestnet('XLM', 100)}
                  className="text-left text-[12px] font-bold text-[#2F4FBF] hover:underline flex items-center gap-1"
                >
                  <span>+ Friendbot 100 XLM</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-[42px] bg-[#0B1530] text-white font-bold text-[15px] rounded-[10px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
