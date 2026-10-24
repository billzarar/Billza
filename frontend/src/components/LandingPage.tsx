import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  Play,
  Check,
  Clock,
  Bell,
  Calendar,
  Sparkles,
  RefreshCw,
  Wallet,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  FileCheck,
  Zap,
} from 'lucide-react';
import { BillzaLogo } from './BillIcons';
import { NavTab } from './Sidebar';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onViewDemo: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  onViewDemo,
  onNavigateTab,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Section 5 Interactive Reminder Demo State
  const [reminderDays, setReminderDays] = useState<'7' | '3' | '1' | '0'>('3');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [appAlerts, setAppAlerts] = useState(true);

  // Section 7 Interactive Recurring Schedule Demo State
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [snoozed, setSnoozed] = useState(false);
  const [paidStatus, setPaidStatus] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0B1530] font-onest selection:bg-[#4164D9] selection:text-white overflow-x-hidden">
      {/* =========================================================================
          SECTION 0: HERO (Navy Background with Multi-Radial Glows)
      ========================================================================= */}
      <section
        className="relative w-full bg-[#0B1530] text-white overflow-hidden"
        style={{
          background: `
            radial-gradient(35% 60% at 50% 30%, rgba(122, 214, 160, 0.45) 0%, rgba(43, 148, 96, 0.22) 45%, rgba(43, 148, 96, 0) 75%),
            radial-gradient(40% 50% at 0% 100%, rgba(43, 148, 96, 0.35) 0%, rgba(43, 148, 96, 0) 70%),
            radial-gradient(45% 60% at 4% 18%, rgba(65, 100, 217, 0.32) 0%, rgba(65, 100, 217, 0) 70%),
            radial-gradient(40% 50% at 100% 0%, rgba(43, 148, 96, 0.25) 0%, rgba(43, 148, 96, 0) 70%),
            linear-gradient(180deg, #0F1D40 0%, #0B1530 100%),
            #0B1530
          `,
        }}
      >
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="max-w-[1248px] h-full mx-auto border-x border-white/10 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10" />
          </div>
        </div>

        {/* --- Top Navigation Bar (Sticky with Glassmorphism) --- */}
        <div className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0B1530]/85 border-b border-white/10 shadow-lg shadow-black/20 transition-all duration-200">
          <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8">
            <header className="flex items-center justify-between h-[72px] sm:h-[84px]">
              {/* Wordmark Logo */}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center shrink-0 cursor-pointer focus:outline-none"
                aria-label="Billza Home"
              >
                <BillzaLogo variant="dark" />
              </button>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-7 lg:gap-9 text-[14px] font-medium text-[#C3CBDD]">
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  How it works
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Features
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('dashboard-preview')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('stellar-payments')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Stellar payments
                </button>
              </nav>

              {/* Desktop Actions */}
              <div className="hidden sm:flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-4 py-2 text-[14px] font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="px-4 py-2 text-[14px] font-semibold text-white bg-[#4164D9] hover:bg-[#3453c0] rounded-xl shadow-md shadow-[#4164D9]/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Get started
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/10 transition-colors cursor-pointer focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </header>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="sm:hidden py-4 px-4 mb-4 rounded-2xl bg-[#0F1D40]/95 backdrop-blur-2xl border border-white/15 space-y-2 shadow-2xl animate-fadeIn">
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="flex items-center justify-between w-full text-left py-2.5 px-3 rounded-xl text-[15px] font-medium text-[#C3CBDD] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <span>How it works</span>
                  <ChevronRight size={16} className="text-white/40" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="flex items-center justify-between w-full text-left py-2.5 px-3 rounded-xl text-[15px] font-medium text-[#C3CBDD] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <span>Features</span>
                  <ChevronRight size={16} className="text-white/40" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('dashboard-preview')}
                  className="flex items-center justify-between w-full text-left py-2.5 px-3 rounded-xl text-[15px] font-medium text-[#C3CBDD] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <span>Dashboard</span>
                  <ChevronRight size={16} className="text-white/40" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('stellar-payments')}
                  className="flex items-center justify-between w-full text-left py-2.5 px-3 rounded-xl text-[15px] font-medium text-[#C3CBDD] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <span>Stellar payments</span>
                  <ChevronRight size={16} className="text-white/40" />
                </button>
                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogin();
                    }}
                    className="w-full py-2.5 text-center text-[14px] font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl border border-white/15 transition-all cursor-pointer"
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onGetStarted();
                    }}
                    className="w-full py-2.5 text-center text-[14px] font-semibold text-white bg-[#4164D9] hover:bg-[#3453c0] rounded-xl shadow-md shadow-[#4164D9]/25 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Get started
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Hero Content Split (Desktop 3-Column / Mobile Stacked) --- */}
        <div className="relative z-10 max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
            {/* Left Column: Headline & Floating Bill Slip */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-8 lg:gap-12">
              <h1 className="text-[42px] sm:text-[54px] lg:text-[70px] leading-[1.06] font-medium tracking-[-2px] lg:tracking-[-2.6px] text-white">
                Stay ahead <br className="hidden sm:inline" />
                of every bill.
              </h1>

              {/* Bill Slip Visual Container with 4 Corner Accent Brackets */}
              <div className="relative w-[210px] h-[210px] sm:w-[220px] sm:h-[220px] border border-white/40 p-4">
                {/* 4 Corner Crosshair Squares */}
                <div className="absolute -top-[4px] -left-[4px] w-[8px] h-[8px] bg-white" />
                <div className="absolute -top-[4px] -right-[4px] w-[8px] h-[8px] bg-white" />
                <div className="absolute -bottom-[4px] -left-[4px] w-[8px] h-[8px] bg-white" />
                <div className="absolute -bottom-[4px] -right-[4px] w-[8px] h-[8px] bg-white" />

                {/* Ambient glow behind slip */}
                <div className="absolute w-[160px] h-[100px] left-[15px] top-[24px] bg-[#5FD39A] opacity-25 blur-md rounded-[10px] -rotate-18" />

                {/* Floating Tilted Bill Slip */}
                <div className="absolute w-[162px] h-[100px] left-[20px] top-[40px] bg-white rounded-[10px] shadow-2xl -rotate-12 p-3 text-[#0B1530] flex flex-col justify-between border border-[#EEF1F6]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-[12px] leading-tight text-[#0B1530]">Internet</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#E3F4EA] border border-[#2B9460] rounded-[4px] font-bold text-[8.5px] leading-none text-[#1B7A4B]">
                        Paid
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[14px] leading-tight text-[#0B1530] tabular-nums">38.50</p>
                      <p className="font-bold text-[8.5px] text-[#4A5675]">USDC</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-dashed border-[#DDE2EC] flex items-center justify-between text-[9px] text-[#4A5675]">
                    <span>Monthly</span>
                    <span className="font-mono text-[8px] text-[#2B9460]">Stellar ✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: 3D Tilted Mobile Mockup */}
            <div className="lg:col-span-5 flex justify-center py-4 lg:py-0">
              <div className="relative w-[280px] sm:w-[310px] h-[580px] sm:h-[620px] bg-[#0A0F1E] border-[2px] border-[#8A93AB] rounded-[44px] shadow-[0px_45px_90px_rgba(0,0,0,0.6),10px_10px_0px_-3px_#2A3552] p-2.5 -rotate-6 lg:-rotate-9 hover:rotate-0 transition-transform duration-500 ease-out">
                {/* Phone Notch/Speaker */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#0A0F1E] rounded-full z-30" />

                {/* Screen Content Wrapper */}
                <div className="w-full h-full bg-[#F3F5F9] rounded-[34px] overflow-hidden flex flex-col text-[#0B1530] text-xs">
                  {/* Micro App Header */}
                  <div className="bg-white px-3.5 pt-6 pb-2.5 border-b border-[#EEF1F6] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BillzaLogo collapsed />
                      <span className="font-extrabold text-[13px] text-[#0B1530]">Billza</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#EEF1F6] border border-[#77839F]/30 text-[9px] font-bold text-[#4A5675]">
                      Stellar
                    </span>
                  </div>

                  {/* Micro App Body */}
                  <div className="p-3 space-y-2.5 overflow-hidden flex-1">
                    <div>
                      <p className="font-extrabold text-[13px] text-[#0B1530]">Dashboard</p>
                      <p className="text-[10px] text-[#4A5675]">1 bill overdue · 2 due soon</p>
                    </div>

                    {/* Micro Expense Card */}
                    <div className="bg-white p-2.5 rounded-[10px] border border-[#EEF1F6] shadow-xs space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#4A5675] font-medium">Scheduled for October</span>
                        <span className="px-1.5 py-0.5 bg-[#E6ECFB] text-[#2F4FBF] rounded font-bold text-[9px]">+8.4%</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[17px] font-extrabold text-[#0B1530] tabular-nums">561.50</span>
                        <span className="text-[9px] font-bold text-[#4A5675]">USDC</span>
                      </div>
                      {/* Micro Mini Bar Chart */}
                      <div className="flex items-end justify-between gap-1 h-9 pt-1">
                        <div className="w-3 bg-[#EEF1F6] rounded-t h-[40%]" />
                        <div className="w-3 bg-[#EEF1F6] rounded-t h-[55%]" />
                        <div className="w-3 bg-[#EEF1F6] rounded-t h-[45%]" />
                        <div className="w-3 bg-[#EEF1F6] rounded-t h-[70%]" />
                        <div className="w-3 bg-[#4164D9] rounded-t h-[95%]" />
                        <div className="w-3 bg-[#2B9460] rounded-t h-[80%]" />
                      </div>
                    </div>

                    {/* Micro Bill Item 1 (Overdue) */}
                    <div className="bg-white p-2.5 rounded-[10px] border border-[#EEF1F6] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#FDE8E6] flex items-center justify-center text-[#B42318]">
                          <Zap size={12} />
                        </div>
                        <div>
                          <p className="font-bold text-[10px] text-[#0B1530]">Fibre internet</p>
                          <span className="text-[8px] font-bold text-[#B42318] bg-[#FDE8E6] px-1 py-0.2 rounded">
                            2 days overdue
                          </span>
                        </div>
                      </div>
                      <span className="font-extrabold text-[11px] text-[#0B1530] tabular-nums">25.00 USDC</span>
                    </div>

                    {/* Micro Bill Item 2 (Due Soon) */}
                    <div className="bg-white p-2.5 rounded-[10px] border border-[#EEF1F6] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#E6ECFB] flex items-center justify-center text-[#2F4FBF]">
                          <Clock size={12} />
                        </div>
                        <div>
                          <p className="font-bold text-[10px] text-[#0B1530]">Gym membership</p>
                          <span className="text-[8px] font-medium text-[#4A5675]">Due in 3 days</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-[11px] text-[#0B1530] tabular-nums">45.00 EUR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Key Stats & Value Proposition CTAs */}
            <div className="lg:col-span-3 flex flex-col justify-between gap-8 lg:items-end text-left lg:text-right">
              {/* Stat Cards Row */}
              <div className="flex flex-row lg:flex-col gap-4">
                {/* Stat 1: Settlement Speed */}
                <div className="relative border border-white/40 p-4 bg-white/5 backdrop-blur-xs rounded-[2px] flex items-center gap-3">
                  <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white" />
                  <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white" />
                  <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white" />
                  <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white" />
                  <div>
                    <p className="text-[32px] sm:text-[36px] font-normal leading-none text-[#5FD39A] tracking-[-1px] tabular-nums">
                      ≈5s
                    </p>
                    <p className="text-[13px] font-medium text-[#C3CBDD] mt-1">to settle</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                    <Clock size={14} />
                  </div>
                </div>

                {/* Stat 2: Fee */}
                <div className="relative border border-white/40 p-4 bg-white/5 backdrop-blur-xs rounded-[2px] flex items-center gap-3">
                  <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] bg-white" />
                  <div className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] bg-white" />
                  <div className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] bg-white" />
                  <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-white" />
                  <div>
                    <p className="text-[13px] font-medium text-[#C3CBDD]">Fee</p>
                    <p className="text-[32px] sm:text-[36px] font-normal leading-none text-[#5FD39A] tracking-[-1px] tabular-nums mt-1">
                      &lt;1¢
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                    <Zap size={14} />
                  </div>
                </div>
              </div>

              {/* Subhead Prose */}
              <div className="max-w-[320px] space-y-5">
                <p className="text-[16px] leading-[24px] text-[#C3CBDD] font-normal">
                  From rent to your phone plan, Billza reminds you on time and lets you pay on Stellar with your own wallet.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-wrap lg:justify-end items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="px-5 py-3 rounded-[10px] bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-[14px] flex items-center gap-2 transition-all cursor-pointer"
                  >
                    Get started
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={onViewDemo}
                    className="px-4 py-3 rounded-[10px] text-white hover:text-[#5FD39A] font-semibold text-[14px] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Play size={16} fill="currentColor" />
                    View demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: TRUST & WALLET CHIPS
      ========================================================================= */}
      <section className="py-20 lg:py-24 bg-white border-b border-[#EEF1F6]">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="max-w-[840px] mx-auto space-y-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E3F4EA] text-[#2B9460]">
              <Shield size={24} strokeWidth={2.2} />
            </div>
            <h2 className="text-[28px] sm:text-[34px] leading-[1.25] font-medium tracking-[-0.8px] text-[#0B1530]">
              Billza never holds your money. Every payment goes from your wallet straight to the bill’s Stellar address.
            </h2>
            <p className="text-[14px] sm:text-[15px] font-medium text-[#5F6A86]">
              Works with the Stellar wallets you already use
            </p>
          </div>

          {/* Wallet Chips Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
            {[
              { name: 'Freighter', color: '#1B254B', letter: 'F' },
              { name: 'xBull', color: '#B42318', letter: 'X' },
              { name: 'LOBSTR', color: '#0052FF', letter: 'L' },
              { name: 'Hana', color: '#0B1530', letter: 'H' },
              { name: 'WalletConnect', color: '#3B99FC', letter: 'W' },
            ].map((wallet) => (
              <div
                key={wallet.name}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-[12px] bg-[#F8F9FC] border border-[#EEF1F6] hover:border-[#4164D9] hover:shadow-xs transition-all cursor-default select-none"
              >
                <div
                  className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white font-extrabold text-[12px]"
                  style={{ backgroundColor: wallet.color }}
                >
                  {wallet.letter}
                </div>
                <span className="font-semibold text-[15px] text-[#4A5675]">{wallet.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: "A CALMER WAY TO PAY YOUR BILLS" (3 CARDS)
      ========================================================================= */}
      <section id="features" className="py-20 lg:py-28 bg-[#F3F5F9]">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
            <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.1] font-medium tracking-[-1.5px] text-[#0B1530] max-w-[620px]">
              A calmer way to <br className="hidden sm:inline" />
              pay your bills
            </h2>
            <p className="text-[16px] leading-[24px] text-[#4A5675] max-w-[340px] md:text-right">
              Track what’s due, hear about it in time, and settle directly on the Stellar ledger.
            </p>
          </div>

          {/* 3 Large Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1: Pay on Stellar (Dark Navy Card) */}
            <div className="relative bg-[#0B1530] text-white rounded-[20px] p-8 flex flex-col justify-between h-[440px] sm:h-[460px] overflow-hidden shadow-sm">
              <div className="space-y-2 z-10">
                <h3 className="text-[22px] font-semibold text-white tracking-[-0.3px]">Pay on Stellar</h3>
                <p className="text-[15px] leading-[22px] text-[#A9B4CC]">
                  USDC or XLM, signed in your own wallet and verified on the ledger.
                </p>
              </div>

              {/* Wireframe Sphere Visual */}
              <div className="relative h-[220px] flex items-center justify-center">
                <div
                  className="w-[260px] h-[260px] rounded-full border border-white/10 flex items-center justify-center relative shadow-[inset_2px_2px_0px_rgba(255,255,255,0.12)]"
                  style={{
                    background: 'radial-gradient(93.51% 93.51% at 62% 30%, #4A5675 0%, #1A2A55 45%, #0B1530 75%)',
                  }}
                >
                  {/* Subtle Grid Rings */}
                  <div className="w-[200px] h-[200px] rounded-full border border-white/5" />
                  <div className="w-[140px] h-[140px] rounded-full border border-white/5" />
                  {/* Glowing Center Badge */}
                  <div className="absolute w-14 h-14 rounded-full bg-[#4164D9] flex items-center justify-center text-white font-extrabold text-[14px] shadow-[0px_0px_30px_#4164D9]">
                    USDC
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Reminders, on time (Emerald Gradient Card) */}
            <div
              className="relative rounded-[20px] p-8 flex flex-col justify-between h-[440px] sm:h-[460px] overflow-hidden text-[#0B1530] shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #7AD6A0 0%, #5FD39A 50%, #2B9460 100%)',
              }}
            >
              <div className="space-y-2 z-10">
                <h3 className="text-[22px] font-semibold text-[#0B1530] tracking-[-0.3px]">Reminders, on time</h3>
                <p className="text-[15px] leading-[22px] text-[#0B1530]/80">
                  Choose when you hear about a bill. Overdue bills follow up until paid.
                </p>
              </div>

              {/* 4 Floating Tag Chips in Grid */}
              <div className="grid grid-cols-2 gap-3 z-10">
                <div className="bg-white/90 backdrop-blur-xs p-4 rounded-[12px] flex flex-col items-center justify-center text-center gap-1.5 shadow-xs">
                  <Clock size={18} className="text-[#0B1530]" />
                  <span className="font-semibold text-[13px] text-[#0B1530]">3 days before</span>
                </div>
                <div className="bg-white/90 backdrop-blur-xs p-4 rounded-[12px] flex flex-col items-center justify-center text-center gap-1.5 shadow-xs">
                  <Bell size={18} className="text-[#0B1530]" />
                  <span className="font-semibold text-[13px] text-[#0B1530]">By email</span>
                </div>
                <div className="bg-white/90 backdrop-blur-xs p-4 rounded-[12px] flex flex-col items-center justify-center text-center gap-1.5 shadow-xs">
                  <Sparkles size={18} className="text-[#0B1530]" />
                  <span className="font-semibold text-[13px] text-[#0B1530]">In the app</span>
                </div>
                <div className="bg-white/90 backdrop-blur-xs p-4 rounded-[12px] flex flex-col items-center justify-center text-center gap-1.5 shadow-xs">
                  <Calendar size={18} className="text-[#0B1530]" />
                  <span className="font-semibold text-[13px] text-[#0B1530]">On the due date</span>
                </div>
              </div>
            </div>

            {/* Card 3: Repeats on its own (Crisp White Card) */}
            <div className="relative bg-white border border-[#DDE2EC] rounded-[20px] p-8 flex flex-col justify-between h-[440px] sm:h-[460px] overflow-hidden shadow-sm">
              <div className="space-y-2 z-10">
                <h3 className="text-[22px] font-semibold text-[#0B1530] tracking-[-0.3px]">Repeats on its own</h3>
                <p className="text-[15px] leading-[22px] text-[#4A5675]">
                  Weekly to yearly. Snooze one, mark one paid, or let Stellar recurring payments roll.
                </p>
              </div>

              {/* Layered Bill Cards Visual */}
              <div className="space-y-2.5 z-10">
                <div className="bg-[#F8F9FC] border border-[#EEF1F6] p-3 rounded-[10px] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2B9460]" />
                    <span className="font-bold text-[12px] text-[#0B1530]">Fibre internet</span>
                  </div>
                  <span className="font-extrabold text-[12px] text-[#0B1530] tabular-nums">25.00 USDC</span>
                </div>

                <div className="bg-white border border-[#4164D9] p-3 rounded-[10px] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4164D9]" />
                    <span className="font-bold text-[12px] text-[#0B1530]">Gym membership</span>
                  </div>
                  <span className="font-extrabold text-[12px] text-[#4164D9] tabular-nums">45.00 EUR</span>
                </div>

                <div className="bg-[#F8F9FC] border border-[#EEF1F6] p-3 rounded-[10px] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#94560A]" />
                    <span className="font-bold text-[12px] text-[#0B1530]">Cloud hosting</span>
                  </div>
                  <span className="font-extrabold text-[12px] text-[#0B1530] tabular-nums">18.00 XLM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: "EVERYTHING DUE, ON ONE SCREEN" (DASHBOARD PREVIEW)
      ========================================================================= */}
      <section id="dashboard-preview" className="py-20 lg:py-28 bg-[#0B1530] text-white overflow-hidden">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="max-w-[700px] space-y-4">
            <h2 className="text-[34px] sm:text-[46px] lg:text-[54px] font-medium leading-[1.1] tracking-[-1.5px] text-white">
              Everything due, <br />
              on one screen.
            </h2>
            <p className="text-[16px] sm:text-[17px] leading-[26px] text-[#C3CBDD]">
              What’s overdue, what’s next and what’s paid this month. Totals stay split by currency so there are no surprises.
            </p>
          </div>

          {/* Desktop App Window Mockup */}
          <div className="relative rounded-[16px] border border-white/15 bg-[#F3F5F9] shadow-[0px_35px_80px_rgba(0,0,0,0.5)] overflow-hidden text-[#0B1530]">
            {/* Top Browser / Window Header */}
            <div className="bg-white px-5 py-3.5 border-b border-[#DDE2EC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FDE8E6] border border-[#D2453A]" />
                <div className="w-3 h-3 rounded-full bg-[#FEF3EB] border border-[#94560A]" />
                <div className="w-3 h-3 rounded-full bg-[#E3F4EA] border border-[#2B9460]" />
                <span className="ml-3 text-[12px] font-bold text-[#4A5675]">app.billza.io/dashboard</span>
              </div>
              <button
                type="button"
                onClick={onViewDemo}
                className="px-3 py-1 bg-[#4164D9] text-white rounded-[6px] text-[12px] font-bold hover:bg-[#3453c0] transition-colors flex items-center gap-1.5"
              >
                Launch interactive demo
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Mock Dashboard Layout */}
            <div className="p-4 sm:p-8 space-y-6">
              {/* Stat Overview Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[12px] border border-[#EEF1F6] shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-[13px] text-[#4A5675] font-semibold">
                    <span>Scheduled for October</span>
                    <span className="text-[#2F4FBF] bg-[#E6ECFB] px-2 py-0.5 rounded text-[11px] font-bold">Active</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-extrabold text-[#0B1530] tabular-nums">561.50</span>
                    <span className="text-[13px] font-bold text-[#4A5675]">USDC</span>
                  </div>
                  <p className="text-[11px] text-[#4A5675]">1 bill overdue · 2 due soon</p>
                </div>

                <div className="bg-white p-5 rounded-[12px] border border-[#EEF1F6] shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-[13px] text-[#4A5675] font-semibold">
                    <span>XLM Scheduled</span>
                    <span className="text-[#2B9460] bg-[#E3F4EA] px-2 py-0.5 rounded text-[11px] font-bold">Stellar</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-extrabold text-[#0B1530] tabular-nums">140.00</span>
                    <span className="text-[13px] font-bold text-[#4A5675]">XLM</span>
                  </div>
                  <p className="text-[11px] text-[#4A5675]">Next due Oct 30</p>
                </div>

                <div className="bg-white p-5 rounded-[12px] border border-[#EEF1F6] shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-[13px] text-[#4A5675] font-semibold">
                    <span>EUR Scheduled</span>
                    <span className="text-[#4A5675] bg-[#EEF1F6] px-2 py-0.5 rounded text-[11px] font-bold">Manual</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-extrabold text-[#0B1530] tabular-nums">45.00</span>
                    <span className="text-[13px] font-bold text-[#4A5675]">EUR</span>
                  </div>
                  <p className="text-[11px] text-[#4A5675]">Gym recurring membership</p>
                </div>
              </div>

              {/* Sample Upcoming Payments Table */}
              <div className="bg-white rounded-[12px] border border-[#EEF1F6] shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EEF1F6] flex justify-between items-center">
                  <h4 className="font-extrabold text-[15px] text-[#0B1530]">Upcoming payments</h4>
                  <span className="text-[12px] font-semibold text-[#4164D9]">October schedule</span>
                </div>
                <div className="divide-y divide-[#EEF1F6]">
                  {[
                    { name: 'Fibre internet', status: '2 days overdue', tagColor: 'bg-[#FDE8E6] text-[#B42318]', amount: '25.00 USDC', date: 'Oct 18' },
                    { name: 'Gym membership', status: 'Due in 3 days', tagColor: 'bg-[#FEF3EB] text-[#94560A]', amount: '45.00 EUR', date: 'Oct 23' },
                    { name: 'Cloud hosting', status: 'Due in 10 days', tagColor: 'bg-[#EEF1F6] text-[#4A5675]', amount: '140.00 XLM', date: 'Oct 30' },
                  ].map((row) => (
                    <div key={row.name} className="px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[14px] text-[#0B1530]">{row.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.tagColor}`}>{row.status}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-[#4A5675]">{row.date}</span>
                        <span className="font-extrabold text-[14px] text-[#0B1530] tabular-nums">{row.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gradient Overlay Fadeout at Bottom */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0B1530] to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: "HOW BILLZA WORKS" (4 STEPS)
      ========================================================================= */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-[#FFFFFF] border-b border-[#EEF1F6]">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="max-w-[680px] space-y-3">
            <h2 className="text-[34px] sm:text-[44px] font-medium tracking-[-1.2px] text-[#0B1530]">
              How Billza works
            </h2>
            <p className="text-[16px] leading-[24px] text-[#4A5675]">
              Four steps from an upcoming due date to a verified payment on the Stellar ledger.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Add a bill',
                desc: 'Give it a name, the amount, the currency and the Stellar address if you’re paying on-chain.',
                icon: <FileCheck size={20} className="text-[#2F4FBF]" />,
              },
              {
                step: '02',
                title: 'Set how it repeats',
                desc: 'Weekly, monthly, quarterly or yearly. Keep it open-ended or set an end date.',
                icon: <RefreshCw size={20} className="text-[#2F4FBF]" />,
              },
              {
                step: '03',
                title: 'Get a reminder',
                desc: 'By email and in the app, 7, 3 or 1 day before, or on the day it’s due.',
                icon: <Bell size={20} className="text-[#2F4FBF]" />,
              },
              {
                step: '04',
                title: 'Pay your way',
                desc: 'Pay in USDC or XLM from your own Stellar wallet, or mark it paid if you handled it yourself.',
                icon: <Wallet size={20} className="text-[#2F4FBF]" />,
              },
            ].map((card) => (
              <div
                key={card.step}
                className="bg-[#F3F5F9] border border-[#EEF1F6] rounded-[20px] p-6 sm:p-7 flex flex-col justify-between h-[280px] sm:h-[300px] hover:border-[#4164D9] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-[10px] bg-white border border-[#DDE2EC] flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className="font-extrabold text-[14px] text-[#2F4FBF] tracking-wider">{card.step}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-[18px] text-[#0B1530]">{card.title}</h3>
                  <p className="text-[14px] leading-[21px] text-[#4A5675]">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: "AUTOMATED REMINDERS"
      ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#F3F5F9]">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Description & Bullet Features */}
            <div className="space-y-6">
              <span className="text-[13px] font-bold text-[#94560A] uppercase tracking-wider">
                Automated reminders
              </span>
              <h2 className="text-[34px] sm:text-[46px] leading-[1.15] font-medium tracking-[-1.5px] text-[#0B1530]">
                Hear about a bill before it’s due.
              </h2>
              <p className="text-[16px] sm:text-[17px] leading-[26px] text-[#4A5675]">
                Billza watches every due date so you don’t have to keep a spreadsheet in your head.
              </p>

              <div className="space-y-3.5 pt-2">
                {[
                  '7, 3 or 1 day before, or on the due date',
                  'Email alerts and in-app notification toasts',
                  'Overdue follow-ups ensure nothing falls through the cracks',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#E3F4EA] flex items-center justify-center text-[#1B7A4B] shrink-0">
                      <Check size={13} strokeWidth={2.5} />
                    </div>
                    <span className="text-[15px] font-medium text-[#0B1530]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive Reminder Preference Demo Card */}
            <div className="bg-white border border-[#DDE2EC] rounded-[24px] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F6]">
                <div>
                  <h3 className="font-extrabold text-[16px] text-[#0B1530]">Reminder preferences</h3>
                  <p className="text-[12px] text-[#4A5675]">Simulate how Billza alerts you</p>
                </div>
                <span className="px-2.5 py-1 bg-[#E3F4EA] text-[#1B7A4B] rounded-[6px] font-bold text-[11px]">
                  Active demo
                </span>
              </div>

              {/* Day Selector Buttons */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#4A5675]">When would you like to hear?</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '7', label: '7 days' },
                    { id: '3', label: '3 days' },
                    { id: '1', label: '1 day' },
                    { id: '0', label: 'On day' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setReminderDays(chip.id as any)}
                      className={`py-2 text-[12px] font-bold rounded-[8px] border transition-all cursor-pointer ${
                        reminderDays === chip.id
                          ? 'bg-[#4164D9] text-white border-[#4164D9] shadow-xs'
                          : 'bg-[#F8F9FC] text-[#4A5675] border-[#DDE2EC] hover:bg-white'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`p-3 rounded-[10px] border flex items-center justify-between transition-colors cursor-pointer ${
                    emailAlerts ? 'bg-[#E3F4EA]/40 border-[#2B9460]' : 'bg-[#F8F9FC] border-[#DDE2EC]'
                  }`}
                >
                  <span className="text-[13px] font-bold text-[#0B1530]">Email alerts</span>
                  <span className={`text-[12px] font-bold ${emailAlerts ? 'text-[#1B7A4B]' : 'text-[#77839F]'}`}>
                    {emailAlerts ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppAlerts(!appAlerts)}
                  className={`p-3 rounded-[10px] border flex items-center justify-between transition-colors cursor-pointer ${
                    appAlerts ? 'bg-[#E3F4EA]/40 border-[#2B9460]' : 'bg-[#F8F9FC] border-[#DDE2EC]'
                  }`}
                >
                  <span className="text-[13px] font-bold text-[#0B1530]">App toasts</span>
                  <span className={`text-[12px] font-bold ${appAlerts ? 'text-[#1B7A4B]' : 'text-[#77839F]'}`}>
                    {appAlerts ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Simulated Toast Preview */}
              <div className="bg-[#0B1530] text-white p-4 rounded-[12px] space-y-1.5 shadow-md">
                <div className="flex items-center justify-between text-[11px] text-[#A9B4CC]">
                  <span className="flex items-center gap-1.5">
                    <Bell size={12} className="text-[#5FD39A]" />
                    Billza notification
                  </span>
                  <span>Just now</span>
                </div>
                <p className="font-bold text-[14px] text-white">
                  Internet is due in {reminderDays === '0' ? 'today' : `${reminderDays} days`} · 38.50 USDC
                </p>
                <p className="text-[12px] text-[#C3CBDD]">
                  Ready to pay on Stellar from your Freighter wallet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: "STELLAR PAYMENTS" (NON-CUSTODIAL & VERIFIED ON LEDGER)
      ========================================================================= */}
      <section id="stellar-payments" className="py-20 lg:py-28 bg-white border-b border-[#EEF1F6]">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Transaction Timeline Card */}
            <div className="bg-[#F8F9FC] border border-[#DDE2EC] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F6]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#4164D9] flex items-center justify-center text-white font-extrabold text-[12px]">
                    $
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[15px] text-[#0B1530]">Internet payment</h4>
                    <p className="text-[12px] text-[#4A5675]">38.50 USDC</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#E3F4EA] border border-[#2B9460] text-[10px] font-bold text-[#1B7A4B]">
                  Confirmed
                </span>
              </div>

              {/* 3 Step Timeline */}
              <div className="space-y-4 relative pl-8">
                {/* Vertical Line */}
                <div className="absolute left-3 top-3 bottom-3 w-[2px] bg-[#2B9460]" />

                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-[#1B7A4B] text-white flex items-center justify-center text-[11px]">
                    ✓
                  </div>
                  <p className="font-bold text-[14px] text-[#0B1530]">Approved in Freighter</p>
                  <p className="text-[12px] text-[#4A5675]">You checked the amount and signed in wallet</p>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-[#1B7A4B] text-white flex items-center justify-center text-[11px]">
                    ✓
                  </div>
                  <p className="font-bold text-[14px] text-[#0B1530]">Sent on Stellar</p>
                  <p className="text-[12px] text-[#4A5675] font-mono-redhat">To GBZX…Q4PA · fee 0.00001 XLM</p>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-[#1B7A4B] text-white flex items-center justify-center text-[11px]">
                    ✓
                  </div>
                  <p className="font-bold text-[14px] text-[#0B1530]">Verified and saved</p>
                  <p className="text-[12px] text-[#4A5675] font-mono-redhat">tx 7c1e…3a90</p>
                </div>
              </div>
            </div>

            {/* Right Column: Benefit Details */}
            <div className="space-y-6">
              <span className="text-[13px] font-bold text-[#1B7A4B] uppercase tracking-wider">
                Stellar payments
              </span>
              <h2 className="text-[34px] sm:text-[46px] leading-[1.15] font-medium tracking-[-1.5px] text-[#0B1530]">
                Pay from your own wallet. We never touch your secret key.
              </h2>
              <p className="text-[16px] sm:text-[17px] leading-[26px] text-[#4A5675]">
                Billza prepares the payment. You check it and sign. Everything is non-custodial and cryptographically verified.
              </p>

              <div className="divide-y divide-[#DDE2EC] pt-2">
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                  <span className="font-bold text-[15px] text-[#0B1530] w-36 shrink-0">Approve</span>
                  <span className="text-[14px] text-[#4A5675]">Nothing moves until you sign in your wallet.</span>
                </div>
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                  <span className="font-bold text-[15px] text-[#0B1530] w-36 shrink-0">Low network fee</span>
                  <span className="text-[14px] text-[#4A5675]">Transactions settle in ~5 seconds for less than 0.00001 XLM.</span>
                </div>
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                  <span className="font-bold text-[15px] text-[#0B1530] w-36 shrink-0">Cryptographic receipt</span>
                  <span className="text-[14px] text-[#4A5675]">Immutable on-chain proof recorded for accounting and tax export.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: "RECURRING BILLS" (SCHEDULE & SNOOZE)
      ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#F3F5F9]">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Description & Feature Grid */}
            <div className="space-y-6">
              <span className="text-[13px] font-bold text-[#4164D9] uppercase tracking-wider">
                Flexible recurring rules
              </span>
              <h2 className="text-[34px] sm:text-[46px] leading-[1.15] font-medium tracking-[-1.5px] text-[#0B1530]">
                Set it up once. It repeats on its own.
              </h2>
              <p className="text-[16px] sm:text-[17px] leading-[26px] text-[#4A5675]">
                Whether it repeats every Monday or once a year, Billza keeps your recurring schedule on autopilot.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5 border-t border-[#DDE2EC] pt-4">
                  <h4 className="font-bold text-[16px] text-[#0B1530]">Any schedule</h4>
                  <p className="text-[14px] text-[#4A5675]">Weekly, monthly, quarterly or yearly.</p>
                </div>
                <div className="space-y-1.5 border-t border-[#DDE2EC] pt-4">
                  <h4 className="font-bold text-[16px] text-[#0B1530]">Snooze anytime</h4>
                  <p className="text-[14px] text-[#4A5675]">Push a due date back when you need more room.</p>
                </div>
                <div className="space-y-1.5 border-t border-[#DDE2EC] pt-4">
                  <h4 className="font-bold text-[16px] text-[#0B1530]">Skip when needed</h4>
                  <p className="text-[14px] text-[#4A5675]">Skip a payment without breaking the recurring loop.</p>
                </div>
                <div className="space-y-1.5 border-t border-[#DDE2EC] pt-4">
                  <h4 className="font-bold text-[16px] text-[#0B1530]">Full payment history</h4>
                  <p className="text-[14px] text-[#4A5675]">Every payment logged with tx hash receipts.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Recurring Rule Box */}
            <div className="bg-white border border-[#DDE2EC] rounded-[24px] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF1F6]">
                <h3 className="font-extrabold text-[18px] text-[#0B1530]">Rent</h3>
                <span className="font-extrabold text-[15px] text-[#0B1530] tabular-nums">450.00 USDC</span>
              </div>

              {/* Repeats Segmented Control */}
              <div className="space-y-2">
                <span className="text-[13px] font-bold text-[#4A5675]">Repeats</span>
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#EEF1F6] rounded-[12px]">
                  {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setRecurringFrequency(freq)}
                      className={`py-2 text-[12px] font-bold capitalize rounded-[9px] transition-all cursor-pointer ${
                        recurringFrequency === freq
                          ? 'bg-white text-[#0B1530] shadow-xs'
                          : 'text-[#4A5675] hover:text-[#0B1530]'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Dates Projection */}
              <div className="space-y-2">
                <span className="text-[13px] font-bold text-[#4A5675]">Upcoming schedule dates</span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-[10px] border border-[#4164D9] bg-[#E6ECFB]/50 space-y-1">
                    <p className="text-[10px] font-semibold text-[#4A5675]">Next</p>
                    <p className="font-bold text-[14px] text-[#0B1530]">
                      {snoozed ? 'Nov 4' : 'Nov 1'}
                    </p>
                  </div>
                  <div className="p-3 rounded-[10px] border border-dashed border-[#B7C2D9] bg-[#F8F9FC] space-y-1">
                    <p className="text-[10px] font-semibold text-[#4A5675]">Then</p>
                    <p className="font-bold text-[14px] text-[#0B1530]">Dec 1</p>
                  </div>
                  <div className="p-3 rounded-[10px] border border-dashed border-[#B7C2D9] bg-[#F8F9FC] opacity-60 space-y-1">
                    <p className="text-[10px] font-semibold text-[#4A5675]">Then</p>
                    <p className="font-bold text-[14px] text-[#0B1530]">Jan 1</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSnoozed(!snoozed)}
                  className="flex-1 py-2.5 px-4 rounded-[10px] border border-[#77839F] text-[#0B1530] font-semibold text-[13px] hover:bg-[#F3F5F9] transition-colors cursor-pointer"
                >
                  {snoozed ? 'Undo Snooze' : 'Snooze 3 days'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaidStatus(!paidStatus)}
                  className={`flex-1 py-2.5 px-4 rounded-[10px] font-semibold text-[13px] transition-colors cursor-pointer ${
                    paidStatus
                      ? 'bg-[#1B7A4B] text-white'
                      : 'bg-[#0B1530] text-white hover:bg-[#1A2A55]'
                  }`}
                >
                  {paidStatus ? 'Marked as Paid ✓' : 'Mark as paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: BOTTOM CTA BANNER
      ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-[24px] p-8 sm:p-14 lg:p-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 text-white relative overflow-hidden shadow-xl"
            style={{
              background: `
                radial-gradient(40% 112.5% at 100% 0%, rgba(122, 214, 160, 0.45) 0%, rgba(43, 148, 96, 0) 70%),
                radial-gradient(35% 100% at 0% 100%, rgba(65, 100, 217, 0.3) 0%, rgba(65, 100, 217, 0) 70%),
                #0B1530
              `,
            }}
          >
            <div className="max-w-[620px] space-y-4">
              <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.1] font-medium tracking-[-1.8px] text-white">
                Your next bill is on its way. Be ready for it.
              </h2>
              <p className="text-[16px] text-[#C3CBDD]">
                Get organized, never miss a due date, and pay on the Stellar ledger with zero custody risk.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onViewDemo}
                className="px-5 py-3 rounded-[10px] text-white hover:text-[#5FD39A] font-semibold text-[14px] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Play size={16} fill="currentColor" />
                View demo
              </button>
              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3.5 rounded-[10px] bg-white text-[#0B1530] hover:bg-[#F3F5F9] font-bold text-[14px] shadow-sm transition-all cursor-pointer"
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: FOOTER
      ========================================================================= */}
      <footer className="py-12 bg-white border-t border-[#EEF1F6]">
        <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Wordmark Logo */}
            <div className="flex items-center">
              <BillzaLogo variant="light" />
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-[14px] font-medium text-[#4A5675]">
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-[#0B1530] transition-colors cursor-pointer"
              >
                How it works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="hover:text-[#0B1530] transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('help')}
                className="hover:text-[#0B1530] transition-colors cursor-pointer"
              >
                Help
              </button>
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab('help');
                }}
                className="hover:text-[#0B1530] transition-colors"
              >
                Privacy
              </a>
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateTab('help');
                }}
                className="hover:text-[#0B1530] transition-colors"
              >
                Terms
              </a>
            </div>

            {/* Copyright */}
            <p className="text-[13px] text-[#5F6A86]">
              © 2026 Billza
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
