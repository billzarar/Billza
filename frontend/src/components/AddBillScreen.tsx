import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
  Check,
  ChevronDown,
  Calendar,
  Info,
  Wallet,
} from 'lucide-react';
import {
  BillItem,
  BillIconType,
  Currency,
} from '../data/initialData';
import { BillIcon } from './BillIcons';

interface AddBillScreenProps {
  onCancel: () => void;
  onAddBill: (bill: Omit<BillItem, 'id'>) => Promise<void> | void;
  walletBalances?: { USDC: number; XLM: number; EUR: number };
  defaultCurrency?: Currency;
}

interface CategoryOption {
  id: string;
  label: string;
  iconType: BillIconType;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'Electricity', label: 'Electricity', iconType: 'bolt' },
  { id: 'Internet', label: 'Internet', iconType: 'wifi' },
  { id: 'Water', label: 'Water', iconType: 'drop' },
  { id: 'Rent', label: 'Rent', iconType: 'house' },
  { id: 'Subscriptions', label: 'Subscriptions', iconType: 'monitor' },
  { id: 'Education', label: 'Education', iconType: 'grad' },
  { id: 'Insurance', label: 'Insurance', iconType: 'shield' },
  { id: 'Business utilities', label: 'Business utilities', iconType: 'building' },
  { id: 'Other', label: 'Other', iconType: 'receipt' },
];

type FrequencyType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type EndsType = 'never' | 'date' | 'count';
type PaymentMethodType = 'myself' | 'stellar';

const STORAGE_KEY = 'billza_add_bill_draft';
const DEFAULT_TESTNET_VAULT = 'GDDRCINHVBETV3AI2QDJMOOS7KC35DAEHOWZLW6RYFZ2XZMVW7AXNWCY';

// Safe localStorage draft loader (cleans out old demo text if previously saved)
function getStoredDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.billName === 'Gym membership') parsed.billName = '';
      if (parsed.amount === '35.00') parsed.amount = '';
      if (parsed.customCategory === 'Fitness') parsed.customCategory = '';
      if (parsed.description === 'Monthly membership at City Fitness, Lekki') parsed.description = '';
      if (parsed.payee === 'City Fitness') parsed.payee = '';
      if (parsed.accountReference === 'MEMBER-20417') parsed.accountReference = '';
      return parsed;
    }
  } catch (err) {
    console.warn('[AddBill] Could not parse stored draft:', err);
  }
  return null;
}

function clearStoredDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('step');
      window.history.replaceState(null, '', url.toString());
    }
  } catch (err) {
    console.warn('[AddBill] Could not clear stored draft:', err);
  }
}

