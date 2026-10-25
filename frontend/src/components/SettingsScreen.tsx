import React, { useState } from 'react';
import {
  User,
  Mail,
  Wallet,
  Bell,
  Coins,
  Shield,
  LogOut,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  KeyRound,
  Laptop,
  Smartphone,
  Upload,
  Lock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Currency, WalletState, BillItem } from '../data/initialData';
import { AuthUser, updateUserProfile } from '../services/api';
import { ConfirmModal } from './ConfirmModal';

interface SettingsScreenProps {
  wallet: WalletState;
  currency: Currency;
  currentUser?: AuthUser | null;
  onUpdateUser?: (user: AuthUser) => void;
  onCurrencyChange: (curr: Currency) => void;
  onOpenReminderSettings: () => void;
  onOpenWalletModal: () => void;
  onTriggerToast: (msg: string) => void;
}

type SettingsSection =
  | 'profile'
  | 'email'
  | 'wallet'
  | 'notifications'
  | 'currency'
  | 'security'
  | 'danger';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  wallet,
  currency,
  currentUser,
  onUpdateUser,
  onCurrencyChange,
  onOpenReminderSettings,
  onOpenWalletModal,
  onTriggerToast,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  // Profile form state derived from real authenticated user
  const initialName =
    currentUser?.full_name ||
    (currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : '') ||
    currentUser?.username ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
    'Billza User';

  const [fullName, setFullName] = useState(initialName);
  const [accountType, setAccountType] = useState<'Personal' | 'Household'>('Personal');
  const [timeZone, setTimeZone] = useState('UTC / Local Time');
  const [avatarInitials, setAvatarInitials] = useState(
    (initialName || 'BZ')
      .trim()
      .split(/\s+/)
      .map((p) => p[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BZ'
  );
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  // Email state
  const [email, setEmail] = useState(currentUser?.email || 'user@billza.app');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Password & Security modals
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active sessions
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Chrome on macOS',
      location: 'Lagos, Nigeria',
      time: 'Active now',
      isCurrent: true,
      icon: 'laptop' as const,
    },
    {
      id: 'sess-2',
      device: 'Safari on iPhone',
      location: 'Lagos, Nigeria',
      time: '2 days ago',
      isCurrent: false,
      icon: 'phone' as const,
    },
  ]);

  // Copy helper
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
    onTriggerToast('Copied full Stellar wallet address');
  };

  const handleScrollTo = (sectionId: string, sectionKey: SettingsSection) => {
    setActiveSection(sectionKey);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await updateUserProfile({
        full_name: fullName,
        preferred_currency: currency,
      });
      if (onUpdateUser) {
        onUpdateUser(updated);
      }
      onTriggerToast('Profile preferences updated in database');
    } catch (err: any) {
      console.warn('Profile update note:', err);
      onTriggerToast('Saved profile locally');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setCustomPhoto(uploadEvent.target?.result as string);
        onTriggerToast('Uploaded profile photo');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setCustomPhoto(null);
    onTriggerToast('Removed profile photo (using AO initials)');
  };

  const handleSignOutOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    onTriggerToast('Signed out of all other remote devices');
  };

  const handleSignOutSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    onTriggerToast('Session terminated');
  };

  return (
    <div className="w-full flex flex-col items-start gap-[28px]">
      {/* 1. Header Frame: Title & Subtitle */}
      <div className="w-full flex flex-col items-start gap-[8.5px]">
        <h1 className="font-onest font-extrabold text-[32px] sm:text-[40px] leading-[38px] sm:leading-[48px] tracking-[-1px] text-[#0B1530]">
          Settings
        </h1>
        <p className="font-onest font-medium text-[16px] sm:text-[18px] leading-[24px] sm:leading-[28px] text-[#4A5675]">
          Your profile, wallet, currency and account preferences
        </p>
      </div>

      {/* 2. Main Two-Column Frame: Left Section Nav (220px) + Right Stack (884px) */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-[24px]">
        {/* Left Sticky Sidebar Section Links (220px on desktop) */}
        <aside className="w-full lg:w-[220px] shrink-0 bg-white border border-[#DDE2EC] rounded-[12px] p-[9px] flex flex-row lg:flex-col gap-[2px] overflow-x-auto lg:overflow-visible sticky lg:top-4 z-10 shadow-xs">
          <button
            type="button"
            onClick={() => handleScrollTo('settings-profile', 'profile')}
            className={`w-full flex items-center px-[12px] h-[40px] gap-[10px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]'
            }`}
          >
            <User size={16} strokeWidth={2} className={activeSection === 'profile' ? 'text-white' : 'text-[#4A5675]'} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => handleScrollTo('settings-email', 'email')}
            className={`w-full flex items-center px-[12px] h-[40px] gap-[10px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'email'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]'
            }`}
          >
            <Mail size={16} strokeWidth={2} className={activeSection === 'email' ? 'text-white' : 'text-[#4A5675]'} />
            <span>Email address</span>
          </button>

          <button
            type="button"
            onClick={() => handleScrollTo('settings-wallet', 'wallet')}
            className={`w-full flex items-center px-[12px] h-[40px] gap-[10px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'wallet'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]'
            }`}
          >
            <Wallet size={16} strokeWidth={2} className={activeSection === 'wallet' ? 'text-white' : 'text-[#4A5675]'} />
            <span>Stellar wallet</span>
          </button>

          <button
            type="button"
            onClick={() => handleScrollTo('settings-notifications', 'notifications')}
            className={`w-full flex items-center px-[12px] h-[40px] gap-[10px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'notifications'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]'
            }`}
          >
            <Bell size={16} strokeWidth={2} className={activeSection === 'notifications' ? 'text-white' : 'text-[#4A5675]'} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => handleScrollTo('settings-currency', 'currency')}
            className={`w-full flex items-center px-[12px] h-[40px] gap-[10px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'currency'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]'
            }`}
          >
            <Coins size={16} strokeWidth={2} className={activeSection === 'currency' ? 'text-white' : 'text-[#4A5675]'} />
            <span>Default currency</span>
          </button>

          <button
            type="button"
            onClick={() => handleScrollTo('settings-security', 'security')}
            className={`w-full flex items-center px-[12px] h-[40px] gap-[10px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'security'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]'
            }`}
          >
            <Shield size={16} strokeWidth={2} className={activeSection === 'security' ? 'text-white' : 'text-[#4A5675]'} />
            <span>Account security</span>
          </button>

          <button
            type="button"
            onClick={() => handleScrollTo('settings-danger', 'danger')}
            className={`w-full flex items-center px-[12px] h-[40px] gap-[10px] rounded-[8px] font-onest font-bold text-[14px] leading-[20px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'danger'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-[#4A5675] hover:text-[#0B1530] hover:bg-[#EEF1F6]'
            }`}
          >
            <LogOut size={16} strokeWidth={2} className={activeSection === 'danger' ? 'text-white' : 'text-[#4A5675]'} />
            <span>Log out</span>
          </button>
        </aside>

        {/* Right Content Stack (884px wide) */}
        <div className="flex-1 w-full max-w-[884px] flex flex-col gap-[20px]">
          {/* SECTION 1: Profile (884px x 488px) */}
          <section
            id="settings-profile"
            className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] overflow-hidden shadow-xs flex flex-col"
          >
            {/* Section Header */}
            <div className="flex items-start px-[28px] pt-[24px] pb-[4px]">
              <div className="flex items-start gap-[14px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#EEF1F6] flex items-center justify-center shrink-0">
                  <User size={18} strokeWidth={2} className="text-[#0B1530]" />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <h3 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
                    Profile
                  </h3>
                  <p className="font-onest font-normal text-[16px] leading-[24px] text-[#4A5675]">
                    How your name shows on bills, reminders and receipts.
                  </p>
                </div>
              </div>
            </div>

            {/* Section Body */}
            <div className="px-[28px] pt-[8px] pb-[24px] flex flex-col gap-[20px]">
              {/* Avatar Frame */}
              <div className="flex items-center gap-[16px] pt-2">
                {customPhoto ? (
                  <img
                    src={customPhoto}
                    alt={fullName}
                    className="w-[68px] h-[68px] rounded-full object-cover border-2 border-[#4164D9]"
                  />
                ) : (
                  <div className="w-[68px] h-[68px] rounded-full bg-[#E6ECFB] border-2 border-[#4164D9] flex items-center justify-center select-none">
                    <span className="font-onest font-bold text-[20px] leading-[28px] text-[#2F4FBF]">
                      {avatarInitials}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-[6px]">
                  <div className="flex items-center gap-[8px]">
                    <label className="inline-flex items-center justify-center px-[15px] h-[40px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] font-onest font-bold text-[14px] text-[#0B1530] cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      Upload photo
                    </label>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-[10px] h-[40px] font-onest font-bold text-[14px] text-[#4A5675] hover:text-[#0B1530] transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    JPG or PNG, up to 2 MB. Your initials show if you don't upload one.
                  </span>
                </div>
              </div>

              {/* Form Input Grid */}
              <div className="flex flex-col gap-[16px]">
                {/* Row: Full Name & Account Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                  {/* Full Name */}
                  <div className="flex flex-col gap-[8px]">
                    <label className="font-onest font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        const parts = e.target.value.trim().split(' ');
                        if (parts.length >= 2) {
                          setAvatarInitials((parts[0][0] + parts[1][0]).toUpperCase());
                        } else if (parts[0]) {
                          setAvatarInitials(parts[0].slice(0, 2).toUpperCase());
                        }
                      }}
                      className="w-full h-[48px] px-[15px] bg-white border border-[#0B1530] rounded-[10px] font-onest text-[16px] leading-[24px] text-[#0B1530] focus:outline-hidden focus:ring-2 focus:ring-[#4164D9]/20"
                    />
                  </div>

                  {/* Account Type */}
                  <div className="flex flex-col gap-[8px]">
                    <label className="font-onest font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                      Account type
                    </label>
                    <div className="relative">
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value as any)}
                        className="w-full h-[48px] pl-[15px] pr-[36px] bg-white border border-[#0B1530] rounded-[10px] font-onest text-[16px] leading-[24px] text-[#0B1530] appearance-none cursor-pointer focus:outline-hidden"
                      >
                        <option value="Personal">Personal</option>
                        <option value="Household">Household</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5675] pointer-events-none"
                      />
                    </div>
                    <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                      Personal or Household. It only changes how we label your receipts.
                    </span>
                  </div>
                </div>

                {/* Time zone Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="font-onest font-semibold text-[14px] leading-[20px] text-[#0B1530]">
                    Time zone
                  </label>
                  <div className="relative flex items-center">
                    <Globe
                      size={16}
                      className="absolute left-[15px] text-[#4A5675] pointer-events-none"
                    />
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full h-[48px] pl-[40px] pr-[36px] bg-white border border-[#0B1530] rounded-[10px] font-onest text-[16px] leading-[24px] text-[#0B1530] appearance-none cursor-pointer focus:outline-hidden"
                    >
                      <option value="West Africa Time (Lagos)">West Africa Time (Lagos)</option>
                      <option value="Greenwich Mean Time (UTC)">Greenwich Mean Time (UTC)</option>
                      <option value="Central European Time (Berlin)">Central European Time (Berlin)</option>
                      <option value="Eastern Standard Time (New York)">Eastern Standard Time (New York)</option>
                      <option value="Pacific Standard Time (Los Angeles)">Pacific Standard Time (Los Angeles)</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5675] pointer-events-none"
                    />
                  </div>
                  <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Reminders and dates use this time zone.
                  </span>
                </div>
              </div>

              {/* Check again / Save Profile button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="inline-flex items-center justify-center px-[18px] h-[44px] bg-[#0B1530] hover:bg-[#1A2A55] text-white font-onest font-bold text-[16px] leading-[24px] rounded-[10px] cursor-pointer transition-colors shadow-xs"
                >
                  Save changes
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 2: Email Address (884px x 162px) */}
          <section
            id="settings-email"
            className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] overflow-hidden shadow-xs flex flex-col"
          >
            <div className="flex items-start px-[28px] pt-[24px] pb-[4px]">
              <div className="flex items-start gap-[14px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#EEF1F6] flex items-center justify-center shrink-0">
                  <Mail size={18} strokeWidth={2} className="text-[#0B1530]" />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <h3 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
                    Email address
                  </h3>
                  <p className="font-onest font-normal text-[16px] leading-[24px] text-[#4A5675]">
                    Used to sign in and for email reminders.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[28px] pt-[8px] pb-[24px]">
              {isChangingEmail ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="Enter new email address"
                    className="flex-1 h-[40px] px-3 border border-[#0B1530] rounded-[10px] text-[14px]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (newEmailInput.includes('@')) {
                          setEmail(newEmailInput);
                          setIsChangingEmail(false);
                          onTriggerToast(`Verification email sent to ${newEmailInput}`);
                        } else {
                          onTriggerToast('Please enter a valid email address');
                        }
                      }}
                      className="h-[40px] px-4 bg-[#0B1530] text-white rounded-[10px] text-[13px] font-bold"
                    >
                      Verify & Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingEmail(false)}
                      className="h-[40px] px-3 bg-white border border-[#DDE2EC] rounded-[10px] text-[13px] font-bold text-[#4A5675]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-col gap-[6px]">
                    <div className="flex items-center gap-[10px]">
                      <span className="font-onest font-bold text-[16px] leading-[24px] text-[#0B1530]">
                        {email}
                      </span>
                      <span className="inline-flex items-center px-[8px] py-[1px] gap-[5px] h-[24px] bg-[#E3F4EA] border border-[#2B9460] rounded-[6px]">
                        <Check size={12} strokeWidth={2.5} className="text-[#1B7A4B]" />
                        <span className="font-onest font-bold text-[12px] leading-[16px] text-[#1B7A4B]">
                          Connected
                        </span>
                      </span>
                    </div>
                    <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                      You sign in with this email, and reminders are sent here.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEmailInput(email);
                      setIsChangingEmail(true);
                    }}
                    className="inline-flex items-center justify-center px-[15px] h-[40px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] font-onest font-bold text-[14px] text-[#0B1530] transition-colors cursor-pointer select-none"
                  >
                    Change email
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: Stellar Wallet (884px x 414px) */}
          <section
            id="settings-wallet"
            className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] overflow-hidden shadow-xs flex flex-col"
          >
            <div className="flex items-start px-[28px] pt-[24px] pb-[4px]">
              <div className="flex items-start gap-[14px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#EEF1F6] flex items-center justify-center shrink-0">
                  <Wallet size={18} strokeWidth={2} className="text-[#0B1530]" />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <h3 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
                    Stellar wallet
                  </h3>
                  <p className="font-onest font-normal text-[16px] leading-[24px] text-[#4A5675]">
                    The wallet Billza pays from. Test money on Stellar Testnet.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[28px] pt-[8px] pb-[24px] flex flex-col gap-[14px]">
              {/* Connected Wallet Bar Card */}
              <div className="w-full bg-[#F8F9FC] border border-[#DDE2EC] rounded-[12px] p-[15px_17px] flex items-center justify-between gap-[12px]">
                <div className="flex items-center gap-[12px] min-w-0">
                  <div className="w-[40px] h-[40px] bg-[#0B1530] rounded-[10px] flex items-center justify-center shrink-0">
                    <Wallet size={18} strokeWidth={2} className="text-white" />
                  </div>
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <div className="flex items-center gap-[8px] flex-wrap">
                      <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                        {wallet.connectedProvider || 'Freighter'}
                      </span>
                      <span className="inline-flex items-center px-[8px] py-[1px] gap-[5px] h-[24px] bg-[#E3F4EA] border border-[#2B9460] rounded-[6px]">
                        <Check size={12} strokeWidth={2.5} className="text-[#1B7A4B]" />
                        <span className="font-onest font-bold text-[12px] leading-[16px] text-[#1B7A4B]">
                          Connected
                        </span>
                      </span>
                      <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-white border border-[#77839F] rounded-[6px]">
                        <span className="font-onest font-bold text-[12px] leading-[16px] text-[#4A5675]">
                          Stellar Testnet
                        </span>
                      </span>
                    </div>
                    <span className="font-mono text-[14px] leading-[20px] text-[#0B1530] truncate">
                      {wallet.address}
                    </span>
                  </div>
                </div>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={handleCopyWallet}
                  title="Copy full wallet address"
                  className="w-[36px] h-[36px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[8px] flex items-center justify-center text-[#4A5675] hover:text-[#0B1530] transition-colors shrink-0 cursor-pointer"
                >
                  {copiedAddress ? <Check size={15} className="text-[#1B7A4B]" /> : <Copy size={15} />}
                </button>
              </div>

              {/* Two Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
                <div className="border border-[#DDE2EC] rounded-[10px] p-[13px_15px] flex flex-col gap-[2px]">
                  <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    USDC balance
                  </span>
                  <div className="flex items-baseline gap-[4px]">
                    <span className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
                      {wallet.balances.USDC.toFixed(2)}
                    </span>
                    <span className="font-onest font-bold text-[12px] leading-[16px] text-[#4A5675]">
                      USDC
                    </span>
                  </div>
                </div>

                <div className="border border-[#DDE2EC] rounded-[10px] p-[13px_15px] flex flex-col gap-[2px]">
                  <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    XLM balance, 1.50 kept as reserve
                  </span>
                  <div className="flex items-baseline gap-[4px]">
                    <span className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
                      {wallet.balances.XLM.toFixed(2)}
                    </span>
                    <span className="font-onest font-bold text-[12px] leading-[16px] text-[#4A5675]">
                      XLM
                    </span>
                  </div>
                </div>
              </div>

              {/* Trustline setup note */}
              <div className="flex items-center gap-[8px]">
                <Check size={14} strokeWidth={2.5} className="text-[#1B7A4B] shrink-0" />
                <span className="font-onest font-medium text-[12px] leading-[16px] text-[#1B7A4B]">
                  USDC is set up on this wallet, so it can hold and pay USD Coin.
                </span>
              </div>

              {/* Secret key security banner */}
              <div className="bg-[#F3F6FE] border border-[#C9D4F7] rounded-[10px] p-[11px_13px] flex items-center gap-[8px]">
                <Lock size={16} className="text-[#2F4FBF] shrink-0" />
                <span className="font-onest font-medium text-[12px] leading-[16px] text-[#0B1530]">
                  Billza never sees your secret key. Every payment is signed in your wallet.
                </span>
              </div>

              {/* Actions row: View on Explorer, Switch, Disconnect */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
                <div className="flex items-center gap-[10px] flex-wrap">
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${wallet.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-[15px] h-[40px] gap-[8px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] font-onest font-bold text-[14px] text-[#0B1530] transition-colors cursor-pointer select-none"
                  >
                    <span>View on Stellar Explorer</span>
                    <ExternalLink size={14} />
                  </a>

                  <button
                    type="button"
                    onClick={onOpenWalletModal}
                    className="inline-flex items-center px-[15px] h-[40px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] font-onest font-bold text-[14px] text-[#0B1530] transition-colors cursor-pointer select-none"
                  >
                    Switch wallet
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onTriggerToast('Wallet remains connected in demo sandbox mode')}
                  className="inline-flex items-center px-[15px] h-[40px] bg-white border border-[#F5C2BC] hover:bg-[#FFF8F7] rounded-[10px] font-onest font-bold text-[14px] text-[#B42318] transition-colors cursor-pointer select-none"
                >
                  Disconnect wallet
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 4: Notifications (884px x 392px) */}
          <section
            id="settings-notifications"
            className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] overflow-hidden shadow-xs flex flex-col"
          >
            <div className="flex items-start px-[28px] pt-[24px] pb-[4px]">
              <div className="flex items-start gap-[14px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#EEF1F6] flex items-center justify-center shrink-0">
                  <Bell size={18} strokeWidth={2} className="text-[#0B1530]" />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <h3 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
                    Notifications
                  </h3>
                  <p className="font-onest font-normal text-[16px] leading-[24px] text-[#4A5675]">
                    A summary of your reminder settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[28px] pt-[8px] pb-[24px] flex flex-col">
              <div className="flex justify-between items-center py-[10px]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Email reminders
                </span>
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  On
                </span>
              </div>

              <div className="flex justify-between items-center py-[11px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  In-app reminders
                </span>
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  On
                </span>
              </div>

              <div className="flex justify-between items-center py-[11px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Default timing
                </span>
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  3 days before, on due date
                </span>
              </div>

              <div className="flex justify-between items-center py-[11px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Send at
                </span>
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  08:00 WAT
                </span>
              </div>

              <div className="flex justify-between items-center py-[11px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Overdue reminders
                </span>
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  Every 2 days
                </span>
              </div>

              <div className="flex justify-between items-center py-[11px] border-t border-[#EEF1F6]">
                <span className="font-onest font-semibold text-[14px] leading-[20px] text-[#4A5675]">
                  Wallet alerts
                </span>
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  On
                </span>
              </div>

              {/* Link directly to Screen 10 (Reminder settings) */}
              <div className="flex justify-start pt-[10px]">
                <button
                  type="button"
                  onClick={onOpenReminderSettings}
                  className="inline-flex items-center gap-[6px] font-onest font-bold text-[14px] leading-[20px] text-[#2F4FBF] hover:underline cursor-pointer"
                >
                  <span>Edit reminder settings</span>
                  <ChevronRight size={14} strokeWidth={2.5} className="text-[#2F4FBF]" />
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 5: Default Currency (884px x 212px) */}
          <section
            id="settings-currency"
            className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] overflow-hidden shadow-xs flex flex-col"
          >
            <div className="flex items-start px-[28px] pt-[24px] pb-[4px]">
              <div className="flex items-start gap-[14px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#EEF1F6] flex items-center justify-center shrink-0">
                  <Coins size={18} strokeWidth={2} className="text-[#0B1530]" />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <h3 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
                    Default currency
                  </h3>
                  <p className="font-onest font-normal text-[16px] leading-[24px] text-[#4A5675]">
                    Picked for you when you add a new bill. You can still pay bills in any currency.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[28px] pt-[8px] pb-[24px] flex flex-col gap-[12px]">
              {/* Radio Cards 3 options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px]">
                {/* Option 1: USDC */}
                <div
                  onClick={() => {
                    onCurrencyChange('USDC');
                    onTriggerToast('Default currency set to USDC');
                  }}
                  className={`border rounded-[12px] p-[15px_17px] flex items-center gap-[12px] cursor-pointer transition-colors ${
                    currency === 'USDC'
                      ? 'bg-[#F3F5F9] border-[#0B1530]'
                      : 'bg-white border-[#DDE2EC] hover:border-[#77839F]'
                  }`}
                >
                  <div
                    className={`w-[20px] h-[20px] rounded-full border flex items-center justify-center shrink-0 ${
                      currency === 'USDC' ? 'border-[#0B1530] border-[6px]' : 'border-[#9AA4BA]'
                    }`}
                  />
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                      USDC · USD Coin
                    </span>
                    <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                      Pay from your wallet
                    </span>
                  </div>
                </div>

                {/* Option 2: XLM */}
                <div
                  onClick={() => {
                    onCurrencyChange('XLM');
                    onTriggerToast('Default currency set to XLM');
                  }}
                  className={`border rounded-[12px] p-[15px_17px] flex items-center gap-[12px] cursor-pointer transition-colors ${
                    currency === 'XLM'
                      ? 'bg-[#F3F5F9] border-[#0B1530]'
                      : 'bg-white border-[#DDE2EC] hover:border-[#77839F]'
                  }`}
                >
                  <div
                    className={`w-[20px] h-[20px] rounded-full border flex items-center justify-center shrink-0 ${
                      currency === 'XLM' ? 'border-[#0B1530] border-[6px]' : 'border-[#9AA4BA]'
                    }`}
                  />
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                      XLM · Stellar Lumens
                    </span>
                    <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                      Pay from your wallet
                    </span>
                  </div>
                </div>

                {/* Option 3: EUR */}
                <div
                  onClick={() => {
                    onCurrencyChange('EUR');
                    onTriggerToast('Default currency set to EUR');
                  }}
                  className={`border rounded-[12px] p-[15px_17px] flex items-center gap-[12px] cursor-pointer transition-colors ${
                    currency === 'EUR'
                      ? 'bg-[#F3F5F9] border-[#0B1530]'
                      : 'bg-white border-[#DDE2EC] hover:border-[#77839F]'
                  }`}
                >
                  <div
                    className={`w-[20px] h-[20px] rounded-full border flex items-center justify-center shrink-0 ${
                      currency === 'EUR' ? 'border-[#0B1530] border-[6px]' : 'border-[#9AA4BA]'
                    }`}
                  />
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                      EUR · Euro
                    </span>
                    <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                      You pay it yourself
                    </span>
                  </div>
                </div>
              </div>

              <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                Totals always show each currency on its own card, never converted together.
              </span>
            </div>
          </section>

          {/* SECTION 6: Account Security (884px x 424px) */}
          <section
            id="settings-security"
            className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[1px] overflow-hidden shadow-xs flex flex-col"
          >
            <div className="flex items-start px-[28px] pt-[24px] pb-[4px]">
              <div className="flex items-start gap-[14px]">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[#EEF1F6] flex items-center justify-center shrink-0">
                  <Shield size={18} strokeWidth={2} className="text-[#0B1530]" />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <h3 className="font-onest font-bold text-[20px] leading-[28px] text-[#0B1530]">
                    Account security
                  </h3>
                  <p className="font-onest font-normal text-[16px] leading-[24px] text-[#4A5675]">
                    Keep your Billza account safe.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[28px] pt-[8px] pb-[24px] flex flex-col">
              {/* Row 1: Password */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-[16px] gap-3">
                <div className="flex flex-col gap-[2px]">
                  <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    Password
                  </span>
                  <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Last changed Wed 12 Aug 2026
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="inline-flex items-center justify-center px-[15px] h-[40px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] font-onest font-bold text-[14px] text-[#0B1530] transition-colors cursor-pointer select-none"
                >
                  Change password
                </button>
              </div>

              {/* Row 2: Two-step verification */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-[17px] border-t border-[#EEF1F6] gap-3">
                <div className="flex flex-col gap-[2px]">
                  <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    Two-step verification
                  </span>
                  <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                    Ask for a code from an authenticator app when signing in.
                  </span>
                </div>

                <div className="flex items-center gap-[10px]">
                  <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-white border border-[#77839F] rounded-[6px]">
                    <span className="font-onest font-bold text-[12px] leading-[16px] text-[#4A5675]">
                      {twoFactorEnabled ? 'Active' : 'Off'}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorEnabled((prev) => !prev);
                      onTriggerToast(
                        twoFactorEnabled
                          ? 'Disabled two-step verification'
                          : 'Two-step verification enabled with authenticator'
                      );
                    }}
                    className="inline-flex items-center justify-center px-[15px] h-[39px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] font-onest font-bold text-[14px] text-[#0B1530] transition-colors cursor-pointer select-none"
                  >
                    {twoFactorEnabled ? 'Turn off' : 'Set up'}
                  </button>
                </div>
              </div>

              {/* Row 3: Signed in on */}
              <div className="flex flex-col gap-[12px] pt-[13px] border-t border-[#EEF1F6]">
                <div className="flex items-center justify-between">
                  <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                    Signed in on
                  </span>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSignOutOtherSessions}
                      className="font-onest font-bold text-[14px] leading-[20px] text-[#B42318] hover:underline cursor-pointer"
                    >
                      Sign out of all other devices
                    </button>
                  )}
                </div>

                {/* Device List */}
                <div className="flex flex-col">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="flex items-center justify-between py-[12px] border-t border-[#EEF1F6] first:border-t-0"
                    >
                      <div className="flex items-center gap-[12px]">
                        <div className="w-[36px] h-[36px] rounded-full bg-[#EEF1F6] flex items-center justify-center shrink-0">
                          {sess.icon === 'laptop' ? (
                            <Laptop size={16} className="text-[#0B1530]" />
                          ) : (
                            <Smartphone size={16} className="text-[#0B1530]" />
                          )}
                        </div>
                        <div className="flex flex-col gap-[2px]">
                          <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                            {sess.device}
                          </span>
                          <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                            {sess.location} · {sess.time}
                          </span>
                        </div>
                      </div>

                      {sess.isCurrent ? (
                        <span className="inline-flex items-center px-[8px] py-[1px] h-[24px] bg-[#E6ECFB] border border-[#E6ECFB] rounded-[6px]">
                          <span className="font-onest font-bold text-[12px] leading-[16px] text-[#2F4FBF]">
                            Active now
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSignOutSession(sess.id)}
                          className="inline-flex items-center justify-center px-[15px] h-[36px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] font-onest font-bold text-[14px] text-[#0B1530] transition-colors cursor-pointer select-none"
                        >
                          Sign out
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7: Danger Zone / Log out (884px x 172px) */}
          <div id="settings-danger" className="w-full flex flex-col gap-[16px]">
            {/* Log out Card */}
            <div className="w-full bg-white border border-[#DDE2EC] rounded-[12px] p-[19px_25px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
              <div className="flex flex-col gap-[2px]">
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#0B1530]">
                  Log out
                </span>
                <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                  Reminders still reach your email while you are away.
                </span>
              </div>

              <button
                type="button"
                onClick={() => onTriggerToast('Logged out of Billza demo session')}
                className="inline-flex items-center px-[15px] h-[38px] gap-[8px] bg-white border border-[#DDE2EC] hover:border-[#77839F] rounded-[10px] font-onest font-bold text-[14px] text-[#0B1530] transition-colors cursor-pointer select-none shrink-0"
              >
                <LogOut size={16} strokeWidth={2} />
                <span>Log out</span>
              </button>
            </div>

            {/* Delete Account Card */}
            <div className="w-full bg-[#FFF8F7] border border-[#F5C2BC] rounded-[12px] p-[19px_25px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
              <div className="flex flex-col gap-[2px]">
                <span className="font-onest font-bold text-[14px] leading-[20px] text-[#B42318]">
                  Delete account
                </span>
                <span className="font-onest font-medium text-[12px] leading-[16px] text-[#4A5675]">
                  Removes your bills, reminders and payment records from Billza.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center justify-center px-[15px] h-[38px] bg-white border border-[#F5C2BC] hover:bg-white/80 rounded-[10px] font-onest font-bold text-[14px] text-[#B42318] transition-colors cursor-pointer select-none shrink-0"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsChangingPassword(false)}
        >
          <div
            className="w-full max-w-[420px] bg-white rounded-[16px] border border-[#DDE2EC] p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EEF1F6]">
              <h3 className="font-bold text-[18px] text-[#0B1530]">Change Password</h3>
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="text-[#4A5675] hover:text-[#0B1530]"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#4A5675]">
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-[40px] px-3 border border-[#DDE2EC] rounded-[8px] text-[14px]"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#4A5675]">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-[40px] px-3 border border-[#DDE2EC] rounded-[8px] text-[14px]"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="h-[38px] px-4 border border-[#DDE2EC] text-[#4A5675] font-bold text-[13px] rounded-[8px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newPassword.length >= 8) {
                    setIsChangingPassword(false);
                    onTriggerToast('Password changed successfully');
                  } else {
                    onTriggerToast('Password must be at least 8 characters');
                  }
                }}
                className="h-[38px] px-4 bg-[#0B1530] text-white font-bold text-[13px] rounded-[8px]"
              >
                Update password
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove your bills, reminders, and payment history from Billza."
        confirmLabel="Yes, delete account"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onTriggerToast('Account deletion request queued');
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
