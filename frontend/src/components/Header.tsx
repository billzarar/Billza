import { Bell, Menu, LogOut, User } from 'lucide-react';
import { BillzaLogo } from './BillIcons';
import { AuthUser } from '../services/api';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenWalletModal: () => void;
  onToggleNotifications: () => void;
  hasUnreadNotifications: boolean;
  onOpenLanding?: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
  wallet: {
    addressShort: string;
    network: string;
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
  onOpenLanding,
  user,
  onLogout,
  wallet,
}) => {
  return (
    <header className="w-full h-[64px] sm:h-[72px] bg-white border-b border-[#DDE2EC]/70 px-4 sm:px-6 lg:px-[32px] flex items-center justify-between gap-3 shrink-0">
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
            Good day, {user ? (user.first_name || user.username.split('@')[0]) : 'Amara'}
          </span>
          <span className="font-medium text-[12px] leading-[16px] text-[#4A5675] truncate">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Right: Testnet Tag, Wallet Bar, Notifications */}
      <div className="flex items-center gap-[8px] sm:gap-[10px] shrink-0">
        {/* Stellar Testnet Status Label */}
        <button
          type="button"
          onClick={onOpenWalletModal}
          className="hidden md:inline-flex items-center justify-center h-[28px] px-[11px] py-[1px] bg-white border border-[#77839F] rounded-[6px] hover:bg-[#F3F5F9] transition-colors whitespace-nowrap shrink-0"
        >
          <span className="font-bold text-[12px] leading-[16px] text-[#4A5675]">
            {wallet.network}
          </span>
        </button>

        {/* Wallet Bar: Desktop & Tablet */}
        <button
          type="button"
          onClick={onOpenWalletModal}
          className="hidden sm:flex items-center gap-[10px] h-[44px] px-[15px] py-[1px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] transition-colors whitespace-nowrap shrink-0"
          title="View connected Stellar wallet"
        >
          <span className="w-[8px] h-[8px] rounded-[2px] bg-[#4164D9] shrink-0" />
          <span className="font-mono-redhat text-[14px] leading-[20px] text-[#0B1530]">
            {wallet.addressShort}
          </span>
          <span className="w-[1px] h-[18px] bg-[#DDE2EC] shrink-0" />
          <span className="font-bold text-[14px] leading-[20px] text-[#0B1530] tabular-nums">
            {wallet.balances.USDC.toFixed(2)} USDC
          </span>
          <span className="hidden xl:inline font-bold text-[14px] leading-[20px] text-[#0B1530] tabular-nums">
            {wallet.balances.XLM.toFixed(2)} XLM
          </span>
        </button>

        {/* Mobile Compact Wallet Button */}
        <button
          type="button"
          onClick={onOpenWalletModal}
          className="flex sm:hidden items-center gap-1.5 h-[40px] px-2.5 bg-white border border-[#DDE2EC] rounded-[10px] text-[12px] font-bold text-[#0B1530] tabular-nums whitespace-nowrap shrink-0"
        >
          <span className="w-[7px] h-[7px] rounded-[2px] bg-[#4164D9] shrink-0" />
          <span>{wallet.balances.USDC.toFixed(0)} USDC</span>
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onToggleNotifications}
          className="relative w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] flex items-center justify-center text-[#0B1530] transition-colors shrink-0"
          aria-label="Notifications, 3 new"
        >
          <Bell size={20} strokeWidth={1.8} />
          {hasUnreadNotifications && (
            <span className="absolute top-[10px] left-[22px] sm:left-[23px] w-[9px] h-[9px] rounded-full bg-[#D2453A] border border-white" />
          )}
        </button>

        {/* Return to Landing Page Button */}
        {onOpenLanding && (
          <button
            type="button"
            onClick={onOpenLanding}
            className="hidden lg:inline-flex items-center gap-1.5 h-[44px] px-3.5 bg-[#F3F5F9] hover:bg-[#EEF1F6] border border-[#DDE2EC] rounded-[10px] text-[13px] font-semibold text-[#0B1530] transition-colors shrink-0"
            title="View Landing Page"
          >
            <span>Landing page</span>
          </button>
        )}

        {/* User Sign Out */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 h-[40px] sm:h-[44px] px-3 bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 rounded-[10px] text-[13px] font-semibold transition-colors shrink-0"
            title="Sign out of Billza"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        )}
      </div>
    </header>
  );
};
