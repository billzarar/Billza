import React, { useState } from 'react';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Clock,
  Check,
  Zap,
} from 'lucide-react';
import { BillzaLogo } from './BillIcons';
import { loginUser, verifyWalletAuth, getWalletNonce, AuthUser, getUserProfile } from '../services/api';
import { signChallengeMessage, openOfficialStellarWalletsKit } from '../services/stellarWallet';

interface LoginPageProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateSignup: () => void;
  onNavigateLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateSignup,
  onNavigateLanding,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email / Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser(email.trim(), password);
      if (response.user) {
        onSuccess(response.user);
      } else {
        const profile = await getUserProfile();
        onSuccess(profile);
      }
    } catch (err: any) {
      console.warn('Login note:', err);
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Account Filler
  const fillDemoAccount = () => {
    setEmail('demo@billza.app');
    setPassword('BillzaTestnet2026!');
    setErrorMessage(null);
  };

  // Official Stellar Wallets Kit Connect
  const handleOfficialWalletLogin = async () => {
    setErrorMessage(null);
    setIsWalletLoading(true);

    try {
      const walletAddress = await openOfficialStellarWalletsKit();
      if (!walletAddress) {
        // User cancelled or closed the modal: stay on the page, DO NOT redirect!
        setIsWalletLoading(false);
        return;
      }

      // Step 1: Request cryptographic nonce challenge from backend
      const nonceRes = await getWalletNonce(walletAddress);
      const nonce = nonceRes.nonce;
      const messageToSign =
        nonceRes.message || `Sign this message to authenticate with Billza: ${nonce}`;

      // Step 2: Request wallet signature
      const signature = await signChallengeMessage(messageToSign, walletAddress);

      // Step 3: Verify signature with Django backend & receive JWT tokens
      const authData = await verifyWalletAuth(walletAddress, nonce, signature);

      if (authData.user) {
        onSuccess(authData.user);
      } else {
        const profile = await getUserProfile();
        onSuccess(profile);
      }
    } catch (err: any) {
      console.error('Wallet auth failed:', err);
      setErrorMessage(err?.message || 'Wallet authentication failed. Please try again.');
    } finally {
      setIsWalletLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#0B1530] font-onest flex flex-col lg:flex-row items-stretch justify-between overflow-x-hidden">
      {/* =========================================================================
          LEFT COLUMN: FORM & LOGIN (Width: 680px, Padding: 28px 64px 32px)
      ========================================================================= */}
      <div className="w-full lg:w-[680px] shrink-0 min-h-screen bg-white flex flex-col justify-between px-6 sm:px-12 lg:px-[64px] py-[28px] lg:py-[32px] gap-[32px]">
        {/* Top Header with Wordmark Logo & Back Link */}
        <div className="w-full max-w-[552px] h-[44px] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onNavigateLanding}
            className="flex items-center cursor-pointer focus:outline-none"
            aria-label="Billza Home"
          >
            <BillzaLogo variant="light" />
          </button>

          <button
            type="button"
            onClick={onNavigateLanding}
            className="flex items-center gap-1.5 text-[14px] font-bold text-[#0B1530] hover:text-[#4164D9] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2.2} />
            <span>Home</span>
          </button>
        </div>

        {/* Main Content Area (Max Width: 552px, Centered Container: 400px) */}
        <div className="w-full max-w-[552px] flex flex-col items-center justify-center my-auto">
          <div className="w-full max-w-[400px] flex flex-col gap-[28px]">
            {/* Title & Subtitle */}
            <div className="flex flex-col gap-[7.5px]">
              <h1 className="text-[28px] leading-[36px] font-extrabold text-[#0B1530] tracking-[-0.5px]">
                Welcome back
              </h1>
              <p className="text-[16px] leading-[24px] font-normal text-[#4A5675]">
                Sign in to manage your bills and Stellar payments
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-[10px] bg-[#FFF8F7] border border-[#B42318] flex items-center gap-2.5 text-xs text-[#B42318]">
                <AlertCircle size={16} className="shrink-0 text-[#B42318]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
              {/* 1. Email Field */}
              <div className="flex flex-col gap-[8px]">
                <label className="text-[14px] leading-[20px] font-semibold text-[#0B1530]">
                  Email address
                </label>
                <div className="h-[48px] bg-white border border-[#77839F] rounded-[10px] px-[15px] flex items-center focus-within:border-[#4164D9] focus-within:ring-1 focus-within:ring-[#4164D9] transition-all">
                  <input
                    type="email"
                    required
                    placeholder="demo@billza.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-[16px] leading-[24px] text-[#0B1530] placeholder-[#5F6A86] outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* 2. Password Field */}
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center justify-between">
                  <label className="text-[14px] leading-[20px] font-semibold text-[#0B1530]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={fillDemoAccount}
                    className="text-[12px] font-bold text-[#4164D9] hover:underline cursor-pointer"
                  >
                    Fill Demo
                  </button>
                </div>
                <div className="h-[48px] bg-white border border-[#77839F] rounded-[10px] pl-[15px] pr-[7px] flex items-center justify-between focus-within:border-2 focus-within:border-[#4164D9] transition-all">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-[16px] leading-[24px] text-[#0B1530] placeholder-[#5F6A86] outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center text-[#4A5675] hover:text-[#0B1530] transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading || isWalletLoading}
                className="w-full h-[44px] bg-[#0B1530] hover:bg-[#18264e] text-white text-[16px] leading-[24px] font-bold rounded-[10px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? <span>Verifying...</span> : <span>Go to dashboard</span>}
              </button>

              {/* Official Stellar Wallets Kit Connect */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleOfficialWalletLogin}
                  disabled={isWalletLoading || isLoading}
                  className="w-full h-[44px] bg-white hover:bg-[#F3F5F9] border border-[#DDE2EC] text-[#0B1530] text-[14px] leading-[20px] font-bold rounded-[10px] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  <Wallet size={18} className="text-[#4164D9]" />
                  <span>
                    {isWalletLoading ? 'Connecting Stellar Kit...' : 'Connect with Stellar Wallets Kit'}
                  </span>
                </button>
                <p className="text-center text-[11px] text-[#77839F] flex items-center justify-center gap-1">
                  <ShieldCheck size={13} className="text-[#2B9460]" />
                  Works with Freighter, Albedo, xBull & Lobstr
                </p>
              </div>
            </form>

            {/* Quick Demo Credentials Autofill Banner */}
            <div className="p-3 bg-[#F8F9FC] border border-[#DDE2EC] rounded-[10px] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold text-[#0B1530]">Demo Testnet Account</p>
                <p className="text-[11px] text-[#4A5675]">demo@billza.app · pre-seeded bills</p>
              </div>
              <button
                type="button"
                onClick={fillDemoAccount}
                className="px-2.5 py-1 text-[11px] font-bold text-[#4164D9] bg-[#E6ECFB] hover:bg-[#d8e3fb] rounded-[6px] transition-colors cursor-pointer"
              >
                Autofill
              </button>
            </div>

            {/* Don't have an account? Sign up */}
            <div className="text-center text-[14px] leading-[20px] font-medium text-[#4A5675]">
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={onNavigateSignup}
                className="text-[#0B1530] font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-[552px] flex items-center justify-between text-[13px] leading-[18px] font-medium text-[#4A5675] shrink-0 pt-4">
          <span>© 2026 Billza</span>
          <div className="flex items-center gap-[20px]">
            <a href="#" className="hover:text-[#0B1530] transition-colors">
              Help
            </a>
            <a href="#" className="hover:text-[#0B1530] transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-[#0B1530] transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: AUTH PANEL (Width: 760px, Padding: 16px, Hero Canvas)
      ========================================================================= */}
      <div className="hidden lg:flex w-[760px] p-[16px] shrink-0 min-h-screen">
        <div
          className="relative w-[728px] h-full min-h-[868px] rounded-[24px] overflow-hidden p-[48px] flex flex-col justify-between selection:bg-[#4164D9]"
          style={{
            background: `
              radial-gradient(57.69% 48.39% at 55% 32%, rgba(122, 214, 160, 0.5) 0%, rgba(43, 148, 96, 0.22) 45%, rgba(43, 148, 96, 0) 75%),
              radial-gradient(57.69% 41.47% at 0% 100%, rgba(65, 100, 217, 0.4) 0%, rgba(65, 100, 217, 0) 70%),
              radial-gradient(49.45% 34.56% at 100% 0%, rgba(43, 148, 96, 0.3) 0%, rgba(43, 148, 96, 0) 70%),
              linear-gradient(180deg, #0F1D40 0%, #0B1530 100%),
              #0B1530
            `,
          }}
        >
          {/* Grid Accent Lines */}
          <div className="absolute left-[48px] top-0 bottom-0 w-[1px] bg-white/[0.07] pointer-events-none" />
          <div className="absolute right-[48px] top-0 bottom-0 w-[1px] bg-white/[0.07] pointer-events-none" />
          <div className="absolute left-0 right-0 top-[96px] h-[1px] bg-white/[0.07] pointer-events-none" />

          {/* Floating Visual Cards Container */}
          <div className="relative w-full h-[440px] mt-[60px] pointer-events-none">
            {/* Card 1: Bill Card (360px x 114px, Rotated -4deg, White with Shadow) */}
            <div
              className="absolute left-[80px] top-[100px] w-[360px] h-[114px] bg-white rounded-[14px] p-5 shadow-[0px_30px_60px_rgba(0,0,0,0.35)] flex justify-between items-center z-10"
              style={{ transform: 'rotate(-4deg)' }}
            >
              <div className="flex flex-col justify-between h-full">
                <span className="text-[12px] leading-[16px] font-semibold text-[#4A5675]">
                  Utilities, monthly
                </span>
                <span className="text-[18px] leading-[24px] font-extrabold text-[#0B1530]">
                  Internet
                </span>
                <div className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-[#FDF1DD] border border-[#B8740A] text-[#94560A] text-[12px] leading-[16px] font-bold">
                  Due in 3 days
                </div>
              </div>
              <div className="flex flex-col items-end justify-center h-full">
                <span className="text-[22px] leading-[28px] font-extrabold text-[#0B1530] tracking-[-0.4px]">
                  38.50
                </span>
                <span className="text-[12px] leading-[16px] font-bold text-[#4A5675]">
                  USDC
                </span>
              </div>
            </div>

            {/* Card 2: Crosshair Reminder Box (250px x 68px, Dark Navy with 4 white crosshairs) */}
            <div className="absolute left-[40px] top-[10px] w-[250px] h-[68px] bg-[#0B1530] border border-white/50 p-3.5 flex items-center gap-3 z-20">
              <div className="absolute -top-[4px] -left-[4px] w-[9px] h-[9px] bg-white" />
              <div className="absolute -top-[4px] -right-[4px] w-[9px] h-[9px] bg-white" />
              <div className="absolute -bottom-[4px] -left-[4px] w-[9px] h-[9px] bg-white" />
              <div className="absolute -bottom-[4px] -right-[4px] w-[9px] h-[9px] bg-white" />

              <div className="w-[36px] h-[36px] rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] leading-[20px] font-bold text-white">
                  Reminder sent
                </span>
                <span className="text-[12px] leading-[16px] font-medium text-[#C3CBDD]">
                  3 days before Internet is due
                </span>
              </div>
            </div>

            {/* Card 3: Paid on Stellar Receipt Popup (230px x 106px, White with Shadow) */}
            <div className="absolute left-[240px] top-[260px] w-[230px] h-[106px] bg-white rounded-[12px] p-4 shadow-[0px_20px_40px_rgba(0,0,0,0.3)] flex flex-col justify-between z-20">
              <div className="self-start inline-flex items-center px-2 py-0.5 rounded-[4px] border border-[#2B9460] text-[#1B7A4B] text-[11px] leading-[14px] font-bold tracking-[0.6px] uppercase" style={{ transform: 'rotate(-3deg)' }}>
                Paid on Stellar
              </div>
              <span className="text-[14px] leading-[20px] font-bold text-[#0B1530]">
                Phone plan · 120.00 XLM
              </span>
              <span className="font-mono-redhat text-[12px] leading-[16px] font-normal text-[#4A5675]">
                tx 7c1e…3a90
              </span>
            </div>
          </div>

          {/* Bottom Headline & Trust Microcopy */}
          <div className="flex flex-col gap-[16px] z-10">
            <div className="flex flex-col">
              <h2 className="text-[44px] leading-[50px] font-medium tracking-[-1.6px] text-white">
                Stay ahead
              </h2>
              <span className="text-[44px] leading-[50px] font-medium tracking-[-1.6px] text-[#8E9BBB]">
                of every bill.
              </span>
            </div>

            <div className="flex items-center gap-[10px] text-[14px] leading-[20px] font-medium text-[#C3CBDD]">
              <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#5FD39A] flex items-center justify-center shrink-0">
                <Check size={11} strokeWidth={3} className="text-[#5FD39A]" />
              </div>
              <span>Billza never holds your money. You approve each transaction.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
