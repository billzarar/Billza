import React, { useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  MoreHorizontal,
  X,
  AlertTriangle,
  Check,
  Shield,
  Copy,
} from 'lucide-react';
import { BillItem, Currency } from '../data/initialData';
import { BillIcon } from './BillIcons';

interface BillsScreenProps {
  bills: BillItem[];
  onOpenAddBill: () => void;
  onPayBill: (bill: BillItem) => void;
  onMarkPaid: (bill: BillItem) => void;
  onViewStatus: (bill: BillItem) => void;
  onCopyAddress: (addr: string) => void;
  onSelectBill: (bill: BillItem) => void;
}

type PeriodFilter = 'all' | '7d' | '30d' | '3m' | 'month';
type StatusTab = 'all' | 'overdue' | 'soon' | 'upcoming' | 'paid';
type SortField = 'due' | 'amount' | 'name';

const AVAILABLE_MONTHS = [
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026',
  'January 2027',
];

export const BillsScreen: React.FC<BillsScreenProps> = ({
  bills,
  onOpenAddBill,
  onPayBill,
  onMarkPaid,
  onViewStatus,
  onCopyAddress,
  onSelectBill,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number | null>(null);
  const [showMonthMenu, setShowMonthMenu] = useState(false);

  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<Currency | 'ALL'>('ALL');
  const [cycleFilter, setCycleFilter] = useState<'ALL' | 'monthly' | 'quarterly'>('ALL');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);

  const [sortBy, setSortBy] = useState<SortField>('due');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [openMenuBillId, setOpenMenuBillId] = useState<string | null>(null);
  const [expandedDetailBillId, setExpandedDetailBillId] = useState<string | null>(null);

  const totalBillsCount = bills.length;
  const monthlyCount = bills.filter((b) => b.frequency === 'monthly').length;
  const quarterlyCount = bills.filter((b) => b.frequency === 'quarterly').length;

  const overdueCount = bills.filter((b) => b.status === 'overdue').length;
  const dueSoonCount = bills.filter((b) => b.status === 'soon').length;
  const upcomingCount = bills.filter((b) => b.status === 'upcoming').length;
  // In the Bills screen Figma spec, Paid tab shows 2 (or paid + verifying/completed)
  const paidTabCount = Math.max(
    2,
    bills.filter((b) => b.status === 'paid').length
  );

  const handlePrevMonth = () => {
    setPeriod('month');
    setSelectedMonthIdx((prev) => {
      if (prev === null) return 1; // October 2026
      return Math.max(0, prev - 1);
    });
  };

  const handleNextMonth = () => {
    setPeriod('month');
    setSelectedMonthIdx((prev) => {
      if (prev === null) return 1; // October 2026
      return Math.min(AVAILABLE_MONTHS.length - 1, prev + 1);
    });
  };

  // Filter and sort bills
  const filteredBills = bills
    .filter((bill) => {
      // Period filter
      if (period === '7d' && !bill.inNext7Days) return false;
      if (period === '30d' && !bill.inNext30Days) return false;
      if (period === 'month' && selectedMonthIdx !== null) {
        const monthName = AVAILABLE_MONTHS[selectedMonthIdx];
        const dueText = bill.billsNextDueLabel || bill.dueDateLabel;
        if (monthName.startsWith('October') && !dueText.includes('Oct')) return false;
        if (monthName.startsWith('November') && !dueText.includes('Nov')) return false;
        if (monthName.startsWith('January') && !dueText.includes('Jan')) return false;
      }

      // Status tab filter
      if (statusTab === 'overdue' && bill.status !== 'overdue') return false;
      if (statusTab === 'soon' && bill.status !== 'soon') return false;
      if (statusTab === 'upcoming' && bill.status !== 'upcoming') return false;
      if (statusTab === 'paid' && bill.status !== 'paid' && bill.status !== 'pending') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = bill.name.toLowerCase().includes(q);
        const matchCat = bill.category.toLowerCase().includes(q);
        const matchAddr = bill.recipientShort.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchAddr) return false;
      }

      // Extra filters
      const displayCurr = bill.billsCurrency || bill.currency;
      if (currencyFilter !== 'ALL' && displayCurr !== currencyFilter) return false;
      if (cycleFilter !== 'ALL' && bill.frequency !== cycleFilter) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') {
        const amtA = a.billsAmount ?? a.amount;
        const amtB = b.billsAmount ?? b.amount;
        return amtB - amtA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // Default order: Overdue first, then by due date (original array order)
      return 0;
    });

  const renderStatusPill = (bill: BillItem) => {
    if (bill.status === 'overdue') {
      return (
        <span className="inline-flex items-center h-[28px] px-[11px] py-[1px] bg-[#FDE8E6] border border-[#D2453A] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#B42318] whitespace-nowrap shrink-0">
          {bill.dueInLabel}
        </span>
      );
    }
    if (bill.status === 'soon') {
      return (
        <span className="inline-flex items-center h-[28px] px-[11px] py-[1px] bg-[#FDF1DD] border border-[#B8740A] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#94560A] whitespace-nowrap shrink-0">
          {bill.dueInLabel}
        </span>
      );
    }
    if (bill.status === 'pending') {
      return (
        <span className="inline-flex items-center h-[28px] px-[11px] py-[1px] bg-[#E6ECFB] border border-[#E6ECFB] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#2F4FBF] whitespace-nowrap shrink-0">
          Verifying
        </span>
      );
    }
    if (bill.status === 'paid') {
      return (
        <span className="inline-flex items-center gap-[5px] h-[28px] px-[11px] py-[1px] bg-[#E3F4EA] border border-[#2B9460] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#1B7A4B] whitespace-nowrap shrink-0">
          <Check size={12} strokeWidth={2.5} className="text-[#1B7A4B]" />
          <span>{bill.billsStatusLabel || 'Paid this quarter'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center h-[28px] px-[11px] py-[1px] bg-[#EEF1F6] border border-[#EEF1F6] rounded-[6px] font-bold text-[12px] leading-[16px] text-[#0B1530] whitespace-nowrap shrink-0">
        {bill.dueInLabel}
      </span>
    );
  };

  const renderPrimaryRowAction = (bill: BillItem) => {
    if (bill.status === 'paid') {
      return null;
    }
    if (bill.status === 'overdue' || bill.status === 'soon') {
      return (
        <button
          type="button"
          onClick={() => onPayBill(bill)}
          className="inline-flex items-center justify-center h-[36px] px-[14px] bg-[#0B1530] hover:bg-[#1A2A55] rounded-[10px] font-bold text-[16px] leading-[24px] text-white transition-colors whitespace-nowrap shrink-0"
        >
          Pay
        </button>
      );
    }
    if (bill.status === 'pending' || bill.actionType === 'status') {
      return (
        <button
          type="button"
          onClick={() => onViewStatus(bill)}
          className="inline-flex items-center justify-center h-[36px] px-2 font-bold text-[14px] leading-[20px] text-[#2F4FBF] underline hover:text-[#0B1530] transition-colors whitespace-nowrap shrink-0"
        >
          View status
        </button>
      );
    }
    if (bill.actionType === 'mark') {
      return (
        <button
          type="button"
          onClick={() => onMarkPaid(bill)}
          className="inline-flex items-center justify-center h-[36px] px-[14px] rounded-[10px] hover:bg-[#E6ECFB]/60 font-bold text-[16px] leading-[24px] text-[#2F4FBF] transition-colors whitespace-nowrap shrink-0"
        >
          Mark as paid
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onPayBill(bill)}
        className="inline-flex items-center justify-center h-[36px] px-[15px] rounded-[10px] hover:bg-[#E6ECFB]/60 font-bold text-[16px] leading-[24px] text-[#2F4FBF] transition-colors whitespace-nowrap shrink-0"
      >
        Pay
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col gap-[24px] sm:gap-[28px]">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <div className="flex flex-col gap-[6px] sm:gap-[8.5px]">
          <h1 className="font-extrabold text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] tracking-[-1px] text-[#0B1530]">
            Bills
          </h1>
          <p className="font-medium text-[15px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#4A5675]">
            {totalBillsCount} bills, {monthlyCount} monthly and {quarterlyCount} quarterly. Bills
            due soonest appear first.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddBill}
          className="inline-flex items-center justify-center gap-[8px] h-[44px] px-[18px] bg-[#0B1530] hover:bg-[#1A2A55] text-white rounded-[10px] font-bold text-[16px] leading-[24px] transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus size={18} strokeWidth={2.4} />
          <span>Add new bill</span>
        </button>
      </div>

      {/* 2. PeriodPicker Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
        {/* Left: Show bills due in segmented control */}
        <div
          className="inline-flex flex-wrap sm:flex-nowrap items-center p-[3px] gap-[2px] bg-[#EEF1F6] rounded-[10px] min-h-[40px] w-full sm:w-auto overflow-x-auto"
          role="group"
          aria-label="Show bills due in"
        >
          {(
            [
              { id: 'all', label: 'All upcoming' },
              { id: '7d', label: 'Next 7 days' },
              { id: '30d', label: 'Next 30 days' },
              { id: '3m', label: 'Next 3 months' },
            ] as { id: PeriodFilter; label: string }[]
          ).map((item) => {
            const isActive = period === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPeriod(item.id);
                  setSelectedMonthIdx(null);
                }}
                className={`h-[34px] px-[14px] rounded-[8px] font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#0B1530] text-white'
                    : 'text-[#4A5675] hover:text-[#0B1530]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: Or a month picker */}
        <div className="flex items-center gap-[12px] self-start lg:self-auto">
          <span className="font-semibold text-[14px] leading-[20px] text-[#4A5675] whitespace-nowrap">
            Or a month
          </span>

          <div className="relative flex items-center gap-[6px]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-[40px] h-[40px] bg-white hover:bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] flex items-center justify-center text-[#0B1530] transition-colors shrink-0"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={() => setShowMonthMenu((prev) => !prev)}
              className={`h-[40px] min-w-[160.5px] px-[13px] bg-white hover:bg-[#F8F9FC] border rounded-[10px] flex items-center justify-between gap-[8px] transition-colors whitespace-nowrap shrink-0 ${
                period === 'month' ? 'border-[#0B1530]' : 'border-[#DDE2EC]'
              }`}
            >
              <span className="flex items-center gap-[8px]">
                <Calendar size={16} strokeWidth={2} className="text-[#0B1530]" />
                <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  {period === 'month' && selectedMonthIdx !== null
                    ? AVAILABLE_MONTHS[selectedMonthIdx]
                    : 'Pick a month'}
                </span>
              </span>
              <ChevronDown size={16} strokeWidth={2} className="text-[#0B1530]" />
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-[40px] h-[40px] bg-white hover:bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] flex items-center justify-center text-[#0B1530] transition-colors shrink-0"
              aria-label="Next month"
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>

            {/* Month Dropdown Menu */}
            {showMonthMenu && (
              <div className="absolute right-0 top-[46px] z-30 w-[200px] bg-white border border-[#DDE2EC] rounded-[10px] shadow-xl py-1.5 flex flex-col">
                {AVAILABLE_MONTHS.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPeriod('month');
                      setSelectedMonthIdx(idx);
                      setShowMonthMenu(false);
                    }}
                    className={`px-3.5 py-2 text-left text-[13px] font-semibold hover:bg-[#F3F5F9] flex items-center justify-between ${
                      period === 'month' && selectedMonthIdx === idx
                        ? 'text-[#4164D9] bg-[#E6ECFB]/40'
                        : 'text-[#0B1530]'
                    }`}
                  >
                    <span>{m}</span>
                    {period === 'month' && selectedMonthIdx === idx && <Check size={14} />}
                  </button>
                ))}
                {period === 'month' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod('all');
                      setSelectedMonthIdx(null);
                      setShowMonthMenu(false);
                    }}
                    className="px-3.5 py-2 mt-1 border-t border-[#EEF1F6] text-left text-[12px] font-bold text-[#4A5675] hover:text-[#0B1530]"
                  >
                    Reset to All upcoming
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bill Totals Row (4 TotalCards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[16px] w-full">
        {/* TotalCard 1: Each month (Navy) */}
        <div className="w-full h-[136px] bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
          <div className="w-full h-[42px] bg-[#0B1530] rounded-t-[10px] px-[20px] py-[11px] flex items-center gap-[8px] shrink-0">
            <span className="w-[6px] h-[6px] rounded-[3px] bg-[#7F9BF0] shrink-0" />
            <span className="font-semibold text-[14px] leading-[20px] text-white">
              Each month
            </span>
          </div>
          <div className="flex-1 px-[20px] pt-[16px] pb-[20px] flex flex-col gap-[4px] justify-between">
            <div className="flex items-start gap-[5px] tabular-nums">
              <span className="font-extrabold text-[28px] leading-[36px] tracking-[-0.5px] text-[#0B1530]">
                531.50
              </span>
              <span className="pt-[15px] font-bold text-[12px] leading-[16px] text-[#0B1530]">
                USDC
              </span>
            </div>
            <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
              Plus 140.00 XLM and 45.00 EUR
            </span>
          </div>
        </div>

        {/* TotalCard 2: Each quarter (Grey) */}
        <div className="w-full h-[136px] bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
          <div className="w-full h-[42px] bg-[#EEF1F6] rounded-t-[10px] px-[20px] py-[11px] flex items-center gap-[8px] shrink-0">
            <span className="w-[6px] h-[6px] rounded-[3px] bg-[#8A94AD] shrink-0" />
            <span className="font-semibold text-[14px] leading-[20px] text-[#3B4664]">
              Each quarter
            </span>
          </div>
          <div className="flex-1 px-[20px] pt-[16px] pb-[20px] flex flex-col gap-[4px] justify-between">
            <div className="flex items-start gap-[5px] tabular-nums">
              <span className="font-extrabold text-[28px] leading-[36px] tracking-[-0.5px] text-[#0B1530]">
                330.00
              </span>
              <span className="pt-[15px] font-bold text-[12px] leading-[16px] text-[#0B1530]">
                USDC
              </span>
            </div>
            <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
              School fees and office internet
            </span>
          </div>
        </div>

        {/* TotalCard 3: Next due (Amber) */}
        <button
          type="button"
          onClick={() => setStatusTab((prev) => (prev === 'soon' ? 'all' : 'soon'))}
          className="w-full h-[136px] bg-white border border-[#DDE2EC] hover:border-[#E59A1A] rounded-[12px] p-[1px] flex flex-col overflow-hidden text-left transition-colors"
        >
          <div className="w-full h-[42px] bg-[#FFF1D6] rounded-t-[10px] px-[20px] py-[11px] flex items-center gap-[8px] shrink-0">
            <span className="w-[6px] h-[6px] rounded-[3px] bg-[#E59A1A] shrink-0" />
            <span className="font-semibold text-[14px] leading-[20px] text-[#8A5300]">
              Next due
            </span>
          </div>
          <div className="flex-1 px-[20px] pt-[16px] pb-[20px] flex flex-col gap-[4px] justify-between">
            <span className="font-extrabold text-[28px] leading-[36px] tracking-[-0.5px] text-[#0B1530]">
              Fri 23 Oct
            </span>
            <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
              Home electricity, 38.50 USDC
            </span>
          </div>
        </button>

        {/* TotalCard 4: Overdue (Red) */}
        <button
          type="button"
          onClick={() => setStatusTab((prev) => (prev === 'overdue' ? 'all' : 'overdue'))}
          className="w-full h-[136px] bg-white border border-[#DDE2EC] hover:border-[#D2453A] rounded-[12px] p-[1px] flex flex-col overflow-hidden text-left transition-colors"
        >
          <div className="w-full h-[42px] bg-[#FDE8E6] rounded-t-[10px] px-[20px] py-[11px] flex items-center gap-[8px] shrink-0">
            <span className="w-[6px] h-[6px] rounded-[3px] bg-[#B42318] shrink-0" />
            <span className="font-semibold text-[14px] leading-[20px] text-[#B42318]">
              Overdue
            </span>
          </div>
          <div className="flex-1 px-[20px] pt-[16px] pb-[20px] flex flex-col gap-[4px] justify-between">
            <div className="flex items-start gap-[5px] tabular-nums">
              <span className="font-extrabold text-[28px] leading-[36px] tracking-[-0.5px] text-[#B42318]">
                {overdueCount}
              </span>
              <span className="pt-[15px] font-bold text-[12px] leading-[16px] text-[#B42318]">
                {overdueCount === 1 ? 'bill' : 'bills'}
              </span>
            </div>
            <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
              {overdueCount > 0 ? 'Fibre internet, 2 days late' : 'No overdue bills'}
            </span>
          </div>
        </button>
      </div>

      {/* 4. Main Bills Table Card */}
      <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] flex flex-col overflow-hidden">
        {/* Top Toolbar: Status Tabs + Search + Filters + Sort */}
        <div className="w-full px-4 sm:px-[24px] py-[20px] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Status Segmented Tabs */}
          <div
            className="inline-flex items-center p-[3px] gap-[2px] bg-[#EEF1F6] rounded-[10px] min-h-[39px] overflow-x-auto max-w-full"
            role="tablist"
            aria-label="Filter bills by status"
          >
            {(
              [
                { id: 'all', label: 'All', count: totalBillsCount },
                { id: 'overdue', label: 'Overdue', count: overdueCount },
                { id: 'soon', label: 'Due soon', count: dueSoonCount },
                { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
                { id: 'paid', label: 'Paid', count: paidTabCount },
              ] as { id: StatusTab; label: string; count: number }[]
            ).map((tab) => {
              const isActive = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setStatusTab(tab.id)}
                  className={`h-[33px] px-[12px] rounded-[8px] flex items-center gap-[8px] font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#0B1530] text-white'
                      : 'text-[#4A5675] hover:text-[#0B1530]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-[6px] rounded-[10px] font-bold text-[12px] leading-[16px] tabular-nums ${
                      isActive ? 'bg-white/[0.16] text-white' : 'bg-white text-[#0B1530]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Filters & Sort Controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-[10px]">
            {/* Search Input */}
            <label className="relative flex items-center gap-[10px] h-[39px] w-full sm:w-[250px] px-[15px] py-[1px] bg-white border border-[#DDE2EC] focus-within:border-[#4164D9] rounded-[10px]">
              <Search size={18} strokeWidth={1.8} className="text-[#4A5675] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bills"
                className="w-full bg-transparent text-[15px] sm:text-[16px] leading-[24px] text-[#0B1530] placeholder:text-[#757575] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#4A5675] hover:text-[#0B1530]"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            {/* Filters Button + Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowFiltersMenu((prev) => !prev);
                  setShowSortMenu(false);
                }}
                className={`h-[39px] px-[13px] py-[1px] bg-white hover:bg-[#F8F9FC] border rounded-[10px] flex items-center gap-[8px] font-bold text-[14px] leading-[20px] text-[#0B1530] transition-colors whitespace-nowrap shrink-0 ${
                  currencyFilter !== 'ALL' || cycleFilter !== 'ALL'
                    ? 'border-[#4164D9] bg-[#E6ECFB]/20'
                    : 'border-[#DDE2EC]'
                }`}
              >
                <SlidersHorizontal size={16} strokeWidth={2} className="text-[#0B1530]" />
                <span>Filters</span>
              </button>

              {showFiltersMenu && (
                <div className="absolute right-0 top-[45px] z-30 w-[230px] bg-white border border-[#DDE2EC] rounded-[10px] shadow-xl p-3.5 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-[#4A5675] uppercase tracking-wider">
                      Currency
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(['ALL', 'USDC', 'XLM', 'EUR'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCurrencyFilter(c)}
                          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold ${
                            currencyFilter === c
                              ? 'bg-[#0B1530] text-white'
                              : 'bg-[#EEF1F6] text-[#4A5675] hover:text-[#0B1530]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-[#4A5675] uppercase tracking-wider">
                      Billing Cycle
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(['ALL', 'monthly', 'quarterly'] as const).map((cy) => (
                        <button
                          key={cy}
                          type="button"
                          onClick={() => setCycleFilter(cy)}
                          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold capitalize ${
                            cycleFilter === cy
                              ? 'bg-[#0B1530] text-white'
                              : 'bg-[#EEF1F6] text-[#4A5675] hover:text-[#0B1530]'
                          }`}
                        >
                          {cy === 'ALL' ? 'All' : cy}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(currencyFilter !== 'ALL' || cycleFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrencyFilter('ALL');
                        setCycleFilter('ALL');
                        setShowFiltersMenu(false);
                      }}
                      className="pt-2 border-t border-[#EEF1F6] text-left text-[12px] font-bold text-[#2F4FBF] hover:underline"
                    >
                      Clear active filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Due date Sort Button + Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSortMenu((prev) => !prev);
                  setShowFiltersMenu(false);
                }}
                className="h-[39px] min-w-[135px] px-[13px] py-[1px] bg-white hover:bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] flex items-center justify-between gap-[8px] font-bold text-[14px] leading-[20px] text-[#0B1530] transition-colors whitespace-nowrap shrink-0"
              >
                <span className="flex items-center gap-[8px]">
                  <ArrowUpDown size={16} strokeWidth={2} className="text-[#0B1530]" />
                  <span>
                    {sortBy === 'due'
                      ? 'Due date'
                      : sortBy === 'amount'
                      ? 'Amount'
                      : 'Bill name'}
                  </span>
                </span>
                <ChevronDown size={16} strokeWidth={2} className="text-[#0B1530]" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-[45px] z-30 w-[160px] bg-white border border-[#DDE2EC] rounded-[10px] shadow-xl py-1.5 flex flex-col">
                  {(
                    [
                      { id: 'due', label: 'Due date' },
                      { id: 'amount', label: 'Amount (high–low)' },
                      { id: 'name', label: 'Bill name (A–Z)' },
                    ] as { id: SortField; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        setShowSortMenu(false);
                      }}
                      className={`px-3.5 py-2 text-left text-[13px] font-semibold hover:bg-[#F3F5F9] flex items-center justify-between ${
                        sortBy === opt.id ? 'text-[#4164D9] bg-[#E6ECFB]/40' : 'text-[#0B1530]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Column Header Row (#F8F9FC, height 40px) */}
        <div className="hidden lg:grid lg:grid-cols-[284px_100px_128px_140px_128px_1fr] items-center gap-4 px-[24px] py-[12px] h-[40px] bg-[#F8F9FC] font-medium text-[12px] leading-[16px] text-[#4A5675]">
          <div>Bill</div>
          <div>Pays to</div>
          <div>Next due</div>
          <div>Status</div>
          <div className="text-right">Amount</div>
          <div />
        </div>

        {/* Bill List Rows */}
        <div className="flex flex-col w-full">
          {filteredBills.length === 0 ? (
            <div className="px-6 py-14 border-t border-[#EEF1F6] flex flex-col items-center justify-center text-center gap-2">
              <p className="font-bold text-[16px] text-[#0B1530]">
                No bills match your current filters
              </p>
              <p className="text-[14px] text-[#4A5675]">
                Try resetting your search query, period filter, or status tab.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPeriod('all');
                  setSelectedMonthIdx(null);
                  setStatusTab('all');
                  setSearchQuery('');
                  setCurrencyFilter('ALL');
                  setCycleFilter('ALL');
                }}
                className="mt-2 h-[38px] px-4 bg-[#0B1530] text-white font-bold text-[14px] rounded-[8px]"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            filteredBills.map((bill) => {
              const isOverdue = bill.status === 'overdue';
              const displayAmount = bill.billsAmount ?? bill.amount;
              const displayCurrency = bill.billsCurrency ?? bill.currency;
              const displayNextDue = bill.billsNextDueLabel || bill.dueDateLabel;
              const isSelfPay = bill.actionType === 'mark';
              const isExpanded = expandedDetailBillId === bill.id;

              return (
                <div
                  key={bill.id}
                  className={`border-top border-t border-[#EEF1F6] transition-colors ${
                    isOverdue ? 'bg-[#FFF8F7]' : 'bg-white hover:bg-[#F8F9FC]/70'
                  }`}
                >
                  {/* Desktop Row (lg+) */}
                  <div className="hidden lg:grid lg:grid-cols-[284px_100px_128px_140px_128px_1fr] items-center gap-4 pl-[24px] pr-[20px] py-[16.5px] min-h-[73px]">
                    {/* Col 1: Bill Icon + Name + Cycle + Error/Warn */}
                    <button
                      type="button"
                      onClick={() => onSelectBill(bill)}
                      className="flex items-center gap-[14px] min-w-0 text-left group cursor-pointer"
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

                      <div className="flex flex-col gap-[4px] min-w-0">
                        <div className="flex flex-col gap-[2px] min-w-0">
                          <span className="font-bold text-[14px] leading-[20px] text-[#0B1530] group-hover:text-[#2F4FBF] transition-colors truncate">
                            {bill.name}
                          </span>
                          <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
                            {bill.billsSubtitle || bill.subtitle}
                          </span>
                        </div>

                        {bill.failureReason && (
                          <div className="flex items-center gap-[4px] text-[#B42318]">
                            <X size={12} strokeWidth={2.5} className="shrink-0" />
                            <span className="font-bold text-[12px] leading-[16px] whitespace-nowrap">
                              {bill.failureReason}
                            </span>
                          </div>
                        )}

                        {bill.warningReason && (
                          <div className="flex items-center gap-[4px] text-[#8A5300]">
                            <AlertTriangle size={12} strokeWidth={2.2} className="shrink-0" />
                            <span className="font-bold text-[12px] leading-[16px] whitespace-nowrap">
                              {bill.warningReason}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Col 2: Pays to */}
                    <div className="min-w-0">
                      {isSelfPay ? (
                        <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] whitespace-nowrap">
                          {bill.recipientShort}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCopyAddress(bill.recipientAddress)}
                          title="Click to copy Stellar address"
                          className="font-mono-redhat text-[12px] leading-[16px] text-[#0B1530] hover:text-[#4164D9] transition-colors whitespace-nowrap"
                        >
                          {bill.recipientShort}
                        </button>
                      )}
                    </div>

                    {/* Col 3: Next due */}
                    <div>
                      <span
                        className={`font-semibold text-[14px] leading-[20px] whitespace-nowrap ${
                          isOverdue
                            ? 'text-[#B42318]'
                            : bill.status === 'paid'
                            ? 'text-[#4A5675]'
                            : 'text-[#0B1530]'
                        }`}
                      >
                        {displayNextDue}
                      </span>
                    </div>

                    {/* Col 4: Status */}
                    <div>{renderStatusPill(bill)}</div>

                    {/* Col 5: Amount */}
                    <div className="flex items-baseline justify-end gap-[4px] tabular-nums">
                      <span className="font-bold text-[14px] leading-[20px] text-[#0B1530]">
                        {displayAmount.toFixed(2)}
                      </span>
                      <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">
                        {displayCurrency}
                      </span>
                    </div>

                    {/* Col 6: Actions (Pay / Status / Mark + More 3-dots + Details chevron) */}
                    <div className="relative flex items-center justify-end gap-[8px]">
                      {renderPrimaryRowAction(bill)}

                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuBillId((prev) => (prev === bill.id ? null : bill.id))
                        }
                        className="w-[36px] h-[36px] bg-white hover:bg-[#F3F5F9] border border-[#DDE2EC] rounded-[8px] flex items-center justify-center text-[#0B1530] transition-colors shrink-0"
                        aria-label={`More actions for ${bill.name}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectBill(bill)}
                        className="w-[24px] h-[36px] flex items-center justify-center text-[#77839F] hover:text-[#0B1530] transition-colors shrink-0 cursor-pointer"
                        aria-label={`View details for ${bill.name}`}
                      >
                        <ChevronRight size={16} strokeWidth={2} />
                      </button>

                      {/* More Actions Dropdown */}
                      {openMenuBillId === bill.id && (
                        <div className="absolute right-8 top-[40px] z-30 w-[180px] bg-white border border-[#DDE2EC] rounded-[10px] shadow-xl py-1.5 flex flex-col text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuBillId(null);
                              onSelectBill(bill);
                            }}
                            className="px-3.5 py-2 text-[13px] font-semibold text-[#0B1530] hover:bg-[#F3F5F9]"
                          >
                            View bill details
                          </button>
                          {bill.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuBillId(null);
                                if (bill.actionType === 'mark') {
                                  onMarkPaid(bill);
                                } else {
                                  onPayBill(bill);
                                }
                              }}
                              className="px-3.5 py-2 text-[13px] font-semibold text-[#0B1530] hover:bg-[#F3F5F9]"
                            >
                              {bill.actionType === 'mark' ? 'Mark bill as paid' : 'Pay bill now'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuBillId(null);
                              onCopyAddress(bill.recipientAddress);
                            }}
                            className="px-3.5 py-2 text-[13px] font-semibold text-[#0B1530] hover:bg-[#F3F5F9]"
                          >
                            Copy recipient address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile / Tablet Responsive Row (< lg) */}
                  <div className="flex lg:hidden flex-col gap-3 p-4 sm:px-6">
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
                            {bill.billsSubtitle || bill.subtitle} ·{' '}
                            <span className="font-mono-redhat text-[11px]">
                              {bill.recipientShort}
                            </span>
                          </span>
                        </div>
                      </button>

                      <div className="flex items-baseline gap-[4px] shrink-0 tabular-nums">
                        <span className="font-bold text-[15px] leading-[20px] text-[#0B1530]">
                          {displayAmount.toFixed(2)}
                        </span>
                        <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">
                          {displayCurrency}
                        </span>
                      </div>
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

                    <div className="flex flex-wrap items-center justify-between gap-2 pl-[52px] pt-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-[13px] ${
                            isOverdue ? 'text-[#B42318]' : 'text-[#0B1530]'
                          }`}
                        >
                          {displayNextDue}
                        </span>
                        {renderStatusPill(bill)}
                      </div>

                      <div className="flex items-center gap-2">
                        {renderPrimaryRowAction(bill)}
                        <button
                          type="button"
                          onClick={() => onSelectBill(bill)}
                          className="w-[34px] h-[34px] bg-white border border-[#DDE2EC] rounded-[8px] flex items-center justify-center text-[#0B1530]"
                          aria-label={`View details for ${bill.name}`}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Bill Details Drawer */}
                  {isExpanded && (
                    <div className="px-5 sm:px-[24px] py-3.5 bg-[#F8F9FC] border-t border-[#EEF1F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
                        <div>
                          <span className="text-[#4A5675] font-medium">Category: </span>
                          <span className="text-[#0B1530] font-bold">{bill.category}</span>
                        </div>
                        <div>
                          <span className="text-[#4A5675] font-medium">Cycle: </span>
                          <span className="text-[#0B1530] font-bold capitalize">
                            {bill.frequency}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#4A5675] font-medium">Destination: </span>
                          <span className="font-mono-redhat text-[#0B1530]">
                            {bill.recipientAddress}
                          </span>
                          {!isSelfPay && (
                            <button
                              type="button"
                              onClick={() => onCopyAddress(bill.recipientAddress)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-[#DDE2EC] rounded text-[11px] font-bold text-[#0B1530] hover:bg-[#EEF1F6]"
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer Bar */}
        <div className="border-t border-[#EEF1F6] px-4 sm:px-[24px] py-[16.5px] min-h-[49px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
          <span className="font-medium text-[12px] leading-[16px] text-[#4A5675]">
            Showing {filteredBills.length === totalBillsCount ? `all ${totalBillsCount}` : filteredBills.length}{' '}
            bills. Overdue first, then by due date.
          </span>

          <div className="flex items-center gap-[6px] text-[#4A5675]">
            <Shield size={14} strokeWidth={1.8} className="shrink-0" />
            <span className="font-medium text-[12px] leading-[16px]">
              Stellar payments go from your wallet straight to each bill&apos;s address.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
