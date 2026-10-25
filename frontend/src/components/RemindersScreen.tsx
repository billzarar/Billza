import React, { useState } from 'react';
import { Settings, RefreshCw, Bell, Mail, Smartphone, AlertTriangle, Check } from 'lucide-react';
import { BillItem } from '../data/initialData';
import { ReminderItem } from '../data/remindersData';
import { BillIcon } from './BillIcons';

interface RemindersScreenProps {
  reminders: ReminderItem[];
  bills: BillItem[];
  onSelectBill: (bill: BillItem) => void;
  onMarkAsRead: (reminderId: string) => void;
  onMarkAllAsRead: () => void;
  onRetryReminder: (reminderId: string) => void;
  onTriggerToast: (msg: string) => void;
  onOpenSettings?: () => void;
}

type TabKey = 'all' | 'unread' | 'scheduled' | 'read' | 'failed';

export const RemindersScreen: React.FC<RemindersScreenProps> = ({
  reminders,
  bills,
  onSelectBill,
  onMarkAsRead,
  onMarkAllAsRead,
  onRetryReminder,
  onTriggerToast,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Settings form state
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [appEnabled, setAppEnabled] = useState(true);
  const [timing3Days, setTiming3Days] = useState(true);
  const [timing1Day, setTiming1Day] = useState(true);
  const [timingDueDay, setTimingDueDay] = useState(true);
  const [overdueCadence, setOverdueCadence] = useState('every_2_days');

  const unreadCount = reminders.filter((r) => r.isUnread).length;
  const scheduledCount = reminders.filter((r) => r.status === 'scheduled').length;
  const readCount = reminders.filter((r) => r.status === 'read' || (!r.isUnread && r.status === 'sent')).length;
  const failedCount = reminders.filter((r) => r.status === 'failed').length;

  const filteredReminders = reminders.filter((r) => {
    if (activeTab === 'unread') return r.isUnread;
    if (activeTab === 'scheduled') return r.status === 'scheduled';
    if (activeTab === 'read') return r.status === 'read' || (!r.isUnread && r.status === 'sent');
    if (activeTab === 'failed') return r.status === 'failed';
    return true; // 'all'
  });

  const overdueReminders = filteredReminders.filter((r) => r.isOverdueSection);
  const upcomingReminders = filteredReminders.filter((r) => !r.isOverdueSection);

  const handleViewBillByReminder = (rem: ReminderItem) => {
    const matched = bills.find((b) => b.id === rem.billId || b.name === rem.billName);
    if (matched) {
      onSelectBill(matched);
    } else {
      // Fallback: create mock bill matching reminder
      const fallbackBill: BillItem = {
        id: rem.billId,
        name: rem.billName,
        category: 'Services',
        frequency: 'monthly',
        subtitle: rem.subtitle,
        billsSubtitle: rem.subtitle,
        dueDateLabel: rem.dueDateLabel,
        dueInLabel: rem.statusBadge,
        status: rem.tone === 'overdue' ? 'overdue' : 'soon',
        amount: rem.amount,
        currency: rem.currency,
        actionType: 'pay',
        icon: rem.icon,
        recipientAddress: 'GBZX7K4M9J2RT8LP5V3N6WQ2C9X7H4Y8B5D2E6F9Q4PA',
        recipientShort: 'GBZX…Q4PA',
      };
      onSelectBill(fallbackBill);
    }
  };

  const renderViaIcons = (via: ReminderItem['via']) => {
    if (via === 'app') {
      return (
        <span className="inline-flex items-center gap-[6px] text-[#4A5675]">
          <Smartphone size={14} strokeWidth={1.8} className="text-[#0B1530]" />
          <span className="font-['Onest'] font-medium text-[12px] leading-[16px]">In-app</span>
        </span>
      );
    }
    if (via === 'email') {
      return (
        <span className="inline-flex items-center gap-[6px] text-[#4A5675]">
          <Mail size={14} strokeWidth={1.8} className="text-[#0B1530]" />
          <span className="font-['Onest'] font-medium text-[12px] leading-[16px]">Email</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-[6px] text-[#4A5675]">
        <span className="inline-flex items-center gap-[3px]">
          <Mail size={14} strokeWidth={1.8} className="text-[#0B1530]" />
          <Smartphone size={14} strokeWidth={1.8} className="text-[#0B1530]" />
        </span>
        <span className="font-['Onest'] font-medium text-[12px] leading-[16px]">Email and in-app</span>
      </span>
    );
  };

  const renderStatusBadge = (rem: ReminderItem) => {
    if (rem.statusBadgeKind === 'verifying') {
      return (
        <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-[#E6ECFB] border border-[#E6ECFB] rounded-[6px] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#2F4FBF] whitespace-nowrap">
          {rem.statusBadge}
        </span>
      );
    }
    if (rem.statusBadgeKind === 'overdue') {
      return (
        <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-[#FDE8E6] border border-[#D2453A] rounded-[6px] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#B42318] whitespace-nowrap">
          {rem.statusBadge}
        </span>
      );
    }
    if (rem.statusBadgeKind === 'testnet') {
      return (
        <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-white border border-[#77839F] rounded-[6px] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#4A5675] whitespace-nowrap">
          {rem.statusBadge}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-[#EEF1F6] border border-[#EEF1F6] rounded-[6px] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#0B1530] whitespace-nowrap">
        {rem.statusBadge}
      </span>
    );
  };

  const renderReminderRow = (rem: ReminderItem) => {
    return (
      <div
        key={rem.id}
        className={`relative border-t border-[#EEF1F6] transition-colors ${
          rem.isUnread ? 'bg-[#F5F8FF]' : 'bg-white hover:bg-[#F8F9FC]/70'
        }`}
      >
        {/* Unread blue dot */}
        {rem.isUnread && (
          <span
            aria-label="Unread reminder"
            className="absolute left-[9px] top-[30px] w-[8px] height-[8px] h-[8px] rounded-full bg-[#4164D9] shrink-0"
          />
        )}

        {/* Desktop Layout (lg+) */}
        <div className="hidden lg:grid lg:grid-cols-[380px_160px_100px_110px_90px_1fr] items-center gap-4 pl-[28px] pr-[20px] py-[14px] min-h-[68px]">
          {/* Col 1: Icon + Bill name + message + optional error */}
          <div className="flex items-center gap-[14px] min-w-0">
            <div
              className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center shrink-0 ${
                rem.tone === 'overdue'
                  ? 'bg-[#FDE8E6] text-[#B42318]'
                  : 'bg-[#EEF1F6] text-[#0B1530]'
              }`}
            >
              <BillIcon type={rem.icon} size={18} />
            </div>

            <div className="flex flex-col gap-[2px] min-w-0">
              <span className="font-['Onest'] font-extrabold text-[14px] leading-[20px] text-[#0B1530] truncate">
                {rem.billName}
              </span>
              <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#0B1530] truncate">
                {rem.subtitle}
              </span>
              {rem.errorDetail && (
                <div className="flex items-center gap-1 text-[#B42318] pt-0.5">
                  <AlertTriangle size={12} strokeWidth={2.2} className="shrink-0" />
                  <span className="font-['Onest'] font-bold text-[12px] leading-[16px]">
                    {rem.errorDetail}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Sent or scheduled */}
          <div className="flex flex-col gap-[2px] min-w-0">
            <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530] whitespace-nowrap">
              {rem.timeLabel}
            </span>
            {renderViaIcons(rem.via)}
          </div>

          {/* Col 3: Bill due */}
          <div>
            <span
              className={`font-['Onest'] font-semibold text-[14px] leading-[20px] whitespace-nowrap ${
                rem.tone === 'overdue' ? 'text-[#B42318]' : 'text-[#0B1530]'
              }`}
            >
              {rem.dueDateLabel}
            </span>
          </div>

          {/* Col 4: Amount */}
          <div className="flex items-baseline justify-end gap-[4px] tabular-nums">
            <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
              {rem.amount.toFixed(2)}
            </span>
            <span className="font-['Onest'] font-bold text-[12px] leading-[16px] text-[#4A5675]">
              {rem.currency}
            </span>
          </div>

          {/* Col 5: Status */}
          <div>{renderStatusBadge(rem)}</div>

          {/* Col 6: Actions */}
          <div className="flex items-center justify-end gap-[10px]">
            {rem.actionText === 'Mark as read' && rem.isUnread && (
              <button
                type="button"
                onClick={() => onMarkAsRead(rem.id)}
                className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#2F4FBF] underline hover:text-[#1E3A9E] cursor-pointer whitespace-nowrap"
              >
                Mark as read
              </button>
            )}

            {rem.actionText === 'Retry now' && (
              <button
                type="button"
                onClick={() => onRetryReminder(rem.id)}
                className="inline-flex items-center gap-[6px] font-['Onest'] font-bold text-[14px] leading-[20px] text-[#2F4FBF] underline hover:text-[#1E3A9E] cursor-pointer whitespace-nowrap"
              >
                <RefreshCw size={14} strokeWidth={2} />
                <span>Retry now</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleViewBillByReminder(rem)}
              className="h-[38px] px-[13px] bg-white hover:bg-[#F8F9FC] border border-[#DDE2EC] rounded-[8px] font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530] transition-colors cursor-pointer whitespace-nowrap"
            >
              View bill
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Responsive Layout (< lg) */}
        <div className="flex lg:hidden flex-col gap-3 p-4 pl-7 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-[40px] h-[40px] rounded-[20px] flex items-center justify-center shrink-0 ${
                  rem.tone === 'overdue'
                    ? 'bg-[#FDE8E6] text-[#B42318]'
                    : 'bg-[#EEF1F6] text-[#0B1530]'
                }`}
              >
                <BillIcon type={rem.icon} size={18} />
              </div>

              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-['Onest'] font-extrabold text-[14px] leading-[20px] text-[#0B1530] truncate">
                  {rem.billName}
                </span>
                <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#0B1530]">
                  {rem.subtitle}
                </span>
                {rem.errorDetail && (
                  <span className="font-['Onest'] font-bold text-[12px] text-[#B42318] pt-0.5">
                    {rem.errorDetail}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-1 shrink-0 tabular-nums">
              <span className="font-['Onest'] font-bold text-[15px] leading-[20px] text-[#0B1530]">
                {rem.amount.toFixed(2)}
              </span>
              <span className="font-['Onest'] font-bold text-[12px] leading-[16px] text-[#4A5675]">
                {rem.currency}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pl-[52px]">
            <div className="flex items-center gap-2">
              <span
                className={`font-['Onest'] font-semibold text-[13px] ${
                  rem.tone === 'overdue' ? 'text-[#B42318]' : 'text-[#0B1530]'
                }`}
              >
                {rem.dueDateLabel}
              </span>
              {renderStatusBadge(rem)}
            </div>

            <div className="flex items-center gap-2">
              {rem.actionText === 'Mark as read' && rem.isUnread && (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(rem.id)}
                  className="font-['Onest'] font-bold text-[13px] text-[#2F4FBF] underline cursor-pointer"
                >
                  Mark read
                </button>
              )}
              {rem.actionText === 'Retry now' && (
                <button
                  type="button"
                  onClick={() => onRetryReminder(rem.id)}
                  className="font-['Onest'] font-bold text-[13px] text-[#2F4FBF] underline cursor-pointer"
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => handleViewBillByReminder(rem)}
                className="h-[34px] px-3 bg-white border border-[#DDE2EC] rounded-[8px] font-['Onest'] font-bold text-[13px] text-[#0B1530]"
              >
                View bill
              </button>
            </div>
          </div>

          <div className="pl-[52px] pt-0.5 text-[12px] text-[#4A5675] flex items-center justify-between">
            <span>{rem.timeLabel}</span>
            {renderViaIcons(rem.via)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-[24px] sm:gap-[28px]">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <div className="flex flex-col gap-[6px] sm:gap-[8.5px]">
          <h1 className="font-['Onest'] font-extrabold text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] tracking-[-1px] text-[#0B1530]">
            Reminders
          </h1>
          <p className="font-['Onest'] font-medium text-[15px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#4A5675]">
            {unreadCount} unread. Billza sends reminders by email and inside the app.
          </p>
        </div>

        <div className="flex items-center gap-[10px] self-start sm:self-auto flex-wrap">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="h-[44px] px-[19px] bg-white hover:bg-[#F8F9FC] border border-[#0B1530] rounded-[10px] font-['Onest'] font-bold text-[16px] leading-[24px] text-[#0B1530] transition-colors whitespace-nowrap cursor-pointer"
            >
              Mark all as read
            </button>
          ) : (
            <div className="h-[44px] px-[19px] bg-[#E3F4EA] border border-[#2B9460] rounded-[10px] inline-flex items-center gap-2 font-['Onest'] font-bold text-[15px] text-[#1B7A4B]">
              <Check size={16} strokeWidth={2.4} />
              <span>All caught up</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                setShowSettingsModal(true);
              }
            }}
            className="inline-flex items-center gap-[8px] h-[44px] px-[17px] bg-white hover:bg-[#F8F9FC] border border-[#0B1530] rounded-[10px] font-['Onest'] font-bold text-[16px] leading-[24px] text-[#0B1530] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Settings size={16} strokeWidth={2} />
            <span>Reminder settings</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Row (4 TotalCards: 2x2 on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-[16px] w-full">
        {/* TotalCard 1: Each month */}
        <div className="w-full min-h-[118px] sm:min-h-[136px] bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col justify-between overflow-hidden shadow-2xs">
          <div className="w-full h-[34px] sm:h-[42px] bg-[#0B1530] rounded-t-[10px] px-3 sm:px-[20px] py-2 sm:py-[11px] flex items-center gap-1.5 sm:gap-[8px] shrink-0">
            <span className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-[3px] bg-[#7F9BF0] shrink-0" />
            <span className="font-['Onest'] font-semibold text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-white truncate">
              Each month
            </span>
          </div>
          <div className="flex-1 px-3 sm:px-[20px] py-2.5 sm:pt-[16px] sm:pb-[20px] flex flex-col gap-1 sm:gap-[4px] justify-between">
            <div className="flex items-baseline gap-1 sm:gap-[5px] tabular-nums">
              <span className="font-['Onest'] font-extrabold text-[19px] xs:text-[22px] sm:text-[28px] leading-[26px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
                531.50
              </span>
              <span className="font-['Onest'] font-bold text-[11px] sm:text-[12px] leading-[16px] text-[#0B1530]">
                USDC
              </span>
            </div>
            <span className="font-['Onest'] font-medium text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] text-[#4A5675] truncate">
              Plus 140.00 XLM and 45.00 EUR
            </span>
          </div>
        </div>

        {/* TotalCard 2: Each quarter */}
        <div className="w-full min-h-[118px] sm:min-h-[136px] bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col justify-between overflow-hidden shadow-2xs">
          <div className="w-full h-[34px] sm:h-[42px] bg-[#EEF1F6] rounded-t-[10px] px-3 sm:px-[20px] py-2 sm:py-[11px] flex items-center gap-1.5 sm:gap-[8px] shrink-0">
            <span className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-[3px] bg-[#8A94AD] shrink-0" />
            <span className="font-['Onest'] font-semibold text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#3B4664] truncate">
              Each quarter
            </span>
          </div>
          <div className="flex-1 px-3 sm:px-[20px] py-2.5 sm:pt-[16px] sm:pb-[20px] flex flex-col gap-1 sm:gap-[4px] justify-between">
            <div className="flex items-baseline gap-1 sm:gap-[5px] tabular-nums">
              <span className="font-['Onest'] font-extrabold text-[19px] xs:text-[22px] sm:text-[28px] leading-[26px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
                330.00
              </span>
              <span className="font-['Onest'] font-bold text-[11px] sm:text-[12px] leading-[16px] text-[#0B1530]">
                USDC
              </span>
            </div>
            <span className="font-['Onest'] font-medium text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] text-[#4A5675] truncate">
              School fees and office internet
            </span>
          </div>
        </div>

        {/* TotalCard 3: Next due */}
        <div className="w-full min-h-[118px] sm:min-h-[136px] bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col justify-between overflow-hidden shadow-2xs">
          <div className="w-full h-[34px] sm:h-[42px] bg-[#FFF1D6] rounded-t-[10px] px-3 sm:px-[20px] py-2 sm:py-[11px] flex items-center gap-1.5 sm:gap-[8px] shrink-0">
            <span className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-[3px] bg-[#E59A1A] shrink-0" />
            <span className="font-['Onest'] font-semibold text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#8A5300] truncate">
              Next due
            </span>
          </div>
          <div className="flex-1 px-3 sm:px-[20px] py-2.5 sm:pt-[16px] sm:pb-[20px] flex flex-col gap-1 sm:gap-[4px] justify-between">
            <span className="font-['Onest'] font-extrabold text-[18px] xs:text-[20px] sm:text-[28px] leading-[26px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530] truncate">
              Fri 23 Oct
            </span>
            <span className="font-['Onest'] font-medium text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] text-[#4A5675] truncate">
              Home electricity, 38.50 USDC
            </span>
          </div>
        </div>

        {/* TotalCard 4: Overdue */}
        <div className="w-full min-h-[118px] sm:min-h-[136px] bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col justify-between overflow-hidden shadow-2xs">
          <div className="w-full h-[34px] sm:h-[42px] bg-[#FDE8E6] rounded-t-[10px] px-3 sm:px-[20px] py-2 sm:py-[11px] flex items-center gap-1.5 sm:gap-[8px] shrink-0">
            <span className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-[3px] bg-[#B42318] shrink-0" />
            <span className="font-['Onest'] font-semibold text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#B42318] truncate">
              Overdue
            </span>
          </div>
          <div className="flex-1 px-3 sm:px-[20px] py-2.5 sm:pt-[16px] sm:pb-[20px] flex flex-col gap-1 sm:gap-[4px] justify-between">
            <div className="flex items-baseline gap-1 sm:gap-[5px] tabular-nums">
              <span className="font-['Onest'] font-extrabold text-[19px] xs:text-[22px] sm:text-[28px] leading-[26px] sm:leading-[36px] tracking-[-0.5px] text-[#B42318]">
                1
              </span>
              <span className="font-['Onest'] font-bold text-[11px] sm:text-[12px] leading-[16px] text-[#B42318]">
                bill
              </span>
            </div>
            <span className="font-['Onest'] font-medium text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] text-[#4A5675] truncate">
              Fibre internet, 2 days late
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Reminders Table Card */}
      <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
        {/* Top Toolbar: Tabs + Caption */}
        <div className="w-full px-4 sm:px-[24px] py-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Segmented Status Tabs */}
          <div
            className="inline-flex items-center p-[3px] gap-[2px] bg-[#EEF1F6] rounded-[10px] min-h-[39px] overflow-x-auto max-w-full"
            role="tablist"
            aria-label="Filter reminders by status"
          >
            {(
              [
                { id: 'all', label: 'All', count: reminders.length },
                { id: 'unread', label: 'Unread', count: unreadCount },
                { id: 'scheduled', label: 'Scheduled', count: scheduledCount },
                { id: 'read', label: 'Read', count: readCount },
                { id: 'failed', label: 'Failed', count: failedCount },
              ] as { id: TabKey; label: string; count: number }[]
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-[33px] px-[12px] rounded-[8px] flex items-center gap-[8px] font-['Onest'] font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B1530] text-white'
                      : 'text-[#4A5675] hover:text-[#0B1530]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-[6px] rounded-[10px] font-['Onest'] font-bold text-[12px] leading-[16px] tabular-nums ${
                      isActive ? 'bg-white/[0.16] text-white' : 'bg-white text-[#0B1530]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Newest first, then what’s coming up
          </span>
        </div>

        {/* Column Header Row (bg-[#F8F9FC], height: 40px) */}
        <div className="hidden lg:grid lg:grid-cols-[380px_160px_100px_110px_90px_1fr] items-center gap-4 px-[28px] py-[12px] h-[40px] bg-[#F8F9FC] font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
          <div>Bill and message</div>
          <div>Sent or scheduled</div>
          <div>Bill due</div>
          <div className="text-right">Amount</div>
          <div>Status</div>
          <div />
        </div>

        {/* List of Reminders */}
        <div className="flex flex-col w-full">
          {filteredReminders.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#4A5675]">
              <p className="font-bold text-[16px] text-[#0B1530]">No reminders in this tab</p>
              <p className="text-[14px] mt-1">Switch to All to see all scheduled and past reminders.</p>
            </div>
          ) : (
            <>
              {/* Section 1: Overdue bills header banner */}
              {overdueReminders.length > 0 && (
                <>
                  <div className="px-5 sm:px-[24px] py-[8.5px] bg-[#FFF8F7] border-t border-[#EEF1F6]">
                    <span className="font-['Onest'] font-bold text-[12px] leading-[16px] text-[#B42318]">
                      Overdue bills
                    </span>
                  </div>
                  {overdueReminders.map(renderReminderRow)}
                </>
              )}

              {/* Section 2: Upcoming bills header banner */}
              {upcomingReminders.length > 0 && (
                <>
                  <div className="px-5 sm:px-[24px] py-[8.5px] bg-[#F8F9FC] border-t border-[#EEF1F6]">
                    <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                      Upcoming bills · 488.50 USDC, 140.00 XLM
                    </span>
                  </div>
                  {upcomingReminders.map(renderReminderRow)}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer Bar */}
        <div className="border-t border-[#EEF1F6] px-4 sm:px-[24px] py-[16.5px] min-h-[49px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
          <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Showing all {reminders.length} reminders. Times are West Africa Time (WAT).
          </span>

          <div className="flex items-center gap-[6px] text-[#4A5675]">
            <Bell size={14} strokeWidth={1.8} className="shrink-0" />
            <span className="font-['Onest'] font-medium text-[12px] leading-[16px]">
              Reminders go out even when you’re signed out.
            </span>
          </div>
        </div>
      </section>

      {/* Reminder Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[16px] border border-[#DDE2EC] max-w-[480px] w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F6]">
              <div className="flex items-center gap-2.5">
                <Settings size={20} className="text-[#0B1530]" />
                <h3 className="font-['Onest'] font-extrabold text-[20px] text-[#0B1530]">
                  Reminder settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-[#EEF1F6] flex items-center justify-center text-[#4A5675] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-[14px]">
              {/* Channel */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-[#0B1530]">Channels</span>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4164D9] cursor-pointer"
                  />
                  <span>Email notifications (to amara@billza.stellar)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appEnabled}
                    onChange={(e) => setAppEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4164D9] cursor-pointer"
                  />
                  <span>In-app notifications and header badges</span>
                </label>
              </div>

              {/* Timing */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#EEF1F6]">
                <span className="font-bold text-[#0B1530]">When to notify</span>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timing3Days}
                    onChange={(e) => setTiming3Days(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4164D9] cursor-pointer"
                  />
                  <span>3 days before due date</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timing1Day}
                    onChange={(e) => setTiming1Day(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4164D9] cursor-pointer"
                  />
                  <span>1 day before due date</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timingDueDay}
                    onChange={(e) => setTimingDueDay(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4164D9] cursor-pointer"
                  />
                  <span>On due date at 08:00 WAT</span>
                </label>
              </div>

              {/* Overdue */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#EEF1F6]">
                <span className="font-bold text-[#0B1530]">Overdue follow-ups</span>
                <select
                  value={overdueCadence}
                  onChange={(e) => setOverdueCadence(e.target.value)}
                  className="h-[38px] px-3 rounded-[8px] border border-[#DDE2EC] font-medium text-[#0B1530] cursor-pointer"
                >
                  <option value="daily">Daily until settled</option>
                  <option value="every_2_days">Every 2 days (Recommended)</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF1F6]">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="h-[40px] px-4 rounded-[10px] border border-[#DDE2EC] font-bold text-[14px] text-[#4A5675] hover:bg-[#F3F5F9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  onTriggerToast('Saved reminder notification preferences');
                }}
                className="h-[40px] px-5 rounded-[10px] bg-[#0B1530] hover:bg-[#192852] font-bold text-[14px] text-white cursor-pointer"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
