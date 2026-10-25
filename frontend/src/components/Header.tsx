import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Menu,
  LogOut,
  User,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Settings,
  HelpCircle,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { BillzaLogo } from './BillIcons';
import { AuthUser } from '../services/api';
import { NavTab } from './Sidebar';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenWalletModal: () => void;
  onToggleNotifications: () => void;
  hasUnreadNotifications: boolean;
  onNavigateTab?: (tab: NavTab) => void;
  user?: AuthUser | null;
  onLogout?: () => void;
  wallet: {
    addressShort: string;
    addressFull?: string;
    address?: string;
    network: string;
    connected?: boolean;
    connectedProvider?: string;
    balances: {
      USDC: number;
      XLM: number;
      EUR: number;
    };
  };
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenWalletModal,
  onToggleNotifications,
  hasUnreadNotifications,
  onNavigateTab,
  user,
  onLogout,
  wallet,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const fullAddress = wallet.addressFull || wallet.address || wallet.addressShort || '';

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullAddress) return;
    navigator.clipboard.writeText(fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.full_name) {
      const parts = user.full_name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'BZ';
  };

  const displayName =
    user?.first_name ||
    (user?.full_name ? user.full_name.trim().split(' ')[0] : '') ||
    (user?.username ? user.username.split('@')[0] : '') ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'there';

  const userEmail = user?.email || (user?.username?.includes('@') ? user.username : '');

  return (
    <header className="w-full h-[64px] sm:h-[72px] bg-white border-b border-[#DDE2EC]/70 px-4 sm:px-6 lg:px-[32px] flex items-center justify-between gap-3 shrink-0 relative z-30">
      {/* Left: Mobile Menu + Greeting */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden w-[40px] h-[40px] rounded-[10px] border border-[#DDE2EC] flex items-center justify-center text-[#0B1530] hover:bg-[#F3F5F9] transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile compact logo on extra-small screens */}
        <div className="flex sm:hidden items-center bg-[#0B1530] px-2.5 py-1 rounded-[6px] shrink-0">
          <BillzaLogo collapsed />
        </div>

        <div className="flex flex-col gap-[2px] min-w-0">
          <span className="font-bold text-[14px] leading-[20px] text-[#0B1530] truncate">
            Good day, {displayName}
          </span>
          <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Right: Notifications + Profile & Wallet Trigger */}
      <div className="flex items-center gap-[8px] sm:gap-[12px] shrink-0">
        {/* Notifications Button */}
        <button
          type="button"
          onClick={onToggleNotifications}
          className="relative w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] flex items-center justify-center text-[#0B1530] transition-colors shrink-0"
          aria-label="Notifications"
        >
          <Bell size={20} strokeWidth={1.8} />
          {hasUnreadNotifications && (
            <span className="absolute top-[10px] left-[22px] sm:left-[23px] w-[9px] h-[9px] rounded-full bg-[#D2453A] border-2 border-white" />
          )}
        </button>

        {/* Profile & Wallet Popup Button */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            className={`flex items-center gap-2 h-[38px] sm:h-[40px] px-2.5 sm:px-3 bg-white border rounded-[10px] transition-all whitespace-nowrap shrink-0 shadow-xs ${
              isProfileOpen
                ? 'border-[#4164D9] ring-2 ring-[#4164D9]/15'
                : 'border-[#DDE2EC] hover:border-[#77839F]'
            }`}
            title="Open account profile & wallet balances"
          >
            {/* User Avatar Circle */}
            <div className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full bg-gradient-to-tr from-[#0B1530] via-[#1A2A55] to-[#4164D9] text-white flex items-center justify-center text-[11px] font-bold shrink-0 tracking-wider">
              {getInitials()}
            </div>

            {/* Only USDC balance along with profile icon */}
            <span className="font-bold text-[13px] text-[#0B1530] tabular-nums">
              {((wallet?.balances?.USDC) ?? 0).toFixed(2)} USDC
            </span>

            <ChevronDown
              size={14}
              className={`text-[#77839F] transition-transform duration-200 shrink-0 ${
                isProfileOpen ? 'rotate-180 text-[#4164D9]' : ''
              }`}
            />
          </button>

          {/* Profile & Wallet Tooltip Popup */}
          {isProfileOpen && (
            <div
              role="dialog"
              aria-label="User Profile and Wallet Details"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-[330px] sm:w-[370px] max-w-[calc(100vw-24px)] bg-white border border-[#DDE2EC] rounded-[16px] shadow-2xl p-0 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header: User Info Banner */}
              <div className="bg-[#F8F9FC] border-b border-[#EEF1F6] p-4 flex items-center gap-3">
                <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-tr from-[#0B1530] via-[#1A2A55] to-[#4164D9] text-white flex items-center justify-center text-[15px] font-extrabold shadow-sm shrink-0">
                  {getInitials()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[15px] leading-[20px] text-[#0B1530] truncate">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.full_name || displayName}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#EBF2FF] text-[#4164D9] text-[10px] font-bold">
                      <ShieldCheck size={11} />
                      Active
                    </span>
                  </div>
                  {userEmail ? (
                    <span className="text-[12px] text-[#4A5675] truncate">{userEmail}</span>
                  ) : (
                    <span className="text-[12px] text-[#77839F] truncate">Stellar Testnet Account</span>
                  )}
                </div>
              </div>

              {/* Wallet Section */}
              <div className="p-4 flex flex-col gap-3 border-b border-[#EEF1F6]">
                {/* Network & Stellar Address Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#ECFDF3] border border-[#ABEFC6]">
                    <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
                    <span className="text-[11px] font-bold text-[#067647]">{wallet.network}</span>
                  </div>

                  {fullAddress && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${fullAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4164D9] hover:underline"
                    >
                      <span>StellarExpert</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                {/* Stellar Address with Copy */}
                {fullAddress ? (
                  <div className="flex items-center justify-between bg-[#F3F5F9] border border-[#DDE2EC] rounded-[10px] px-3 py-2 text-[12px]">
                    <div className="flex items-center gap-2 min-w-0 font-mono-redhat text-[#0B1530]">
                      <Wallet size={14} className="text-[#4164D9] shrink-0" />
                      <span className="truncate" title={fullAddress}>
                        {fullAddress.length > 20
                          ? `${fullAddress.slice(0, 8)}...${fullAddress.slice(-8)}`
                          : fullAddress}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="ml-2 p-1 text-[#4A5675] hover:text-[#0B1530] transition-colors shrink-0"
                      title="Copy full Stellar address"
                    >
                      {copiedAddress ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#12B76A]">
                          <Check size={13} />
                          Copied
                        </span>
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-[12px] text-[#4A5675] py-1">No wallet connected yet</div>
                )}

                {/* Balances Card */}
                <div className="bg-[#F8F9FC] border border-[#DDE2EC] rounded-[12px] p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#4A5675] uppercase tracking-wider">
                    <span>Wallet Balances</span>
                    <span className="text-[#12B76A] font-semibold lowercase">live synced</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* USDC Balance Card */}
                    <div className="bg-white border border-[#DDE2EC] rounded-[10px] p-2.5 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#2775CA]" />
                        <span className="text-[11px] font-bold text-[#4A5675]">USDC</span>
                      </div>
                      <span className="font-extrabold text-[16px] text-[#0B1530] tabular-nums truncate">
                        {((wallet?.balances?.USDC) ?? 0).toFixed(2)}
                      </span>
                    </div>

                    {/* XLM Balance Card */}
                    <div className="bg-white border border-[#DDE2EC] rounded-[10px] p-2.5 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#0B1530]" />
                        <span className="text-[11px] font-bold text-[#4A5675]">XLM (Native)</span>
                      </div>
                      <span className="font-extrabold text-[16px] text-[#0B1530] tabular-nums truncate">
                        {((wallet?.balances?.XLM) ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Manage / Fund Button inside Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenWalletModal();
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-[36px] bg-[#0B1530] hover:bg-[#1A2A55] text-white rounded-[8px] font-bold text-[12px] transition-colors shadow-sm mt-1"
                  >
                    <Wallet size={14} />
                    <span>Manage Wallet & Fund Testnet</span>
                  </button>
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="p-2 flex flex-col gap-0.5 text-[13px] border-b border-[#EEF1F6]">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigateTab?.('settings');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[#0B1530] hover:bg-[#F3F5F9] font-medium transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings size={16} className="text-[#4A5675]" />
                    <span>Account Settings</span>
                  </span>
                  <ChevronDown size={14} className="text-[#A9B4CC] -rotate-90" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigateTab?.('reminders');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[#0B1530] hover:bg-[#F3F5F9] font-medium transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <Bell size={16} className="text-[#4A5675]" />
                    <span>Reminders & Notifications</span>
                  </span>
                  <ChevronDown size={14} className="text-[#A9B4CC] -rotate-90" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigateTab?.('help');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[#0B1530] hover:bg-[#F3F5F9] font-medium transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle size={16} className="text-[#4A5675]" />
                    <span>Help & Support</span>
                  </span>
                  <ChevronDown size={14} className="text-[#A9B4CC] -rotate-90" />
                </button>
              </div>

              {/* Sign Out Row */}
              {onLogout && (
                <div className="p-2 bg-[#F8F9FC]/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[#D2453A] hover:bg-[#FFF8F7] font-semibold text-[13px] transition-colors"
                  >
                    <LogOut size={16} className="text-[#D2453A]" />
                    <span>Sign out of Billza</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
