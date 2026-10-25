import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  Wallet,
  Building,
  X,
  RefreshCw,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { BillIcon } from './BillIcons';
import {
  DetailedPaymentRecord,
  PaymentVerificationStatus,
} from '../data/paymentHistoryData';
import { Currency, BillItem } from '../data/initialData';
import { TransactionReceiptModal } from './TransactionReceiptModal';
import { downloadPaymentHistoryCsv } from '../services/api';

interface PaymentHistoryScreenProps {
  bills: BillItem[];
  detailedPayments?: DetailedPaymentRecord[];
  onSelectBill: (bill: BillItem) => void;
  onPayBill?: (bill: BillItem) => void;
  onTriggerToast: (msg: string) => void;
  onRefreshPayments?: () => Promise<void>;
}

type PeriodFilter = 'this-month' | 'last-3-months' | 'this-year' | 'all-time';

export const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({
  bills,
  detailedPayments,
  onSelectBill,
  onPayBill,
  onTriggerToast,
  onRefreshPayments,
}) => {
  const [payments, setPayments] = useState<DetailedPaymentRecord[]>(detailedPayments || []);

  React.useEffect(() => {
    if (detailedPayments) {
      setPayments(detailedPayments);
    }
  }, [detailedPayments]);

  const [period, setPeriod] = useState<PeriodFilter>('last-3-months');
  const [statusTab, setStatusTab] = useState<'all' | PaymentVerificationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<'all' | Currency>('all');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<'all' | 'stellar' | 'bank'>('all');

  // Custom Dates Popover
  const [isCustomDatesOpen, setIsCustomDatesOpen] = useState(false);
  const [customRangeText, setCustomRangeText] = useState('Thu 23 Jul – Tue 20 Oct 2026');

  const [currentPage, setCurrentPage] = useState(1);
  const PAYMENTS_PER_PAGE = 5;

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusTab, period, selectedCurrencyFilter, selectedMethodFilter, customRangeText]);

  // Inspected payment detail modal/drawer
  const [selectedPayment, setSelectedPayment] = useState<DetailedPaymentRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isReverifying, setIsReverifying] = useState(false);

  // Status Tab Counts
  const counts = useMemo(() => {
    return {
      all: payments.length,
      verified: payments.filter((p) => p.status === 'verified').length,
      verifying: payments.filter((p) => p.status === 'verifying').length,
      manual: payments.filter((p) => p.status === 'manual').length,
      failed: payments.filter((p) => p.status === 'failed').length,
    };
  }, [payments]);

  // Dynamically computed metrics for the 4 TotalCards
  const totals = useMemo(() => {
    // 1. Each month: recurring monthly bills
    const monthlyBills = bills.filter(
      (b) => !b.frequency || b.frequency.toLowerCase().includes('month')
    );
    const monthlyUSDC = monthlyBills
      .filter((b) => b.currency === 'USDC')
      .reduce((s, b) => s + b.amount, 0);
    const monthlyXLM = monthlyBills
      .filter((b) => b.currency === 'XLM')
      .reduce((s, b) => s + b.amount, 0);
    const monthlyEUR = monthlyBills
      .filter((b) => b.currency === 'EUR')
      .reduce((s, b) => s + b.amount, 0);

    const extraCurrencies: string[] = [];
    if (monthlyXLM > 0) extraCurrencies.push(`${monthlyXLM.toFixed(2)} XLM`);
    if (monthlyEUR > 0) extraCurrencies.push(`${monthlyEUR.toFixed(2)} EUR`);
    const monthlySubtext =
      extraCurrencies.length > 0
        ? `Plus ${extraCurrencies.join(' and ')}`
        : monthlyBills.length > 0
        ? `${monthlyBills.length} recurring monthly ${monthlyBills.length === 1 ? 'bill' : 'bills'}`
        : 'No monthly recurring bills';

    // 2. Each quarter: recurring quarterly bills
    const quarterlyBills = bills.filter(
      (b) => b.frequency && b.frequency.toLowerCase().includes('quarter')
    );
    const quarterlyUSDC = quarterlyBills
      .filter((b) => b.currency === 'USDC')
      .reduce((s, b) => s + b.amount, 0);
    const quarterlyNames = quarterlyBills.map((b) => b.name).slice(0, 2).join(' and ');
    const quarterlySubtext =
      quarterlyBills.length > 0
        ? quarterlyNames
        : 'No quarterly bills scheduled';

    // 3. Past 3 months: actual completed payments
    const past3mPayments = payments.filter((p) => p.status === 'verified' || p.status === 'manual');
    const past3mUSDC = past3mPayments
      .filter((p) => p.currency === 'USDC')
      .reduce((s, p) => s + p.amount, 0);
    const uniqueProviders = new Set(past3mPayments.map((p) => p.billName)).size;
    const past3mSubtext =
      past3mPayments.length > 0
        ? `${past3mPayments.length} payments across ${uniqueProviders} ${
            uniqueProviders === 1 ? 'provider' : 'providers'
          }`
        : 'No completed payments in period';

    // 4. Overdue bills
    const overdueBills = bills.filter((b) => b.status === 'overdue');
    const overdueSubtext =
      overdueBills.length > 0
        ? `${overdueBills[0].name}, ${overdueBills[0].dueInLabel}`
        : 'All bills up to date';

    return {
      monthlyUSDC,
      monthlySubtext,
      quarterlyUSDC,
      quarterlySubtext,
      past3mUSDC,
      past3mSubtext,
      overdueCount: overdueBills.length,
      overdueSubtext,
    };
  }, [bills, payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Period filter
      if (period === 'this-month' && p.monthYear !== 'October 2026') {
        return false;
      }
      if (period === 'last-3-months' && !['October 2026', 'September 2026', 'August 2026'].includes(p.monthYear)) {
        return false;
      }

      // Status tab
      if (statusTab !== 'all' && p.status !== statusTab) {
        return false;
      }

      // Currency filter
      if (selectedCurrencyFilter !== 'all' && p.currency !== selectedCurrencyFilter) {
        return false;
      }

      // Method filter
      if (selectedMethodFilter !== 'all' && p.paymentMethod !== selectedMethodFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.billName.toLowerCase().includes(q);
        const matchesCycle = p.billCycleLabel.toLowerCase().includes(q);
        const matchesNote = p.txHashOrNote.toLowerCase().includes(q);
        const matchesMethod = p.paymentMethodLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesCycle && !matchesNote && !matchesMethod) {
          return false;
        }
      }

      return true;
    });
  }, [payments, period, statusTab, selectedCurrencyFilter, selectedMethodFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAYMENTS_PER_PAGE;
  const endIndex = Math.min(startIndex + PAYMENTS_PER_PAGE, filteredPayments.length);
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    onTriggerToast(`Copied ${label}`);
  };

  // Export CSV via Backend API
  const handleExportCSV = async () => {
    try {
      await downloadPaymentHistoryCsv();
      onTriggerToast('Exported official payment history CSV from backend');
    } catch {
      // Client-side export fallback
      const headers = [
        'Bill Name',
        'Billing Cycle',
        'Paid Date',
        'Paid Time',
        'Month',
        'Payment Method',
        'Amount',
        'Currency',
        'Status',
        'Transaction Hash / Note',
        'Recipient Address',
        'Memo',
      ];

      const rows = filteredPayments.map((p) => [
        `"${p.billName}"`,
        `"${p.billCycleLabel}"`,
        `"${p.paidDateLabel}"`,
        `"${p.paidTimeLabel}"`,
        `"${p.monthYear}"`,
        `"${p.paymentMethodLabel}"`,
        p.amount.toFixed(2),
        p.currency,
        `"${p.statusBadgeText}"`,
        `"${p.fullTxHash || p.txHashOrNote}"`,
        `"${p.recipientAddress || ''}"`,
        `"${p.memo || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `billza_payment_history_${period}_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onTriggerToast(`Exported ${filteredPayments.length} payment records to CSV`);
    }
  };

  // Re-verify action
  const handleReverify = (payment: DetailedPaymentRecord) => {
    setIsReverifying(true);
    setTimeout(() => {
      setIsReverifying(false);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                status: 'verified',
                statusBadgeText: 'Verified',
                statusBadgeKind: 'verified',
              }
            : p
        )
      );
      if (selectedPayment && selectedPayment.id === payment.id) {
        setSelectedPayment((prev) =>
          prev
            ? {
                ...prev,
                status: 'verified',
                statusBadgeText: 'Verified',
                statusBadgeKind: 'verified',
              }
            : null
        );
      }
      onTriggerToast(`Verified on Stellar Horizon ledger #${payment.ledgerSequence || 5419825}`);
    }, 900);
  };

  return (
    <div className="w-full flex flex-col items-start gap-[28px]">
      {/* 1. Header Frame: Title, Subtitle, Export CSV */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-1">
        <div className="flex flex-col items-start gap-[8.5px]">
          <h1 className="font-onest font-extrabold text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] tracking-[-1px] text-[#0B1530]">
            Payment history
          </h1>
          <p className="font-onest font-medium text-[16px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#4A5675]">
            Every payment you made from your wallet
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center px-[19px] py-[1px] gap-[8px] h-[44px] bg-white border border-[#0B1530] rounded-[10px] hover:bg-[#F8F9FC] transition-colors cursor-pointer select-none shrink-0"
        >
          <Download size={18} strokeWidth={2} className="text-[#0B1530]" />
          <span className="font-onest font-bold text-[16px] leading-[24px] text-[#0B1530]">
            Export CSV
          </span>
        </button>
      </div>

      {/* 2. Frame: Date Period Selector & Custom Dates Picker */}
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        {/* Segmented Period Switcher */}
        <div className="inline-flex items-center p-[3px] gap-[2px] bg-[#EEF1F6] rounded-[10px] max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setPeriod('this-month');
              setCustomRangeText('Thu 1 Oct – Tue 20 Oct 2026');
            }}
            className={`px-[14px] h-[34px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
              period === 'this-month'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530]'
            }`}
          >
            This month
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod('last-3-months');
              setCustomRangeText('Thu 23 Jul – Tue 20 Oct 2026');
            }}
            className={`px-[14px] h-[34px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
              period === 'last-3-months'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530]'
            }`}
          >
            Last 3 months
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod('this-year');
              setCustomRangeText('Wed 1 Jan – Tue 20 Oct 2026');
            }}
            className={`px-[14px] h-[34px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
              period === 'this-year'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530]'
            }`}
          >
            This year
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod('all-time');
              setCustomRangeText('All time through Tue 20 Oct 2026');
            }}
            className={`px-[14px] h-[34px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
              period === 'all-time'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530]'
            }`}
          >
            All time
          </button>
        </div>

        {/* Date Range label + Custom Dates Button */}
        <div className="relative flex items-center gap-[10px]">
          <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675] hidden sm:inline">
            {customRangeText}
          </span>
          <button
            type="button"
            onClick={() => setIsCustomDatesOpen((prev) => !prev)}
            className="inline-flex items-center px-[13px] py-[1px] gap-[8px] h-[40px] bg-white border border-[#DDE2EC] rounded-[10px] hover:border-[#77839F] transition-colors cursor-pointer select-none"
          >
            <Calendar size={16} strokeWidth={2} className="text-[#0B1530]" />
            <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
              Custom dates
            </span>
            <ChevronDown size={16} strokeWidth={2} className="text-[#0B1530]" />
          </button>

          {/* Custom Dates Popover Dropdown */}
          {isCustomDatesOpen && (
            <div className="absolute right-0 top-[48px] z-30 w-[280px] bg-white border border-[#DDE2EC] rounded-[12px] shadow-xl p-3 flex flex-col gap-2">
              <span className="text-[12px] font-bold text-[#4A5675] uppercase tracking-wider px-2">
                Quick Date Presets
              </span>
              {[
                { label: 'Past 30 days', range: 'Sun 20 Sep – Tue 20 Oct 2026' },
                { label: 'Past 90 days', range: 'Thu 23 Jul – Tue 20 Oct 2026' },
                { label: 'Q3 2026 (Jul - Sep)', range: 'Wed 1 Jul – Wed 30 Sep 2026' },
                { label: 'Q4 2026 to date', range: 'Thu 1 Oct – Tue 20 Oct 2026' },
                { label: 'Year to date (2026)', range: 'Wed 1 Jan – Tue 20 Oct 2026' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCustomRangeText(preset.range);
                    setIsCustomDatesOpen(false);
                    onTriggerToast(`Filtered to: ${preset.label}`);
                  }}
                  className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-[#F3F5F9] text-[13px] font-semibold text-[#0B1530] flex items-center justify-between"
                >
                  <span>{preset.label}</span>
                  <span className="text-[11px] text-[#77839F]">{preset.range.split('–')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Payment Totals Cards: 2x2 on mobile, 4 columns on desktop */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-[16px]">
        {/* TotalCard 1: Each month */}
        <div className="bg-white border border-[#DDE2EC] rounded-[12px] overflow-hidden flex flex-col justify-between shadow-2xs">
          <div className="flex items-center px-3 sm:px-[20px] py-2 sm:py-[11px] gap-1.5 sm:gap-[8px] h-[34px] sm:h-[42px] bg-[#0B1530]">
            <span className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] bg-[#7F9BF0] rounded-full shrink-0" />
            <span className="font-onest font-semibold text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-white truncate">
              Each month
            </span>
          </div>
          <div className="p-3 sm:p-[20px] pt-2.5 sm:pt-[16px] flex flex-col gap-1 sm:gap-[4px] justify-between flex-1">
            <div className="flex items-baseline gap-1 sm:gap-[5px]">
              <span className="font-onest font-extrabold text-[19px] xs:text-[22px] sm:text-[28px] leading-[26px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
                {totals.monthlyUSDC.toFixed(2)}
              </span>
              <span className="font-onest font-bold text-[11px] sm:text-[12px] leading-[16px] text-[#0B1530]">
                USDC
              </span>
            </div>
            <p className="font-onest font-medium text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] text-[#4A5675] truncate">
              {totals.monthlySubtext}
            </p>
          </div>
        </div>

        {/* TotalCard 2: Each quarter */}
        <div className="bg-white border border-[#DDE2EC] rounded-[12px] overflow-hidden flex flex-col justify-between shadow-2xs">
          <div className="flex items-center px-3 sm:px-[20px] py-2 sm:py-[11px] gap-1.5 sm:gap-[8px] h-[34px] sm:h-[42px] bg-[#EEF1F6]">
            <span className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] bg-[#8A94AD] rounded-full shrink-0" />
            <span className="font-onest font-semibold text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#3B4664] truncate">
              Each quarter
            </span>
          </div>
          <div className="p-3 sm:p-[20px] pt-2.5 sm:pt-[16px] flex flex-col gap-1 sm:gap-[4px] justify-between flex-1">
            <div className="flex items-baseline gap-1 sm:gap-[5px]">
              <span className="font-onest font-extrabold text-[19px] xs:text-[22px] sm:text-[28px] leading-[26px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
                {totals.quarterlyUSDC.toFixed(2)}
              </span>
              <span className="font-onest font-bold text-[11px] sm:text-[12px] leading-[16px] text-[#0B1530]">
                USDC
              </span>
            </div>
            <p className="font-onest font-medium text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] text-[#4A5675] truncate">
              {totals.quarterlySubtext}
            </p>
          </div>
        </div>

        {/* TotalCard 3: 3-month total / Average */}
        <div className="bg-white border border-[#DDE2EC] rounded-[12px] overflow-hidden flex flex-col justify-between shadow-2xs">
          <div className="flex items-center px-3 sm:px-[20px] py-2 sm:py-[11px] gap-1.5 sm:gap-[8px] h-[34px] sm:h-[42px] bg-[#EEF1F6]">
            <span className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] bg-[#8A94AD] rounded-full shrink-0" />
            <span className="font-onest font-semibold text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#3B4664] truncate">
              Past 3 months
            </span>
          </div>
          <div className="p-3 sm:p-[20px] pt-2.5 sm:pt-[16px] flex flex-col gap-1 sm:gap-[4px] justify-between flex-1">
            <div className="flex items-baseline gap-1 sm:gap-[5px]">
              <span className="font-onest font-extrabold text-[19px] xs:text-[22px] sm:text-[28px] leading-[26px] sm:leading-[36px] tracking-[-0.5px] text-[#0B1530]">
                {totals.past3mUSDC.toFixed(2)}
              </span>
              <span className="font-onest font-bold text-[11px] sm:text-[12px] leading-[16px] text-[#0B1530]">
                USDC
              </span>
            </div>
            <p className="font-onest font-medium text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] text-[#4A5675] truncate">
              {totals.past3mSubtext}
            </p>
          </div>
        </div>

        {/* TotalCard 4: Overdue (Urgent Red) */}
        <div className="bg-white border border-[#DDE2EC] rounded-[12px] overflow-hidden flex flex-col justify-between shadow-2xs">
          <div className="flex items-center px-3 sm:px-[20px] py-2 sm:py-[11px] gap-1.5 sm:gap-[8px] h-[34px] sm:h-[42px] bg-[#FDE8E6]">
            <span className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] bg-[#B42318] rounded-full shrink-0" />
            <span className="font-onest font-semibold text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] text-[#B42318] truncate">
              Overdue
            </span>
          </div>
          <div className="p-3 sm:p-[20px] pt-2.5 sm:pt-[16px] flex flex-col gap-1 sm:gap-[4px] justify-between flex-1">
            <div className="flex items-baseline gap-1 sm:gap-[5px]">
              <span className="font-onest font-extrabold text-[19px] xs:text-[22px] sm:text-[28px] leading-[26px] sm:leading-[36px] tracking-[-0.5px] text-[#B42318]">
                {totals.overdueCount}
              </span>
              <span className="font-onest font-bold text-[11px] sm:text-[12px] leading-[16px] text-[#B42318]">
                {totals.overdueCount === 1 ? 'bill' : 'bills'}
              </span>
            </div>
            <p className="font-onest font-medium text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] text-[#4A5675] truncate">
              {totals.overdueSubtext}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Payments Main Table Container */}
      <div className="w-full bg-white border border-[#DDE2EC] rounded-[12px] overflow-hidden flex flex-col shadow-xs">
        {/* Table Top Toolbar: Verification Status Tabs & Search/Filter */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center px-3.5 sm:px-[24px] py-3.5 sm:py-[20px] gap-4">
          {/* Verification Status Tabs */}
          <div className="inline-flex items-center p-[3px] gap-[2px] bg-[#EEF1F6] rounded-[10px] max-w-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusTab('all')}
              className={`inline-flex items-center px-[12px] h-[33px] gap-[8px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
                statusTab === 'all'
                  ? 'bg-[#0B1530] text-white shadow-xs'
                  : 'text-[#4A5675] hover:text-[#0B1530]'
              }`}
            >
              <span>All</span>
              <span
                className={`px-[6px] h-[20px] rounded-[10px] font-onest font-bold text-[12px] leading-[16px] flex items-center justify-center ${
                  statusTab === 'all' ? 'bg-white/16 text-white' : 'bg-white text-[#0B1530]'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('verified')}
              className={`inline-flex items-center px-[12px] h-[33px] gap-[8px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
                statusTab === 'verified'
                  ? 'bg-[#0B1530] text-white shadow-xs'
                  : 'text-[#4A5675] hover:text-[#0B1530]'
              }`}
            >
              <span>Verified</span>
              <span
                className={`px-[6px] h-[20px] rounded-[10px] font-onest font-bold text-[12px] leading-[16px] flex items-center justify-center ${
                  statusTab === 'verified' ? 'bg-white/16 text-white' : 'bg-white text-[#0B1530]'
                }`}
              >
                {counts.verified}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('verifying')}
              className={`inline-flex items-center px-[12px] h-[33px] gap-[8px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
                statusTab === 'verifying'
                  ? 'bg-[#0B1530] text-white shadow-xs'
                  : 'text-[#4A5675] hover:text-[#0B1530]'
              }`}
            >
              <span>Verifying</span>
              <span
                className={`px-[6px] h-[20px] rounded-[10px] font-onest font-bold text-[12px] leading-[16px] flex items-center justify-center ${
                  statusTab === 'verifying' ? 'bg-white/16 text-white' : 'bg-white text-[#0B1530]'
                }`}
              >
                {counts.verifying}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('manual')}
              className={`inline-flex items-center px-[12px] h-[33px] gap-[8px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
                statusTab === 'manual'
                  ? 'bg-[#0B1530] text-white shadow-xs'
                  : 'text-[#4A5675] hover:text-[#0B1530]'
              }`}
            >
              <span>Marked paid</span>
              <span
                className={`px-[6px] h-[20px] rounded-[10px] font-onest font-bold text-[12px] leading-[16px] flex items-center justify-center ${
                  statusTab === 'manual' ? 'bg-white/16 text-white' : 'bg-white text-[#0B1530]'
                }`}
              >
                {counts.manual}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('failed')}
              className={`inline-flex items-center px-[12px] h-[33px] gap-[8px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors cursor-pointer whitespace-nowrap ${
                statusTab === 'failed'
                  ? 'bg-[#0B1530] text-white shadow-xs'
                  : 'text-[#4A5675] hover:text-[#0B1530]'
              }`}
            >
              <span>Failed</span>
              <span
                className={`px-[6px] h-[20px] rounded-[10px] font-onest font-bold text-[12px] leading-[16px] flex items-center justify-center ${
                  statusTab === 'failed' ? 'bg-white/16 text-white' : 'bg-white text-[#0B1530]'
                }`}
              >
                {counts.failed}
              </span>
            </button>
          </div>

          {/* Search payments & Filters right toolbar */}
          <div className="relative flex items-center gap-[10px] w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 lg:w-[250px]">
              <Search
                size={18}
                strokeWidth={1.8}
                className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#4A5675]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payments"
                className="w-full h-[39px] pl-[42px] pr-[32px] bg-white border border-[#DDE2EC] rounded-[10px] text-[15px] text-[#0B1530] placeholder-[#757575] focus:outline-hidden focus:border-[#4164D9]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#0B1530]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`inline-flex items-center px-[13px] py-[1px] gap-[8px] h-[39px] bg-white border rounded-[10px] transition-colors cursor-pointer select-none ${
                selectedCurrencyFilter !== 'all' || selectedMethodFilter !== 'all'
                  ? 'border-[#4164D9] bg-[#E6ECFB]/30 text-[#4164D9]'
                  : 'border-[#DDE2EC] hover:border-[#77839F] text-[#0B1530]'
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={2} />
              <span className="font-onest font-bold text-[14px] leading-[20px]">
                Filters
              </span>
              {(selectedCurrencyFilter !== 'all' || selectedMethodFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-[#4164D9]" />
              )}
            </button>

            {/* Filters Dropdown Popover */}
            {isFilterOpen && (
              <div className="absolute right-0 top-[48px] z-30 w-[260px] bg-white border border-[#DDE2EC] rounded-[12px] shadow-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#EEF1F6]">
                  <span className="font-bold text-[14px] text-[#0B1530]">Filter Records</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCurrencyFilter('all');
                      setSelectedMethodFilter('all');
                      setIsFilterOpen(false);
                      onTriggerToast('Cleared filters');
                    }}
                    className="text-[12px] font-bold text-[#4164D9] hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#4A5675]">Currency</span>
                  <div className="grid grid-cols-4 gap-1">
                    {(['all', 'USDC', 'XLM', 'EUR'] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setSelectedCurrencyFilter(curr)}
                        className={`h-[28px] rounded-[6px] text-[12px] font-bold ${
                          selectedCurrencyFilter === curr
                            ? 'bg-[#0B1530] text-white'
                            : 'bg-[#EEF1F6] text-[#4A5675] hover:text-[#0B1530]'
                        }`}
                      >
                        {curr.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#4A5675]">Payment Method</span>
                  <div className="flex flex-col gap-1">
                    {[
                      { key: 'all', label: 'All methods' },
                      { key: 'stellar', label: 'Stellar wallet only' },
                      { key: 'bank', label: 'Bank transfers only' },
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedMethodFilter(m.key as any)}
                        className={`px-2.5 py-1.5 rounded-[6px] text-left text-[12px] font-bold ${
                          selectedMethodFilter === m.key
                            ? 'bg-[#0B1530] text-white'
                            : 'hover:bg-[#EEF1F6] text-[#4A5675]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full mt-1 py-1.5 bg-[#4164D9] hover:bg-[#3252BF] text-white font-bold text-[13px] rounded-[8px]"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table Headers */}
        <div className="hidden lg:grid grid-cols-[260px_140px_140px_200px_120px_160px_40px] items-center px-[24px] py-[12px] bg-[#F8F9FC] border-t border-[#EEF1F6]">
          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Bill
          </span>
          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Paid on
          </span>
          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Paid with
          </span>
          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Transaction or note
          </span>
          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675] text-right pr-2">
            Amount
          </span>
          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Status
          </span>
          <span />
        </div>

        {/* List of Payments */}
        <div className="w-full flex flex-col">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <Search size={32} className="text-[#A9B4CC]" />
              <p className="font-onest font-bold text-[16px] text-[#0B1530]">
                No payment records match this filter
              </p>
              <p className="font-onest text-[14px] text-[#4A5675]">
                Try selecting "All" status or clearing the search keyword.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusTab('all');
                  setSearchQuery('');
                  setSelectedCurrencyFilter('all');
                  setSelectedMethodFilter('all');
                }}
                className="mt-2 px-4 py-2 bg-[#0B1530] text-white rounded-[8px] text-[13px] font-bold"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col">
              {paginatedPayments.map((record, index) => {
                const prevRecord = index > 0 ? paginatedPayments[index - 1] : null;
                const showMonthDivider = !prevRecord || prevRecord.monthYear !== record.monthYear;

                return (
                  <React.Fragment key={record.id}>
                    {showMonthDivider && (
                      <div className="w-full px-[24px] py-[9px] bg-[#F8F9FC] border-t border-[#EEF1F6] flex items-center">
                        <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                          {record.monthYear}
                        </span>
                      </div>
                    )}
                    <PaymentRowItem
                      record={record}
                      onOpenDetails={() => setSelectedPayment(record)}
                      onCopyHash={(hash) => handleCopy(hash, 'transaction hash')}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination & Footer Summary Bar */}
        <div className="w-full border-t border-[#EEF1F6] px-4 sm:px-[24px] py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Showing {filteredPayments.length > 0 ? `${startIndex + 1}–${endIndex}` : '0'} of {filteredPayments.length} payments
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-[34px] px-3 rounded-[8px] border border-[#DDE2EC] bg-white text-[13px] font-bold text-[#0B1530] hover:bg-[#F3F5F9] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} strokeWidth={2} />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  totalPages > 5 &&
                  page !== 1 &&
                  page !== totalPages &&
                  Math.abs(page - safePage) > 1
                ) {
                  if (page === 2 || page === totalPages - 1) {
                    return (
                      <span key={page} className="px-1 text-[12px] text-[#77839F]">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                const isActive = page === safePage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-[34px] h-[34px] rounded-[8px] text-[13px] font-bold flex items-center justify-center transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#0B1530] text-white shadow-xs'
                        : 'bg-white border border-[#DDE2EC] text-[#0B1530] hover:bg-[#F3F5F9]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="h-[34px] px-3 rounded-[8px] border border-[#DDE2EC] bg-white text-[13px] font-bold text-[#0B1530] hover:bg-[#F3F5F9] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="inline-flex items-center gap-[6px]">
            <Wallet size={14} strokeWidth={1.8} className="text-[#0B1530]" />
            <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
              Paid from your Stellar wallet and checked against ledger records
            </span>
          </div>
        </div>
      </div>

      {/* 5. Figma Receipt Slip Popup (Screen 14 receipt modal) */}
      {selectedPayment && (
        <TransactionReceiptModal
          payment={selectedPayment}
          bill={bills.find((b) => b.id === selectedPayment.billId) || null}
          userWalletAddress="GBZX…Q4PA"
          onClose={() => setSelectedPayment(null)}
          onViewBillDetails={(b) => {
            setSelectedPayment(null);
            onSelectBill(b);
          }}
          onTriggerToast={onTriggerToast}
        />
      )}
    </div>
  );
};

// Sub-component for individual Payment History Row matching Figma desktop and mobile layouts
interface PaymentRowItemProps {
  record: DetailedPaymentRecord;
  onOpenDetails: () => void;
  onCopyHash: (hash: string) => void;
}

const PaymentRowItem: React.FC<PaymentRowItemProps> = ({ record, onOpenDetails, onCopyHash }) => {
  return (
    <div
      onClick={onOpenDetails}
      className="w-full group hover:bg-[#F9FAFC] transition-colors cursor-pointer border-t border-[#EEF1F6] first:border-t-0"
    >
      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-[260px_140px_140px_200px_120px_160px_40px] items-center px-[24px] py-[14px]">
        {/* 1. Bill Column: Icon + Name + Cycle */}
        <div className="flex items-center gap-[14px]">
          <div
            className={`w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 ${
              record.status === 'failed' ? 'bg-[#FDE8E6]' : 'bg-[#EEF1F6]'
            }`}
          >
            <BillIcon
              type={record.icon}
              size={18}
              className={record.status === 'failed' ? 'text-[#B42318]' : 'text-[#0B1530]'}
            />
          </div>
          <div className="flex flex-col gap-[2px] min-w-0">
            <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530] truncate">
              {record.billName}
            </span>
            <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
              {record.billCycleLabel}
            </span>
          </div>
        </div>

        {/* 2. Paid on Column */}
        <div className="flex flex-col gap-[2px]">
          <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#0B1530]">
            {record.paidDateLabel}
          </span>
          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
            {record.paidTimeLabel}
          </span>
        </div>

        {/* 3. Paid with Column */}
        <div className="flex items-center gap-[6px]">
          {record.paymentMethod === 'stellar' ? (
            <Wallet size={14} className="text-[#4A5675] shrink-0" />
          ) : (
            <Building size={14} className="text-[#4A5675] shrink-0" />
          )}
          <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675] truncate">
            {record.paymentMethodLabel}
          </span>
        </div>

        {/* 4. Transaction or note */}
        <div className="flex items-center">
          {record.isNote ? (
            record.status === 'failed' ? (
              <div className="inline-flex items-center gap-[4px] text-[#B42318]">
                <AlertCircle size={12} strokeWidth={2} />
                <span className="font-onest font-bold text-[12px] leading-[16px] truncate">
                  {record.txHashOrNote}
                </span>
              </div>
            ) : (
              <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                {record.txHashOrNote}
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (record.fullTxHash) {
                  onCopyHash(record.fullTxHash);
                }
              }}
              className="inline-flex items-center gap-[4px] text-[#2F4FBF] hover:underline font-mono text-[12px] leading-[16px] group/link"
              title="Copy transaction hash"
            >
              <span>{record.txHashOrNote}</span>
              <Copy size={13} className="opacity-70 group-hover/link:opacity-100" />
            </button>
          )}
        </div>

        {/* 5. Amount */}
        <div className="flex items-baseline justify-end gap-[4px] pr-2">
          <span
            className={`font-onest font-bold text-[14px] leading-[20px] ${
              record.status === 'failed' ? 'text-[#4A5675]' : 'text-[#0B1530]'
            }`}
          >
            {record.amount.toFixed(2)}
          </span>
          <span className="font-onest font-bold text-[12px] leading-[16px] text-[#4A5675]">
            {record.currency}
          </span>
        </div>

        {/* 6. Status Badge */}
        <div className="flex items-center">
          <StatusBadge kind={record.statusBadgeKind} text={record.statusBadgeText} />
        </div>

        {/* 7. Action Chevron Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            aria-label={`Payment details for ${record.billName}`}
            className="w-[24px] h-[36px] flex items-center justify-center text-[#77839F] group-hover:text-[#0B1530]"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Stacked Card Layout */}
      <div className="flex lg:hidden flex-col p-3.5 sm:p-4 gap-2.5 sm:gap-3">
        {/* Top: Icon + Bill name & cycle (left, flexible) | Amount & time (right, shrink-0) */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                record.status === 'failed' ? 'bg-[#FDE8E6]' : 'bg-[#EEF1F6]'
              }`}
            >
              <BillIcon
                type={record.icon}
                size={17}
                className={record.status === 'failed' ? 'text-[#B42318]' : 'text-[#0B1530]'}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-onest font-bold text-[14px] leading-[18px] text-[#0B1530] truncate block">
                {record.billName}
              </span>
              <span className="text-[11px] sm:text-[12px] leading-[16px] text-[#4A5675] truncate block">
                {record.billCycleLabel} · {record.paidDateLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 pl-1">
            <div className="flex items-baseline gap-1">
              <span className="font-onest font-bold text-[15px] sm:text-[16px] text-[#0B1530]">
                {record.amount.toFixed(2)}
              </span>
              <span className="text-[11px] font-bold text-[#4A5675]">{record.currency}</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#77839F]">{record.paidTimeLabel}</span>
          </div>
        </div>

        {/* Bottom: Status badge + Method (left) | Tx note / link (right) */}
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 pt-2 border-t border-[#EEF1F6]/70 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <StatusBadge kind={record.statusBadgeKind} text={record.statusBadgeText} />
            <span className="text-[11px] sm:text-[12px] text-[#4A5675] truncate max-w-[130px] xs:max-w-[160px] sm:max-w-none">
              {record.paymentMethodLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#2F4FBF] text-[11px] sm:text-[12px] font-mono shrink-0 ml-auto">
            {record.isNote ? (
              <span className={record.status === 'failed' ? 'text-[#B42318] font-sans font-bold text-[11px] sm:text-[12px]' : 'text-[#4A5675] font-sans text-[11px] sm:text-[12px]'}>
                {record.txHashOrNote}
              </span>
            ) : (
              <span>{record.txHashOrNote}</span>
            )}
            <ChevronRight size={14} className="text-[#77839F]" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Status Badge corresponding to the Figma specifications
interface StatusBadgeProps {
  kind: 'verified' | 'verifying' | 'failed' | 'manual';
  text: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ kind, text }) => {
  switch (kind) {
    case 'verified':
      return (
        <span className="inline-flex items-center px-[8px] py-[1px] gap-[5px] h-[24px] bg-[#E3F4EA] border border-[#2B9460] rounded-[6px] select-none">
          <Check size={12} strokeWidth={2.5} className="text-[#1B7A4B]" />
          <span className="font-onest font-bold text-[12px] leading-[16px] text-[#1B7A4B]">
            {text}
          </span>
        </span>
      );

    case 'verifying':
      return (
        <span className="inline-flex items-center px-[8px] py-[1px] gap-[5px] h-[24px] bg-[#E6ECFB] border border-[#E6ECFB] rounded-[6px] select-none">
          <Clock size={12} strokeWidth={2} className="text-[#2F4FBF]" />
          <span className="font-onest font-bold text-[12px] leading-[16px] text-[#2F4FBF]">
            {text}
          </span>
        </span>
      );

    case 'failed':
      return (
        <span className="inline-flex items-center px-[8px] py-[1px] gap-[5px] h-[24px] bg-[#FDE8E6] border border-[#D2453A] rounded-[6px] select-none">
          <AlertCircle size={12} strokeWidth={2} className="text-[#B42318]" />
          <span className="font-onest font-bold text-[12px] leading-[16px] text-[#B42318]">
            {text}
          </span>
        </span>
      );

    case 'manual':
      return (
        <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-white border border-[#77839F] rounded-[6px] select-none">
          <span className="font-onest font-bold text-[12px] leading-[16px] text-[#4A5675]">
            {text}
          </span>
        </span>
      );

    default:
      return null;
  }
};
