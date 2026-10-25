import React from 'react';
import {
  Receipt,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import { BillItem, PaymentHistoryItem } from '../data/initialData';

export type StatCardKind = 'total' | 'next14' | 'overdue' | 'paid';

interface StatCardPopupProps {
  kind: StatCardKind;
  bills: BillItem[];
  payments: PaymentHistoryItem[];
  onClose: (e: React.MouseEvent) => void;
  onActionClick: (kind: StatCardKind) => void;
  onSelectBill?: (bill: BillItem) => void;
  alignRight?: boolean;
}

export const StatCardPopup: React.FC<StatCardPopupProps> = ({
  kind,
  bills,
  payments,
  onClose,
  onActionClick,
  onSelectBill,
  alignRight = false,
}) => {
  const isUrgentRed = kind === 'overdue';

  // Background and shadow styles matching Figma spec
  const containerBg = isUrgentRed ? 'bg-[#B42318]' : 'bg-[#4164D9]';
  const containerShadow = isUrgentRed
    ? 'shadow-[0px_2px_6px_rgba(11,21,48,0.14),0px_18px_44px_rgba(180,35,24,0.36)]'
    : 'shadow-[0px_2px_6px_rgba(11,21,48,0.12),0px_18px_44px_rgba(11,21,48,0.28)]';

  // Alignment so right-side cards don't overflow right edge of viewport
  const alignmentClass = alignRight
    ? 'right-0 left-auto'
    : 'left-0 right-auto';

  const renderRowItem = (
    id: string,
    title: string,
    subtitle: string,
    amount: number,
    currency: string,
    isFirst: boolean,
    onClick?: () => void
  ) => (
    <div
      key={id}
      onClick={onClick}
      className={`flex items-center justify-between gap-[12px] w-full ${
        isFirst
          ? 'py-[10px] min-h-[56px]'
          : 'pt-[11px] pb-[10px] min-h-[57px] border-t border-white/[0.16]'
      } ${onClick ? 'cursor-pointer hover:bg-white/[0.06] -mx-1 px-1 rounded-[6px] transition-colors' : ''}`}
    >
      <div className="flex flex-col items-start min-w-0 flex-1">
        <span className="font-bold text-[14px] leading-[20px] text-white truncate w-full">
          {title}
        </span>
        <span className="font-medium text-[12px] leading-[16px] text-white/[0.74] truncate w-full">
          {subtitle}
        </span>
      </div>

      <div className="flex items-center gap-[4px] shrink-0 tabular-nums">
        <span className="font-bold text-[14px] leading-[20px] text-white">
          {amount.toFixed(2)}
        </span>
        <span className="pt-[4px] font-bold text-[12px] leading-[16px] text-white/[0.74]">
          {currency}
        </span>
      </div>
    </div>
  );

  if (kind === 'total') {
    const monthlyBills = bills.filter((b) => b.frequency === 'monthly');
    const quarterlyBills = bills.filter((b) => b.frequency === 'quarterly');
    const monthlyUsdc = monthlyBills
      .filter((b) => b.currency === 'USDC')
      .reduce((s, b) => s + b.amount, 0);
    const monthlyXlm = monthlyBills
      .filter((b) => b.currency === 'XLM')
      .reduce((s, b) => s + b.amount, 0);
    const monthlyEur = monthlyBills
      .filter((b) => b.currency === 'EUR')
      .reduce((s, b) => s + b.amount, 0);
    const secondaryParts: string[] = [];
    if (monthlyXlm > 0) secondaryParts.push(`${monthlyXlm.toFixed(2)} XLM`);
    if (monthlyEur > 0) secondaryParts.push(`${monthlyEur.toFixed(2)} EUR`);

    // Limit preview items to 5 items
    const previewBills = bills.slice(0, 5);
    const moreBillsCount = Math.max(0, bills.length - 5);

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-[calc(100%+10px)] ${alignmentClass} z-40 w-[calc(100vw-32px)] sm:w-[360px] ${containerBg} ${containerShadow} rounded-[12px] pt-[20px] px-[20px] pb-[18px] flex flex-col items-start gap-[16px] text-white text-left cursor-default`}
      >
        {/* Top Header Group */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col items-start gap-[6px]">
              <div className="flex items-center gap-[8px] h-[20px]">
                <Receipt size={18} strokeWidth={1.9} className="text-white shrink-0" />
                <span className="font-semibold text-[14px] leading-[20px] text-white whitespace-nowrap">
                  Total bills
                </span>
              </div>
              <div className="flex items-start gap-[8px] h-[44px] tabular-nums">
                <span className="font-extrabold text-[40px] leading-[44px] tracking-[-1px] text-white">
                  {bills.length}
                </span>
                <span className="pt-[18px] font-extrabold text-[18px] leading-[22px] text-white">
                  bills
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-[32px] h-[32px] rounded-[8px] bg-white/[0.16] hover:bg-white/[0.26] flex items-center justify-center text-white transition-colors shrink-0"
              aria-label="Close detail popup"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>

          <p className="font-medium text-[12px] leading-[16px] text-white/[0.74] w-full">
            Every bill Billza is tracking for you ({monthlyBills.length} monthly, {quarterlyBills.length} quarterly).
          </p>
        </div>

        {/* Lists Container (limited to 5 items) */}
        <div className="flex flex-col items-start gap-[6px] w-full">
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
              Preview ({previewBills.length} of {bills.length})
            </span>
          </div>
          <div className="flex flex-col w-full">
            {previewBills.length === 0 ? (
              <span className="text-[12px] text-white/60 py-2">No bills tracked</span>
            ) : (
              previewBills.map((item, idx) =>
                renderRowItem(
                  item.id,
                  item.name,
                  `${item.category} · ${item.frequency} · ${item.dueDateLabel}`,
                  item.amount,
                  item.currency,
                  idx === 0,
                  onSelectBill ? () => onSelectBill(item) : undefined
                )
              )
            )}
          </div>
          {moreBillsCount > 0 && (
            <span className="text-[11px] font-medium text-white/70 pt-1">
              + {moreBillsCount} more {moreBillsCount === 1 ? 'bill' : 'bills'} in your account
            </span>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="w-full pt-[15px] border-t border-white/[0.16] flex items-end justify-between gap-3">
          <div className="flex flex-col items-start gap-[2px] tabular-nums">
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
              Every month
            </span>
            <div className="flex items-baseline gap-[3.75px]">
              <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-white">
                {monthlyUsdc.toFixed(2)}
              </span>
              <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-white">
                USDC
              </span>
            </div>
            {secondaryParts.length > 0 && (
              <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
                + {secondaryParts.join(' · ')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onActionClick('total')}
            className="h-[40px] px-[16px] bg-white hover:bg-[#F3F5F9] rounded-[10px] flex items-center gap-[8px] text-[#0B1530] font-bold text-[14px] leading-[20px] transition-colors shrink-0 whitespace-nowrap"
          >
            <span>All bills</span>
            <ArrowRight size={16} strokeWidth={2} className="text-[#0B1530]" />
          </button>
        </div>
      </div>
    );
  }

  if (kind === 'next14') {
    const next14Bills = bills.filter((b) => b.inNext14Days && b.status !== 'paid');
    const previewNext14 = next14Bills.slice(0, 5);
    const moreNext14Count = Math.max(0, next14Bills.length - 5);
    const next14Usdc = next14Bills
      .filter((b) => b.currency === 'USDC')
      .reduce((s, b) => s + b.amount, 0);
    const next14Xlm = next14Bills
      .filter((b) => b.currency === 'XLM')
      .reduce((s, b) => s + b.amount, 0);
    const next14Eur = next14Bills
      .filter((b) => b.currency === 'EUR')
      .reduce((s, b) => s + b.amount, 0);
    const secondaryN14: string[] = [];
    if (next14Xlm > 0) secondaryN14.push(`${next14Xlm.toFixed(2)} XLM`);
    if (next14Eur > 0) secondaryN14.push(`${next14Eur.toFixed(2)} EUR`);

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-[calc(100%+10px)] ${alignmentClass} z-40 w-[calc(100vw-32px)] sm:w-[360px] ${containerBg} ${containerShadow} rounded-[12px] pt-[20px] px-[20px] pb-[18px] flex flex-col items-start gap-[16px] text-white text-left cursor-default`}
      >
        {/* Top Header Group */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col items-start gap-[6px]">
              <div className="flex items-center gap-[8px] h-[20px]">
                <Calendar size={18} strokeWidth={1.9} className="text-white shrink-0" />
                <span className="font-semibold text-[14px] leading-[20px] text-white whitespace-nowrap">
                  Next 14 days
                </span>
              </div>
              <div className="flex items-start gap-[8px] h-[44px] tabular-nums">
                <span className="font-extrabold text-[40px] leading-[44px] tracking-[-1px] text-white">
                  {next14Bills.length}
                </span>
                <span className="pt-[18px] font-extrabold text-[18px] leading-[22px] text-white">
                  {next14Bills.length === 1 ? 'bill' : 'bills'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-[32px] h-[32px] rounded-[8px] bg-white/[0.16] hover:bg-white/[0.26] flex items-center justify-center text-white transition-colors shrink-0"
              aria-label="Close detail popup"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>

          <p className="font-medium text-[12px] leading-[16px] text-white/[0.74] w-full">
            Scheduled bills due in the upcoming 14 days, ordered by due date.
          </p>
        </div>

        {/* Lists Container (limited to 5 items) */}
        <div className="flex flex-col items-start gap-[6px] w-full">
          <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
            Upcoming ({previewNext14.length} of {next14Bills.length})
          </span>
          <div className="flex flex-col w-full">
            {previewNext14.length === 0 ? (
              <span className="text-[12px] text-white/60 py-2">No bills due in the next 14 days</span>
            ) : (
              previewNext14.map((item, idx) =>
                renderRowItem(
                  item.id,
                  item.name,
                  `${item.category} · ${item.dueDateLabel} (${item.dueInLabel})`,
                  item.amount,
                  item.currency,
                  idx === 0,
                  onSelectBill ? () => onSelectBill(item) : undefined
                )
              )
            )}
          </div>
          {moreNext14Count > 0 && (
            <span className="text-[11px] font-medium text-white/70 pt-1">
              + {moreNext14Count} more upcoming {moreNext14Count === 1 ? 'bill' : 'bills'}
            </span>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="w-full pt-[15px] border-t border-white/[0.16] flex items-end justify-between gap-3">
          <div className="flex flex-col items-start gap-[2px] tabular-nums">
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
              Due in 14 days
            </span>
            <div className="flex items-baseline gap-[3.75px]">
              <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-white">
                {next14Usdc.toFixed(2)}
              </span>
              <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-white">
                USDC
              </span>
            </div>
            {secondaryN14.length > 0 && (
              <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
                + {secondaryN14.join(' · ')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onActionClick('next14')}
            className="h-[40px] px-[16px] bg-white hover:bg-[#F3F5F9] rounded-[10px] flex items-center gap-[8px] text-[#0B1530] font-bold text-[14px] leading-[20px] transition-colors shrink-0 whitespace-nowrap"
          >
            <span>Upcoming</span>
            <ArrowRight size={16} strokeWidth={2} className="text-[#0B1530]" />
          </button>
        </div>
      </div>
    );
  }

  if (kind === 'overdue') {
    const overdueList = bills.filter((b) => b.status === 'overdue');
    const previewOverdue = overdueList.slice(0, 5);
    const moreOverdueCount = Math.max(0, overdueList.length - 5);
    const overdueTotalUsdc = overdueList.reduce((acc, b) => acc + b.amount, 0);

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-[calc(100%+10px)] ${alignmentClass} z-40 w-[calc(100vw-32px)] sm:w-[360px] ${containerBg} ${containerShadow} rounded-[12px] pt-[20px] px-[20px] pb-[18px] flex flex-col items-start gap-[16px] text-white text-left cursor-default`}
      >
        {/* Top Header Group */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col items-start gap-[6px]">
              <div className="flex items-center gap-[8px] h-[20px]">
                <AlertTriangle size={18} strokeWidth={2.1} className="text-white shrink-0" />
                <span className="font-semibold text-[14px] leading-[20px] text-white whitespace-nowrap">
                  Overdue
                </span>
              </div>
              <div className="flex items-start gap-[8px] h-[44px] tabular-nums">
                <span className="font-extrabold text-[40px] leading-[44px] tracking-[-1px] text-white">
                  {overdueList.length}
                </span>
                <span className="pt-[18px] font-extrabold text-[18px] leading-[22px] text-white">
                  {overdueList.length === 1 ? 'bill' : 'bills'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-[32px] h-[32px] rounded-[8px] bg-white/[0.16] hover:bg-white/[0.26] flex items-center justify-center text-white transition-colors shrink-0"
              aria-label="Close detail popup"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>

          <p className="font-medium text-[12px] leading-[16px] text-white/[0.82] w-full">
            Urgent attention needed. Payment past its due date and requires retry.
          </p>
        </div>

        {/* Overdue Items (limited to 5 items) */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="flex flex-col items-start gap-[2px] w-full">
            <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.78]">
              Past due ({previewOverdue.length} of {overdueList.length})
            </span>
            <div className="flex flex-col w-full">
              {previewOverdue.length > 0 ? (
                previewOverdue.map((bill, idx) =>
                  renderRowItem(
                    bill.id,
                    bill.name,
                    `${bill.category} · due ${bill.dueDateLabel} (${bill.dueInLabel})`,
                    bill.amount,
                    bill.currency,
                    idx === 0,
                    onSelectBill ? () => onSelectBill(bill) : undefined
                  )
                )
              ) : (
                <div className="py-3 text-[13px] text-white/90 font-medium">
                  All overdue bills have been paid.
                </div>
              )}
            </div>
            {moreOverdueCount > 0 && (
              <span className="text-[11px] font-medium text-white/80 pt-1">
                + {moreOverdueCount} more overdue {moreOverdueCount === 1 ? 'bill' : 'bills'}
              </span>
            )}
          </div>

          {overdueList.length > 0 && (
            <div className="w-full rounded-[8px] bg-white/[0.14] border border-white/[0.22] px-3 py-2 flex flex-col gap-0.5">
              <span className="font-bold text-[12px] leading-[16px] text-white">
                Payment Status
              </span>
              <span className="font-medium text-[11px] leading-[15px] text-white/[0.86]">
                {overdueList[0].name} was due on {overdueList[0].dueDateLabel}. Action required to settle payment.
              </span>
            </div>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="w-full pt-[15px] border-t border-white/[0.16] flex items-end justify-between gap-3">
          <div className="flex flex-col items-start gap-[2px] tabular-nums">
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.78]">
              Total overdue
            </span>
            <div className="flex items-baseline gap-[3.75px]">
              <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-white">
                {overdueTotalUsdc.toFixed(2)}
              </span>
              <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-white">
                USDC
              </span>
            </div>
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.78]">
              {overdueList.length > 0 ? `${overdueList[0].dueInLabel} · Retry ready` : 'All caught up'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onActionClick('overdue')}
            className="h-[40px] px-[16px] bg-white hover:bg-[#FFF8F7] rounded-[10px] flex items-center gap-[8px] text-[#B42318] font-bold text-[14px] leading-[20px] transition-colors shrink-0 whitespace-nowrap"
          >
            <span>Pay now</span>
            <ArrowRight size={16} strokeWidth={2.2} className="text-[#B42318]" />
          </button>
        </div>
      </div>
    );
  }

  // kind === 'paid'
  const stellarPaid = payments.filter((p) => p.status === 'paid');
  const manualPaid = payments.filter((p) => p.status === 'manual');
  const allPaid = payments.filter((p) => p.status === 'paid' || p.status === 'manual');
  const previewPaid = allPaid.slice(0, 5);
  const morePaidCount = Math.max(0, allPaid.length - 5);

  const paidUsdc = payments
    .filter((p) => p.currency === 'USDC' && (p.status === 'paid' || p.status === 'manual'))
    .reduce((s, p) => s + p.amount, 0);
  const paidXlm = payments
    .filter((p) => p.currency === 'XLM' && (p.status === 'paid' || p.status === 'manual'))
    .reduce((s, p) => s + p.amount, 0);
  const paidEur = payments
    .filter((p) => p.currency === 'EUR' && (p.status === 'paid' || p.status === 'manual'))
    .reduce((s, p) => s + p.amount, 0);
  const verifyingUsdc = payments
    .filter((p) => p.currency === 'USDC' && p.status === 'pending')
    .reduce((s, p) => s + p.amount, 0);
  const paidSecondaryParts: string[] = [];
  if (paidEur > 0) paidSecondaryParts.push(`${paidEur.toFixed(2)} EUR`);
  if (paidXlm > 0) paidSecondaryParts.push(`${paidXlm.toFixed(2)} XLM`);
  if (verifyingUsdc > 0) paidSecondaryParts.push(`${verifyingUsdc.toFixed(2)} USDC verifying`);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-[calc(100%+10px)] ${alignmentClass} z-40 w-[calc(100vw-32px)] sm:w-[360px] ${containerBg} ${containerShadow} rounded-[12px] pt-[20px] px-[20px] pb-[18px] flex flex-col items-start gap-[16px] text-white text-left cursor-default`}
    >
      {/* Top Header Group */}
      <div className="flex flex-col items-start gap-[10px] w-full">
        <div className="flex items-start justify-between w-full">
          <div className="flex flex-col items-start gap-[6px]">
            <div className="flex items-center gap-[8px] h-[20px]">
              <CheckCircle2 size={18} strokeWidth={1.9} className="text-white shrink-0" />
              <span className="font-semibold text-[14px] leading-[20px] text-white whitespace-nowrap">
                Paid in October
              </span>
            </div>
            <div className="flex items-start gap-[8px] h-[44px] tabular-nums">
              <span className="font-extrabold text-[40px] leading-[44px] tracking-[-1px] text-white">
                {allPaid.length}
              </span>
              <span className="pt-[18px] font-extrabold text-[18px] leading-[22px] text-white">
                paid
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-[32px] h-[32px] rounded-[8px] bg-white/[0.16] hover:bg-white/[0.26] flex items-center justify-center text-white transition-colors shrink-0"
            aria-label="Close detail popup"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <p className="font-medium text-[12px] leading-[16px] text-white/[0.74] w-full">
          Bills settled in October via Stellar Testnet ({stellarPaid.length}) or marked paid directly ({manualPaid.length}).
        </p>
      </div>

      {/* Lists Container (limited to 5 items) */}
      <div className="flex flex-col items-start gap-[6px] w-full">
        <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
          Recent payments ({previewPaid.length} of {allPaid.length})
        </span>
        <div className="flex flex-col w-full">
          {previewPaid.length === 0 ? (
            <span className="text-[12px] text-white/60 py-2">No payments settled in October</span>
          ) : (
            previewPaid.map((p, idx) =>
              renderRowItem(
                p.id,
                p.name,
                `${p.status === 'paid' ? 'Paid on Stellar' : 'Direct payment'} · ${p.dateLabel}`,
                p.amount,
                p.currency,
                idx === 0
              )
            )
          )}
        </div>
        {morePaidCount > 0 && (
          <span className="text-[11px] font-medium text-white/70 pt-1">
            + {morePaidCount} more {morePaidCount === 1 ? 'payment' : 'payments'} settled in October
          </span>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="w-full pt-[15px] border-t border-white/[0.16] flex items-end justify-between gap-3">
        <div className="flex flex-col items-start gap-[2px] tabular-nums">
          <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
            Paid in October
          </span>
          <div className="flex items-baseline gap-[3.75px]">
            <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-white">
              {paidUsdc.toFixed(2)}
            </span>
            <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-white">
              USDC
            </span>
          </div>
          {paidSecondaryParts.length > 0 && (
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
              + {paidSecondaryParts.join(' · ')}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onActionClick('paid')}
          className="h-[40px] px-[16px] bg-white hover:bg-[#F3F5F9] rounded-[10px] flex items-center gap-[8px] text-[#0B1530] font-bold text-[14px] leading-[20px] transition-colors shrink-0 whitespace-nowrap"
        >
          <span>History</span>
          <ArrowRight size={16} strokeWidth={2} className="text-[#0B1530]" />
        </button>
      </div>
    </div>
  );
};
