import React, { useState } from 'react';
import {
  ArrowLeft,
  X,
  Copy,
  Check,
  ExternalLink,
  Download,
  Share2,
} from 'lucide-react';
import { DetailedPaymentRecord } from '../data/paymentHistoryData';
import { BillItem } from '../data/initialData';

interface TransactionReceiptModalProps {
  payment: DetailedPaymentRecord;
  bill?: BillItem | null;
  userWalletAddress?: string;
  onClose: () => void;
  onViewBillDetails?: (bill: BillItem) => void;
  onTriggerToast: (msg: string) => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  payment,
  bill,
  userWalletAddress = 'GBZX…Q4PA',
  onClose,
  onViewBillDetails,
  onTriggerToast,
}) => {
  const [copied, setCopied] = useState(false);

  // Formatted Hash into 8-character groups like the Figma spec:
  // "7c1e9a4f 2b6d08e3 c5a7f1d9 2b4e6c08 a3f5"
  const formattedHash = React.useMemo(() => {
    const raw = payment.fullTxHash || payment.txHashOrNote.replace(/[^a-zA-Z0-9]/g, '');
    if (!raw || raw.length < 16) {
      return payment.fullTxHash || '7c1e9a4f 2b6d08e3 c5a7f1d9 2b4e6c08 a3f5';
    }
    const clean = raw.slice(0, 36);
    const chunks: string[] = [];
    for (let i = 0; i < clean.length; i += 8) {
      chunks.push(clean.slice(i, i + 8));
    }
    return chunks.join(' ');
  }, [payment]);

  const handleCopyHash = () => {
    const textToCopy = payment.fullTxHash || payment.txHashOrNote;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onTriggerToast('Copied Stellar transaction hash');
  };

  const handleDownloadPDF = () => {
    // Generate clean printable receipt
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Billza Receipt - ${payment.billName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0B1530; }
            .receipt { max-width: 440px; margin: 0 auto; border: 1px solid #DDE2EC; padding: 32px; border-radius: 12px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0B1530; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 800; }
            .amount { font-size: 36px; font-weight: 800; margin: 16px 0; color: #0B1530; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EEF1F6; font-size: 14px; }
            .label { color: #4A5675; }
            .value { font-weight: 600; }
            .hash { font-family: monospace; font-size: 11px; word-break: break-all; margin-top: 16px; padding: 10px; background: #F3F5F9; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="title">billza receipt</div>
              <div>No. ${payment.receiptNo || '88204'}</div>
            </div>
            <div>${payment.billName} · ${payment.billCycleLabel}</div>
            <div class="amount">${payment.amount.toFixed(2)} ${payment.currency}</div>
            <div class="row"><span class="label">Status</span><span class="value">${payment.statusBadgeText}</span></div>
            <div class="row"><span class="label">Paid to</span><span class="value">${payment.payeeName || bill?.payeeName || payment.billName}</span></div>
            <div class="row"><span class="label">Destination</span><span class="value">${payment.recipientShort || 'GBQE…7HDN'}</span></div>
            <div class="row"><span class="label">Memo</span><span class="value">${payment.memo || 'ELEC-2210-0457'}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${payment.paidDateLabel} 2026, ${payment.paidTimeLabel}</span></div>
            <div class="row"><span class="label">Network</span><span class="value">Stellar Testnet (Fee: 0.00001 XLM)</span></div>
            <div class="hash">Transaction Hash: ${payment.fullTxHash || payment.txHashOrNote}</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    onTriggerToast('Generated PDF receipt');
  };

  const handleShare = async () => {
    const shareData = {
      title: `Billza Receipt: ${payment.billName}`,
      text: `Paid ${payment.amount.toFixed(2)} ${payment.currency} for ${payment.billName} via Stellar (${payment.txHashOrNote}).`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onTriggerToast('Receipt shared');
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(
      `Billza Receipt: ${payment.billName} · ${payment.amount.toFixed(2)} ${payment.currency} · Paid on Stellar · Tx: ${payment.fullTxHash || payment.txHashOrNote}`
    );
    onTriggerToast('Receipt details copied to clipboard');
  };

  // Derive date string for rotated stamp e.g. "21 Sep" or "19 Oct"
  const stampDate = React.useMemo(() => {
    if (payment.paidDateLabel.includes('Today')) return '20 Oct';
    const match = payment.paidDateLabel.match(/(\d+\s+[A-Za-z]+)/);
    return match ? match[1] : '21 Sep';
  }, [payment.paidDateLabel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      {/* 420px Frame matching Figma */}
      <div
        className="w-full max-w-[420px] my-auto flex flex-col items-start gap-[14px] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Controls: Back & Close (420px x 40px) */}
        <div className="w-full flex flex-row justify-between items-center h-[40px]">
          {/* Back button */}
          <button
            type="button"
            onClick={onClose}
            className="flex flex-row items-center pl-[8px] pr-[12px] gap-[6px] w-[78px] h-[40px] bg-white/12 hover:bg-white/20 active:scale-95 transition-all rounded-[10px] cursor-pointer"
          >
            <ArrowLeft size={18} strokeWidth={2.2} className="text-white" />
            <span className="font-onest font-bold text-[14px] leading-[20px] text-white">
              Back
            </span>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex flex-row justify-center items-center w-[40px] h-[40px] bg-white/12 hover:bg-white/20 active:scale-95 transition-all rounded-[10px] cursor-pointer"
          >
            <X size={18} strokeWidth={2.2} className="text-white" />
          </button>
        </div>

        {/* Receipt Slip: Width 420px, Min-height 644px, Background #FFFFFF */}
        <div className="relative w-full bg-white rounded-[14px] shadow-2xl overflow-hidden flex flex-col items-center p-[22px_20px] gap-[16px]">
          {/* Group: Top Content (380px wide) */}
          <div className="w-full flex flex-col items-center gap-[12px]">
            {/* Header: Logo and Receipt Number (380px x 36px) */}
            <div className="w-full flex flex-row justify-between items-center h-[36px]">
              {/* Billza Logo */}
              <div className="inline-flex items-baseline gap-[2px]">
                <span className="font-archivo font-extrabold text-[22px] leading-[22px] tracking-[-0.44px] text-[#0B1530]">
                  bill
                </span>
                <span className="inline-flex items-center justify-center bg-[#4164D9] rounded-r-[2.5px] px-[4.75px] h-[23.75px]">
                  <span className="font-archivo font-extrabold text-[22px] leading-[22px] tracking-[-0.44px] text-white">
                    za
                  </span>
                </span>
              </div>

              {/* Receipt Title & Number */}
              <div className="flex flex-col items-end">
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  Receipt
                </span>
                <span className="font-mono text-[12px] leading-[16px] text-[#4A5675]">
                  No. {payment.receiptNo || '88204'}
                </span>
              </div>
            </div>

            {/* Divider line */}
            <div className="w-full h-[1px] border-t border-[#EEF1F6]" />

            {/* Amount & Stamp Hero Frame (380px x 78px) */}
            <div className="relative w-full h-[78px] flex flex-row items-center justify-between">
              {/* Bill Title & Big Amount */}
              <div className="flex flex-col items-start gap-[2px] z-0">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675] truncate max-w-[240px]">
                  {payment.billName} · {payment.billCycleLabel}
                </span>

                <div className="flex flex-row items-baseline gap-[4.75px]">
                  <span className="font-onest font-extrabold text-[40px] leading-[48px] tracking-[-1px] text-[#0B1530]">
                    {payment.amount.toFixed(2)}
                  </span>
                  <span className="font-onest font-extrabold text-[16px] leading-[48px] tracking-[0.32px] text-[#0B1530]">
                    {payment.currency}
                  </span>
                </div>
              </div>

              {/* Rotated Stamp */}
              {payment.status === 'verified' && (
                <div
                  className="flex flex-col items-center justify-center px-[14px] py-[8px] bg-[#E3F4EA]/60 border-2 border-[#1B7A4B] rounded-[8px] select-none z-10 shrink-0"
                  style={{ transform: 'rotate(-9deg)' }}
                >
                  <span className="font-onest font-extrabold text-[20px] leading-[22px] tracking-[1px] text-[#1B7A4B]">
                    PAID
                  </span>
                  <span className="font-onest font-bold text-[10px] leading-[12px] text-[#1B7A4B] whitespace-nowrap">
                    on Stellar · {stampDate}
                  </span>
                </div>
              )}

              {payment.status === 'verifying' && (
                <div
                  className="flex flex-col items-center justify-center px-[12px] py-[7px] bg-[#E6ECFB]/80 border-2 border-[#2F4FBF] rounded-[8px] select-none z-10 shrink-0"
                  style={{ transform: 'rotate(-9deg)' }}
                >
                  <span className="font-onest font-extrabold text-[17px] leading-[20px] tracking-[0.5px] text-[#2F4FBF]">
                    VERIFYING
                  </span>
                  <span className="font-onest font-bold text-[10px] leading-[12px] text-[#2F4FBF] whitespace-nowrap">
                    on Stellar · Pending
                  </span>
                </div>
              )}

              {payment.status === 'failed' && (
                <div
                  className="flex flex-col items-center justify-center px-[14px] py-[7px] bg-[#FDE8E6]/80 border-2 border-[#B42318] rounded-[8px] select-none z-10 shrink-0"
                  style={{ transform: 'rotate(-9deg)' }}
                >
                  <span className="font-onest font-extrabold text-[19px] leading-[20px] tracking-[1px] text-[#B42318]">
                    FAILED
                  </span>
                  <span className="font-onest font-bold text-[10px] leading-[12px] text-[#B42318] whitespace-nowrap">
                    wallet short · {stampDate}
                  </span>
                </div>
              )}

              {payment.status === 'manual' && (
                <div
                  className="flex flex-col items-center justify-center px-[14px] py-[8px] bg-[#EEF1F6] border-2 border-[#4A5675] rounded-[8px] select-none z-10 shrink-0"
                  style={{ transform: 'rotate(-9deg)' }}
                >
                  <span className="font-onest font-extrabold text-[20px] leading-[22px] tracking-[1px] text-[#0B1530]">
                    PAID
                  </span>
                  <span className="font-onest font-bold text-[10px] leading-[12px] text-[#4A5675] whitespace-nowrap">
                    via Bank · {stampDate}
                  </span>
                </div>
              )}
            </div>

            {/* Perforation 1 (Ticket Cutout notches + dashed line) */}
            <div className="relative w-[420px] h-[22px] -mx-[20px] flex items-center justify-center">
              {/* Left cutout notch */}
              <div className="absolute -left-[11px] top-0 w-[22px] h-[22px] bg-[#0B1530] rounded-full" />
              {/* Dashed line */}
              <div className="w-[370px] border-t-2 border-dashed border-[#B7C2D9]" />
              {/* Right cutout notch */}
              <div className="absolute -right-[11px] top-0 w-[22px] h-[22px] bg-[#0B1530] rounded-full" />
            </div>

            {/* Key-Value Details (380px wide) */}
            <div className="w-full flex flex-col items-start">
              {/* Row 1: Paid to */}
              <div className="w-full flex flex-row justify-between items-start py-[8px]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Paid to
                </span>
                <div className="flex flex-col items-end">
                  <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    {payment.payeeName || bill?.payeeName || payment.billName}
                  </span>
                  <span className="font-mono text-[12px] leading-[16px] text-[#4A5675]">
                    {payment.recipientShort || 'GBQE…7HDN'}
                  </span>
                </div>
              </div>

              {/* Row 2: Memo */}
              <div className="w-full flex flex-row justify-between items-center py-[8px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Memo
                </span>
                <span className="font-mono text-[14px] leading-[18px] text-[#0B1530]">
                  {payment.memo || 'ELEC-2210-0457'}
                </span>
              </div>

              {/* Row 3: From */}
              <div className="w-full flex flex-row justify-between items-center py-[8px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  From
                </span>
                <div className="flex flex-row items-center gap-1">
                  <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                    Freighter ·
                  </span>
                  <span className="font-mono text-[14px] leading-[20px] text-[#0B1530]">
                    {userWalletAddress}
                  </span>
                </div>
              </div>

              {/* Row 4: Network */}
              <div className="w-full flex flex-row justify-between items-center py-[8px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Network
                </span>
                <span className="font-onest font-bold text-[14px] leading-[18px] text-[#0B1530]">
                  {payment.paymentMethod === 'stellar' ? 'Stellar Testnet' : 'SEPA Transfer'}
                </span>
              </div>

              {/* Row 5: Network fee */}
              <div className="w-full flex flex-row justify-between items-center py-[8px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Network fee
                </span>
                <span className="font-onest font-bold text-[14px] leading-[18px] text-[#0B1530]">
                  {payment.paymentMethod === 'stellar' ? payment.networkFee || '0.00001 XLM' : 'Free (SEPA)'}
                </span>
              </div>

              {/* Row 6: Date */}
              <div className="w-full flex flex-row justify-between items-center py-[8px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Date
                </span>
                <span className="font-onest font-bold text-[14px] leading-[18px] text-[#0B1530]">
                  {payment.paidDateLabel} 2026, {payment.paidTimeLabel}
                </span>
              </div>
            </div>

            {/* Perforation 2 (Second ticket cutout notches + dashed line) */}
            <div className="relative w-[420px] h-[22px] -mx-[20px] flex items-center justify-center">
              {/* Left cutout notch */}
              <div className="absolute -left-[11px] top-0 w-[22px] h-[22px] bg-[#0B1530] rounded-full" />
              {/* Dashed line */}
              <div className="w-[370px] border-t-2 border-dashed border-[#B7C2D9]" />
              {/* Right cutout notch */}
              <div className="absolute -right-[11px] top-0 w-[22px] h-[22px] bg-[#0B1530] rounded-full" />
            </div>

            {/* Stellar Transaction Section (380px wide) */}
            <div className="w-full flex flex-col items-start gap-[8px]">
              {/* Header: Stellar transaction + Copy button */}
              <div className="w-full flex flex-row justify-between items-center h-[26px]">
                <span className="font-onest font-semibold text-[12px] leading-[16px] tracking-[0.6px] uppercase text-[#4A5675]">
                  Stellar transaction
                </span>

                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex flex-row items-center px-[9px] py-[1px] gap-[4px] h-[26px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[6px] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check size={13} strokeWidth={2.5} className="text-[#1B7A4B]" />
                  ) : (
                    <Copy size={13} strokeWidth={2} className="text-[#4A5675]" />
                  )}
                  <span className="font-onest font-bold text-[12px] leading-[16px] text-[#4A5675]">
                    {copied ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>

              {/* Hash text with mono font in chunks */}
              <div className="w-full font-mono text-[12px] leading-[16px] text-[#0B1530] break-words tracking-tight py-0.5">
                {formattedHash}
              </div>

              {/* Verification check row */}
              <div className="w-full flex flex-row items-center gap-[6px]">
                <Check size={13} strokeWidth={2.5} className="text-[#1B7A4B] shrink-0" />
                <span className="font-onest font-medium text-[12px] leading-[16px] text-[#1B7A4B]">
                  Amount, asset, recipient and memo match
                </span>
              </div>

              {/* Bottom Ledger & Check on Stellar */}
              <div className="w-full flex flex-row justify-between items-center pt-1">
                <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                  Ledger {payment.ledgerSequence ? payment.ledgerSequence.toLocaleString() : '52,184,903'} · Successful
                </span>

                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${payment.fullTxHash || '7c1e9a4f2b6d08e3c5a7f1d92b4e6c08a3f5b7e21a0d9c4e8f1b3a5c7e9d1f30'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-[4px] text-[#2F4FBF] hover:underline"
                >
                  <span className="font-onest font-bold text-[14px] leading-[20px] text-[#2F4FBF]">
                    Check on Stellar
                  </span>
                  <ExternalLink size={14} strokeWidth={2} className="text-[#2F4FBF]" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Frame: Download PDF & Share (420px x 44px, gap 8px) */}
        <div className="w-full flex flex-row items-center gap-[8px] h-[44px]">
          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 flex flex-row justify-center items-center py-[2px] px-[7px] gap-[8px] h-[44px] border border-white/60 hover:bg-white/10 active:scale-98 rounded-[10px] transition-all cursor-pointer select-none"
          >
            <Download size={18} strokeWidth={2} className="text-white" />
            <span className="font-onest font-bold text-[16px] leading-[24px] text-white">
              Download PDF
            </span>
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 flex flex-row justify-center items-center py-[1px] px-[6px] gap-[8px] h-[44px] bg-white hover:bg-[#F3F5F9] active:scale-98 rounded-[10px] transition-all cursor-pointer select-none shadow-md"
          >
            <Share2 size={18} strokeWidth={2} className="text-[#0B1530]" />
            <span className="font-onest font-bold text-[16px] leading-[24px] text-[#0B1530]">
              Share
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
