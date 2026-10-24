import React from 'react';
import { Clock, X, Check, PenLine, ArrowRight } from 'lucide-react';
import { PaymentHistoryItem } from '../data/initialData';
import { BillIcon } from './BillIcons';

interface RecentPaymentsCardProps {
  payments: PaymentHistoryItem[];
  onInspectPayment: (payment: PaymentHistoryItem) => void;
  onViewFullHistory: () => void;
}

export const RecentPaymentsCard: React.FC<RecentPaymentsCardProps> = ({
  payments,
  onInspectPayment,
  onViewFullHistory,
}) => {
  const verifiedCount = payments.filter((p) => p.status === 'paid').length;
  const manualCount = payments.filter((p) => p.status === 'manual').length;
  const verifyingCount = payments.filter((p) => p.status === 'pending').length;
  const failedCount = payments.filter((p) => p.status === 'failed').length;

  const getCircleStyles = (status: PaymentHistoryItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-[#E6ECFB] text-[#2F4FBF]';
      case 'failed':
        return 'bg-[#FDE8E6] text-[#B42318]';
      case 'paid':
        return 'bg-[#E3F4EA] text-[#1B7A4B]';
      case 'manual':
      default:
        return 'bg-[#EEF1F6] text-[#4A5675]';
    }
  };

  const renderStatusLine = (item: PaymentHistoryItem) => {
    if (item.status === 'pending') {
      return (
        <div className="flex items-center gap-[4px] text-[#2F4FBF]">
          <Clock size={13} strokeWidth={2.2} />
          <span className="font-bold text-[12px] leading-[16px]">{item.statusLabel}</span>
        </div>
      );
    }
    if (item.status === 'failed') {
      return (
        <div className="flex items-center gap-[4px] text-[#B42318]">
          <X size={13} strokeWidth={2.5} />
          <span className="font-bold text-[12px] leading-[16px]">{item.statusLabel}</span>
        </div>
      );
    }
    if (item.status === 'paid') {
      return (
        <div className="flex items-center gap-[4px] text-[#1B7A4B]">
          <Check size={13} strokeWidth={2.5} />
          <span className="font-bold text-[12px] leading-[16px]">{item.statusLabel}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-[4px] text-[#4A5675]">
        <PenLine size={13} strokeWidth={2.1} />
        <span className="font-bold text-[12px] leading-[16px]">{item.statusLabel}</span>
      </div>
    );
  };

  return (
    <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:px-[29px] sm:pt-[31px] sm:pb-[27px] flex flex-col justify-between gap-6">
      {/* Top Group: Header + List */}
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-[3.5px] pb-[6px]">
          <h2 className="font-extrabold text-[24px] sm:text-[28px] leading-[32px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
            Recent payments
          </h2>
          <p className="font-normal text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-[#4A5675]">
            October so far, newest first
          </p>
        </div>

        {/* Payment Items */}
        <div className="flex flex-col w-full">
          {payments.slice(0, 5).map((item) => {
            const isFailed = item.status === 'failed';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onInspectPayment(item)}
                className="flex items-center justify-between gap-[14px] w-full min-h-[81px] pt-[15px] pb-[14px] border-t border-[#EEF1F6] hover:bg-[#F8F9FC] transition-colors text-left rounded-xs px-1"
              >
                {/* Left: Icon + Name + Timestamp */}
                <div className="flex items-center gap-[14px] min-w-0 flex-1">
                  <div
                    className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center shrink-0 ${getCircleStyles(
                      item.status
                    )}`}
                  >
                    <BillIcon type={item.icon} size={18} />
                  </div>

                  <div className="flex flex-col gap-[2px] min-w-0">
                    <span className="font-bold text-[14px] leading-[20px] text-[#0B1530] truncate">
                      {item.name}
                    </span>
                    <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                      {item.dateLabel}
                    </span>
                  </div>
                </div>

                {/* Right: Amount Tag + Status */}
                <div className="flex flex-col items-end gap-[5px] shrink-0 tabular-nums">
                  <div className="inline-flex items-baseline gap-[3.25px] h-[31px] pl-[14px] pr-[10px] py-[5px] bg-[#EEF1F6] rounded-r-[6px]">
                    <span
                      className={`font-extrabold text-[15px] leading-[20px] tracking-[-0.1px] ${
                        isFailed ? 'line-through text-[#77839F]' : 'text-[#0B1530]'
                      }`}
                    >
                      {item.amount.toFixed(2)}
                    </span>
                    <span
                      className={`font-extrabold text-[11px] leading-[20px] tracking-[0.22px] ${
                        isFailed ? 'text-[#77839F]' : 'text-[#0B1530]'
                      }`}
                    >
                      {item.currency}
                    </span>
                  </div>

                  {renderStatusLine(item)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Group: Dashed Summary + View Full History Button */}
      <div className="flex flex-col gap-[14px] pt-[16px] w-full">
        {/* Dashed Summary Box */}
        <div className="w-full bg-[#F8F9FC] border border-dashed border-[#B7C2D9] rounded-[10px] px-[16px] py-[14px] flex flex-col gap-[8px]">
          <div className="grid grid-cols-2 gap-[12px] items-center">
            <div className="flex items-baseline gap-[6px] tabular-nums">
              <span className="font-extrabold text-[20px] leading-[28px] text-[#1B7A4B]">
                {verifiedCount}
              </span>
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675]">
                verified on Stellar
              </span>
            </div>

            <div className="flex items-baseline gap-[6px] tabular-nums">
              <span className="font-extrabold text-[20px] leading-[28px] text-[#0B1530]">
                {manualCount}
              </span>
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675]">
                marked by you
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[12px] items-center">
            <div className="flex items-baseline gap-[6px] tabular-nums">
              <span className="font-extrabold text-[20px] leading-[28px] text-[#2F4FBF]">
                {verifyingCount}
              </span>
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675]">
                verifying
              </span>
            </div>

            <div className="flex items-baseline gap-[6px] tabular-nums">
              <span className="font-extrabold text-[20px] leading-[28px] text-[#B42318]">
                {failedCount}
              </span>
              <span className="font-medium text-[12px] leading-[16px] text-[#4A5675]">failed</span>
            </div>
          </div>
        </div>

        {/* Secondary Full-Width Button */}
        <button
          type="button"
          onClick={onViewFullHistory}
          className="w-full h-[44px] px-[19px] bg-white hover:bg-[#F3F5F9] border border-[#0B1530] rounded-[10px] flex items-center justify-center gap-[8px] transition-colors whitespace-nowrap"
        >
          <span className="font-bold text-[16px] leading-[24px] text-[#0B1530]">
            View full payment history
          </span>
          <ArrowRight size={16} strokeWidth={2} className="text-[#0B1530]" />
        </button>
      </div>
    </section>
  );
};
