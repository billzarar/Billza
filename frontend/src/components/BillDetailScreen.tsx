import React, { useState } from 'react';
import { BillItem, BillHistoryRecord } from '../data/initialData';
import { BillIcon } from './BillIcons';

interface BillDetailScreenProps {
  bill: BillItem;
  onBack: () => void;
  onPayBill: (bill: BillItem) => void;
  onMarkPaid: (bill: BillItem) => void;
  onUpdateBill: (updatedBill: BillItem) => void;
  onDeleteBill: (billId: string) => void;
  onViewAllHistory?: () => void;
}

export const BillDetailScreen: React.FC<BillDetailScreenProps> = ({
  bill,
  onBack,
  onPayBill,
  onMarkPaid,
  onUpdateBill,
  onDeleteBill,
  onViewAllHistory,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingReminders, setIsEditingReminders] = useState(false);
  const [remindersSnoozed, setRemindersSnoozed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayAmount = bill.billsAmount ?? bill.amount;
  const displayCurrency = bill.billsCurrency ?? bill.currency;
  const displayDueDate = bill.billsNextDueLabel || bill.dueDateLabel;
  const isManualBill = bill.actionType === 'mark';

  // Editable details state
  const [editCategory, setEditCategory] = useState(bill.category);
  const [editAmount, setEditAmount] = useState(displayAmount.toFixed(2));
  const [editRepeats, setEditRepeats] = useState(
    bill.repeatsText || 'Every month on the 23rd'
  );
  const [editEnds, setEditEnds] = useState(bill.endsText || 'Keeps repeating');
  const [editDescription, setEditDescription] = useState(
    bill.description || 'Monthly recurring bill'
  );

  // Editable reminders state
  const [editReminderWhen, setEditReminderWhen] = useState(
    bill.reminderWhen || '3 days before, on due date'
  );
  const [editReminderWhere, setEditReminderWhere] = useState(
    bill.reminderWhere || 'In-app and email'
  );
  const [editReminderOverdue, setEditReminderOverdue] = useState(
    bill.reminderOverdue || 'Every 2 days'
  );

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(bill.recipientAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 1800);
  };

  const handleCopyTx = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTxHash(tx);
    setTimeout(() => setCopiedTxHash(null), 1800);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(editAmount);
    const updatedAmt =
      !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : displayAmount;
    onUpdateBill({
      ...bill,
      category: editCategory,
      amount: updatedAmt,
      billsAmount: bill.billsAmount !== undefined ? updatedAmt : undefined,
      repeatsText: editRepeats,
      endsText: editEnds,
      description: editDescription,
    });
    setIsEditingDetails(false);
  };

  const handleSaveReminders = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBill({
      ...bill,
      reminderWhen: editReminderWhen,
      reminderWhere: editReminderWhere,
      reminderOverdue: editReminderOverdue,
    });
    setIsEditingReminders(false);
  };

  const renderStatusPill = () => {
    if (bill.status === 'overdue') {
      return (
        <div className="inline-flex items-center gap-[6px] px-[11px] py-[4px] h-[25px] bg-[#FDE8E6] border border-[#D2453A] rounded-[6px]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#B42318] shrink-0" />
          <span className="font-semibold text-[12px] leading-[15px] text-[#B42318] whitespace-nowrap">
            {bill.dueInLabel}
          </span>
        </div>
      );
    }
    if (bill.status === 'soon') {
      return (
        <div className="inline-flex items-center gap-[6px] px-[11px] py-[4px] h-[25px] bg-[#FDF1DD] border border-[#B8740A] rounded-[6px]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#94560A] shrink-0" />
          <span className="font-semibold text-[12px] leading-[15px] text-[#94560A] whitespace-nowrap">
            {bill.dueInLabel}
          </span>
        </div>
      );
    }
    if (bill.status === 'pending') {
      return (
        <div className="inline-flex items-center gap-[6px] px-[11px] py-[4px] h-[25px] bg-[#E6ECFB] border border-[#4164D9] rounded-[6px]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#2F4FBF] shrink-0" />
          <span className="font-semibold text-[12px] leading-[15px] text-[#2F4FBF] whitespace-nowrap">
            Verifying
          </span>
        </div>
      );
    }
    if (bill.status === 'paid' || bill.status === 'manual') {
      return (
        <div className="inline-flex items-center gap-[6px] px-[11px] py-[4px] h-[25px] bg-[#E3F4EA] border border-[#2B9460] rounded-[6px]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#1B7A4B] shrink-0" />
          <span className="font-semibold text-[12px] leading-[15px] text-[#1B7A4B] whitespace-nowrap">
            {bill.billsStatusLabel || bill.dueInLabel || 'Paid on Stellar'}
          </span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-[6px] px-[11px] py-[4px] h-[25px] bg-[#EEF1F6] border border-[#77839F] rounded-[6px]">
        <span className="w-[6px] h-[6px] rounded-full bg-[#4A5675] shrink-0" />
        <span className="font-semibold text-[12px] leading-[15px] text-[#4A5675] whitespace-nowrap">
          {bill.dueInLabel}
        </span>
      </div>
    );
  };

  const historyRecords: BillHistoryRecord[] = bill.billHistory || [];

  return (
    <div className="w-full flex flex-col gap-5 sm:gap-[20px]">
      {/* Breadcrumb Row */}
      <div className="flex items-center gap-[8px] h-[18px]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-[6px] text-[#2F4FBF] hover:text-[#1E3A9E] transition-colors cursor-pointer group"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="shrink-0 transition-transform group-hover:-translate-x-0.5"
          >
            <path
              d="M11.25 13.5L6.75 9L11.25 4.5"
              stroke="#2F4FBF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-bold text-[14px] leading-[18px] text-[#2F4FBF]">
            Bills
          </span>
        </button>
        <span className="font-normal text-[16px] leading-[20px] text-[#B7C2D9]">
          /
        </span>
        <span className="font-semibold text-[14px] leading-[18px] text-[#4A5675] truncate">
          {bill.name}
        </span>
      </div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-[20px] border-b border-[#DDE2EC]">
        {/* Left: 56x56 Circle Icon + Title + Subtitle */}
        <div className="flex items-start sm:items-center gap-[16px] min-w-0">
          <div className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] rounded-full bg-[#EEF1F6] flex items-center justify-center text-[#0B1530] shrink-0">
            <BillIcon type={bill.icon} size={24} />
          </div>
          <div className="flex flex-col gap-[4px] min-w-0">
            <h1 className="font-extrabold text-[28px] sm:text-[36px] lg:text-[40px] leading-[1.1] tracking-[-1px] text-[#0B1530] truncate">
              {bill.name}
            </h1>
            <p className="font-normal text-[14px] sm:text-[16px] leading-[20px] text-[#4A5675]">
              {bill.category} ·{' '}
              {bill.frequency === 'quarterly' ? 'Repeats quarterly' : 'Repeats monthly'} ·{' '}
              {isManualBill
                ? `Paid by you in ${displayCurrency}`
                : `Stellar payment in ${displayCurrency}`}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-[10px] shrink-0 flex-wrap sm:flex-nowrap relative">
          {bill.status !== 'paid' && bill.status !== 'manual' && (
            <button
              type="button"
              onClick={() => onMarkPaid(bill)}
              className="h-[44px] px-[19px] bg-white hover:bg-[#F8F9FC] border border-[#0B1530] rounded-[10px] font-bold text-[15px] sm:text-[16px] leading-[20px] text-[#0B1530] transition-colors cursor-pointer whitespace-nowrap"
            >
              Mark as paid
            </button>
          )}

          {bill.status !== 'paid' && bill.status !== 'manual' ? (
            <button
              type="button"
              onClick={() => onPayBill(bill)}
              className={`h-[44px] px-[18px] rounded-[10px] font-bold text-[15px] sm:text-[16px] leading-[20px] text-white transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                bill.status === 'overdue'
                  ? 'bg-[#B42318] hover:bg-[#911B12]'
                  : 'bg-[#0B1530] hover:bg-[#192852]'
              }`}
            >
              Pay {displayAmount.toFixed(2)} {displayCurrency}
            </button>
          ) : (
            <div className="h-[44px] px-[18px] bg-[#E3F4EA] border border-[#2B9460] rounded-[10px] inline-flex items-center gap-2 font-bold text-[15px] text-[#1B7A4B]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8.5L6.5 11.5L12.5 4.5"
                  stroke="#1B7A4B"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Paid for this cycle</span>
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              aria-label="More bill options"
              className="w-[44px] h-[44px] bg-white hover:bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="3.75" cy="9" r="1.25" fill="#0B1530" />
                <circle cx="9" cy="9" r="1.25" fill="#0B1530" />
                <circle cx="14.25" cy="9" r="1.25" fill="#0B1530" />
              </svg>
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-[50px] w-[200px] bg-white border border-[#DDE2EC] rounded-[10px] shadow-xl py-1.5 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setIsEditingDetails(true);
                  }}
                  className="w-full px-4 py-2 text-left font-medium text-[14px] text-[#0B1530] hover:bg-[#F3F5F9] cursor-pointer"
                >
                  Edit bill details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setIsEditingReminders(true);
                  }}
                  className="w-full px-4 py-2 text-left font-medium text-[14px] text-[#0B1530] hover:bg-[#F3F5F9] cursor-pointer"
                >
                  Configure reminders
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleCopyAddress();
                  }}
                  className="w-full px-4 py-2 text-left font-medium text-[14px] text-[#0B1530] hover:bg-[#F3F5F9] cursor-pointer"
                >
                  Copy Stellar address
                </button>
                <div className="my-1 border-t border-[#EEF1F6]" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full px-4 py-2 text-left font-semibold text-[14px] text-[#B42318] hover:bg-[#FDE8E6]/60 cursor-pointer"
                >
                  Delete this bill
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Split: 744px Left + 360px Right on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-[24px] items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:gap-[24px] min-w-0">
          {/* Card 1: Next Payment & Stellar Info */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:p-[24px] flex flex-col gap-[18px]">
            {/* Top Amount & Status Pill Row */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex flex-col gap-[6px]">
                <span className="font-semibold text-[14px] leading-[18px] text-[#4A5675]">
                  {bill.status === 'paid' || bill.status === 'manual'
                    ? `Next payment, ${displayDueDate}`
                    : `Next payment, ${displayDueDate}`}
                </span>
                <div className="flex items-baseline gap-[8px] tabular-nums">
                  <span
                    className={`font-extrabold text-[38px] sm:text-[48px] leading-[1.06] tracking-[-1.44px] ${
                      bill.status === 'overdue' ? 'text-[#B42318]' : 'text-[#0B1530]'
                    }`}
                  >
                    {displayAmount.toFixed(2)}
                  </span>
                  <span className="font-extrabold text-[18px] sm:text-[20px] leading-[26px] text-[#0B1530]">
                    {displayCurrency}
                  </span>
                </div>
              </div>

              <div className="self-start">{renderStatusPill()}</div>
            </div>

            {/* 4 Key-Value Rows */}
            <div className="border-t border-[#EEF1F6] flex flex-col">
              {/* Row 1: Pay to */}
              <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-4 min-h-[38px]">
                <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                  Pay to
                </span>
                <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                  {bill.payeeName || bill.name}
                </span>
              </div>

              {/* Row 2: Stellar address */}
              <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-4 min-h-[47px]">
                <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                  Stellar address
                </span>
                <div className="flex items-center gap-[8px]">
                  <span className="font-mono-redhat font-normal text-[13px] sm:text-[14px] leading-[19px] text-[#0B1530]">
                    {bill.recipientShort}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    title="Copy Stellar address"
                    className="w-[28px] h-[27px] bg-white hover:bg-[#F3F5F9] border border-[#DDE2EC] rounded-[6px] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {copiedAddress ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2.5 7.5L5.5 10.5L11.5 3.5"
                          stroke="#1B7A4B"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect
                          x="4.5"
                          y="4.5"
                          width="7"
                          height="7"
                          rx="1.2"
                          stroke="#0B1530"
                          strokeWidth="1.3"
                        />
                        <path
                          d="M2.5 9.5V3.5C2.5 2.94772 2.94772 2.5 3.5 2.5H9.5"
                          stroke="#0B1530"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Row 3: Memo */}
              <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-4 min-h-[39px]">
                <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                  Memo
                </span>
                <span className="font-mono-redhat font-normal text-[13px] sm:text-[14px] leading-[19px] text-[#0B1530]">
                  {bill.memo || 'NONE'}
                </span>
              </div>

              {/* Row 4: Network fee */}
              <div className="py-[10px] flex items-center justify-between gap-4 min-h-[38px]">
                <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                  Network fee
                </span>
                <span className="font-bold text-[14px] leading-[18px] text-[#0B1530]">
                  Under 0.0001 XLM
                </span>
              </div>
            </div>

            {/* Bottom Reminder Caption */}
            <div className="flex items-center gap-[8px]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M7 1.75C4.92893 1.75 3.25 3.42893 3.25 5.5V8.16667L2.08333 9.91667V10.5H11.9167V9.91667L10.75 8.16667V5.5C10.75 3.42893 9.07107 1.75 7 1.75Z"
                  stroke="#4A5675"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.83333 11.9583C6.10208 12.425 6.51625 12.6875 7 12.6875C7.48375 12.6875 7.89792 12.425 8.16667 11.9583"
                  stroke="#4A5675"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-medium text-[12px] leading-[15px] text-[#4A5675]">
                {remindersSnoozed
                  ? 'Reminders snoozed for 24 hours'
                  : bill.reminderSentText || 'Reminder sent today, 3 days before due date'}
              </span>
            </div>
          </div>

          {/* Card 2: Payment History */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-[24px] pt-[20px] pb-[12px] flex flex-col gap-[2px]">
              <h2 className="font-bold text-[20px] leading-[26px] tracking-[-0.3px] text-[#0B1530]">
                Payment history
              </h2>
              <p className="font-normal text-[14px] sm:text-[16px] leading-[20px] text-[#4A5675]">
                Verified Stellar payments are kept apart from payments marked by you.
              </p>
            </div>

            {/* Desktop Table Header (#F8F9FC) */}
            <div className="hidden sm:grid sm:grid-cols-[1.45fr_1.15fr_1.35fr_0.85fr] items-center px-[24px] h-[37px] bg-[#F8F9FC] border-y border-[#EEF1F6]">
              <span className="font-semibold text-[12px] leading-[15px] text-[#4A5675]">
                Payment
              </span>
              <span className="font-semibold text-[12px] leading-[15px] text-[#4A5675]">
                How it was paid
              </span>
              <span className="font-semibold text-[12px] leading-[15px] text-[#4A5675]">
                Transaction or note
              </span>
              <span className="font-semibold text-[12px] leading-[15px] text-[#4A5675] text-right">
                Amount
              </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#EEF1F6]">
              {historyRecords.map((rec) => {
                const isStellar = rec.method === 'stellar';
                const isManual = rec.method === 'manual';
                const isFailed = rec.method === 'failed';

                return (
                  <div
                    key={rec.id}
                    className="px-5 sm:px-[24px] py-[14px] grid grid-cols-1 sm:grid-cols-[1.45fr_1.15fr_1.35fr_0.85fr] items-center gap-3 sm:gap-2 hover:bg-[#F8F9FC]/60 transition-colors"
                  >
                    {/* Col 1: Payment Cycle + Date */}
                    <div className="flex items-center gap-[12px] min-w-0">
                      {isStellar && (
                        <div className="w-[32px] h-[32px] rounded-full bg-[#E3F4EA] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M3.5 8.5L6.5 11.5L12.5 4.5"
                              stroke="#1B7A4B"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                      {isManual && (
                        <div className="w-[32px] h-[32px] rounded-full bg-[#EEF1F6] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M3.5 8.5L6.5 11.5L12.5 4.5"
                              stroke="#0B1530"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                      {isFailed && (
                        <div className="w-[32px] h-[32px] rounded-full bg-[#FDE8E6] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle
                              cx="8"
                              cy="8"
                              r="5.5"
                              stroke="#B42318"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M8 5.25V8.5"
                              stroke="#B42318"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <circle cx="8" cy="10.75" r="0.75" fill="#B42318" />
                          </svg>
                        </div>
                      )}

                      <div className="flex flex-col gap-[2px] min-w-0">
                        <span className="font-semibold text-[16px] leading-[20px] text-[#0B1530] truncate">
                          {rec.cycleLabel}
                        </span>
                        <span className="font-medium text-[12px] leading-[15px] text-[#4A5675]">
                          {rec.dateSubLabel}
                        </span>
                      </div>
                    </div>

                    {/* Col 2: How it was paid badge */}
                    <div className="flex items-center">
                      {isStellar && (
                        <div className="inline-flex items-center gap-[6px] px-[11px] py-[4px] h-[25px] bg-[#E3F4EA] border border-[#2B9460] rounded-[6px]">
                          <span className="w-[6px] h-[6px] rounded-full bg-[#1B7A4B] shrink-0" />
                          <span className="font-semibold text-[12px] leading-[15px] text-[#1B7A4B] whitespace-nowrap">
                            {rec.methodLabel}
                          </span>
                        </div>
                      )}
                      {isManual && (
                        <div className="inline-flex items-center gap-[6px] px-[11px] py-[4px] h-[25px] bg-white border border-[#77839F] rounded-[6px]">
                          <span className="w-[6px] h-[6px] rounded-full bg-[#4A5675] shrink-0" />
                          <span className="font-semibold text-[12px] leading-[15px] text-[#4A5675] whitespace-nowrap">
                            {rec.methodLabel}
                          </span>
                        </div>
                      )}
                      {isFailed && (
                        <div className="inline-flex items-center gap-[6px] px-[11px] py-[4px] h-[25px] bg-[#FDE8E6] border border-[#D2453A] rounded-[6px]">
                          <span className="w-[6px] h-[6px] rounded-full bg-[#B42318] shrink-0" />
                          <span className="font-semibold text-[12px] leading-[15px] text-[#B42318] whitespace-nowrap">
                            {rec.methodLabel}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Col 3: Transaction or note */}
                    <div className="flex items-center min-w-0">
                      {isStellar ? (
                        <button
                          type="button"
                          onClick={() => handleCopyTx(rec.txHashOrNote)}
                          title="Click to copy Stellar transaction hash"
                          className="inline-flex items-center gap-[6px] text-[#2F4FBF] hover:underline cursor-pointer"
                        >
                          <span className="font-mono-redhat font-normal text-[12px] leading-[16px] text-[#2F4FBF]">
                            {copiedTxHash === rec.txHashOrNote
                              ? 'Copied!'
                              : rec.txHashOrNote}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5"
                              stroke="#2F4FBF"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      ) : (
                        <span
                          className={`font-medium text-[12px] leading-[15px] truncate ${
                            isFailed ? 'text-[#B42318]' : 'text-[#4A5675]'
                          }`}
                        >
                          {rec.txHashOrNote}
                        </span>
                      )}
                    </div>

                    {/* Col 4: Amount */}
                    <div className="flex sm:justify-end">
                      <span
                        className={`font-bold text-[16px] leading-[20px] tabular-nums ${
                          isFailed
                            ? 'text-[#4A5675]'
                            : 'text-[#0B1530]'
                        }`}
                      >
                        {rec.amount.toFixed(2)} {rec.currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Link */}
            <div className="px-5 sm:px-[24px] py-[15px] border-t border-[#EEF1F6]">
              <button
                type="button"
                onClick={onViewAllHistory}
                className="font-bold text-[14px] leading-[18px] text-[#2F4FBF] underline hover:text-[#1E3A9E] cursor-pointer"
              >
                See all in Payment history
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (360px on desktop) */}
        <div className="flex flex-col gap-6 lg:gap-[24px]">
          {/* Card 1: Details */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:p-[24px] flex flex-col gap-[12px]">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[20px] leading-[26px] tracking-[-0.3px] text-[#0B1530]">
                Details
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingDetails((prev) => !prev)}
                className="inline-flex items-center gap-[6px] text-[#2F4FBF] hover:text-[#1E3A9E] cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M9.91667 1.75001C10.2261 1.44059 10.6458 1.26675 11.0833 1.26675C11.5209 1.26675 11.9406 1.44059 12.25 1.75001C12.5594 2.05943 12.7333 2.4791 12.7333 2.91668C12.7333 3.35426 12.5594 3.77393 12.25 4.08334L4.375 11.9583L1.16667 12.8333L2.04167 9.62501L9.91667 1.75001Z"
                    stroke="#2F4FBF"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-bold text-[14px] leading-[18px] text-[#2F4FBF]">
                  {isEditingDetails ? 'Cancel' : 'Edit'}
                </span>
              </button>
            </div>

            {isEditingDetails ? (
              <form onSubmit={handleSaveDetails} className="flex flex-col gap-3 pt-1">
                <div>
                  <label className="block font-medium text-[12px] text-[#4A5675] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[14px] text-[#0B1530]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[12px] text-[#4A5675] mb-1">
                    Amount ({displayCurrency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[14px] text-[#0B1530]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[12px] text-[#4A5675] mb-1">
                    Repeats
                  </label>
                  <input
                    type="text"
                    value={editRepeats}
                    onChange={(e) => setEditRepeats(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[14px] text-[#0B1530]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[12px] text-[#4A5675] mb-1">
                    Ends
                  </label>
                  <input
                    type="text"
                    value={editEnds}
                    onChange={(e) => setEditEnds(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[14px] text-[#0B1530]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[12px] text-[#4A5675] mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[14px] text-[#0B1530]"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 h-[36px] bg-[#0B1530] hover:bg-[#192852] text-white rounded-[8px] font-bold text-[14px] cursor-pointer"
                >
                  Save details
                </button>
              </form>
            ) : (
              <div className="flex flex-col">
                <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-3">
                  <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                    Category
                  </span>
                  <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                    {bill.category}
                  </span>
                </div>
                <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-3">
                  <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                    Amount
                  </span>
                  <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right tabular-nums">
                    {displayAmount.toFixed(2)} {displayCurrency}
                  </span>
                </div>
                <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-3">
                  <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                    Repeats
                  </span>
                  <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                    {bill.repeatsText || 'Every month on the 23rd'}
                  </span>
                </div>
                <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-3">
                  <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                    Started
                  </span>
                  <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                    {bill.startedDate || '23 Jan 2026'}
                  </span>
                </div>
                <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-3">
                  <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                    Ends
                  </span>
                  <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                    {bill.endsText || 'Keeps repeating'}
                  </span>
                </div>
                <div className="py-[10px] flex items-center justify-between gap-3">
                  <span className="font-medium text-[14px] leading-[18px] text-[#4A5675] shrink-0">
                    Description
                  </span>
                  <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                    {bill.description || 'Monthly recurring bill'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Reminders */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:p-[24px] flex flex-col gap-[12px]">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[20px] leading-[26px] tracking-[-0.3px] text-[#0B1530]">
                Reminders
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingReminders((prev) => !prev)}
                className="inline-flex items-center gap-[6px] text-[#2F4FBF] hover:text-[#1E3A9E] cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M9.91667 1.75001C10.2261 1.44059 10.6458 1.26675 11.0833 1.26675C11.5209 1.26675 11.9406 1.44059 12.25 1.75001C12.5594 2.05943 12.7333 2.4791 12.7333 2.91668C12.7333 3.35426 12.5594 3.77393 12.25 4.08334L4.375 11.9583L1.16667 12.8333L2.04167 9.62501L9.91667 1.75001Z"
                    stroke="#2F4FBF"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-bold text-[14px] leading-[18px] text-[#2F4FBF]">
                  {isEditingReminders ? 'Cancel' : 'Edit'}
                </span>
              </button>
            </div>

            {isEditingReminders ? (
              <form onSubmit={handleSaveReminders} className="flex flex-col gap-3 pt-1">
                <div>
                  <label className="block font-medium text-[12px] text-[#4A5675] mb-1">
                    When
                  </label>
                  <input
                    type="text"
                    value={editReminderWhen}
                    onChange={(e) => setEditReminderWhen(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[14px] text-[#0B1530]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[12px] text-[#4A5675] mb-1">
                    Where
                  </label>
                  <input
                    type="text"
                    value={editReminderWhere}
                    onChange={(e) => setEditReminderWhere(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[14px] text-[#0B1530]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[12px] text-[#4A5675] mb-1">
                    If overdue
                  </label>
                  <input
                    type="text"
                    value={editReminderOverdue}
                    onChange={(e) => setEditReminderOverdue(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[14px] text-[#0B1530]"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 h-[36px] bg-[#0B1530] hover:bg-[#192852] text-white rounded-[8px] font-bold text-[14px] cursor-pointer"
                >
                  Save reminders
                </button>
              </form>
            ) : (
              <>
                <div className="flex flex-col">
                  <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-3">
                    <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                      When
                    </span>
                    <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                      {bill.reminderWhen || '3 days before, on due date'}
                    </span>
                  </div>
                  <div className="py-[10px] border-b border-[#EEF1F6] flex items-center justify-between gap-3">
                    <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                      Where
                    </span>
                    <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                      {bill.reminderWhere || 'In-app and email'}
                    </span>
                  </div>
                  <div className="py-[10px] flex items-center justify-between gap-3">
                    <span className="font-medium text-[14px] leading-[18px] text-[#4A5675]">
                      If overdue
                    </span>
                    <span className="font-bold text-[14px] leading-[18px] text-[#0B1530] text-right">
                      {bill.reminderOverdue || 'Every 2 days'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRemindersSnoozed((prev) => !prev)}
                  className={`w-full h-[36px] px-[15px] rounded-[10px] border font-bold text-[16px] leading-[20px] flex items-center justify-center transition-colors cursor-pointer ${
                    remindersSnoozed
                      ? 'bg-[#EEF1F6] border-[#77839F] text-[#4A5675]'
                      : 'bg-white hover:bg-[#F8F9FC] border-[#0B1530] text-[#0B1530]'
                  }`}
                >
                  {remindersSnoozed ? 'Resume reminders' : 'Snooze reminders'}
                </button>
              </>
            )}
          </div>

          {/* Card 3: Delete this bill */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] px-5 sm:px-[25px] py-[17px] flex items-center justify-between gap-3">
            <div className="flex flex-col gap-[2px]">
              <span className="font-bold text-[14px] leading-[18px] text-[#0B1530]">
                Delete this bill
              </span>
              <span className="font-normal text-[12px] leading-[15px] text-[#4A5675]">
                Past payments stay in Payment history.
              </span>
            </div>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-[36px] px-3 rounded-[8px] border border-[#DDE2EC] font-semibold text-[13px] text-[#4A5675] hover:bg-[#F3F5F9] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteBill(bill.id)}
                  className="h-[36px] px-3 rounded-[8px] bg-[#B42318] hover:bg-[#911B12] font-bold text-[13px] text-white cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-[36px] px-[13px] bg-white hover:bg-[#FDE8E6]/60 border border-[#F5C2BC] rounded-[8px] inline-flex items-center gap-[6px] transition-colors cursor-pointer shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1.75 3.5H12.25M5.25 3.5V2.33333C5.25 2.01117 5.51117 1.75 5.83333 1.75H8.16667C8.48883 1.75 8.75 2.01117 8.75 2.33333V3.5M10.5 3.5V11.6667C10.5 11.9888 10.2388 12.25 9.91667 12.25H4.08333C3.76117 12.25 3.5 11.9888 3.5 11.6667V3.5H10.5Z"
                    stroke="#B42318"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-bold text-[14px] leading-[18px] text-[#B42318]">
                  Delete
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
