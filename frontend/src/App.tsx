/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  AlertTriangle,
  ArrowUpRight,
  Home,
  Receipt,
  Bell,
  History,
  Check,
  X,
} from 'lucide-react';
import {
  Currency,
  INITIAL_WALLET,
  INITIAL_BILLS,
  INITIAL_PAYMENTS,
  BillItem,
  PaymentHistoryItem,
} from './data/initialData';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { MonthlyExpensesChart } from './components/MonthlyExpensesChart';
import { BillCategoriesCard } from './components/BillCategoriesCard';
import { UpcomingPaymentsCard } from './components/UpcomingPaymentsCard';
import { RecentPaymentsCard } from './components/RecentPaymentsCard';
import { StatCardPopup, StatCardKind } from './components/StatCardPopup';
import { BillsScreen } from './components/BillsScreen';
import { BillDetailScreen } from './components/BillDetailScreen';
import { RemindersScreen } from './components/RemindersScreen';
import { ReminderSettingsScreen } from './components/ReminderSettingsScreen';
import { PaymentHistoryScreen } from './components/PaymentHistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HelpScreen } from './components/HelpScreen';
import { INITIAL_REMINDERS, ReminderItem } from './data/remindersData';
import {
  AddBillModal,
  PayBillModal,
  StatusModal,
  WalletModal,
} from './components/Modals';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import {
  AuthUser,
  getStoredUser,
  clearStoredAuth,
  fetchOccurrences,
  fetchPaymentHistory,
  fetchReminders,
  markOccurrencePaidApi,
  transformBackendOccurrence,
} from './services/api';