export const AddBillScreen: React.FC<AddBillScreenProps> = ({
  onCancel,
  onAddBill,
  walletBalances,
  defaultCurrency = 'USDC',
}) => {
  // Load initial draft from localStorage
  const draft = useMemo(() => getStoredDraft(), []);

  // Determine starting step (URL query param > draft > 1)
  const getInitialStep = (): 1 | 2 | 3 | 4 | 5 => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const stepParam = parseInt(url.searchParams.get('step') || '', 10);
      if (stepParam >= 1 && stepParam <= 5) return stepParam as any;
    }
    if (draft && draft.currentStep >= 1 && draft.currentStep <= 5) {
      return draft.currentStep;
    }
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(getInitialStep);

  // Step 1: Details (Empty defaults so user never has to delete prefilled text)
  const [billName, setBillName] = useState<string>(draft?.billName ?? '');
  const [category, setCategory] = useState<string>(draft?.category ?? 'Electricity');
  const [customCategory, setCustomCategory] = useState<string>(draft?.customCategory ?? '');
  const [amount, setAmount] = useState<string>(draft?.amount ?? '');
  const [currency, setCurrency] = useState<Currency>(
    draft?.currency ?? (defaultCurrency || 'USDC')
  );
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [description, setDescription] = useState<string>(draft?.description ?? '');

  // Step 2: Schedule
  const getInitialDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  };
  const [dueDateStr, setDueDateStr] = useState<string>(draft?.dueDateStr ?? getInitialDueDate);
  const [repeatEveryCount, setRepeatEveryCount] = useState<number>(draft?.repeatEveryCount ?? 1);
  const [frequency, setFrequency] = useState<FrequencyType>(draft?.frequency ?? 'monthly');
  const [ends, setEnds] = useState<EndsType>(draft?.ends ?? 'never');
  const [endDateStr, setEndDateStr] = useState<string>(draft?.endDateStr ?? '');
  const [paymentCount, setPaymentCount] = useState<number>(draft?.paymentCount ?? 12);

  // Step 3: How you pay
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    draft?.paymentMethod ?? (currency === 'EUR' ? 'myself' : 'stellar')
  );
  const [payee, setPayee] = useState<string>(draft?.payee ?? '');
  const [accountReference, setAccountReference] = useState<string>(draft?.accountReference ?? '');
  const [recipientStellarAddress, setRecipientStellarAddress] = useState<string>(
    draft?.recipientStellarAddress ?? ''
  );

  // Step 4: Reminders
  const [reminderDays, setReminderDays] = useState<string[]>(
    draft?.reminderDays ?? ['3d', 'due']
  );
  const [overdueRemind, setOverdueRemind] = useState<boolean>(draft?.overdueRemind ?? true);
  const [inAppAlert, setInAppAlert] = useState<boolean>(draft?.inAppAlert ?? true);
  const [emailAlert, setEmailAlert] = useState<boolean>(draft?.emailAlert ?? true);

  // Submission / Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedBillData, setSavedBillData] = useState<any>(draft?.savedBillData ?? null);

  // Reference to native date input for one-click calendar opening
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDatePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    if (dateInputRef.current) {
      if (typeof (dateInputRef.current as any).showPicker === 'function') {
        try {
          (dateInputRef.current as any).showPicker();
          return;
        } catch {
          // Fallback if browser security flags showPicker
        }
      }
      dateInputRef.current.focus();
      dateInputRef.current.click();
    }
  };

  // Synchronize entire draft to localStorage and update URL query param so refresh NEVER loses progress
  useEffect(() => {
    const draftPayload = {
      currentStep,
      billName,
      category,
      customCategory,
      amount,
      currency,
      description,
      dueDateStr,
      repeatEveryCount,
      frequency,
      ends,
      endDateStr,
      paymentCount,
      paymentMethod,
      payee,
      accountReference,
      recipientStellarAddress,
      reminderDays,
      overdueRemind,
      inAppAlert,
      emailAlert,
      savedBillData,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPayload));
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.get('step') !== String(currentStep)) {
          url.searchParams.set('step', String(currentStep));
          window.history.replaceState(null, '', url.toString());
        }
      }
    } catch (err) {
      console.warn('[AddBill] Error saving draft to localStorage:', err);
    }
  }, [
    currentStep,
    billName,
    category,
    customCategory,
    amount,
    currency,
    description,
    dueDateStr,
    repeatEveryCount,
    frequency,
    ends,
    endDateStr,
    paymentCount,
    paymentMethod,
    payee,
    accountReference,
    recipientStellarAddress,
    reminderDays,
    overdueRemind,
    inAppAlert,
    emailAlert,
    savedBillData,
  ]);

  // Active Category Object
  const selectedCatObj = useMemo(() => {
    return CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  }, [category]);

  const displayCategoryLabel =
    category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

  const displayBillName = billName.trim() || 'New bill';
  const parsedAmount = parseFloat(amount) || 0;

  // Date Calculation Helpers
  const parsedDate = useMemo(() => {
    try {
      const parts = dueDateStr.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return new Date(dueDateStr);
    } catch {
      return new Date();
    }
  }, [dueDateStr]);

  const formattedDueDateFull = useMemo(() => {
    try {
      return parsedDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dueDateStr;
    }
  }, [parsedDate, dueDateStr]);

  const formattedDueDateShort = useMemo(() => {
    try {
      return parsedDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dueDateStr;
    }
  }, [parsedDate, dueDateStr]);

  // Days until due
  const daysUntilDue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(parsedDate);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [parsedDate]);

  const dueStatusLabel = useMemo(() => {
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`;
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${daysUntilDue} days`;
  }, [daysUntilDue]);

  // Future next 3 due dates
  const nextThreeDates = useMemo(() => {
    const dates: { dateStr: string; label?: string }[] = [];
    const base = new Date(parsedDate);

    for (let i = 0; i < 3; i++) {
      const nextD = new Date(base);
      if (frequency === 'weekly') {
        nextD.setDate(nextD.getDate() + i * 7 * repeatEveryCount);
      } else if (frequency === 'quarterly') {
        nextD.setMonth(nextD.getMonth() + i * 3 * repeatEveryCount);
      } else if (frequency === 'yearly') {
        nextD.setFullYear(nextD.getFullYear() + i * repeatEveryCount);
      } else {
        // monthly
        nextD.setMonth(nextD.getMonth() + i * repeatEveryCount);
      }

      const formatted = nextD.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      dates.push({
        dateStr: formatted,
        label: i === 0 ? 'First payment' : undefined,
      });
    }
    return dates;
  }, [parsedDate, frequency, repeatEveryCount]);

  // Reminder summary date calculation
  const firstReminderText = useMemo(() => {
    const target = new Date(parsedDate);
    if (reminderDays.includes('7d')) {
      target.setDate(target.getDate() - 7);
      return `${target.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, 7 days before`;
    }
    if (reminderDays.includes('3d')) {
      target.setDate(target.getDate() - 3);
      return `${target.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, 3 days before`;
    }
    if (reminderDays.includes('1d')) {
      target.setDate(target.getDate() - 1);
      return `${target.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, 1 day before`;
    }
    return 'On due date';
  }, [parsedDate, reminderDays]);

  // Frequency display label
  const frequencyLabel = useMemo(() => {
    switch (frequency) {
      case 'weekly':
        return repeatEveryCount === 1 ? 'Weekly' : `Every ${repeatEveryCount} weeks`;
      case 'quarterly':
        return repeatEveryCount === 1 ? 'Quarterly' : `Every ${repeatEveryCount} quarters`;
      case 'yearly':
        return repeatEveryCount === 1 ? 'Yearly' : `Every ${repeatEveryCount} years`;
      default:
        return repeatEveryCount === 1 ? 'Monthly' : `Every ${repeatEveryCount} months`;
    }
  }, [frequency, repeatEveryCount]);

  const frequencyUnit = useMemo(() => {
    switch (frequency) {
      case 'weekly':
        return repeatEveryCount === 1 ? 'week' : 'weeks';
      case 'quarterly':
        return repeatEveryCount === 1 ? 'quarter' : 'quarters';
      case 'yearly':
        return repeatEveryCount === 1 ? 'year' : 'years';
      default:
        return repeatEveryCount === 1 ? 'month' : 'months';
    }
  }, [frequency, repeatEveryCount]);

  // Quick date setter
  const setDueDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDateStr(d.toISOString().slice(0, 10));
  };

  const setDueDateEndOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDueDateStr(lastDay.toISOString().slice(0, 10));
  };

  // Handle reminder toggle
  const toggleReminderDay = (dayKey: string) => {
    if (reminderDays.includes(dayKey)) {
      setReminderDays(reminderDays.filter((d) => d !== dayKey));
    } else {
      setReminderDays([...reminderDays, dayKey]);
    }
  };

  // Stepper Navigation
  const handleNextStep = () => {
    setValidationError(null);
    if (currentStep === 1) {
      if (!billName.trim()) {
        setValidationError('Please enter a bill name.');
        return;
      }
      if (parsedAmount <= 0) {
        setValidationError('Please enter a valid payment amount greater than zero.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (paymentMethod === 'stellar') {
        const cleanKey = recipientStellarAddress.trim();
        if (!cleanKey) {
          setValidationError(
            'Please enter a recipient Stellar address starting with "G" (or click "Use Billza Testnet Vault").'
          );
          return;
        }
        if (!cleanKey.startsWith('G') || cleanKey.length !== 56) {
          setValidationError(
            'Recipient address must be a valid 56-character Stellar public key starting with "G".'
          );
          return;
        }
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      handleFinalSave();
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (currentStep > 1 && currentStep < 5) {
      setCurrentStep((prev) => (prev - 1) as any);
    } else if (currentStep === 1) {
      clearStoredDraft();
      onCancel();
    }
  };

  // Final Save to backend
  const handleFinalSave = async () => {
    setValidationError(null);
    setIsSubmitting(true);

    try {
      const finalCategory =
        category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

      const finalFrequency: 'monthly' | 'quarterly' =
        frequency === 'quarterly' ? 'quarterly' : 'monthly';

      // Safe Stellar destination address: Only set if paying with Stellar on-chain and valid key
      const recipientStellarKey =
        paymentMethod === 'stellar' && currency !== 'EUR'
          ? recipientStellarAddress.trim() || DEFAULT_TESTNET_VAULT
          : '';

      const billPayload: any = {
        name: displayBillName,
        category: finalCategory,
        customCategory: category === 'Other' ? customCategory.trim() : '',
        frequency: finalFrequency,
        repeatEveryCount,
        endsType: ends,
        paymentMethod,
        subtitle: `${finalCategory}, ${frequencyLabel}`,
        billsSubtitle: `${finalCategory} · ${frequencyLabel}`,
        dueDateLabel: formattedDueDateShort,
        billsNextDueLabel: formattedDueDateShort,
        dueInLabel: dueStatusLabel,
        billsStatusLabel: dueStatusLabel,
        status: 'upcoming',
        amount: parsedAmount,
        currency,
        actionType: currency === 'EUR' ? 'mark' : 'pay',
        icon: selectedCatObj.iconType,
        recipientAddress: recipientStellarKey,
        recipientShort:
          currency === 'EUR' || paymentMethod === 'myself'
            ? `${payee.trim() || 'Direct payment'}, you pay`
            : recipientStellarKey
            ? `${recipientStellarKey.slice(0, 4)}…${recipientStellarKey.slice(-4)}`
            : 'Stellar Vault',
        inNext7Days: daysUntilDue <= 7 && daysUntilDue >= 0,
        inNext14Days: daysUntilDue <= 14 && daysUntilDue >= 0,
        inNext30Days: daysUntilDue <= 30 && daysUntilDue >= 0,
        payeeName: payee.trim() || displayBillName,
        memo: accountReference.trim() || undefined,
        referenceNumber: accountReference.trim() || undefined,
        description: description.trim() || undefined,
        startedDate: dueDateStr,
        remind7Days: reminderDays.includes('7d'),
        remind3Days: reminderDays.includes('3d'),
        remind1Day: reminderDays.includes('1d'),
        remindOnDue: reminderDays.includes('due'),
        remindOverdue: overdueRemind,
        remindInApp: inAppAlert,
        remindEmail: emailAlert,
      };

      await onAddBill(billPayload);
      setSavedBillData(billPayload);
      setCurrentStep(5);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to create another bill
  const handleResetForAnother = () => {
    clearStoredDraft();
    setBillName('');
    setCategory('Electricity');
    setCustomCategory('');
    setAmount('');
    setCurrency('USDC');
    setDescription('');
    setDueDateStr(getInitialDueDate());
    setRepeatEveryCount(1);
    setFrequency('monthly');
    setEnds('never');
    setPaymentMethod('stellar');
    setPayee('');
    setAccountReference('');
    setRecipientStellarAddress('');
    setReminderDays(['3d', 'due']);
    setOverdueRemind(true);
    setInAppAlert(true);
    setEmailAlert(true);
    setCurrentStep(1);
    setSavedBillData(null);
  };

  // STEP 5: SAVED CONFIRMATION SCREEN
  if (currentStep === 5) {
    return (
      <div className="w-full flex justify-center py-6 sm:py-10 animate-in fade-in duration-200">
        <div
          className="w-full max-w-[480px] rounded-[16px] p-0 flex flex-col items-start"
          style={{
            background: '#F3F5F9',
            boxShadow:
              '0px 2px 6px rgba(11, 21, 48, 0.08), 0px 24px 56px rgba(11, 21, 48, 0.28)',
          }}
        >
          {/* Inner White Card */}
          <div
            className="w-full bg-white rounded-[16px] flex flex-col items-center relative"
            style={{
              padding: '30px 28px 28px',
              gap: '20px',
              boxShadow: '0px 10px 24px rgba(11, 21, 48, 0.07)',
            }}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => {
                clearStoredDraft();
                onCancel();
              }}
              className="absolute right-3.5 top-3 w-[44px] h-[44px] rounded-[10px] flex items-center justify-center text-[#4A5675] hover:bg-[#F3F5F9] transition-colors"
              title="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>

            {/* Success Check Icon Circle */}
            <div
              className="w-[56px] h-[56px] rounded-[28px] flex items-center justify-center"
              style={{ background: '#E3F4EA' }}
            >
              <Check size={26} strokeWidth={2.8} className="text-[#1B7A4B]" />
            </div>

            {/* Heading & Subtitle */}
            <div className="flex flex-col items-center text-center gap-1">
              <h2 className="font-['Onest'] font-bold text-[20px] leading-[28px] text-[#0B1530]">
                {displayBillName} is saved
              </h2>
              <p className="font-['Onest'] font-normal text-[16px] leading-[24px] text-[#4A5675]">
                It’s now on your bills list, highlighted.
              </p>
            </div>

            {/* Summary Details Table Box */}
            <div
              className="w-full rounded-[12px] border border-[#DDE2EC] flex flex-col"
              style={{ padding: '5px 17px' }}
            >
              {/* Row 1: First due */}
              <div className="flex items-center justify-between py-3">
                <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  First due
                </span>
                <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  {formattedDueDateFull}
                </span>
              </div>

              {/* Row 2: Amount */}
              <div className="flex items-center justify-between py-3 border-t border-[#EEF1F6]">
                <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Amount
                </span>
                <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  {parsedAmount.toFixed(2)} {currency}
                </span>
              </div>

              {/* Row 3: Repeats */}
              <div className="flex items-center justify-between py-3 border-t border-[#EEF1F6]">
                <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Repeats
                </span>
                <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  {frequencyLabel}
                </span>
              </div>

              {/* Row 4: How you pay */}
              <div className="flex items-center justify-between py-3 border-t border-[#EEF1F6]">
                <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  How you pay
                </span>
                <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  {currency === 'EUR' || paymentMethod === 'myself'
                    ? 'Yourself, then mark it paid'
                    : 'Stellar wallet auto-pay'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  clearStoredDraft();
                  onCancel();
                }}
                className="w-full sm:flex-1 h-[44px] rounded-[10px] bg-white border border-[#0B1530] font-['Onest'] font-bold text-[16px] text-[#0B1530] hover:bg-[#F3F5F9] transition-colors flex items-center justify-center"
              >
                Mark as paid
              </button>
              <button
                type="button"
                onClick={() => {
                  clearStoredDraft();
                  onCancel();
                }}
                className="w-full sm:flex-1 h-[44px] rounded-[10px] bg-[#0B1530] font-['Onest'] font-bold text-[16px] text-white hover:bg-[#15234A] transition-colors flex items-center justify-center"
              >
                Go to dashboard
              </button>
            </div>

            {/* Add another bill link */}
            <button
              type="button"
              onClick={handleResetForAnother}
              className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#2F4FBF] underline hover:text-[#1F3D99] transition-colors"
            >
              Add another bill
            </button>
          </div>

          {/* Bottom Container Note */}
          <div className="w-full py-3.5 px-4 flex items-center justify-center text-center">
            <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
              Reminders are on. Change them anytime from Reminders.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // STEPS 1 TO 4
  const stepTitles: Record<number, string> = {
    1: 'Bill details',
    2: 'Schedule',
    3: 'How you pay',
    4: 'Reminders',
  };

  const stepsList = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Schedule' },
    { num: 3, label: 'How you pay' },
    { num: 4, label: 'Reminders' },
    { num: 5, label: 'Review' },
  ];

  return (
    <div className="w-full flex justify-center py-4 sm:py-8 animate-in fade-in duration-200">
      {/* 900px Outer Container */}
      <div
        className="w-full max-w-[900px] rounded-[16px] flex flex-col items-start"
        style={{
          background: '#F3F5F9',
          boxShadow:
            '0px 2px 6px rgba(11, 21, 48, 0.08), 0px 24px 56px rgba(11, 21, 48, 0.28)',
        }}
      >
        {/* Inner White Card (Header + Stepper + Form + Preview) */}
        <div
          className="w-full bg-white rounded-[16px] flex flex-col items-center relative"
          style={{
            padding: '30px 32px 32px',
            gap: '24px',
            boxShadow: '0px 10px 24px rgba(11, 21, 48, 0.07)',
          }}
        >
          {/* Top Right Close Button */}
          <button
            type="button"
            onClick={() => {
              onCancel();
            }}
            className="absolute right-4 sm:right-6 top-3 sm:top-4 w-[44px] h-[44px] rounded-[10px] flex items-center justify-center text-[#4A5675] hover:bg-[#F3F5F9] transition-colors"
            title="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>

          {/* Section 1: Modal Header (Caption + Heading) */}
          <div className="w-full flex flex-col items-start gap-1 pr-12">
            <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
              Add a new bill
            </span>
            <h1 className="font-['Onest'] font-bold text-[20px] leading-[28px] text-[#0B1530]">
              {stepTitles[currentStep]}
            </h1>
          </div>

          {/* Section 2: FormSteps Horizontal Stepper (836px) */}
          <div className="w-full flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 sm:pb-0">
            {stepsList.map((stepItem, idx) => {
              const isCompleted = stepItem.num < currentStep;
              const isActive = stepItem.num === currentStep;

              return (
                <React.Fragment key={stepItem.num}>
                  {/* Step Item */}
                  <div
                    onClick={() => {
                      if (stepItem.num < currentStep) {
                        setCurrentStep(stepItem.num as any);
                      }
                    }}
                    className={`flex items-center gap-2 shrink-0 ${
                      isCompleted ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Badge */}
                    <div
                      className={`w-[24px] h-[24px] rounded-[12px] flex items-center justify-center font-['Onest'] font-bold text-[12px] leading-[16px] transition-colors ${
                        isCompleted
                          ? 'bg-[#0B1530] border border-[#0B1530] text-white'
                          : isActive
                          ? 'bg-white border border-[#0B1530] text-[#0B1530]'
                          : 'bg-white border border-[#C7CFDD] text-[#77839F]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={12} strokeWidth={2.5} className="text-white" />
                      ) : (
                        stepItem.num
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`font-['Onest'] font-bold text-[14px] leading-[20px] whitespace-nowrap ${
                        isCompleted || isActive ? 'text-[#0B1530]' : 'text-[#4A5675]'
                      }`}
                    >
                      {stepItem.label}
                    </span>
                  </div>

                  {/* Connector Line between steps */}
                  {idx < stepsList.length - 1 && (
                    <div
                      className={`h-[2px] min-w-[20px] sm:min-w-[40px] flex-1 rounded-[1px] transition-colors ${
                        stepItem.num < currentStep ? 'bg-[#0B1530]' : 'bg-[#EEF1F6]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Divider Line */}
          <div className="w-full h-[1px] bg-[#EEF1F6]" />

          {/* Validation Error Banner (if any) */}
          {validationError && (
            <div className="w-full p-3.5 rounded-[10px] bg-[#FFF8F7] border border-[#FDE8E6] text-[#B42318] text-[13px] font-medium flex items-center gap-2">
              <Info size={16} className="shrink-0 text-[#B42318]" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 3: Body Content (2 Columns: Left 532px form + Right 268px preview) */}
          <div className="w-full flex flex-col lg:flex-row items-start gap-8 lg:gap-[36px]">
            {/* LEFT COLUMN: 532px wide Form */}
            <div className="w-full lg:w-[532px] shrink-0 flex flex-col gap-6">
              {/* ================= STEP 1: DETAILS ================= */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-[26px]">
                  {/* Bill name input */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="bill-name-input"
                      className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]"
                    >
                      Bill name
                    </label>
                    <div className="w-full h-[48px] bg-white border border-[#0B1530] focus-within:border-[#4164D9] focus-within:ring-2 focus-within:ring-[#4164D9]/15 rounded-[10px] px-[15px] flex items-center transition-all">
                      <input
                        id="bill-name-input"
                        type="text"
                        value={billName}
                        onChange={(e) => {
                          setBillName(e.target.value);
                          if (validationError) setValidationError(null);
                        }}
                        placeholder="e.g. Gym membership, Office rent, Starlink..."
                        className="w-full font-['Onest'] font-normal text-[16px] leading-[24px] text-[#0B1530] outline-none placeholder-[#A9B4CC]"
                      />
                    </div>
                  </div>

                  {/* Category Selection 3x3 Grid */}
                  <div className="flex flex-col gap-2">
                    <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                      Category
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`h-[44px] px-[13px] rounded-[10px] border flex items-center justify-between text-left transition-all ${
                              isSelected
                                ? 'bg-[#F3F5F9] border-[#0B1530]'
                                : 'bg-white border-[#DDE2EC] hover:border-[#77839F]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={isSelected ? 'text-[#0B1530]' : 'text-[#4A5675]'}>
                                <BillIcon type={cat.iconType} size={18} />
                              </span>
                              <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530] truncate">
                                {cat.label}
                              </span>
                            </div>

                            {/* Small circle checkmark badge on selected */}
                            {isSelected && (
                              <div className="w-[18px] h-[18px] rounded-[9px] bg-[#0B1530] flex items-center justify-center shrink-0">
                                <Check size={11} strokeWidth={2.5} className="text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Name this category subbox when "Other" is selected */}
                    {category === 'Other' && (
                      <div
                        className="w-full rounded-[12px] border border-[#EEF1F6] flex flex-col gap-2 mt-1.5"
                        style={{ background: '#F8F9FC', padding: '15px 17px' }}
                      >
                        <label
                          htmlFor="custom-cat-input"
                          className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]"
                        >
                          Name this category
                        </label>
                        <div className="w-full h-[48px] bg-white border border-[#0B1530] focus-within:border-[#4164D9] rounded-[10px] px-[15px] flex items-center transition-all">
                          <input
                            id="custom-cat-input"
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="e.g. Fitness, Tools, Equipment"
                            className="w-full font-['Onest'] font-normal text-[16px] leading-[24px] text-[#0B1530] outline-none placeholder-[#A9B4CC]"
                          />
                        </div>
                        <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                          It shows on your bills and in filters.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amount & Currency */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="amount-input"
                      className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]"
                    >
                      Amount
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-[48px] bg-white border border-[#0B1530] focus-within:border-[#4164D9] focus-within:ring-2 focus-within:ring-[#4164D9]/15 rounded-[10px] px-[15px] flex items-center transition-all">
                        <input
                          id="amount-input"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            if (validationError) setValidationError(null);
                          }}
                          placeholder="0.00"
                          className="w-full font-['Onest'] font-normal text-[16px] leading-[24px] text-[#0B1530] outline-none tabular-nums placeholder-[#A9B4CC]"
                        />
                      </div>

                      {/* Currency Button / Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                          className="h-[48px] w-[81px] bg-white border border-[#DDE2EC] rounded-[10px] px-3.5 flex items-center justify-between font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530] hover:border-[#77839F] transition-colors"
                        >
                          <span>{currency}</span>
                          <ChevronDown size={16} className="text-[#4A5675]" />
                        </button>

                        {currencyDropdownOpen && (
                          <div className="absolute right-0 top-[52px] w-[95px] bg-white border border-[#DDE2EC] rounded-[10px] shadow-lg py-1 z-20">
                            {(['USDC', 'XLM', 'EUR'] as Currency[]).map((curr) => (
                              <button
                                key={curr}
                                type="button"
                                onClick={() => {
                                  setCurrency(curr);
                                  setCurrencyDropdownOpen(false);
                                  if (curr === 'EUR') setPaymentMethod('myself');
                                }}
                                className={`w-full px-3 py-1.5 text-left font-['Onest'] font-bold text-[13px] ${
                                  currency === curr
                                    ? 'bg-[#EEF1F6] text-[#0B1530]'
                                    : 'text-[#4A5675] hover:bg-[#F3F5F9]'
                                }`}
                              >
                                {curr}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                      {currency === 'EUR'
                        ? 'EUR bills are paid outside Billza. To pay on-chain, choose USDC or XLM.'
                        : 'USDC and XLM bills can be settled on-chain via Stellar Testnet.'}
                    </span>
                  </div>

                  {/* Description (optional) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                      <label
                        htmlFor="description-input"
                        className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]"
                      >
                        Description
                      </label>
                      <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                        (optional)
                      </span>
                    </div>
                    <div className="w-full bg-white border border-[#0B1530] focus-within:border-[#4164D9] rounded-[10px] p-[13px_15px] transition-all">
                      <textarea
                        id="description-input"
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Monthly membership at City Fitness, Lekki"
                        className="w-full font-['Onest'] font-normal text-[16px] leading-[24px] text-[#0B1530] outline-none resize-none placeholder-[#A9B4CC]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: SCHEDULE ================= */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-[26px]">
                  {/* Row 1: First due date & Repeat every */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* First due date: Instant one-click opening */}
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="due-date-field"
                        className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]"
                      >
                        First due date
                      </label>
                      <div
                        onClick={handleOpenDatePicker}
                        className="relative h-[48px] bg-white border border-[#0B1530] hover:border-[#4164D9] rounded-[10px] px-3.5 flex items-center justify-between cursor-pointer transition-colors select-none"
                        title="Click to choose due date"
                      >
                        <div className="flex items-center gap-2.5 pointer-events-none">
                          <Calendar size={16} className="text-[#4A5675]" />
                          <span className="font-['Onest'] font-semibold text-[15px] leading-[24px] text-[#0B1530]">
                            {formattedDueDateFull}
                          </span>
                        </div>
                        <input
                          ref={dateInputRef}
                          id="due-date-field"
                          type="date"
                          value={dueDateStr}
                          onChange={(e) => setDueDateStr(e.target.value)}
                          className="sr-only"
                          tabIndex={-1}
                        />
                        <ChevronDown size={16} className="text-[#4A5675] pointer-events-none" />
                      </div>

                      {/* Quick Date Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setDueDateOffset(3)}
                          className="px-2 py-0.5 bg-[#EEF1F6] hover:bg-[#DDE2EC] rounded-[6px] font-['Onest'] font-semibold text-[11px] text-[#0B1530] transition-colors"
                        >
                          +3d
                        </button>
                        <button
                          type="button"
                          onClick={() => setDueDateOffset(7)}
                          className="px-2 py-0.5 bg-[#EEF1F6] hover:bg-[#DDE2EC] rounded-[6px] font-['Onest'] font-semibold text-[11px] text-[#0B1530] transition-colors"
                        >
                          +7d
                        </button>
                        <button
                          type="button"
                          onClick={() => setDueDateOffset(14)}
                          className="px-2 py-0.5 bg-[#EEF1F6] hover:bg-[#DDE2EC] rounded-[6px] font-['Onest'] font-semibold text-[11px] text-[#0B1530] transition-colors"
                        >
                          +14d
                        </button>
                        <button
                          type="button"
                          onClick={setDueDateEndOfMonth}
                          className="px-2 py-0.5 bg-[#EEF1F6] hover:bg-[#DDE2EC] rounded-[6px] font-['Onest'] font-semibold text-[11px] text-[#0B1530] transition-colors"
                        >
                          End of month
                        </button>
                      </div>
                    </div>

                    {/* Repeat every stepper */}
                    <div className="flex flex-col gap-2">
                      <label className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                        Repeat every
                      </label>
                      <div className="flex items-center gap-2.5">
                        <div className="h-[50px] w-[134px] bg-white border border-[#DDE2EC] rounded-[10px] flex items-center justify-between p-1">
                          <button
                            type="button"
                            onClick={() => setRepeatEveryCount((prev) => Math.max(1, prev - 1))}
                            className="w-[44px] h-[46px] flex items-center justify-center font-['Onest'] font-bold text-[20px] text-[#4A5675] hover:text-[#0B1530] transition-colors"
                          >
                            −
                          </button>
                          <span className="font-['Onest'] font-bold text-[14px] text-black">
                            {repeatEveryCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRepeatEveryCount((prev) => prev + 1)}
                            className="w-[44px] h-[46px] flex items-center justify-center font-['Onest'] font-bold text-[20px] text-[#0B1530] hover:opacity-80 transition-opacity"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-['Onest'] font-normal text-[16px] leading-[24px] text-[#0B1530]">
                          {frequencyUnit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: How often segmented tabs */}
                  <div className="flex flex-col gap-2">
                    <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                      How often
                    </span>
                    <div className="w-full h-[44px] bg-[#EEF1F6] rounded-[10px] p-[3px] flex items-center gap-0.5">
                      {(['weekly', 'monthly', 'quarterly', 'yearly'] as FrequencyType[]).map((f) => {
                        const isActive = frequency === f;
                        const label =
                          f === 'weekly'
                            ? 'Weekly'
                            : f === 'monthly'
                            ? 'Monthly'
                            : f === 'quarterly'
                            ? 'Quarterly'
                            : 'Yearly';

                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFrequency(f)}
                            className={`flex-1 h-[38px] rounded-[8px] font-['Onest'] font-bold text-[14px] leading-[20px] transition-all flex items-center justify-center ${
                              isActive
                                ? 'bg-[#0B1530] text-white shadow-xs'
                                : 'text-[#4A5675] hover:text-[#0B1530]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 3: Ends Radio options */}
                  <div className="flex flex-col gap-2">
                    <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                      Ends
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {/* Never */}
                      <label className="flex items-center gap-2.5 h-[36px] cursor-pointer select-none">
                        <div
                          onClick={() => setEnds('never')}
                          className={`w-[20px] h-[20px] rounded-[10px] bg-white transition-all ${
                            ends === 'never'
                              ? 'border-[6px] border-[#0B1530]'
                              : 'border border-[#8A94AD]'
                          }`}
                        />
                        <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                          Never
                        </span>
                      </label>

                      {/* On a date */}
                      <label className="flex items-center gap-2.5 h-[36px] cursor-pointer select-none">
                        <div
                          onClick={() => setEnds('date')}
                          className={`w-[20px] h-[20px] rounded-[10px] bg-white transition-all ${
                            ends === 'date'
                              ? 'border-[6px] border-[#0B1530]'
                              : 'border border-[#8A94AD]'
                          }`}
                        />
                        <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                          On a date
                        </span>
                      </label>

                      {/* After a number of payments */}
                      <label className="flex items-center gap-2.5 h-[36px] cursor-pointer select-none">
                        <div
                          onClick={() => setEnds('count')}
                          className={`w-[20px] h-[20px] rounded-[10px] bg-white transition-all ${
                            ends === 'count'
                              ? 'border-[6px] border-[#0B1530]'
                              : 'border border-[#8A94AD]'
                          }`}
                        />
                        <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                          After a number of payments
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Row 4: Next due dates dashed preview box */}
                  <div
                    className="w-full rounded-[12px] border border-dashed border-[#B7C2D9] flex flex-col gap-2"
                    style={{ background: '#F8F9FC', padding: '15px 17px 17px' }}
                  >
                    <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                      Next due dates
                    </span>

                    <div className="flex flex-col">
                      {nextThreeDates.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between py-2.5 ${
                            idx > 0 ? 'border-t border-[#EEF1F6]' : ''
                          }`}
                        >
                          <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                            {item.dateStr}
                          </span>
                          {item.label && (
                            <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                              {item.label}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675] pt-1">
                      Repeats{' '}
                      {repeatEveryCount === 1
                        ? `every ${frequencyUnit}`
                        : `every ${repeatEveryCount} ${frequencyUnit}`}{' '}
                      until you stop it.
                    </span>
                    <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                      Pick the 29th, 30th or 31st and Billza uses the last day of shorter months.
                    </span>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: HOW YOU PAY ================= */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-[22px]">
                  {/* How do you pay this bill? */}
                  <div className="flex flex-col gap-2.5">
                    <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                      How do you pay this bill?
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Option 1: I pay it myself */}
                      <div
                        onClick={() => {
                          setPaymentMethod('myself');
                          if (validationError) setValidationError(null);
                        }}
                        className={`p-[15px_17px] rounded-[12px] border cursor-pointer transition-all flex items-start gap-3 ${
                          paymentMethod === 'myself'
                            ? 'bg-[#F3F5F9] border-[#0B1530]'
                            : 'bg-white border-[#DDE2EC] hover:border-[#77839F]'
                        }`}
                      >
                        <div
                          className={`w-[20px] h-[20px] rounded-[10px] bg-white mt-0.5 shrink-0 ${
                            paymentMethod === 'myself'
                              ? 'border-[6px] border-[#0B1530]'
                              : 'border border-[#8A94AD]'
                          }`}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                            I pay it myself
                          </span>
                          <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                            Card, bank transfer or the provider’s app
                          </span>
                        </div>
                      </div>

                      {/* Option 2: From my Stellar wallet */}
                      <div
                        onClick={() => {
                          if (currency !== 'EUR') {
                            setPaymentMethod('stellar');
                            if (validationError) setValidationError(null);
                          }
                        }}
                        className={`p-[15px_17px] rounded-[12px] border transition-all flex items-start gap-3 ${
                          currency === 'EUR'
                            ? 'bg-[#F8F9FC] border-dashed border-[#DDE2EC] cursor-not-allowed opacity-90'
                            : paymentMethod === 'stellar'
                            ? 'bg-[#F3F5F9] border-[#0B1530] cursor-pointer'
                            : 'bg-white border-[#DDE2EC] hover:border-[#77839F] cursor-pointer'
                        }`}
                      >
                        <div
                          className={`w-[20px] h-[20px] rounded-[10px] mt-0.5 shrink-0 ${
                            currency === 'EUR'
                              ? 'bg-[#F3F5F9] border border-[#C7CFDD]'
                              : paymentMethod === 'stellar'
                              ? 'bg-white border-[6px] border-[#0B1530]'
                              : 'bg-white border border-[#8A94AD]'
                          }`}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`font-['Onest'] font-bold text-[14px] leading-[20px] ${
                              currency === 'EUR' ? 'text-[#77839F]' : 'text-[#0B1530]'
                            }`}
                          >
                            From my Stellar wallet
                          </span>
                          <span
                            className={`font-['Onest'] font-medium text-[12px] leading-[16px] ${
                              currency === 'EUR' ? 'text-[#77839F]' : 'text-[#4A5675]'
                            }`}
                          >
                            {currency === 'EUR'
                              ? 'Needs a USDC or XLM bill. This one is in EUR'
                              : 'Auto-pay or sign with your Stellar wallet on testnet'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Blue Info Notice for EUR bills */}
                    {currency === 'EUR' && (
                      <div
                        className="w-full rounded-[10px] border border-[#C9D4F7] p-[11px_13px] flex items-start gap-2"
                        style={{ background: '#F3F6FE' }}
                      >
                        <Info size={16} className="text-[#2F4FBF] shrink-0 mt-0.5" />
                        <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#0B1530]">
                          This bill is in EUR, so you pay it yourself. We’ll remind you and you can mark it paid.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Form fields: Recipient Stellar Address (When paying with Stellar) */}
                  {paymentMethod === 'stellar' && (
                    <div className="flex flex-col gap-2 p-4 rounded-[12px] bg-[#F8F9FC] border border-[#EEF1F6]">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="recipient-stellar-key-input"
                          className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530] flex items-center gap-1.5"
                        >
                          <Wallet size={16} className="text-[#4164D9]" />
                          <span>Recipient Stellar Address</span>
                          <span className="text-[#D2453A]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientStellarAddress(DEFAULT_TESTNET_VAULT);
                            if (validationError) setValidationError(null);
                          }}
                          className="font-['Onest'] font-bold text-[12px] leading-[16px] text-[#2F4FBF] hover:underline"
                        >
                          Use Billza Testnet Vault
                        </button>
                      </div>

                      <div className="w-full h-[48px] bg-white border border-[#0B1530] focus-within:border-[#4164D9] focus-within:ring-2 focus-within:ring-[#4164D9]/15 rounded-[10px] px-[15px] flex items-center transition-all">
                        <input
                          id="recipient-stellar-key-input"
                          type="text"
                          value={recipientStellarAddress}
                          onChange={(e) => {
                            setRecipientStellarAddress(e.target.value.trim());
                            if (validationError) setValidationError(null);
                          }}
                          placeholder="e.g. G... (56-character Stellar public address)"
                          className="w-full font-['Red_Hat_Mono'] font-normal text-[13px] leading-[20px] text-[#0B1530] outline-none placeholder-[#A9B4CC]"
                          required
                        />
                      </div>
                      <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                        Stellar public key where on-chain payments in {currency} will be dispatched.
                      </span>
                    </div>
                  )}

                  {/* Payee name & Reference */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Who do you pay? */}
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="payee-name-input"
                        className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]"
                      >
                        Who do you pay?
                      </label>
                      <div className="h-[48px] bg-white border border-[#0B1530] focus-within:border-[#4164D9] rounded-[10px] px-[15px] flex items-center transition-all">
                        <input
                          id="payee-name-input"
                          type="text"
                          value={payee}
                          onChange={(e) => setPayee(e.target.value)}
                          placeholder="e.g. City Fitness, AWS, Starlink"
                          className="w-full font-['Onest'] font-normal text-[16px] leading-[24px] text-[#0B1530] outline-none placeholder-[#A9B4CC]"
                        />
                      </div>
                    </div>

                    {/* Account or reference number */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <label
                          htmlFor="account-ref-input"
                          className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]"
                        >
                          Account or reference number
                        </label>
                        <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                          (optional)
                        </span>
                      </div>
                      <div className="h-[48px] bg-white border border-[#0B1530] focus-within:border-[#4164D9] rounded-[10px] px-[15px] flex items-center transition-all">
                        <input
                          id="account-ref-input"
                          type="text"
                          value={accountReference}
                          onChange={(e) => setAccountReference(e.target.value)}
                          placeholder="e.g. MEMBER-20417, INV-001"
                          className="w-full font-['Red_Hat_Mono'] font-normal text-[14px] leading-[20px] text-[#0B1530] outline-none placeholder-[#A9B4CC]"
                        />
                      </div>
                      <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                        Handy to have when you pay. Billza only saves it locally for your convenience.
                      </span>
                    </div>
                  </div>

                  {/* Green tip box */}
                  <div
                    className="w-full rounded-[10px] border border-[#BFE3CD] p-[11px_13px] flex items-start gap-2"
                    style={{ background: '#EEF8F2' }}
                  >
                    <Check size={16} className="text-[#1B7A4B] shrink-0 mt-0.5" />
                    <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#0B1530]">
                      Billza reminds you before each due date so you never miss a payment.
                    </span>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: REMINDERS ================= */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-[26px]">
                  {/* When should we remind you? */}
                  <div className="flex flex-col gap-2">
                    <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                      When should we remind you?
                    </span>

                    {/* Reminder pill buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { key: '7d', label: '7 days before' },
                        { key: '3d', label: '3 days before' },
                        { key: '1d', label: '1 day before' },
                        { key: 'due', label: 'On due date' },
                      ].map((pill) => {
                        const isSelected = reminderDays.includes(pill.key);
                        return (
                          <button
                            key={pill.key}
                            type="button"
                            onClick={() => toggleReminderDay(pill.key)}
                            className={`h-[36px] px-3 rounded-[18px] border font-['Onest'] font-bold text-[14px] leading-[20px] flex items-center justify-center gap-1.5 transition-all ${
                              isSelected
                                ? 'bg-[#0B1530] border-[#0B1530] text-white'
                                : 'bg-white border-[#DDE2EC] text-[#0B1530] hover:border-[#77839F]'
                            }`}
                          >
                            {isSelected && <Check size={13} strokeWidth={2.5} />}
                            <span>{pill.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Overdue Card with Switch */}
                    <div className="w-full rounded-[12px] border border-[#DDE2EC] bg-white p-[13px_17px] flex items-center justify-between mt-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                          If it’s overdue, keep reminding me
                        </span>
                        <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                          Every 2 days until you pay or mark it paid
                        </span>
                      </div>

                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => setOverdueRemind(!overdueRemind)}
                        className={`w-[44px] h-[26px] rounded-[13px] p-[3px] flex items-center transition-colors ${
                          overdueRemind ? 'bg-[#4164D9] justify-end' : 'bg-[#DDE2EC] justify-start'
                        }`}
                      >
                        <div className="w-[20px] h-[20px] rounded-[10px] bg-white shadow-xs" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[12px] font-['Onest'] pt-1">
                      <span className="text-[#4A5675]">
                        Your defaults are 3 days before and on the due date.
                      </span>
                      <button
                        type="button"
                        onClick={() => setReminderDays(['3d', 'due'])}
                        className="font-bold text-[#2F4FBF] underline hover:text-[#1F3D99]"
                      >
                        Change defaults
                      </button>
                    </div>
                  </div>

                  {/* How should we remind you? */}
                  <div className="flex flex-col gap-2">
                    <span className="font-['Onest'] font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                      How should we remind you?
                    </span>

                    <div className="w-full rounded-[12px] border border-[#DDE2EC] bg-white px-[17px] flex flex-col">
                      {/* Row 1: In-app */}
                      <div className="flex items-center justify-between py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                            In-app
                          </span>
                          <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                            The bell in Billza
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInAppAlert(!inAppAlert)}
                          className={`w-[44px] h-[26px] rounded-[13px] p-[3px] flex items-center transition-colors ${
                            inAppAlert ? 'bg-[#4164D9] justify-end' : 'bg-[#DDE2EC] justify-start'
                          }`}
                        >
                          <div className="w-[20px] h-[20px] rounded-[10px] bg-white shadow-xs" />
                        </button>
                      </div>

                      {/* Row 2: Email */}
                      <div className="flex items-center justify-between py-3 border-t border-[#EEF1F6]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530]">
                            Email
                          </span>
                          <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                            user@billza.app
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmailAlert(!emailAlert)}
                          className={`w-[44px] h-[26px] rounded-[13px] p-[3px] flex items-center transition-colors ${
                            emailAlert ? 'bg-[#4164D9] justify-end' : 'bg-[#DDE2EC] justify-start'
                          }`}
                        >
                          <div className="w-[20px] h-[20px] rounded-[10px] bg-white shadow-xs" />
                        </button>
                      </div>
                    </div>

                    {/* First reminder info banner */}
                    <div
                      className="w-full rounded-[10px] border border-[#C9D4F7] p-[11px_13px] flex items-center gap-2 mt-1"
                      style={{ background: '#F3F6FE' }}
                    >
                      <Info size={16} className="text-[#2F4FBF] shrink-0" />
                      <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#0B1530]">
                        First reminder: {firstReminderText}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: 268px Preview Card ("How it will look") */}
            <div className="w-full lg:w-[268px] shrink-0 flex flex-col gap-2.5">
              <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                How it will look
              </span>

              {/* The Preview Card */}
              <div
                className="w-full bg-white border border-[#DDE2EC] rounded-[12px] flex flex-col"
                style={{ padding: '17px 17px 7px' }}
              >
                {/* Header: Icon Circle + Name + Subtitle */}
                <div className="flex items-center gap-3">
                  <div className="w-[40px] h-[40px] rounded-[20px] bg-[#EEF1F6] flex items-center justify-center shrink-0 text-[#0B1530]">
                    <BillIcon type={selectedCatObj.iconType} size={19} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-['Onest'] font-bold text-[14px] leading-[20px] text-[#0B1530] truncate">
                      {displayBillName}
                    </span>
                    <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                      {currentStep >= 2
                        ? `${displayCategoryLabel} · ${
                            frequency === 'quarterly'
                              ? 'Quarterly'
                              : frequency === 'weekly'
                              ? 'Weekly'
                              : frequency === 'yearly'
                              ? 'Yearly'
                              : 'Monthly'
                          }`
                        : displayCategoryLabel}
                    </span>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-['Onest'] font-extrabold text-[28px] leading-[36px] tracking-[-0.5px] text-[#0B1530] tabular-nums">
                      {amount ? parsedAmount.toFixed(2) : '0.00'}
                    </span>
                    <span className="font-['Onest'] font-bold text-[12px] leading-[16px] text-[#4A5675]">
                      {currency}
                    </span>
                  </div>

                  {/* Status Label (if step >= 2) */}
                  {currentStep >= 2 && (
                    <div className="px-2 py-0.5 rounded-[6px] bg-[#EEF1F6] border border-[#EEF1F6] font-['Onest'] font-bold text-[12px] leading-[16px] text-[#0B1530]">
                      {dueStatusLabel}
                    </div>
                  )}
                </div>

                {/* Table Row 1: Next due */}
                <div className="flex items-start justify-between py-2.5 border-t border-[#EEF1F6]">
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Next due
                  </span>
                  <span
                    className={`font-['Onest'] text-[14px] leading-[20px] ${
                      currentStep >= 2
                        ? 'font-bold text-[#0B1530]'
                        : 'font-semibold text-[#77839F]'
                    }`}
                  >
                    {currentStep >= 2 ? formattedDueDateShort : 'Not set'}
                  </span>
                </div>

                {/* Table Row 2: Repeats */}
                <div className="flex items-start justify-between py-2.5 border-t border-[#EEF1F6]">
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Repeats
                  </span>
                  <span
                    className={`font-['Onest'] text-[14px] leading-[20px] ${
                      currentStep >= 2
                        ? 'font-bold text-[#0B1530]'
                        : 'font-semibold text-[#77839F]'
                    }`}
                  >
                    {currentStep >= 2 ? frequencyLabel : 'Not set'}
                  </span>
                </div>

                {/* Table Row 3: Pays */}
                <div className="flex items-start justify-between py-2.5 border-t border-[#EEF1F6]">
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Pays
                  </span>
                  <span
                    className={`font-['Onest'] text-[14px] leading-[20px] max-w-[150px] truncate text-right ${
                      currentStep >= 3
                        ? 'font-bold text-[#0B1530]'
                        : 'font-semibold text-[#77839F]'
                    }`}
                  >
                    {currentStep >= 3
                      ? payee.trim()
                        ? paymentMethod === 'myself' || currency === 'EUR'
                          ? `${payee}, you pay`
                          : payee
                        : paymentMethod === 'myself' || currency === 'EUR'
                        ? 'You pay'
                        : 'Stellar wallet'
                      : 'Not set'}
                  </span>
                </div>

                {/* Table Row 4: Reminder */}
                <div className="flex items-start justify-between py-2.5 border-t border-[#EEF1F6]">
                  <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Reminder
                  </span>
                  <span
                    className={`font-['Onest'] text-[14px] leading-[20px] ${
                      currentStep >= 4
                        ? 'font-bold text-[#0B1530]'
                        : 'font-semibold text-[#77839F]'
                    }`}
                  >
                    {currentStep >= 4 ? firstReminderText.split(',')[0] : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar (86px height) */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between p-[20px_32px_22px] gap-4">
          <span className="font-['Onest'] font-medium text-[12px] leading-[16px] text-[#4A5675]">
            You can change any of this later.
          </span>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Secondary Button ("Choose another" / "Back") */}
            <button
              type="button"
              onClick={handlePrevStep}
              className="h-[44px] px-[19px] rounded-[10px] bg-white border border-[#0B1530] font-['Onest'] font-bold text-[16px] leading-[24px] text-[#0B1530] hover:bg-[#F3F5F9] transition-colors"
            >
              {currentStep === 1 ? 'Choose another' : 'Back'}
            </button>

            {/* Primary Button ("Continue" with arrow) */}
            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="h-[44px] px-[18px] rounded-[10px] bg-[#0B1530] font-['Onest'] font-bold text-[16px] leading-[24px] text-white hover:bg-[#15234A] transition-colors flex items-center gap-2 shadow-xs disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
