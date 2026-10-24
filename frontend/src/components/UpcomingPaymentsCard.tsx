import React from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { BillItem } from '../data/initialData';
import { BillIcon } from './BillIcons';

interface UpcomingPaymentsCardProps {
  bills: BillItem[];
  selectedCategory: string | null;
  statusFilter: string | null;
  onClearFilters: () => void;
  onPayBill: (bill: BillItem) => void;
  onMarkPaid: (bill: BillItem) => void;
  onViewStatus: (bill: BillItem) => void;
  onViewAllBills: () => void;
  onSelectBill: (bill: BillItem) => void;
}

export const UpcomingPaymentsCard: React.FC<UpcomingPaymentsCardProps> = ({
  bills,
  selectedCategory,
  statusFilter,
  onClearFilters,
  onPayBill,
  onMarkPaid,
  onViewStatus,
  onViewAllBills,
  onSelectBill,
}) => {
  // Filter to unpaid/upcoming bills by default unless statusFilter is 'paid'
  const filteredBills = bills.filter((bill) => {
    if (selectedCategory && bill.category !== selectedCategory) return false;
    if (statusFilter === 'overdue') return bill.status === 'overdue';
    if (statusFilter === 'next14') return bill.inNext14Days && bill.status !== 'paid';
    if (statusFilter === 'paid') return bill.status === 'paid';
    // Default upcoming view shows overdue, soon, pending, upcoming
    return bill.status !== 'paid';
  });

  const renderStatusBadge = (bill: BillItem) => {
    if (bill.status === 'overdue') {
      return (
        <span className="inline-flex items-center h-[28px] px-[11px] bg-[#FDE8E6] border border-[#D2453A] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#B42318] whitespace-nowrap shrink-0">
          {bill.dueInLabel}
        </span>
      );
    }
    if (bill.status === 'soon') {
      return (
        <span className="inline-flex items-center h-[28px] px-[11px] bg-[#FDF1DD] border border-[#B8740A] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#94560A] whitespace-nowrap shrink-0">
          {bill.dueInLabel}
        </span>
      );
    }
    if (bill.status === 'pending') {
      return (
        <span className="inline-flex items-center h-[28px] px-[11px] bg-[#E6ECFB] border border-[#E6ECFB] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#2F4FBF] whitespace-nowrap shrink-0">
          Verifying
        </span>
      );
    }
    if (bill.status === 'paid') {
      return (
        <span className="inline-flex items-center h-[28px] px-[11px] bg-[#E3F4EA] border border-[#1B7A4B]/30 rounded-[6px] font-bold text-[12px] leading-[16px] text-[#1B7A4B] whitespace-nowrap shrink-0">
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center h-[28px] px-[11px] bg-[#EEF1F6] border border-[#EEF1F6] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#0B1530] whitespace-nowrap shrink-0">
        {bill.dueInLabel}
      </span>
    );
  };

  const renderAction = (bill: BillItem) => {
    if (bill.status === 'paid') {
      return (
        <div className="flex flex-col items-end tabular-nums">
          <div className="flex items-baseline gap-[3.5px]">
            <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">
              {bill.amount.toFixed(2)}
            </span>
            <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">
              {bill.currency}
            </span>
          </div>
          <span className="font-bold text-[12px] leading-[16px] text-[#1B7A4B] mt-1">
            Paid on Stellar
          </span>
        </div>
      );
    }

    if (bill.actionType === 'status' || bill.status === 'pending') {
      return (
        <div className="flex flex-col items-end gap-[6px] tabular-nums">
          <div className="flex items-baseline gap-[3.5px]">
            <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">
              {bill.amount.toFixed(2)}
            </span>
            <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">
              {bill.currency}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onViewStatus(bill)}
            className="font-bold text-[14px] leading-[20px] text-[#2F4FBF] underline hover:text-[#0B1530] transition-colors whitespace-nowrap"
          >
            View status
          </button>
        </div>
      );
    }

    if (bill.actionType === 'mark') {
      return (
        <div className="flex flex-col items-end gap-[6px] tabular-nums">
          <div className="flex items-baseline gap-[3.5px]">
            <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">
              {bill.amount.toFixed(2)}
            </span>
            <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">
              {bill.currency}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onMarkPaid(bill)}
            className="font-bold text-[14px] leading-[20px] text-[#2F4FBF] underline hover:text-[#0B1530] transition-colors whitespace-nowrap"
          >
            Mark as paid
          </button>
        </div>
      );
    }

    // Primary solid navy button for overdue & due soon
    if (bill.status === 'overdue' || bill.status === 'soon') {
      return (
        <button
          type="button"
          onClick={() => onPayBill(bill)}
          className="inline-flex items-center justify-center h-[36px] px-[14px] bg-[#0B1530] hover:bg-[#1A2A55] text-white font-bold text-[15px] sm:text-[16px] leading-[24px] rounded-[10px] transition-colors whitespace-nowrap shrink-0 tabular-nums"
        >
          Pay {bill.amount.toFixed(2)} {bill.currency}
        </button>
      );
    }

    // Blue text button for upcoming bills
    return (
      <button
        type="button"
        onClick={() => onPayBill(bill)}
        className="inline-flex items-center justify-end h-[36px] px-[12px] hover:bg-[#E6ECFB]/60 text-[#2F4FBF] font-bold text-[15px] sm:text-[16px] leading-[24px] rounded-[10px] transition-colors whitespace-nowrap shrink-0 tabular-nums"
      >
        Pay {bill.amount.toFixed(2)} {bill.currency}
      </button>
    );
  };

  return (
    <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] flex flex-col justify-between overflow-hidden">
      <div className="flex flex-col w-full">
        {/* Top Header */}
        <div className="px-5 sm:px-[31px] pt-6 sm:pt-[30px] pb-2 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-[3.5px]">
            <h2 className="font-extrabold text-[24px] sm:text-[28px] leading-[32px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
              Upcoming payments
            </h2>
            <p className="font-normal text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-[#4A5675]">
              Overdue first, then by due date
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-1">
            {(selectedCategory || statusFilter) && (
              <button
                type="button"
                onClick={onClearFilters}
                className="font-semibold text-[13px] leading-[18px] text-[#4A5675] hover:text-[#0B1530] underline whitespace-nowrap"
              >
                Reset filter
              </button>
            )}
            <button
              type="button"
              onClick={onViewAllBills}
              className="font-bold text-[14px] leading-[20px] text-[#2F4FBF] underline hover:text-[#0B1530] transition-colors whitespace-nowrap"
            >
              All bills
            </button>
          </div>
        </div>

        {/* Desktop Column Headers */}
        <div className="hidden sm:grid sm:grid-cols-12 items-center px-[32px] pt-[20px] pb-[11px] font-medium text-[12px] leading-[16px] text-[#4A5675]">
          <div className="col-span-5">Bill</div>
          <div className="col-span-2">Due</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Amount</div>
        </div>

        {/* Bill Rows */}
        <div className="flex flex-col w-full">
          {filteredBills.length === 0 ? (
            <div className="px-6 py-12 border-t border-[#EEF1F6] flex flex-col items-center justify-center text-center gap-2">
              <p className="font-bold text-[16px] text-[#0B1530]">
                No bills match the current filter
              </p>
              <p className="text-[14px] text-[#4A5675]">
                Clear your active category or status filter to see all upcoming bills.
              </p>
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-2 h-[36px] px-4 bg-[#0B1530] text-white font-bold text-[14px] rounded-[8px]"
              >
                Show all upcoming bills
              </button>
            </div>
          ) : (
            filteredBills.map((bill) => {
              const isOverdue = bill.status === 'overdue';
              return (
                <div
                  key={bill.id}
                  className={`border-t border-[#EEF1F6] px-5 sm:px-[32px] py-[18px] transition-colors ${
                    isOverdue ? 'bg-[#FFF8F7]' : 'bg-white hover:bg-[#F8F9FC]/80'
                  }`}
                >
                  {/* Desktop / Tablet Grid Layout */}
                  <div className="hidden sm:grid sm:grid-cols-12 items-start gap-2">
                    {/* Col 1: Icon + Bill Title + Subtitle + Warning/Error */}
                    <button
                      type="button"
                      onClick={() => onSelectBill(bill)}
                      className="col-span-5 flex items-start gap-[14px] min-w-0 pr-2 text-left group cursor-pointer"
                    >
                      <div
                        className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          isOverdue
                            ? 'bg-[#FDE8E6] text-[#B42318]'
                            : 'bg-[#EEF1F6] text-[#0B1530]'
                        }`}
                      >
                        <BillIcon type={bill.icon} size={19} />
                      </div>

                      <div className="flex flex-col gap-[6px] min-w-0">
                        <div className="flex flex-col gap-[2px] min-w-0">
                          <span className="font-bold text-[14px] leading-[20px] text-[#0B1530] group-hover:text-[#2F4FBF] transition-colors truncate">
                            {bill.name}
                          </span>
                          <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                            {bill.subtitle}
                          </span>
                        </div>

                        {bill.failureReason && (
                          <div className="flex items-center gap-[4px] text-[#B42318]">
                            <X size={12} strokeWidth={2.5} className="shrink-0" />
                            <span className="font-bold text-[12px] leading-[16px]">
                              {bill.failureReason}
                            </span>
                          </div>
                        )}

                        {bill.warningReason && (
                          <div className="flex items-center gap-[4px] text-[#8A5300]">
                            <AlertTriangle size={12} strokeWidth={2.2} className="shrink-0" />
                            <span className="font-bold text-[12px] leading-[16px]">
                              {bill.warningReason}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Col 2: Due Date */}
                    <div className="col-span-2 pt-[2px]">
                      <span
                        className={`font-semibold text-[14px] leading-[20px] whitespace-nowrap ${
                          isOverdue ? 'text-[#B42318]' : 'text-[#4A5675]'
                        }`}
                      >
                        {bill.dueDateLabel}
                      </span>
                    </div>

                    {/* Col 3: Status Badge */}
                    <div className="col-span-2 pt-[1px]">{renderStatusBadge(bill)}</div>

                    {/* Col 4: Action / Amount */}
                    <div className="col-span-3 flex justify-end items-start">
                      {renderAction(bill)}
                    </div>
                  </div>

                  {/* Mobile Responsive Layout (< sm) */}
                  <div className="flex sm:hidden flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectBill(bill)}
                        className="flex items-start gap-3 min-w-0 text-left group"
                      >
                        <div
                          className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center shrink-0 ${
                            isOverdue
                              ? 'bg-[#FDE8E6] text-[#B42318]'
                              : 'bg-[#EEF1F6] text-[#0B1530]'
                          }`}
                        >
                          <BillIcon type={bill.icon} size={19} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-bold text-[14px] leading-[20px] text-[#0B1530] group-hover:text-[#2F4FBF] truncate">
                            {bill.name}
                          </span>
                          <span className="font-medium text-[12px] leading-[16px] text-[#4A5675]">
                            {bill.subtitle} ·{' '}
                            <span className={isOverdue ? 'text-[#B42318] font-semibold' : ''}>
                              {bill.dueDateLabel}
                            </span>
                          </span>
                        </div>
                      </button>
                      {renderStatusBadge(bill)}
                    </div>

                    {bill.failureReason && (
                      <div className="flex items-center gap-[4px] text-[#B42318] pl-[52px]">
                        <X size={12} strokeWidth={2.5} className="shrink-0" />
                        <span className="font-bold text-[12px] leading-[16px]">
                          {bill.failureReason}
                        </span>
                      </div>
                    )}

                    {bill.warningReason && (
                      <div className="flex items-center gap-[4px] text-[#8A5300] pl-[52px]">
                        <AlertTriangle size={12} strokeWidth={2.2} className="shrink-0" />
                        <span className="font-bold text-[12px] leading-[16px]">
                          {bill.warningReason}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pl-[52px] pt-1">
                      <span className="text-[12px] font-medium text-[#4A5675]">
                        Due {bill.dueDateLabel}
                      </span>
                      {renderAction(bill)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Note */}
      <div className="border-t border-[#EEF1F6] px-5 sm:px-[31px] py-[18px] flex items-center gap-[8px] bg-white">
        <Info size={16} className="text-[#4A5675] shrink-0" />
        <p className="font-medium text-[12px] leading-[16px] text-[#4A5675]">
          On Testnet, payments go to the Stellar address on each bill using test tokens.
        </p>
      </div>
    </section>
  );
};