export type AppView = 'landing' | 'login' | 'signup' | 'app';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [currency, setCurrency] = useState<Currency>('USDC');
  const [wallet, setWallet] = useState(INITIAL_WALLET);
  const [bills, setBills] = useState<BillItem[]>(INITIAL_BILLS);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>(INITIAL_PAYMENTS);
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);

  // Sync with live backend occurrences & data
  useEffect(() => {
    let isMounted = true;
    const syncBackend = async () => {
      try {
        const occs = await fetchOccurrences();
        if (isMounted && occs && occs.length > 0) {
          setBills(occs.map(transformBackendOccurrence));
        }
      } catch {
        // Graceful fallback to initial mock data
      }
    };
    syncBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState(false);

  const selectedBill = bills.find((b) => b.id === selectedBillId) || null;

  // Hover / Active Stat Card Popup state
  const [openStatPopup, setOpenStatPopup] = useState<StatCardKind | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const handleStatMouseEnter = (kind: StatCardKind) => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenStatPopup(kind);
  };

  const handleStatMouseLeave = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpenStatPopup(null);
    }, 150);
  };

  const handleStatToggleClick = (kind: StatCardKind) => {
    setOpenStatPopup((prev) => (prev === kind ? null : kind));
  };

  // Modals & Popovers
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<BillItem | null>(null);
  const [inspectingBill, setInspectingBill] = useState<BillItem | null>(null);
  const [inspectingPayment, setInspectingPayment] = useState<PaymentHistoryItem | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Compute October stats for active currency
  const overdueBills = bills.filter((b) => b.status === 'overdue');
  const dueSoonBills = bills.filter((b) => b.status === 'soon');
  const firstOverdueBill = overdueBills[0] || null;

  // October breakdown per currency
  const getOctoberSummary = (curr: Currency) => {
    if (curr === 'USDC') {
      const paidUsdc = payments
        .filter((p) => p.currency === 'USDC' && (p.status === 'paid' || p.status === 'manual'))
        .reduce((s, p) => s + p.amount, 0);
      const verifyingUsdc = payments
        .filter((p) => p.currency === 'USDC' && p.status === 'pending')
        .reduce((s, p) => s + p.amount, 0);
      const stillToPayUsdc = bills
        .filter(
          (b) =>
            b.currency === 'USDC' &&
            (b.status === 'overdue' || b.status === 'soon')
        )
        .reduce((s, b) => s + b.amount, 0);
      const total = paidUsdc + verifyingUsdc + stillToPayUsdc;
      return {
        total,
        paid: paidUsdc,
        verifying: verifyingUsdc,
        stillToPay: stillToPayUsdc,
        alsoText: 'Also in October: 140.00 XLM · 45.00 EUR',
      };
    }

    if (curr === 'XLM') {
      const paidXlm = payments
        .filter((p) => p.currency === 'XLM' && p.status === 'paid')
        .reduce((s, p) => s + p.amount, 0);
      const verifyingXlm = payments
        .filter((p) => p.currency === 'XLM' && p.status === 'pending')
        .reduce((s, p) => s + p.amount, 0);
      const stillToPayXlm = bills
        .filter((b) => b.currency === 'XLM' && b.status !== 'paid' && b.inNext14Days)
        .reduce((s, b) => s + b.amount, 0);
      const total = paidXlm + verifyingXlm + stillToPayXlm;
      return {
        total,
        paid: paidXlm,
        verifying: verifyingXlm,
        stillToPay: stillToPayXlm,
        alsoText: 'Also in October: 561.50 USDC · 45.00 EUR',
      };
    }

    // EUR
    const paidEur = payments
      .filter((p) => p.currency === 'EUR' && (p.status === 'paid' || p.status === 'manual'))
      .reduce((s, p) => s + p.amount, 0);
    const verifyingEur = 0;
    const stillToPayEur = 0;
    const total = paidEur + verifyingEur + stillToPayEur;
    return {
      total,
      paid: paidEur,
      verifying: verifyingEur,
      stillToPay: stillToPayEur,
      alsoText: 'Also in October: 561.50 USDC · 140.00 XLM',
    };
  };

  const octSummary = getOctoberSummary(currency);
  const safeTotal = octSummary.total > 0 ? octSummary.total : 1;
  const paidPct = (octSummary.paid / safeTotal) * 100;
  const verifyingPct = (octSummary.verifying / safeTotal) * 100;
  const stillToPayPct = (octSummary.stillToPay / safeTotal) * 100;

  // Handlers
  const handleConfirmPayment = (bill: BillItem) => {
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [bill.currency]: Math.max(0, prev.balances[bill.currency] - bill.amount),
      },
    }));

    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? {
              ...b,
              status: 'paid',
              dueInLabel: 'Paid on Stellar',
              billsStatusLabel: b.frequency === 'quarterly' ? 'Paid this quarter' : 'Paid this month',
              failureReason: undefined,
              warningReason: undefined,
            }
          : b
      )
    );

    const newPayment: PaymentHistoryItem = {
      id: `pay-${Date.now()}`,
      billId: bill.id,
      name: bill.name,
      dateLabel: 'Just now',
      amount: bill.amount,
      currency: bill.currency,
      status: 'paid',
      statusLabel: 'Paid on Stellar',
      icon: bill.icon,
      txHash: `${Math.random().toString(16).slice(2, 18)}8f3e9b2a4c1d7e6f5a0b9c8d`,
    };
    setPayments((prev) => [newPayment, ...prev]);
    setPayingBill(null);
    triggerToast(`Paid ${bill.amount.toFixed(2)} ${bill.currency} for ${bill.name} on Stellar Testnet`);
  };

  const handleMarkPaid = (bill: BillItem) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? {
              ...b,
              status: 'paid',
              dueInLabel: 'Marked paid',
              billsStatusLabel: 'Marked paid',
            }
          : b
      )
    );
    const newPayment: PaymentHistoryItem = {
      id: `pay-${Date.now()}`,
      billId: bill.id,
      name: bill.name,
      dateLabel: 'Just now',
      amount: bill.amount,
      currency: bill.currency,
      status: 'manual',
      statusLabel: 'Marked paid',
      icon: bill.icon,
    };
    setPayments((prev) => [newPayment, ...prev]);
    triggerToast(`Marked ${bill.name} (${bill.amount.toFixed(2)} ${bill.currency}) as paid`);
  };

  const handleCompleteVerification = (billId: string) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? {
              ...b,
              status: 'paid',
              dueInLabel: 'Paid on Stellar',
              billsStatusLabel: 'Paid this month',
            }
          : b
      )
    );
    setPayments((prev) =>
      prev.map((p) =>
        p.billId === billId && p.status === 'pending'
          ? { ...p, status: 'paid', statusLabel: 'Paid on Stellar' }
          : p
      )
    );
    triggerToast('Horizon ledger verification confirmed');
  };

  const handleAddBill = (newBillData: Omit<BillItem, 'id'>) => {
    const created: BillItem = {
      ...newBillData,
      id: `bill-${Date.now()}`,
    };
    setBills((prev) => [...prev, created]);
    triggerToast(`Added ${created.name} (${created.amount.toFixed(2)} ${created.currency})`);
  };

  const handleTopUpTestnet = (curr: Currency, amount: number) => {
    setWallet((prev) => {
      const updatedAmount = prev.balances[curr] + amount;
      return {
        ...prev,
        balances: {
          ...prev.balances,
          [curr]: updatedAmount,
        },
      };
    });

    if (curr === 'XLM') {
      setBills((prev) =>
        prev.map((b) => (b.currency === 'XLM' ? { ...b, warningReason: undefined } : b))
      );
    }
    triggerToast(`Funded +${amount.toFixed(2)} Testnet ${curr} to ${wallet.addressShort}`);
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    triggerToast('Copied Stellar destination address');
  };

  const handleSelectBill = (bill: BillItem) => {
    setSelectedBillId(bill.id);
    setActiveTab('bills');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateBill = (updated: BillItem) => {
    setBills((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    triggerToast(`Updated ${updated.name}`);
  };

  const handleDeleteBill = (billId: string) => {
    const target = bills.find((b) => b.id === billId);
    setBills((prev) => prev.filter((b) => b.id !== billId));
    setSelectedBillId(null);
    if (target) {
      triggerToast(`Deleted ${target.name} from recurring bills`);
    }
  };

  const handleMarkReminderAsRead = (remId: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === remId ? { ...r, isUnread: false } : r))
    );
    triggerToast('Marked reminder as read');
  };

  const handleMarkAllRemindersAsRead = () => {
    setReminders((prev) => prev.map((r) => ({ ...r, isUnread: false })));
    setHasUnreadNotifications(false);
    triggerToast('All reminders marked as read');
  };

  const handleRetryReminder = (remId: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === remId
          ? {
              ...r,
              status: 'sent',
              statusBadge: 'Verifying',
              statusBadgeKind: 'verifying',
              errorDetail: undefined,
              actionText: 'Mark as read',
            }
          : r
      )
    );
    triggerToast('Retrying notification dispatch via Stellar network & SMTP…');
  };

  const unreadRemindersCount = reminders.filter((r) => r.isUnread).length;

  const totalBillsCount = bills.length;
  const monthlyBillsCount = bills.filter((b) => b.frequency === 'monthly').length;
  const quarterlyBillsCount = bills.filter((b) => b.frequency === 'quarterly').length;
  const next14DaysCount = bills.filter((b) => b.inNext14Days && b.status !== 'paid').length;
  const paidInOctCount = payments.filter(
    (p) => p.status === 'paid' || p.status === 'manual'
  ).length;
  const paidOnStellarCount = payments.filter((p) => p.status === 'paid').length;
  const markedPaidCount = payments.filter((p) => p.status === 'manual').length;

  const handleStatPopupAction = (kind: StatCardKind) => {
    setOpenStatPopup(null);
    if (kind === 'overdue' && firstOverdueBill) {
      setPayingBill(firstOverdueBill);
      return;
    }
    if (kind === 'paid') {
      setActiveTab('history');
      const el = document.getElementById('upcoming-payments-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (kind === 'next14') {
      setStatusFilter('next14');
      const el = document.getElementById('upcoming-payments-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    // total -> go to Bills screen
    setStatusFilter(null);
    setSelectedCategory(null);
    setActiveTab('bills');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route views: Landing, Login, Signup, or App Dashboard
  if (currentView === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setCurrentView('signup')}
        onLogin={() => setCurrentView('login')}
        onViewDemo={() => setCurrentView('app')}
        onNavigateTab={(tab) => {
          setCurrentView('app');
          setActiveTab(tab);
        }}
      />
    );
  }

  if (currentView === 'signup') {
    return (
      <SignupPage
        onSuccess={(user) => {
          setCurrentUser(user);
          setCurrentView('app');
          triggerToast(`Welcome to Billza, ${user.first_name || user.username}!`);
        }}
        onNavigateLogin={() => setCurrentView('login')}
        onNavigateLanding={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onSuccess={(user) => {
          setCurrentUser(user);
          setCurrentView('app');
          triggerToast(`Welcome back, ${user.first_name || user.username}`);
        }}
        onNavigateSignup={() => setCurrentView('signup')}
        onNavigateLanding={() => setCurrentView('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F3F5F9] text-[#0B1530] flex flex-row items-stretch">
      {/* Left AppSidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={isReminderSettingsOpen ? 'reminders' : activeTab}
        onSelectTab={(tab) => {
          setSelectedBillId(null);
          setIsReminderSettingsOpen(false);
          setActiveTab(tab);
          if (tab === 'dashboard') {
            setStatusFilter(null);
            setSelectedCategory(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        remindersCount={unreadRemindersCount}
        wallet={wallet}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
      />

      {/* Right Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top AppHeader */}
        <div className="relative">
          <Header
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenWalletModal={() => setIsWalletModalOpen(true)}
            onToggleNotifications={() => {
              setShowNotifications((prev) => !prev);
              setHasUnreadNotifications(false);
            }}
            hasUnreadNotifications={hasUnreadNotifications}
            onOpenLanding={() => setCurrentView('landing')}
            user={currentUser}
            onLogout={() => {
              clearStoredAuth();
              setCurrentUser(null);
              setCurrentView('landing');
              triggerToast('Signed out of Billza');
            }}
            wallet={wallet}
          />

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div className="absolute right-4 sm:right-[32px] top-[68px] z-40 w-[340px] max-w-[calc(100vw-32px)] bg-white border border-[#DDE2EC] rounded-[12px] shadow-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#EEF1F6]">
                <span className="font-bold text-[14px] text-[#0B1530]">
                  Reminders & Alerts (3)
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-[#4A5675] hover:text-[#0B1530]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-2.5 text-[13px]">
                <div className="p-2.5 rounded-[8px] bg-[#FFF8F7] border border-[#FDE8E6] flex flex-col gap-0.5">
                  <span className="font-bold text-[#B42318]">
                    Fibre internet is 2 days overdue
                  </span>
                  <span className="text-[12px] text-[#4A5675]">
                    25.00 USDC · Last attempt failed: wallet was short
                  </span>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#FDF1DD]/60 border border-[#B8740A]/30 flex flex-col gap-0.5">
                  <span className="font-bold text-[#94560A]">
                    Home electricity due in 3 days
                  </span>
                  <span className="text-[12px] text-[#4A5675]">
                    38.50 USDC · Due Fri 23 Oct
                  </span>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#F8F9FC] border border-[#DDE2EC] flex flex-col gap-0.5">
                  <span className="font-bold text-[#0B1530]">
                    Health insurance wallet check
                  </span>
                  <span className="text-[12px] text-[#4A5675]">
                    Wallet short by 56.30 XLM for Fri 30 Oct bill
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-8 z-50 bg-[#0B1530] text-white px-4 py-3 rounded-[10px] shadow-lg border border-white/10 flex items-center gap-2.5 text-[14px] font-bold">
            <Check size={16} className="text-[#5FD39A] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="w-full max-w-[1192px] mx-auto px-4 sm:px-6 lg:px-[32px] pt-6 sm:pt-[32px] pb-24 lg:pb-[40px] flex flex-col gap-[24px] sm:gap-[28px]">
          {selectedBill ? (
            <BillDetailScreen
              bill={selectedBill}
              onBack={() => {
                setSelectedBillId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onPayBill={(bill) => setPayingBill(bill)}
              onMarkPaid={(bill) => handleMarkPaid(bill)}
              onUpdateBill={handleUpdateBill}
              onDeleteBill={handleDeleteBill}
              onViewAllHistory={() => {
                setSelectedBillId(null);
                setActiveTab('history');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : isReminderSettingsOpen ? (
            <ReminderSettingsScreen
              bills={bills}
              onBackToReminders={() => {
                setIsReminderSettingsOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectBill={handleSelectBill}
              onTriggerToast={triggerToast}
            />
          ) : activeTab === 'settings' ? (
            <SettingsScreen
              wallet={wallet}
              currency={currency}
              onCurrencyChange={(newCurr) => {
                setCurrency(newCurr);
                triggerToast(`Currency changed to ${newCurr}`);
              }}
              onOpenReminderSettings={() => {
                setIsReminderSettingsOpen(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              onTriggerToast={triggerToast}
            />
          ) : activeTab === 'bills' ? (
            <BillsScreen
              bills={bills}
              onOpenAddBill={() => setIsAddBillOpen(true)}
              onPayBill={(bill) => setPayingBill(bill)}
              onMarkPaid={(bill) => handleMarkPaid(bill)}
              onViewStatus={(bill) => setInspectingBill(bill)}
              onCopyAddress={handleCopyAddress}
              onSelectBill={handleSelectBill}
            />
          ) : activeTab === 'reminders' ? (
            <RemindersScreen
              reminders={reminders}
              bills={bills}
              onSelectBill={handleSelectBill}
              onMarkAsRead={handleMarkReminderAsRead}
              onMarkAllAsRead={handleMarkAllRemindersAsRead}
              onRetryReminder={handleRetryReminder}
              onTriggerToast={triggerToast}
              onOpenSettings={() => {
                setIsReminderSettingsOpen(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : activeTab === 'history' ? (
            <PaymentHistoryScreen
              bills={bills}
              onSelectBill={handleSelectBill}
              onPayBill={(bill) => setPayingBill(bill)}
              onTriggerToast={triggerToast}
            />
          ) : activeTab === 'help' ? (
            <HelpScreen
              onTriggerToast={triggerToast}
              onNavigateToBills={() => {
                setActiveTab('bills');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
            />
          ) : (
            <>
              {/* Page Header */}
              <div className="flex flex-col gap-[6px] sm:gap-[8.5px]">
                <h1 className="font-extrabold text-[30px] sm:text-[40px] leading-[36px] sm:leading-[48px] tracking-[-1px] text-[#0B1530]">
                  Dashboard overview
                </h1>
                {overdueBills.length > 0 ? (
                  <p className="font-bold text-[16px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#B42318]">
                    {overdueBills.length} {overdueBills.length === 1 ? 'bill is' : 'bills are'}{' '}
                    overdue and {dueSoonBills.length} is due this week
                  </p>
                ) : (
                  <p className="font-bold text-[16px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#1B7A4B]">
                    All overdue bills cleared · {dueSoonBills.length} bill due this week
                  </p>
                )}
              </div>

              {/* Section 1: Scheduled for October Hero Card */}
              <section className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-5 sm:px-[32px] sm:pt-[29px] sm:pb-[31px] flex flex-col gap-[20px]">
                {/* Top Row: Scheduled Amount + Currency Segmented Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full">
                  <div className="flex flex-col gap-[8px]">
                    <span className="font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                      Scheduled for October
                    </span>
                    <div className="flex items-baseline gap-[6px] tabular-nums">
                      <span className="font-extrabold text-[40px] sm:text-[48px] leading-[46px] sm:leading-[52px] tracking-[-1.5px] text-[#0B1530]">
                        {octSummary.total.toFixed(2)}
                      </span>
                      <span className="font-extrabold text-[18px] sm:text-[20px] leading-[46px] sm:leading-[52px] tracking-[0.4px] text-[#0B1530]">
                        {currency}
                      </span>
                    </div>
                  </div>

                  {/* Currency Switcher */}
                  <div className="flex items-center gap-[10px] self-start">
                    <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] whitespace-nowrap">
                      Show October in
                    </span>
                    <div
                      className="inline-flex items-center p-[3px] gap-[2px] bg-[#EEF1F6] rounded-[10px] h-[40px]"
                      role="group"
                      aria-label="Select October display currency"
                    >
                      {(['USDC', 'XLM', 'EUR'] as Currency[]).map((curr) => {
                        const isActive = currency === curr;
                        return (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => {
                              setCurrency(curr);
                              setSelectedCategory(null);
                            }}
                            className={`h-[34px] px-[13px] rounded-[8px] font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap shrink-0 ${
                              isActive
                                ? 'bg-[#0B1530] text-white'
                                : 'text-[#4A5675] hover:text-[#0B1530]'
                            }`}
                          >
                            {curr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Middle Row: 3-Segment Progress Bar + Legend + Also in October */}
                <div className="flex flex-col gap-[10px] w-full">
                  <div
                    className="flex items-center gap-[3px] w-full h-[10px]"
                    role="img"
                    aria-label={`October in ${currency}: Paid ${octSummary.paid.toFixed(
                      2
                    )}, Verifying ${octSummary.verifying.toFixed(
                      2
                    )}, Still to pay ${octSummary.stillToPay.toFixed(2)}`}
                  >
                    {octSummary.paid > 0 && (
                      <div
                        style={{ width: `${Math.max(6, paidPct)}%` }}
                        className="h-[10px] bg-[#0B1530] rounded-[3px] transition-all duration-300"
                      />
                    )}
                    {octSummary.verifying > 0 && (
                      <div
                        style={{ width: `${Math.max(3, verifyingPct)}%` }}
                        className="h-[10px] bg-[#4164D9] rounded-[3px] transition-all duration-300"
                      />
                    )}
                    {octSummary.stillToPay > 0 && (
                      <div
                        style={{ width: `${Math.max(8, stillToPayPct)}%` }}
                        className="h-[10px] border border-dashed border-[#B7C2D9] rounded-[3px] flex-1 transition-all duration-300"
                      />
                    )}
                  </div>

                  {/* Legend Row */}
                  <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 w-full tabular-nums">
                    <div className="flex items-center gap-[6px]">
                      <span className="w-[10px] h-[10px] rounded-[2px] bg-[#0B1530] shrink-0" />
                      <span className="font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                        Paid {octSummary.paid.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-[6px]">
                      <span className="w-[10px] h-[10px] rounded-[2px] bg-[#4164D9] shrink-0" />
                      <span className="font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                        Verifying {octSummary.verifying.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-[6px]">
                      <span className="w-[10px] h-[10px] rounded-[2px] border border-dashed border-[#77839F] shrink-0" />
                      <span className="font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                        Still to pay {octSummary.stillToPay.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Also in October caption */}
                  <p className="font-medium text-[12px] leading-[16px] text-[#4A5675] tabular-nums">
                    {octSummary.alsoText}
                  </p>
                </div>

                {/* Bottom Row: Primary & Danger Action Buttons */}
                <div className="flex flex-wrap items-center gap-[8px] w-full pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsAddBillOpen(true)}
                    className="inline-flex items-center justify-center gap-[8px] h-[44px] px-[18px] bg-[#0B1530] hover:bg-[#1A2A55] text-white rounded-[10px] font-bold text-[16px] leading-[24px] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus size={18} strokeWidth={2.4} />
                    <span>Add new bill</span>
                  </button>

                  {firstOverdueBill && (
                    <button
                      type="button"
                      onClick={() => setPayingBill(firstOverdueBill)}
                      className="inline-flex items-center justify-center gap-[8px] h-[44px] px-[19px] bg-white hover:bg-[#FFF8F7] border border-[#D2453A] text-[#B42318] rounded-[10px] font-bold text-[16px] leading-[24px] transition-colors whitespace-nowrap shrink-0 tabular-nums"
                    >
                      <AlertTriangle size={18} strokeWidth={2.2} className="text-[#B42318]" />
                      <span>
                        Pay overdue {firstOverdueBill.amount.toFixed(2)} {firstOverdueBill.currency}
                      </span>
                    </button>
                  )}
                </div>
              </section>

              {/* Section 2: 4 Summary Stat Cards with Hover & Click StatDetail Popups */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[16px] sm:gap-[24px] w-full">
                {/* StatCard 1: Total bills (Navy with rotated 'za' badge) */}
                <div
                  onMouseEnter={() => handleStatMouseEnter('total')}
                  onMouseLeave={handleStatMouseLeave}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => handleStatToggleClick('total')}
                    className="relative h-[168px] w-full bg-[#0B1530] border border-[#0B1530] rounded-[12px] p-[24px] flex flex-col justify-between text-left overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4164D9]"
                  >
                    <div className="flex items-center justify-between w-full z-10">
                      <span className="font-semibold text-[14px] leading-[20px] text-white">
                        Total bills
                      </span>
                      <span
                        className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-colors ${
                          openStatPopup === 'total'
                            ? 'bg-[#4164D9] text-white'
                            : 'bg-white text-[#0B1530] group-hover:bg-[#4164D9] group-hover:text-white'
                        }`}
                      >
                        <ArrowUpRight size={16} strokeWidth={2.2} />
                      </span>
                    </div>

                    <div className="flex items-baseline gap-[6px] z-10 tabular-nums">
                      <span className="font-extrabold text-[48px] leading-[52px] tracking-[-1.5px] text-white">
                        {totalBillsCount}
                      </span>
                      <span className="font-extrabold text-[20px] leading-[25px] text-white">
                        bills
                      </span>
                    </div>

                    <span className="font-medium text-[12px] leading-[16px] text-[#A9B4CC] z-10 tabular-nums">
                      {monthlyBillsCount} monthly · {quarterlyBillsCount} quarterly
                    </span>

                    {/* Decorative Rotated #4164D9 'za' Block */}
                    <div
                      aria-hidden="true"
                      className="absolute left-[151px] top-[71px] w-[150px] h-[110px] bg-[#4164D9] -rotate-10 rounded-tl-[4px] flex items-start justify-start pl-[46px] pt-[18px] pointer-events-none select-none"
                    >
                      <span className="font-archivo font-extrabold text-[44px] leading-[44px] tracking-[-0.88px] text-white">
                        za
                      </span>
                    </div>
                  </button>

                  {openStatPopup === 'total' && (
                    <StatCardPopup
                      kind="total"
                      bills={bills}
                      payments={payments}
                      onClose={(e) => {
                        e.stopPropagation();
                        setOpenStatPopup(null);
                      }}
                      onActionClick={handleStatPopupAction}
                      onSelectBill={(b) => {
                        setOpenStatPopup(null);
                        handleSelectBill(b);
                      }}
                    />
                  )}
                </div>

                {/* StatCard 2: Next 14 days */}
                <div
                  onMouseEnter={() => handleStatMouseEnter('next14')}
                  onMouseLeave={handleStatMouseLeave}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => handleStatToggleClick('next14')}
                    className={`relative h-[168px] w-full bg-white border rounded-[12px] p-[24px] flex flex-col justify-between text-left transition-colors group ${
                      openStatPopup === 'next14' || statusFilter === 'next14'
                        ? 'border-[#4164D9] ring-2 ring-[#4164D9]/20'
                        : 'border-[#DDE2EC] hover:border-[#4164D9]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                        Next 14 days
                      </span>
                      <span
                        className={`w-[34px] h-[34px] rounded-full border flex items-center justify-center transition-colors ${
                          openStatPopup === 'next14'
                            ? 'bg-[#4164D9] border-[#4164D9] text-white'
                            : 'bg-white border-[#77839F] text-[#0B1530] group-hover:bg-[#4164D9] group-hover:border-[#4164D9] group-hover:text-white'
                        }`}
                      >
                        <ArrowUpRight size={16} strokeWidth={2.2} />
                      </span>
                    </div>

                    <div className="flex items-baseline gap-[6px] tabular-nums">
                      <span className="font-extrabold text-[48px] leading-[52px] tracking-[-1.5px] text-[#0B1530]">
                        {next14DaysCount}
                      </span>
                      <span className="font-extrabold text-[20px] leading-[25px] text-[#4A5675]">
                        bills
                      </span>
                    </div>

                    <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate w-full">
                      Electricity first · Fri 23 Oct
                    </span>
                  </button>

                  {openStatPopup === 'next14' && (
                    <StatCardPopup
                      kind="next14"
                      bills={bills}
                      payments={payments}
                      onClose={(e) => {
                        e.stopPropagation();
                        setOpenStatPopup(null);
                      }}
                      onActionClick={handleStatPopupAction}
                      onSelectBill={(b) => {
                        setOpenStatPopup(null);
                        handleSelectBill(b);
                      }}
                    />
                  )}
                </div>

                {/* StatCard 3: Overdue (Urgent Red Popup) */}
                <div
                  onMouseEnter={() => handleStatMouseEnter('overdue')}
                  onMouseLeave={handleStatMouseLeave}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => handleStatToggleClick('overdue')}
                    className={`relative h-[168px] w-full bg-white border rounded-[12px] p-[24px] flex flex-col justify-between text-left transition-colors group ${
                      openStatPopup === 'overdue' || statusFilter === 'overdue'
                        ? 'border-[#D2453A] ring-2 ring-[#D2453A]/20'
                        : 'border-[#DDE2EC] hover:border-[#D2453A]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-[7px]">
                        <span className="w-[8px] h-[8px] rounded-[2px] bg-[#D2453A] shrink-0" />
                        <span className="font-semibold text-[14px] leading-[20px] text-[#B42318]">
                          Overdue
                        </span>
                      </div>
                      <span
                        className={`w-[34px] h-[34px] rounded-full border flex items-center justify-center transition-colors ${
                          openStatPopup === 'overdue'
                            ? 'bg-[#B42318] border-[#B42318] text-white'
                            : 'bg-white border-[#77839F] text-[#0B1530] group-hover:bg-[#B42318] group-hover:border-[#B42318] group-hover:text-white'
                        }`}
                      >
                        <ArrowUpRight size={16} strokeWidth={2.2} />
                      </span>
                    </div>

                    <div className="flex items-baseline gap-[6px] tabular-nums">
                      <span className="font-extrabold text-[48px] leading-[52px] tracking-[-1.5px] text-[#B42318]">
                        {overdueBills.length}
                      </span>
                      <span className="font-extrabold text-[20px] leading-[25px] text-[#B42318]">
                        {overdueBills.length === 1 ? 'bill' : 'bills'}
                      </span>
                    </div>

                    <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate w-full">
                      {overdueBills.length > 0
                        ? 'Fibre internet · 2 days late'
                        : 'No overdue bills remaining'}
                    </span>
                  </button>

                  {openStatPopup === 'overdue' && (
                    <StatCardPopup
                      kind="overdue"
                      bills={bills}
                      payments={payments}
                      onClose={(e) => {
                        e.stopPropagation();
                        setOpenStatPopup(null);
                      }}
                      onActionClick={handleStatPopupAction}
                      onSelectBill={(b) => {
                        setOpenStatPopup(null);
                        handleSelectBill(b);
                      }}
                    />
                  )}
                </div>

                {/* StatCard 4: Paid in October */}
                <div
                  onMouseEnter={() => handleStatMouseEnter('paid')}
                  onMouseLeave={handleStatMouseLeave}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => handleStatToggleClick('paid')}
                    className={`relative h-[168px] w-full bg-white border rounded-[12px] p-[24px] flex flex-col justify-between text-left transition-colors group ${
                      openStatPopup === 'paid' || statusFilter === 'paid'
                        ? 'border-[#4164D9] ring-2 ring-[#4164D9]/20'
                        : 'border-[#DDE2EC] hover:border-[#4164D9]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                        Paid in October
                      </span>
                      <span
                        className={`w-[34px] h-[34px] rounded-full border flex items-center justify-center transition-colors ${
                          openStatPopup === 'paid'
                            ? 'bg-[#4164D9] border-[#4164D9] text-white'
                            : 'bg-white border-[#77839F] text-[#0B1530] group-hover:bg-[#4164D9] group-hover:border-[#4164D9] group-hover:text-white'
                        }`}
                      >
                        <ArrowUpRight size={16} strokeWidth={2.2} />
                      </span>
                    </div>

                    <div className="flex items-baseline gap-[6px] tabular-nums">
                      <span className="font-extrabold text-[48px] leading-[52px] tracking-[-1.5px] text-[#0B1530]">
                        {paidInOctCount}
                      </span>
                      <span className="font-extrabold text-[20px] leading-[25px] text-[#4A5675]">
                        paid
                      </span>
                    </div>

                    <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate w-full tabular-nums">
                      {paidOnStellarCount} on Stellar · {markedPaidCount} marked paid
                    </span>
                  </button>

                  {openStatPopup === 'paid' && (
                    <StatCardPopup
                      kind="paid"
                      alignRight
                      bills={bills}
                      payments={payments}
                      onClose={(e) => {
                        e.stopPropagation();
                        setOpenStatPopup(null);
                      }}
                      onActionClick={handleStatPopupAction}
                    />
                  )}
                </div>
              </div>

              {/* Section 3: Middle 2-Column Split (Monthly expenses 723.25px + Bill categories 380.75px) */}
              <div className="grid grid-cols-1 xl:grid-cols-[1.9fr_1fr] gap-[24px] items-stretch w-full">
                <MonthlyExpensesChart
                  currency={currency}
                  octoberPaidAmount={getOctoberSummary('USDC').paid}
                />
                <BillCategoriesCard
                  currency={currency}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => setSelectedCategory(cat)}
                  onSelectCurrency={(curr) => {
                    setCurrency(curr);
                    setSelectedCategory(null);
                  }}
                />
              </div>

              {/* Section 4: Bottom 2-Column Split (Upcoming payments 723.25px + Recent payments 380.75px) */}
              <div
                id="upcoming-payments-section"
                className="grid grid-cols-1 xl:grid-cols-[1.9fr_1fr] gap-[24px] items-stretch w-full"
              >
                <UpcomingPaymentsCard
                  bills={bills}
                  selectedCategory={selectedCategory}
                  statusFilter={statusFilter}
                  onClearFilters={() => {
                    setSelectedCategory(null);
                    setStatusFilter(null);
                  }}
                  onPayBill={(bill) => setPayingBill(bill)}
                  onMarkPaid={(bill) => handleMarkPaid(bill)}
                  onViewStatus={(bill) => setInspectingBill(bill)}
                  onViewAllBills={() => {
                    setSelectedCategory(null);
                    setStatusFilter(null);
                    setActiveTab('bills');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectBill={handleSelectBill}
                />
                <RecentPaymentsCard
                  payments={payments}
                  onInspectPayment={(payment) => setInspectingPayment(payment)}
                  onViewFullHistory={() => setActiveTab('history')}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-[60px] bg-[#0B1530] border-t border-white/10 px-2 flex items-center justify-around text-white"
      >
        <button
          type="button"
          onClick={() => {
            setSelectedBillId(null);
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-[8px] ${
            activeTab === 'dashboard' && !selectedBillId ? 'text-white font-bold' : 'text-[#A9B4CC] font-medium'
          }`}
        >
          <Home size={18} />
          <span className="text-[11px] leading-[14px]">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedBillId(null);
            setActiveTab('bills');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-[8px] ${
            activeTab === 'bills' ? 'text-white font-bold' : 'text-[#A9B4CC] font-medium'
          }`}
        >
          <Receipt size={18} />
          <span className="text-[11px] leading-[14px]">Bills</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedBillId(null);
            setIsReminderSettingsOpen(false);
            setActiveTab('reminders');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-[8px] ${
            activeTab === 'reminders' && !selectedBillId ? 'text-white font-bold' : 'text-[#A9B4CC] font-medium'
          }`}
        >
          <Bell size={18} />
          <span className="text-[11px] leading-[14px]">Reminders</span>
          {unreadRemindersCount > 0 && (
            <span className="absolute top-0.5 right-2.5 w-4 h-4 rounded-full bg-[#4164D9] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadRemindersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedBillId(null);
            setIsReminderSettingsOpen(false);
            setActiveTab('history');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-[8px] ${
            activeTab === 'history' ? 'text-white font-bold' : 'text-[#A9B4CC] font-medium'
          }`}
        >
          <History size={18} />
          <span className="text-[11px] leading-[14px]">History</span>
        </button>
      </nav>

      {/* Modals */}
      <AddBillModal
        isOpen={isAddBillOpen}
        onClose={() => setIsAddBillOpen(false)}
        onAddBill={handleAddBill}
      />

      <PayBillModal
        bill={payingBill}
        onClose={() => setPayingBill(null)}
        walletBalances={wallet.balances}
        onConfirmPayment={handleConfirmPayment}
        onTopUpTestnet={handleTopUpTestnet}
      />

      <StatusModal
        bill={inspectingBill}
        payment={inspectingPayment}
        onClose={() => {
          setInspectingBill(null);
          setInspectingPayment(null);
        }}
        onCompleteVerification={handleCompleteVerification}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallet={wallet}
        onTopUpTestnet={handleTopUpTestnet}
      />
    </div>
  );
}
