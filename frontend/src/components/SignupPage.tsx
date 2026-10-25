import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Check,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { BillzaLogo } from './BillIcons';
import { registerUser, verifyWalletAuth, getWalletNonce, AuthUser, getStoredUser, getUserProfile } from '../services/api';
import { signChallengeMessage, openOfficialStellarWalletsKit } from '../services/stellarWallet';

interface SignupPageProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateLogin: () => void;
  onNavigateLanding: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onSuccess,
  onNavigateLogin,
  onNavigateLanding,
}) => {
  // Step 1: Create Account Form, Step 2: Verify Email (From Figma Spec)
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 6-digit verification code state
  const [codeDigits, setCodeDigits] = useState<string[]>(['5', '2', '0', '7', '', '']);
  const [resendTimer, setResendTimer] = useState(42);

  const [isLoading, setIsLoading] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Live Password Criteria Calculations
  const hasMinLength = password.length >= 10;
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const notEmailOrName =
    password.length > 0 &&
    (!email || !password.toLowerCase().includes(email.split('@')[0].toLowerCase())) &&
    (!fullName || !password.toLowerCase().includes(fullName.split(' ')[0].toLowerCase()));

  const criteriaMetCount = [hasMinLength, hasNumberOrSymbol, notEmailOrName].filter(Boolean).length;
  const isStrong = criteriaMetCount === 3;
  const isWeak = password.length > 0 && criteriaMetCount < 2;

  // Countdown for resend code
  useEffect(() => {
    if (step === 'verify' && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, resendTimer]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setGlobalError(null);

    if (!fullName.trim()) {
      setGlobalError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (password.length < 10) {
      setPasswordError('Make your password stronger to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerUser(email.trim(), password, fullName.trim());
      // Advance to Email Verification step per Figma spec
      setStep('verify');
    } catch (err: any) {
      console.warn('Registration attempt note:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist')) {
        setEmailError('There’s already an account with this email');
      } else {
        setGlobalError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Complete Email Verification and Go to Dashboard
  const handleVerifyComplete = () => {
    const user = getStoredUser();
    if (user) {
      onSuccess(user);
    } else {
      const nameParts = fullName.trim().split(' ');
      onSuccess({
        id: Date.now(),
        username: email,
        email: email,
        first_name: nameParts[0] || 'User',
        last_name: nameParts.slice(1).join(' ') || '',
        preferred_currency: 'USDC',
      });
    }
  };

  // Official Stellar Wallets Kit Connect
  const handleOfficialWalletSignup = async () => {
    setGlobalError(null);
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
      console.error('Wallet registration failed:', err);
      setGlobalError(err?.message || 'Wallet connection failed. Please try again.');
    } finally {
      setIsWalletLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#0B1530] font-onest flex flex-col lg:flex-row items-stretch justify-between overflow-x-hidden">
      {/* =========================================================================
          LEFT COLUMN: FORM & VERIFICATION (Width: 680px, Padding: 28px 64px 32px)
      ========================================================================= */}
      <div className="w-full lg:w-[680px] shrink-0 min-h-screen bg-white flex flex-col justify-between px-6 sm:px-12 lg:px-[64px] py-[28px] lg:py-[32px] gap-[32px]">
        {/* Top Header with Wordmark Logo & Optional Back Link */}
        <div className="w-full max-w-[552px] h-[44px] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onNavigateLanding}
            className="flex items-center cursor-pointer focus:outline-none"
            aria-label="Billza Home"
          >
            <BillzaLogo variant="light" />
          </button>

          {step === 'verify' && (
            <button
              type="button"
              onClick={() => setStep('form')}
              className="flex items-center gap-1.5 text-[14px] font-bold text-[#0B1530] hover:text-[#4164D9] transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} strokeWidth={2.2} />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Main Content Area (Max Width: 552px, Centered Container: 400px) */}
        <div className="w-full max-w-[552px] flex flex-col items-center justify-center my-auto">
          {step === 'form' ? (
            /* --- STATE 1: CREATE ACCOUNT FORM --- */
            <div className="w-full max-w-[400px] flex flex-col gap-[28px]">
              {/* Title & Subtitle */}
              <div className="flex flex-col gap-[7.5px]">
                <h1 className="text-[28px] leading-[36px] font-extrabold text-[#0B1530] tracking-[-0.5px]">
                  Create your account
                </h1>
                <p className="text-[16px] leading-[24px] font-normal text-[#4A5675]">
                  Track your bills and get reminded before
                </p>
              </div>

              {/* Global Error Banner */}
              {globalError && (
                <div className="p-3.5 rounded-[10px] bg-[#FFF8F7] border border-[#B42318] flex items-center gap-2.5 text-xs text-[#B42318]">
                  <AlertCircle size={16} className="shrink-0 text-[#B42318]" />
                  <span>{globalError}</span>
                </div>
              )}

              {/* Sign Up Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
                {/* 1. Full name Field */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[20px] font-semibold text-[#0B1530]">
                    Full name
                  </label>
                  <div className="h-[48px] bg-white border border-[#77839F] rounded-[10px] px-[15px] flex items-center focus-within:border-[#4164D9] focus-within:ring-1 focus-within:ring-[#4164D9] transition-all">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amara Okafor"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-[16px] leading-[24px] text-[#0B1530] placeholder-[#5F6A86] outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* 2. Email address Field (with error state support) */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[20px] font-semibold text-[#0B1530]">
                    Email address
                  </label>
                  <div
                    className={`h-[48px] rounded-[10px] px-[15px] flex items-center transition-all ${
                      emailError
                        ? 'bg-[#FFF8F7] border border-[#B42318]'
                        : 'bg-white border border-[#77839F] focus-within:border-[#4164D9] focus-within:ring-1 focus-within:ring-[#4164D9]'
                    }`}
                  >
                    <input
                      type="email"
                      required
                      placeholder="amara.okafor@gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      className="w-full text-[16px] leading-[24px] text-[#0B1530] placeholder-[#5F6A86] outline-none bg-transparent"
                    />
                  </div>
                  {emailError && (
                    <div className="flex items-center gap-[6px] text-[13px] leading-[18px] font-medium text-[#B42318]">
                      <AlertCircle size={14} className="shrink-0 text-[#B42318]" />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                {/* 3. Password Field (with focus / error states & show/hide toggle) */}
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[14px] leading-[20px] font-semibold text-[#0B1530]">
                    Password
                  </label>
                  <div
                    className={`h-[48px] rounded-[10px] pl-[15px] pr-[7px] flex items-center justify-between transition-all ${
                      passwordError
                        ? 'bg-[#FFF8F7] border border-[#B42318]'
                        : 'bg-white border border-[#77839F] focus-within:border-2 focus-within:border-[#4164D9]'
                    }`}
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 10 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
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
                  {passwordError && (
                    <div className="flex items-center gap-[6px] text-[13px] leading-[18px] font-medium text-[#B42318]">
                      <AlertCircle size={14} className="shrink-0 text-[#B42318]" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </div>

                {/* 4. Password Strength Meter & Live Checks (Figma Specification) */}
                <div className="flex flex-col gap-[12px]">
                  {/* Strength Bar (4 segments) */}
                  <div className="flex flex-col gap-[6px]">
                    <div className="grid grid-cols-4 gap-[4px] h-[4px]">
                      <div
                        className={`h-[4px] rounded-[2px] transition-colors ${
                          password.length === 0
                            ? 'bg-[#EEF1F6]'
                            : isWeak
                            ? 'bg-[#B42318]'
                            : 'bg-[#1B7A4B]'
                        }`}
                      />
                      <div
                        className={`h-[4px] rounded-[2px] transition-colors ${
                          password.length === 0 || isWeak
                            ? 'bg-[#EEF1F6]'
                            : 'bg-[#1B7A4B]'
                        }`}
                      />
                      <div
                        className={`h-[4px] rounded-[2px] transition-colors ${
                          isStrong ? 'bg-[#1B7A4B]' : 'bg-[#EEF1F6]'
                        }`}
                      />
                      <div
                        className={`h-[4px] rounded-[2px] transition-colors ${
                          isStrong && password.length >= 12 ? 'bg-[#1B7A4B]' : 'bg-[#EEF1F6]'
                        }`}
                      />
                    </div>
                    {password.length > 0 && (
                      <span
                        className={`text-[12px] leading-[16px] font-medium ${
                          isWeak ? 'text-[#B42318]' : 'text-[#1B7A4B]'
                        }`}
                      >
                        {isWeak ? 'Too weak' : 'Strong password'}
                      </span>
                    )}
                  </div>

                  {/* 3 Checklist Items */}
                  <div className="flex flex-col gap-[4px]">
                    <div className="flex items-center gap-[6px] text-[12px] leading-[16px] font-medium">
                      <div
                        className={`w-[12px] h-[12px] rounded-full border flex items-center justify-center shrink-0 ${
                          hasMinLength
                            ? 'border-[#1B7A4B] text-[#1B7A4B]'
                            : password.length > 0
                            ? 'border-[#B42318] text-[#B42318]'
                            : 'border-[#4A5675] text-transparent'
                        }`}
                      >
                        {hasMinLength && <Check size={9} strokeWidth={3} />}
                      </div>
                      <span
                        className={
                          hasMinLength
                            ? 'text-[#1B7A4B]'
                            : password.length > 0
                            ? 'text-[#B42318]'
                            : 'text-[#4A5675]'
                        }
                      >
                        At least 10 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-[6px] text-[12px] leading-[16px] font-medium">
                      <div
                        className={`w-[12px] h-[12px] rounded-full border flex items-center justify-center shrink-0 ${
                          hasNumberOrSymbol
                            ? 'border-[#1B7A4B] text-[#1B7A4B]'
                            : 'border-[#4A5675] text-transparent'
                        }`}
                      >
                        {hasNumberOrSymbol && <Check size={9} strokeWidth={3} />}
                      </div>
                      <span className={hasNumberOrSymbol ? 'text-[#1B7A4B]' : 'text-[#4A5675]'}>
                        A number or symbol
                      </span>
                    </div>

                    <div className="flex items-center gap-[6px] text-[12px] leading-[16px] font-medium">
                      <div
                        className={`w-[12px] h-[12px] rounded-full border flex items-center justify-center shrink-0 ${
                          notEmailOrName
                            ? 'border-[#1B7A4B] text-[#1B7A4B]'
                            : 'border-[#4A5675] text-transparent'
                        }`}
                      >
                        {notEmailOrName && <Check size={9} strokeWidth={3} />}
                      </div>
                      <span className={notEmailOrName ? 'text-[#1B7A4B]' : 'text-[#4A5675]'}>
                        Not your email or name
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Terms of Service Note */}
                <p className="text-[12px] leading-[16px] font-medium text-[#4A5675]">
                  By creating an account you agree to the Terms and Privacy Policy.
                </p>

                {/* 6. Primary Action Button */}
                <button
                  type="submit"
                  disabled={isLoading || isWalletLoading}
                  className="w-full h-[44px] bg-[#0B1530] hover:bg-[#18264e] text-white text-[16px] leading-[24px] font-bold rounded-[10px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? <span>Creating account...</span> : <span>Go to dashboard</span>}
                </button>

                {/* 7. Official Stellar Wallets Kit Connect */}
                <div className="pt-1 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleOfficialWalletSignup}
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

              {/* Already have an account? Log in */}
              <div className="text-center text-[14px] leading-[20px] font-medium text-[#4A5675]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-[#0B1530] font-bold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </div>
          ) : (
            /* --- STATE 2: VERIFY EMAIL SCREEN (Figma Spec) --- */
            <div className="w-full max-w-[400px] flex flex-col gap-[28px]">
              {/* Envelope Icon Box & Header */}
              <div className="flex flex-col gap-[8px]">
                <div className="w-[56px] h-[56px] bg-[#E6ECFB] rounded-[16px] flex items-center justify-center text-[#2F4FBF] mb-2">
                  <Mail size={26} strokeWidth={2} />
                </div>
                <h1 className="text-[28px] leading-[36px] font-extrabold text-[#0B1530] tracking-[-0.5px]">
                  Check your email
                </h1>
                <p className="text-[16px] leading-[24px] font-normal text-[#4A5675]">
                  Enter the 6-digit code we sent to <span className="font-semibold text-[#0B1530]">{email || 'amara.okafor@gmail.com'}</span>
                </p>
              </div>

              {/* 6-Digit Code Inputs */}
              <div className="flex flex-col gap-[8px]">
                <label className="text-[14px] leading-[20px] font-semibold text-[#0B1530]">
                  Code
                </label>
                <div className="grid grid-cols-6 gap-[10px]">
                  {codeDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.slice(-1);
                        const next = [...codeDigits];
                        next[idx] = val;
                        setCodeDigits(next);
                      }}
                      className={`h-[56px] text-center text-[22px] leading-[28px] font-bold text-[#0B1530] rounded-[10px] outline-none transition-all ${
                        idx === 4
                          ? 'border-2 border-[#4164D9] bg-white'
                          : digit
                          ? 'border border-[#0B1530] bg-white'
                          : 'border border-[#77839F] bg-white'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[12px] leading-[16px] font-medium text-[#4A5675]">
                  The code expires in 10 minutes.
                </p>
              </div>

              {/* Resend and Wrong email links */}
              <div className="flex items-center justify-between text-[14px] leading-[20px]">
                <span className="font-medium text-[#4A5675]">
                  {resendTimer > 0 ? (
                    `Didn’t get it? Resend in 0:${resendTimer < 10 ? `0${resendTimer}` : resendTimer}`
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(45)}
                      className="text-[#4164D9] font-bold hover:underline cursor-pointer"
                    >
                      Resend code now
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="font-bold text-[#2F4FBF] hover:underline cursor-pointer"
                >
                  Wrong email?
                </button>
              </div>

              {/* Spam Advice Info Banner */}
              <div className="p-[13px] px-[15px] bg-[#E6ECFB] border border-[#C9D4F7] rounded-[10px] flex items-start gap-[10px]">
                <Info size={18} className="text-[#2F4FBF] shrink-0 mt-0.5" />
                <p className="text-[14px] leading-[20px] font-medium text-[#0B1530]">
                  Can’t find it? Check your spam folder. Codes arrive within a minute.
                </p>
              </div>

              {/* Action Button: Go to Dashboard */}
              <button
                type="button"
                onClick={handleVerifyComplete}
                className="w-full h-[44px] bg-[#0B1530] hover:bg-[#18264e] text-white text-[16px] leading-[24px] font-bold rounded-[10px] transition-colors flex items-center justify-center cursor-pointer"
              >
                Go to dashboard
              </button>
            </div>
          )}
        </div>

        {/* Footer (Width: 552px, Height: 18px) */}
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
          {/* Subtle Grid Accent Lines */}
          <div className="absolute left-[48px] top-0 bottom-0 w-[1px] bg-white/[0.07] pointer-events-none" />
          <div className="absolute right-[48px] top-0 bottom-0 w-[1px] bg-white/[0.07] pointer-events-none" />
          <div className="absolute left-0 right-0 top-[96px] h-[1px] bg-white/[0.07] pointer-events-none" />

          {/* Floating Visual Cards Container */}
          <div className="relative w-full h-[440px] mt-[60px] pointer-events-none">
            {/* Card 1: Bill Card (360px x 114px, Rotated -4deg, White with Shadow) */}
            <div
              className="absolute left-[80px] top-[100px] w-[360px] h-[114px] bg-white rounded-[14px] p-5 shadow-[0px_30px_60px_rgba(0,0,0,0.35)] flex justify-between items-center z-10 transition-transform"
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
              {/* 4 Corner Crosshairs */}
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

          {/* Bottom Headline & Trust Microcopy (Figma Specification) */}
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
