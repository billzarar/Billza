import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Check,
  Edit2,
  Zap,
} from 'lucide-react';
import { BillItem } from '../data/initialData';
import { BillIcon } from './BillIcons';
import { fetchReminderPreferencesApi, updateReminderPreferencesApi } from '../services/api';

interface ReminderSettingsScreenProps {
  bills: BillItem[];
  onBackToReminders: () => void;
  onSelectBill: (bill: BillItem) => void;
  onTriggerToast: (msg: string) => void;
}

export const ReminderSettingsScreen: React.FC<ReminderSettingsScreenProps> = ({
  bills,
  onBackToReminders,
  onSelectBill,
  onTriggerToast,
}) => {
  // Section 1: How reminders reach you
  const [emailToggle, setEmailToggle] = useState(true);
  const [appToggle, setAppToggle] = useState(true);
  const [sendAtTime, setSendAtTime] = useState('08:00');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Section 2: Default timing for new bills
  const [remind7Days, setRemind7Days] = useState(false);
  const [remind3Days, setRemind3Days] = useState(true);
  const [remind1Day, setRemind1Day] = useState(false);
  const [remindDueDate, setRemindDueDate] = useState(true);

  // Section 3: Reminders for each bill
  const [showAllBills, setShowAllBills] = useState(false);
  const [customBillTimings, setCustomBillTimings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    bills.forEach((b) => {
      initial[b.id] = b.reminderWhen || '3 days before, on due date';
    });
    return initial;
  });
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editTimingInput, setEditTimingInput] = useState('');

  // Section 4: If a bill is late
  const [overdueToggle, setOverdueToggle] = useState(true);
  const [overdueCadence, setOverdueCadence] = useState<'daily' | '2days' | 'weekly'>('2days');

  // Section 5: Wallet alerts
  const [walletAlertToggle, setWalletAlertToggle] = useState(true);

  // Unsaved changes tracking & saving status
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchReminderPreferencesApi()
      .then((prefs) => {
        if (!mounted || !prefs) return;
        if (prefs.email_enabled !== undefined) setEmailToggle(prefs.email_enabled);
        if (prefs.in_app_enabled !== undefined) setAppToggle(prefs.in_app_enabled);
        if (prefs.remind_7_days !== undefined) setRemind7Days(prefs.remind_7_days);
        if (prefs.remind_3_days !== undefined) setRemind3Days(prefs.remind_3_days);
        if (prefs.remind_1_day !== undefined) setRemind1Day(prefs.remind_1_day);
        if (prefs.remind_on_due !== undefined) setRemindDueDate(prefs.remind_on_due);
        if (prefs.remind_overdue !== undefined) setOverdueToggle(prefs.remind_overdue);
        setHasUnsavedChanges(false);
      })
      .catch((err) => console.warn('Could not load reminder preferences:', err));
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter((prev) => !prev);
    setHasUnsavedChanges(true);
  };

  const handleTimingPillClick = (
    current: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter(!current);
    setHasUnsavedChanges(true);
  };

  const handleDiscard = () => {
    setEmailToggle(true);
    setAppToggle(true);
    setSendAtTime('08:00');
    setRemind7Days(false);
    setRemind3Days(true);
    setRemind1Day(false);
    setRemindDueDate(true);
    setOverdueToggle(true);
    setOverdueCadence('2days');
    setWalletAlertToggle(true);
    setHasUnsavedChanges(false);
    onTriggerToast('Settings reset to saved values');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateReminderPreferencesApi({
        email_enabled: emailToggle,
        in_app_enabled: appToggle,
        remind_7_days: remind7Days,
        remind_3_days: remind3Days,
        remind_1_day: remind1Day,
        remind_on_due: remindDueDate,
        remind_overdue: overdueToggle,
      });
      setHasUnsavedChanges(false);
      onTriggerToast('Reminder settings saved successfully');
    } catch (err: any) {
      onTriggerToast(err.message || 'Failed to save reminder settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditBill = (billId: string) => {
    setEditingBillId(billId);
    setEditTimingInput(customBillTimings[billId] || '3 days before, on due date');
  };

  const handleSaveBillTiming = (billId: string) => {
    setCustomBillTimings((prev) => ({
      ...prev,
      [billId]: editTimingInput,
    }));
    setEditingBillId(null);
    setHasUnsavedChanges(true);
    onTriggerToast('Updated timing for bill');
  };

  const timeOptions = ['07:00', '08:00', '09:00', '10:00', '12:00', '18:00', '20:00'];

  const displayedBills = showAllBills ? bills : bills.slice(0, 5);

  return (
    <div className="w-full flex flex-col gap-[24px] sm:gap-[28px]">
      {/* 1. Breadcrumb Row */}
      <div className="flex items-center gap-[8px] h-[20px]">
        <button
          type="button"
          onClick={onBackToReminders}
          className="inline-flex items-center gap-[4px] text-[#2F4FBF] hover:text-[#1E3A9E] transition-colors cursor-pointer group"
        >
          <ChevronLeft
            size={18}
            strokeWidth={2}
            className="text-[#2F4FBF] transition-transform group-hover:-translate-x-0.5"
          />
          <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#2F4FBF]">
            Reminders
          </span>
        </button>
        <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#B7C2D9]">
          /
        </span>
        <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#4A5675]">
          Reminder settings
        </span>
      </div>

      {/* 2. Header Row */}
      <div className="flex flex-col gap-[8.5px]">
        <h1 className="font-['Onest'] font-extrabold text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] tracking-[-1px] text-[#0B1530]">
          Reminder settings
        </h1>
        <p className="font-['Onest'] font-medium text-[15px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#4A5675]">
          How reminders reach you, and the timing for upcoming bills and overdue alerts.
        </p>
      </div>

      {/* 3. Main 2-Column Split: Left 744px + Right 360px */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-[24px] items-start w-full">
        {/* Left Column (744px on desktop) */}
        <div className="flex flex-col gap-[24px] min-w-0">
          {/* Card 1: How reminders reach you */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
            <div className="px-5 sm:px-[24px] pt-[20px] pb-1 flex flex-col gap-[4px]">
              <h2 className="font-['Onest'] font-bold text-[20px] leading-[28px] text-[#0B1530]">
                How reminders reach you
              </h2>
              <p className="font-['Onest'] font-normal text-[15px] sm:text-[16px] leading-[24px] text-[#4A5675]">
                For all your bills. Pick email, in-app or both.
              </p>
            </div>

            <div className="px-5 sm:px-[24px] pt-1 pb-2 flex flex-col">
              {/* Row 1: Email */}
              <div className="py-[16px] flex items-center justify-between gap-4">
                <div className="flex flex-col gap-[2px]">
                  <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    Email
                  </span>
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    amara.okafor@gmail.com
                  </span>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailToggle}
                  onClick={() => handleToggle(setEmailToggle)}
                  className={`w-[44px] h-[26px] rounded-full p-[3px] transition-colors cursor-pointer flex items-center ${
                    emailToggle ? 'bg-[#4164D9] justify-end' : 'bg-[#DDE2EC] justify-start'
                  }`}
                >
                  <span className="w-[20px] h-[20px] rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {/* Row 2: In the app */}
              <div className="py-[16px] border-t border-[#EEF1F6] flex items-center justify-between gap-4">
                <div className="flex flex-col gap-[2px]">
                  <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    In the app
                  </span>
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Shows on the Reminders page and under the bell icon.
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={appToggle}
                  onClick={() => handleToggle(setAppToggle)}
                  className={`w-[44px] h-[26px] rounded-full p-[3px] transition-colors cursor-pointer flex items-center shrink-0 ${
                    appToggle ? 'bg-[#4164D9] justify-end' : 'bg-[#DDE2EC] justify-start'
                  }`}
                >
                  <span className="w-[20px] h-[20px] rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {/* Row 3: Send at */}
              <div className="py-[16px] border-t border-[#EEF1F6] flex items-center justify-between gap-4 relative">
                <div className="flex flex-col gap-[2px]">
                  <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    Send at
                  </span>
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    West Africa Time (WAT)
                  </span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTimeDropdown((prev) => !prev)}
                    className="h-[43px] w-[150px] px-[15px] bg-white hover:bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                      {sendAtTime}
                    </span>
                    <ChevronDown size={16} strokeWidth={2} className="text-[#4A5675]" />
                  </button>

                  {showTimeDropdown && (
                    <div className="absolute right-0 top-[48px] z-30 w-[150px] bg-white border border-[#DDE2EC] rounded-[10px] shadow-xl py-1 flex flex-col">
                      {timeOptions.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            setSendAtTime(time);
                            setShowTimeDropdown(false);
                            setHasUnsavedChanges(true);
                          }}
                          className={`px-4 py-2 text-left font-['Onest'] font-semibold text-[13px] flex items-center justify-between hover:bg-[#F3F5F9] ${
                            sendAtTime === time ? 'text-[#4164D9] bg-[#E6ECFB]/40' : 'text-[#0B1530]'
                          }`}
                        >
                          <span>{time}</span>
                          {sendAtTime === time && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Default timing for new bills */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
            <div className="px-5 sm:px-[24px] pt-[20px] pb-1 flex flex-col gap-[4px]">
              <h2 className="font-['Onest'] font-bold text-[20px] leading-[28px] text-[#0B1530]">
                Default timing for new bills
              </h2>
              <p className="font-['Onest'] font-normal text-[15px] sm:text-[16px] leading-[24px] text-[#4A5675]">
                Filled in for you when you add a bill. Can be changed per bill.
              </p>
            </div>

            <div className="px-5 sm:px-[24px] pt-1 pb-4 flex flex-col gap-[10px]">
              <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                Remind me
              </span>

              {/* 4 Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[8px]">
                {/* 7 days before */}
                <button
                  type="button"
                  onClick={() => handleTimingPillClick(remind7Days, setRemind7Days)}
                  className={`h-[40px] px-[9px] rounded-[20px] font-['Onest'] font-bold text-[14px] leading-[20px] flex items-center justify-center gap-[6px] border transition-colors cursor-pointer ${
                    remind7Days
                      ? 'bg-[#0B1530] border-[#0B1530] text-white'
                      : 'bg-white hover:bg-[#F8F9FC] border-[#DDE2EC] text-[#0B1530]'
                  }`}
                >
                  {remind7Days && <Check size={13} strokeWidth={2.4} />}
                  <span>7 days before</span>
                </button>

                {/* 3 days before */}
                <button
                  type="button"
                  onClick={() => handleTimingPillClick(remind3Days, setRemind3Days)}
                  className={`h-[40px] px-[9px] rounded-[20px] font-['Onest'] font-bold text-[14px] leading-[20px] flex items-center justify-center gap-[6px] border transition-colors cursor-pointer ${
                    remind3Days
                      ? 'bg-[#0B1530] border-[#0B1530] text-white'
                      : 'bg-white hover:bg-[#F8F9FC] border-[#DDE2EC] text-[#0B1530]'
                  }`}
                >
                  {remind3Days && <Check size={13} strokeWidth={2.4} />}
                  <span>3 days before</span>
                </button>

                {/* 1 day before */}
                <button
                  type="button"
                  onClick={() => handleTimingPillClick(remind1Day, setRemind1Day)}
                  className={`h-[40px] px-[9px] rounded-[20px] font-['Onest'] font-bold text-[14px] leading-[20px] flex items-center justify-center gap-[6px] border transition-colors cursor-pointer ${
                    remind1Day
                      ? 'bg-[#0B1530] border-[#0B1530] text-white'
                      : 'bg-white hover:bg-[#F8F9FC] border-[#DDE2EC] text-[#0B1530]'
                  }`}
                >
                  {remind1Day && <Check size={13} strokeWidth={2.4} />}
                  <span>1 day before</span>
                </button>

                {/* On due date */}
                <button
                  type="button"
                  onClick={() => handleTimingPillClick(remindDueDate, setRemindDueDate)}
                  className={`h-[40px] px-[9px] rounded-[20px] font-['Onest'] font-bold text-[14px] leading-[20px] flex items-center justify-center gap-[6px] border transition-colors cursor-pointer ${
                    remindDueDate
                      ? 'bg-[#0B1530] border-[#0B1530] text-white'
                      : 'bg-white hover:bg-[#F8F9FC] border-[#DDE2EC] text-[#0B1530]'
                  }`}
                >
                  {remindDueDate && <Check size={13} strokeWidth={2.4} />}
                  <span>On due date</span>
                </button>
              </div>

              <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                Pick as many as you like.
              </span>
            </div>
          </div>

          {/* Card 3: Reminders for each bill */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
            <div className="px-5 sm:px-[24px] pt-[20px] pb-1 flex flex-col gap-[4px]">
              <h2 className="font-['Onest'] font-bold text-[20px] leading-[28px] text-[#0B1530]">
                Reminders for each bill
              </h2>
              <p className="font-['Onest'] font-normal text-[15px] sm:text-[16px] leading-[24px] text-[#4A5675]">
                {bills.length} bills configured with notification rules.
              </p>
            </div>

            <div className="px-5 sm:px-[24px] pt-1 pb-4 flex flex-col gap-1">
              <div className="divide-y divide-[#EEF1F6]">
                {displayedBills.map((bill) => {
                  const isCustom = customBillTimings[bill.id]?.includes('7 days');
                  const timingText = customBillTimings[bill.id] || '3 days before, on due date';

                  return (
                    <div
                      key={bill.id}
                      className="py-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F9FC]/60 transition-colors rounded-[8px] px-2"
                    >
                      <div className="flex items-center gap-[12px] min-w-0">
                        <div className="w-[32px] h-[32px] rounded-full bg-[#EEF1F6] flex items-center justify-center text-[#0B1530] shrink-0">
                          <BillIcon type={bill.icon} size={15} />
                        </div>

                        <div className="flex flex-col gap-[2px] min-w-0">
                          <div className="flex items-center gap-[8px]">
                            <button
                              type="button"
                              onClick={() => onSelectBill(bill)}
                              className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530] hover:text-[#2F4FBF] text-left truncate cursor-pointer"
                            >
                              {bill.name}
                            </button>
                            {isCustom && (
                              <span className="inline-flex items-center px-[7px] py-[2px] h-[20px] bg-[#E6ECFB] rounded-[10px] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#2F4FBF]">
                                Custom
                              </span>
                            )}
                          </div>
                          {editingBillId === bill.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={editTimingInput}
                                onChange={(e) => setEditTimingInput(e.target.value)}
                                className="h-[28px] px-2 border border-[#4164D9] rounded font-['Onest'] text-[12px] text-[#0B1530]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveBillTiming(bill.id)}
                                className="h-[28px] px-2 bg-[#0B1530] text-white rounded text-[11px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingBillId(null)}
                                className="text-[11px] text-[#4A5675]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                              {timingText}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartEditBill(bill.id)}
                        className="inline-flex items-center gap-[6px] text-[#2F4FBF] hover:text-[#1E3A9E] cursor-pointer self-start sm:self-center"
                      >
                        <Edit2 size={14} strokeWidth={2} />
                        <span className="font-['Onest'] font-bold text-[14px] leading-[20px]">
                          Edit
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* View all 8 bills toggle button */}
              <button
                type="button"
                onClick={() => setShowAllBills((prev) => !prev)}
                className="mt-2 w-full h-[44px] bg-white hover:bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] flex items-center justify-center gap-2 font-['Onest'] font-bold text-[14px] text-[#0B1530] transition-colors cursor-pointer"
              >
                <span>{showAllBills ? 'Show fewer bills' : `View all ${bills.length} bills`}</span>
                <ChevronRight size={16} strokeWidth={2} className={showAllBills ? 'rotate-90' : ''} />
              </button>
            </div>
          </div>

          {/* Card 4: If a bill is late */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
            <div className="px-5 sm:px-[24px] pt-[20px] pb-1 flex flex-col gap-[4px]">
              <h2 className="font-['Onest'] font-bold text-[20px] leading-[28px] text-[#0B1530]">
                If a bill is late
              </h2>
              <p className="font-['Onest'] font-normal text-[15px] sm:text-[16px] leading-[24px] text-[#4A5675]">
                After the due date passes.
              </p>
            </div>

            <div className="px-5 sm:px-[24px] pt-1 pb-4 flex flex-col">
              {/* Row 1: Overdue reminders */}
              <div className="py-[16px] flex items-center justify-between gap-4">
                <div className="flex flex-col gap-[2px]">
                  <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    Overdue reminders
                  </span>
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Keep reminding me until the bill is paid.
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={overdueToggle}
                  onClick={() => handleToggle(setOverdueToggle)}
                  className={`w-[44px] h-[26px] rounded-full p-[3px] transition-colors cursor-pointer flex items-center ${
                    overdueToggle ? 'bg-[#4164D9] justify-end' : 'bg-[#DDE2EC] justify-start'
                  }`}
                >
                  <span className="w-[20px] h-[20px] rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {/* Row 2: How often segmented control */}
              <div className="pt-[4px] pb-[8px] flex flex-col gap-[10px]">
                <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  How often
                </span>

                <div
                  className="w-full h-[42px] p-[3px] bg-[#EEF1F6] rounded-[10px] grid grid-cols-3 gap-[2px]"
                  role="group"
                  aria-label="Overdue reminder frequency"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOverdueCadence('daily');
                      setHasUnsavedChanges(true);
                    }}
                    className={`h-[36px] rounded-[8px] font-['Onest'] font-bold text-[14px] leading-[20px] transition-all cursor-pointer ${
                      overdueCadence === 'daily'
                        ? 'bg-white text-[#0B1530] shadow-sm'
                        : 'text-[#4A5675] hover:text-[#0B1530]'
                    }`}
                  >
                    Every day
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOverdueCadence('2days');
                      setHasUnsavedChanges(true);
                    }}
                    className={`h-[36px] rounded-[8px] font-['Onest'] font-bold text-[14px] leading-[20px] transition-all cursor-pointer ${
                      overdueCadence === '2days'
                        ? 'bg-white text-[#0B1530] shadow-sm'
                        : 'text-[#4A5675] hover:text-[#0B1530]'
                    }`}
                  >
                    Every 2 days
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOverdueCadence('weekly');
                      setHasUnsavedChanges(true);
                    }}
                    className={`h-[36px] rounded-[8px] font-['Onest'] font-bold text-[14px] leading-[20px] transition-all cursor-pointer ${
                      overdueCadence === 'weekly'
                        ? 'bg-white text-[#0B1530] shadow-sm'
                        : 'text-[#4A5675] hover:text-[#0B1530]'
                    }`}
                  >
                    Every week
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Wallet alerts */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
            <div className="px-5 sm:px-[24px] pt-[20px] pb-1 flex flex-col gap-[4px]">
              <h2 className="font-['Onest'] font-bold text-[20px] leading-[28px] text-[#0B1530]">
                Wallet alerts
              </h2>
              <p className="font-['Onest'] font-normal text-[15px] sm:text-[16px] leading-[24px] text-[#4A5675]">
                For bills you pay from your Stellar wallet.
              </p>
            </div>

            <div className="px-5 sm:px-[24px] pt-1 pb-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-[2px]">
                <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  Warn me if my wallet is short
                </span>
                <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                  Checked each morning from 14 days before due date.
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={walletAlertToggle}
                onClick={() => handleToggle(setWalletAlertToggle)}
                className={`w-[44px] h-[26px] rounded-full p-[3px] transition-colors cursor-pointer flex items-center shrink-0 ${
                  walletAlertToggle ? 'bg-[#4164D9] justify-end' : 'bg-[#DDE2EC] justify-start'
                }`}
              >
                <span className="w-[20px] h-[20px] rounded-full bg-white shadow-md block" />
              </button>
            </div>
          </div>

          {/* Card 6: Floating / Save Changes Action Card */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:px-[25px] sm:py-[17px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-[8px]">
              <span
                className={`w-[8px] h-[8px] rounded-full shrink-0 ${
                  hasUnsavedChanges ? 'bg-[#E59A1A]' : 'bg-[#1B7A4B]'
                }`}
              />
              <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                {hasUnsavedChanges ? 'You have unsaved changes.' : 'All changes saved.'}
              </span>
            </div>

            <div className="flex items-center gap-[10px] self-start sm:self-auto">
              <button
                type="button"
                onClick={handleDiscard}
                className="h-[42px] px-[19px] bg-white hover:bg-[#F8F9FC] border border-[#0B1530] rounded-[10px] font-['Onest'] font-bold text-[16px] leading-[24px] text-[#0B1530] transition-colors cursor-pointer"
              >
                Discard changes
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="h-[42px] px-[18px] bg-[#0B1530] hover:bg-[#192852] rounded-[10px] font-['Onest'] font-bold text-[16px] leading-[24px] text-white transition-colors cursor-pointer"
              >
                Save settings
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (360px on desktop) */}
        <div className="flex flex-col gap-6 lg:gap-[24px]">
          {/* Card: How this looks */}
          <div className="bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:p-[24px] flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[4px]">
              <h2 className="font-['Onest'] font-bold text-[20px] leading-[28px] text-[#0B1530]">
                How this looks
              </h2>
              <p className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                With these settings, for your next bill.
              </p>
            </div>

            {/* Bill Header in Preview */}
            <div className="flex items-center gap-[12px] pb-3 border-b border-[#EEF1F6]">
              <div className="w-[40px] h-[40px] rounded-[20px] bg-[#EEF1F6] flex items-center justify-center text-[#0B1530] shrink-0">
                <Zap size={18} strokeWidth={1.8} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530] truncate">
                  Home electricity
                </span>
                <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                  38.50 USDC · due Fri 23 Oct
                </span>
              </div>
            </div>

            {/* Vertical Step Timeline */}
            <div className="flex flex-col">
              {/* Step 1: Green */}
              <div className="flex items-start gap-[14px] relative pb-[18px]">
                <div className="flex flex-col items-center">
                  <span className="w-[12px] h-[12px] rounded-full bg-[#1B7A4B] ring-3 ring-white shrink-0 mt-[4px]" />
                  <span className="w-[2px] h-[48px] bg-[#EEF1F6] mt-1" />
                </div>
                <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                      3 days before
                    </span>
                    <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-[#E6ECFB] border border-[#E6ECFB] rounded-[6px] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#2F4FBF]">
                      Verifying
                    </span>
                  </div>
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Tue 20 Oct, {sendAtTime} · Email and in-app
                  </span>
                </div>
              </div>

              {/* Step 2: Blue */}
              <div className="flex items-start gap-[14px] relative pb-[18px]">
                <div className="flex flex-col items-center">
                  <span className="w-[12px] h-[12px] rounded-full bg-[#4164D9] ring-3 ring-white shrink-0 mt-[4px]" />
                  <span className="w-[2px] h-[48px] bg-[#EEF1F6] mt-1" />
                </div>
                <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                      On the due date
                    </span>
                    <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-[#EEF1F6] border border-[#EEF1F6] rounded-[6px] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#0B1530]">
                      Due in 10 days
                    </span>
                  </div>
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Fri 23 Oct, {sendAtTime} · Email and in-app
                  </span>
                </div>
              </div>

              {/* Step 3: Grey */}
              <div className="flex items-start gap-[14px]">
                <div className="flex flex-col items-center">
                  <span className="w-[12px] h-[12px] rounded-full bg-[#B7C2D9] ring-3 ring-white shrink-0 mt-[4px]" />
                </div>
                <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                      If still unpaid
                    </span>
                    <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-white border border-[#77839F] rounded-[6px] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#4A5675]">
                      Stellar Testnet
                    </span>
                  </div>
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Sun 25 Oct, {sendAtTime} · Then every {overdueCadence === 'daily' ? 'day' : overdueCadence === '2days' ? '2 days' : 'week'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
