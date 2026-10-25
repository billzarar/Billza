import React from 'react';
import {
  Home,
  Receipt,
  Bell,
  History,
  Settings,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet,
  Check,
  X,
} from 'lucide-react';
import { BillzaLogo } from './BillIcons';

export type NavTab = 'dashboard' | 'bills' | 'reminders' | 'history' | 'settings' | 'help';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  remindersCount: number;
  wallet: {
    addressShort: string;
    connected: boolean;
    balances: {
      USDC: number;
      XLM: number;
      EUR: number;
    };
  };
  onOpenWalletModal: () => void;
  onOpenLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  remindersCount,
  wallet,
  onOpenWalletModal,
  onOpenLanding,
}) => {
  const mainNavItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} strokeWidth={1.8} /> },
    { id: 'bills', label: 'Bills', icon: <Receipt size={20} strokeWidth={1.8} /> },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: <Bell size={20} strokeWidth={1.8} />,
      badge: remindersCount,
    },
    { id: 'history', label: 'Payment history', icon: <History size={20} strokeWidth={1.8} /> },
  ];

  const secondaryNavItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'settings', label: 'Settings', icon: <Settings size={20} strokeWidth={1.8} /> },
    { id: 'help', label: 'Help', icon: <HelpCircle size={20} strokeWidth={1.8} /> },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex flex-col justify-between h-full w-full bg-[#0B1530] text-white select-none">
        {/* Top Section: Brand + Main Nav */}
        <div className="flex flex-col w-full">
          {/* Brand Header (72px height) */}
          <div
            className={`flex items-center justify-between h-[72px] border-b border-white/[0.04] ${
              isCollapsed ? 'px-3 justify-center' : 'pl-[26px] pr-[14px]'
            }`}
          >
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4164D9] rounded"
                aria-label="Billza Home"
              >
                <BillzaLogo />
              </button>
            )}

            {isMobile ? (
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-[8px] text-[#A9B4CC] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-[8px] text-[#A9B4CC] hover:text-white hover:bg-white/10 transition-colors"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            )}
          </div>

          {/* Main Navigation */}
          <nav
            aria-label="Main Navigation"
            className={`flex flex-col gap-[4px] pt-[24px] ${isCollapsed ? 'px-[12px]' : 'px-[16px]'}`}
          >
            {mainNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center justify-between h-[44px] rounded-[10px] transition-colors whitespace-nowrap shrink-0 ${
                    isCollapsed ? 'px-0 justify-center w-full' : 'px-[13px] w-full'
                  } ${
                    isActive
                      ? 'bg-[#4164D9] text-white font-bold'
                      : 'text-[#A9B4CC] hover:text-white hover:bg-white/[0.06] font-medium'
                  }`}
                >
                  <span className="flex items-center gap-[12px]">
                    <span className={isActive ? 'text-white' : 'text-[#A9B4CC]'}>{item.icon}</span>
                    {!isCollapsed && (
                      <span className="text-[16px] leading-[24px]">{item.label}</span>
                    )}
                  </span>

                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`inline-flex items-center justify-center h-[22px] min-w-[24px] px-[7px] rounded-[6px] text-[12px] leading-[16px] font-bold tabular-nums ${
                        isActive ? 'bg-[#0B1530]/40 text-white' : 'bg-[#4164D9] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings, Help, Wallet Card, Logout */}
        <div
          className={`flex flex-col gap-[16px] pt-[32px] pb-[16px] ${
            isCollapsed ? 'px-[12px] items-center' : 'px-[16px]'
          }`}
        >
          {/* Secondary Nav */}
          <div className="flex flex-col gap-[4px] w-full">
            {secondaryNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-[12px] h-[44px] rounded-[10px] transition-colors whitespace-nowrap shrink-0 ${
                    isCollapsed ? 'px-0 justify-center w-full' : 'px-[13px] w-full'
                  } ${
                    isActive
                      ? 'bg-[#4164D9] text-white font-bold'
                      : 'text-[#A9B4CC] hover:text-white hover:bg-white/[0.06] font-medium'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-[#A9B4CC]'}>{item.icon}</span>
                  {!isCollapsed && (
                    <span className="text-[16px] leading-[24px]">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Account & Wallet Box + Logout */}
          <div className="flex flex-col items-center gap-[12px] w-full">
            {isCollapsed ? (
              <button
                type="button"
                onClick={onOpenWalletModal}
                title="Amara Okafor · Wallet Connected"
                className="w-[44px] h-[44px] rounded-full bg-[#E6ECFB] border-2 border-[#4164D9] flex items-center justify-center text-[#2F4FBF] font-bold text-[14px] hover:opacity-90 transition-opacity"
              >
                AO
              </button>
            ) : (
              <div className="w-full bg-[#1A2A55] border border-white/[0.06] rounded-[12px] px-[13px] py-[15px] flex flex-col gap-[12px]">
                {/* User Profile Link */}
                <button
                  type="button"
                  onClick={() => handleNavClick('settings')}
                  className="flex items-center gap-[10px] w-full text-left group focus:outline-none"
                >
                  <div className="w-[40px] h-[40px] rounded-[20px] bg-[#E6ECFB] border-2 border-[#4164D9] flex items-center justify-center shrink-0">
                    <span className="text-[#2F4FBF] font-bold text-[14px] leading-[20px]">
                      AO
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-bold text-[14px] leading-[20px] truncate group-hover:underline">
                      Amara Okafor
                    </span>
                    <span className="text-[#A9B4CC] font-medium text-[12px] leading-[16px] truncate">
                      Personal account
                    </span>
                  </div>
                </button>

                {/* Wallet Address & Connected Status */}
                <button
                  type="button"
                  onClick={onOpenWalletModal}
                  className="flex items-center justify-between gap-[6px] w-full h-[34px] px-[6px] bg-white/[0.05] hover:bg-white/[0.09] transition-colors rounded-[8px]"
                >
                  <span className="flex items-center gap-[7px] min-w-0">
                    <span className="w-[22px] h-[22px] rounded-[6px] bg-[#4164D9] flex items-center justify-center shrink-0">
                      <Wallet size={13} className="text-white" />
                    </span>
                    <span className="font-mono-redhat text-[12px] leading-[16px] text-[#DDE2EC] truncate">
                      {wallet.addressShort}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-[5px] h-[24px] px-[8px] py-[1px] rounded-[6px] bg-[#5FD39A]/[0.12] border border-[#5FD39A]/[0.45] shrink-0">
                    <Check size={12} strokeWidth={2.5} className="text-[#5FD39A]" />
                    <span className="text-[#5FD39A] font-bold text-[12px] leading-[16px]">
                      {wallet.connected ? 'Connected' : 'Paused'}
                    </span>
                  </span>
                </button>

                {/* Balances Row */}
                <div className="flex items-center justify-between px-[4px] w-full text-[12px] leading-[16px] font-bold text-white tabular-nums">
                  <span>{((wallet?.balances?.USDC) ?? 0).toFixed(2)} USDC</span>
                  <span>{((wallet?.balances?.XLM) ?? 0).toFixed(2)} XLM</span>
                </div>
              </div>
            )}

            {/* Log out / Return to Landing Page */}
            <button
              type="button"
              onClick={() => {
                if (onOpenLanding) {
                  onOpenLanding();
                } else {
                  handleNavClick('settings');
                }
              }}
              title={isCollapsed ? 'Log out' : undefined}
              className={`flex items-center gap-[12px] h-[44px] rounded-[10px] text-[#A9B4CC] hover:text-white hover:bg-white/[0.06] font-medium transition-colors whitespace-nowrap shrink-0 ${
                isCollapsed ? 'px-0 justify-center w-full' : 'px-[13px] w-full'
              }`}
            >
              <LogOut size={20} strokeWidth={1.8} className="text-[#A9B4CC]" />
              {!isCollapsed && <span className="text-[16px] leading-[24px]">Log out</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#0B1530] transition-all duration-200 ${
          collapsed ? 'w-[80px]' : 'w-[248px]'
        }`}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          {renderSidebarContent(false)}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0B1530]/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[268px] max-w-[85vw] h-full bg-[#0B1530] shadow-2xl overflow-y-auto">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
