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
    const monthlyBills = [
      {
        id: 'total-rent',
        name: 'Flat rent',
        sub: 'Rent · due on the 1st',
        amount: 450.0,
        currency: 'USDC',
      },
      {
        id: 'total-ins',
        name: 'Health insurance',
        sub: 'Insurance · due on the 30th',
        amount: 140.0,
        currency: 'XLM',
      },
      {
        id: 'total-elec',
        name: 'Home electricity',
        sub: 'Electricity · due on the 23rd',
        amount: 38.5,
        currency: 'USDC',
      },
      {
        id: 'total-fibre',
        name: 'Fibre internet',
        sub: 'Internet · due on the 18th',
        amount: 25.0,
        currency: 'USDC',
      },
      {
        id: 'total-design',
        name: 'Design software',
        sub: 'Subscriptions · due on the 26th',
        amount: 18.0,
        currency: 'USDC',
      },
      {
        id: 'total-water',
        name: 'Water',
        sub: 'Water · due on the 3rd',
        amount: 45.0,
        currency: 'EUR',
      },
    ];

    const quarterlyBills = [
      {
        id: 'total-school',
        name: 'School fees',
        sub: 'Education · next Thu 5 Nov',
        amount: 300.0,
        currency: 'USDC',
      },
      {
        id: 'total-office',
        name: 'Office internet',
        sub: 'Business utilities · next Tue 12 Jan',
        amount: 30.0,
        currency: 'USDC',
      },
    ];

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
            Every bill Billza is tracking for you, grouped by billing cycle.
          </p>
        </div>

        {/* Lists Container */}
        <div className="flex flex-col items-start gap-[14px] w-full">
          {/* Monthly · 6 */}
          <div className="flex flex-col items-start gap-[2px] w-full">
            <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
              Monthly · {monthlyBills.length}
            </span>
            <div className="flex flex-col w-full">
              {monthlyBills.map((item, idx) =>
                renderRowItem(
                  item.id,
                  item.name,
                  item.sub,
                  item.amount,
                  item.currency,
                  idx === 0
                )
              )}
            </div>
          </div>

          {/* Quarterly · 2 */}
          <div className="flex flex-col items-start gap-[2px] w-full">
            <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
              Quarterly · {quarterlyBills.length}
            </span>
            <div className="flex flex-col w-full">
              {quarterlyBills.map((item, idx) =>
                renderRowItem(
                  item.id,
                  item.name,
                  item.sub,
                  item.amount,
                  item.currency,
                  idx === 0
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="w-full pt-[15px] border-t border-white/[0.16] flex items-end justify-between gap-3">
          <div className="flex flex-col items-start gap-[2px] tabular-nums">
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
              Every month
            </span>
            <div className="flex items-baseline gap-[3.75px]">
              <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-white">
                531.50
              </span>
              <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-white">
                USDC
              </span>
            </div>
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
              + 140.00 XLM · 45.00 EUR
            </span>
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
    const thisWeekBills = [
      {
        id: 'n14-elec',
        name: 'Home electricity',
        sub: 'Electricity · Fri 23 Oct (in 3 days)',
        amount: 38.5,
        currency: 'USDC',
        billRef: bills.find((b) => b.id === 'bill-electricity'),
      },
      {
        id: 'n14-design',
        name: 'Design software',
        sub: 'Subscriptions · Mon 26 Oct (verifying)',
        amount: 18.0,
        currency: 'USDC',
        billRef: bills.find((b) => b.id === 'bill-design'),
      },
    ];

    const nextWeekBills = [
      {
        id: 'n14-ins',
        name: 'Health insurance',
        sub: 'Insurance · Fri 30 Oct (in 10 days)',
        amount: 140.0,
        currency: 'XLM',
        billRef: bills.find((b) => b.id === 'bill-insurance'),
      },
      {
        id: 'n14-rent',
        name: 'Flat rent',
        sub: 'Rent · Sun 1 Nov (in 12 days)',
        amount: 450.0,
        currency: 'USDC',
        billRef: bills.find((b) => b.id === 'bill-rent-nov'),
      },
    ];

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
                  4
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
            Scheduled bills due between 20 Oct and 3 Nov, ordered by due date.
          </p>
        </div>

        {/* Lists Container */}
        <div className="flex flex-col items-start gap-[14px] w-full">
          <div className="flex flex-col items-start gap-[2px] w-full">
            <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
              Due this week · 2
            </span>
            <div className="flex flex-col w-full">
              {thisWeekBills.map((item, idx) =>
                renderRowItem(
                  item.id,
                  item.name,
                  item.sub,
                  item.amount,
                  item.currency,
                  idx === 0,
                  item.billRef && onSelectBill ? () => onSelectBill(item.billRef!) : undefined
                )
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-[2px] w-full">
            <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
              Due next week · 2
            </span>
            <div className="flex flex-col w-full">
              {nextWeekBills.map((item, idx) =>
                renderRowItem(
                  item.id,
                  item.name,
                  item.sub,
                  item.amount,
                  item.currency,
                  idx === 0,
                  item.billRef && onSelectBill ? () => onSelectBill(item.billRef!) : undefined
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="w-full pt-[15px] border-t border-white/[0.16] flex items-end justify-between gap-3">
          <div className="flex flex-col items-start gap-[2px] tabular-nums">
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
              Due in 14 days
            </span>
            <div className="flex items-baseline gap-[3.75px]">
              <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-white">
                506.50
              </span>
              <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-white">
                USDC
              </span>
            </div>
            <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
              + 140.00 XLM · 45.00 EUR
            </span>
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

        {/* Overdue Items */}
        <div className="flex flex-col items-start gap-[14px] w-full">
          <div className="flex flex-col items-start gap-[2px] w-full">
            <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.78]">
              Past due · {overdueList.length}
            </span>
            <div className="flex flex-col w-full">
              {overdueList.length > 0 ? (
                overdueList.map((bill, idx) =>
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
          </div>

          {overdueList.length > 0 && (
            <div className="w-full rounded-[8px] bg-white/[0.14] border border-white/[0.22] px-3 py-2.5 flex flex-col gap-1">
              <span className="font-bold text-[12px] leading-[16px] text-white">
                Why it failed on Mon 19 Oct
              </span>
              <span className="font-medium text-[12px] leading-[16px] text-white/[0.86]">
                Wallet was short at the time of attempt. Your wallet now has 312.50 USDC available.
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
              2 days late · Retry ready
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
  const totalPaidCount = stellarPaid.length + manualPaid.length;

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
                {totalPaidCount}
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
          Bills settled in October via Stellar Testnet or marked paid directly.
        </p>
      </div>

      {/* Lists Container */}
      <div className="flex flex-col items-start gap-[14px] w-full">
        <div className="flex flex-col items-start gap-[2px] w-full">
          <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
            Verified on Stellar · {stellarPaid.length}
          </span>
          <div className="flex flex-col w-full">
            {stellarPaid.map((p, idx) =>
              renderRowItem(
                p.id,
                p.name,
                `Paid on Stellar · ${p.dateLabel}`,
                p.amount,
                p.currency,
                idx === 0
              )
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-[2px] w-full">
          <span className="font-semibold text-[12px] leading-[16px] tracking-[0.6px] text-white/[0.74]">
            Marked paid by you · {manualPaid.length}
          </span>
          <div className="flex flex-col w-full">
            {manualPaid.map((p, idx) =>
              renderRowItem(
                p.id,
                p.name,
                `Direct payment · ${p.dateLabel}`,
                p.amount,
                p.currency,
                idx === 0
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full pt-[15px] border-t border-white/[0.16] flex items-end justify-between gap-3">
        <div className="flex flex-col items-start gap-[2px] tabular-nums">
          <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
            Paid in October
          </span>
          <div className="flex items-baseline gap-[3.75px]">
            <span className="font-extrabold text-[18px] leading-[24px] tracking-[-0.2px] text-white">
              480.00
            </span>
            <span className="font-extrabold text-[12px] leading-[24px] tracking-[0.24px] text-white">
              USDC
            </span>
          </div>
          <span className="font-medium text-[12px] leading-[16px] text-white/[0.74]">
            + 45.00 EUR · 18.00 USDC verifying
          </span>
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
