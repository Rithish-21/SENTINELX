import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  User,
  Building2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile } from '../../types/sentinel';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUsers: UserProfile[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  availableUsers,
}) => {
  const {
    authModalMode,
    setAuthModalMode,
    signin,
    demoLogin,
    signupSendOtp,
    signupVerifyOtp,
    pendingOtpSession,
  } = useAuth();

  // Sign In Form States
  const [signInIdentifier, setSignInIdentifier] = useState('alex.vance@sentinelx.security');
  const [signInPassword, setSignInPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpChannel, setSignUpChannel] = useState<'email' | 'sms'>('email');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState('SOC Security Analyst');
  const [signUpDept, setSignUpDept] = useState('Cyber Threat Intelligence');

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset errors when mode changes
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [authModalMode]);

  // Timer countdown for OTP screen
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (authModalMode === 'verify-otp' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authModalMode, timerSeconds]);

  // Autofocus first OTP box
  useEffect(() => {
    if (authModalMode === 'verify-otp') {
      setOtpDigits(['', '', '', '', '', '']);
      setTimerSeconds(60);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [authModalMode]);

  if (!isOpen) return null;

  // Handle Sign In Submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signin({
        identifier: signInIdentifier,
        password: signInPassword,
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up (Send OTP) Submit
  const handleSignUpSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!signUpName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (signUpChannel === 'email' && !signUpEmail.trim()) {
      setErrorMessage('Valid email address is required.');
      return;
    }
    if (signUpChannel === 'sms' && !signUpPhone.trim()) {
      setErrorMessage('Valid phone number is required.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signupSendOtp({
        name: signUpName,
        channel: signUpChannel,
        email: signUpChannel === 'email' ? signUpEmail : undefined,
        phone: signUpChannel === 'sms' ? signUpPhone : undefined,
        password: signUpPassword,
        role: signUpRole,
        department: signUpDept,
      });
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP Input Change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance cursor
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP Keydown (Backspace navigation)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste into OTP Input
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const chars = pastedData.split('');
      setOtpDigits(chars);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Handle Auto-fill OTP in Demo Mode
  const handleAutoFillOtp = () => {
    if (pendingOtpSession?.debugOtp) {
      const chars = pendingOtpSession.debugOtp.split('');
      setOtpDigits(chars);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Handle Copy Debug OTP
  const handleCopyDebugOtp = () => {
    if (pendingOtpSession?.debugOtp) {
      navigator.clipboard.writeText(pendingOtpSession.debugOtp);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Handle OTP Verification Submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signupVerifyOtp(code);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect verification code. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!pendingOtpSession || timerSeconds > 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await signupSendOtp({
        name: pendingOtpSession.name,
        channel: pendingOtpSession.channel,
        email: pendingOtpSession.channel === 'email' ? pendingOtpSession.destination : undefined,
        phone: pendingOtpSession.channel === 'sms' ? pendingOtpSession.destination : undefined,
        password: 'password123',
      });
      setTimerSeconds(60);
      setSuccessMessage(`New verification code sent: ${res.message}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'Empty', score: 0, color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: 'Moderate', score: 40, color: 'bg-amber-500' };
    if (score <= 4) return { label: 'Strong Cyber Key', score: 80, color: 'bg-[#00D2D3]' };
    return { label: 'Military-Grade Entropy', score: 100, color: 'bg-emerald-400' };
  };

  const passwordStrength = getPasswordStrength(signUpPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050811]/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0A1020] border border-[#1F3158] rounded-2xl shadow-cyan-glow-lg overflow-hidden flex flex-col">
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2D3] via-[#3B82F6] to-[#FF2E93]" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#182747]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00D2D3]/10 border border-[#00D2D3]/40 shadow-cyan-glow">
              <ShieldCheck className="w-6 h-6 text-[#00D2D3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg text-white tracking-wider">
                  SENTINEL<span className="text-[#00D2D3]">X</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#111C33] border border-[#1F3158] text-[#00D2D3] rounded">
                  ZERO-TRUST AUTH
                </span>
              </div>
              <p className="text-xs text-[#8E9EB8] font-mono">
                AI Cyber Defense & Identity Verification Gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#182747] transition-all cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs (Sign In / Register) */}
        {authModalMode !== 'verify-otp' && (
          <div className="grid grid-cols-2 p-1.5 m-6 mb-2 bg-[#060B16] border border-[#182747] rounded-xl font-mono text-xs">
            <button
              onClick={() => setAuthModalMode('signin')}
              className={`py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authModalMode === 'signin'
                  ? 'bg-[#182747] text-[#00D2D3] border border-[#00D2D3]/40 shadow-cyan-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              OPERATOR SIGN IN
            </button>
            <button
              onClick={() => setAuthModalMode('signup')}
              className={`py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authModalMode === 'signup'
                  ? 'bg-[#182747] text-[#00D2D3] border border-[#00D2D3]/40 shadow-cyan-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              REGISTER NEW ACCOUNT
            </button>
          </div>
        )}

        {/* Dynamic Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* Global Alert / Toast feedback */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SIGN IN */}
          {/* ========================================================================= */}
          {authModalMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8E9EB8] mb-1.5">
                  OPERATOR IDENTIFIER (EMAIL / PHONE / USER ID)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#00D2D3] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="alex.vance@sentinelx.security or USR-84920"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080D1A] border border-[#1F3158] focus:border-[#00D2D3] text-sm text-slate-100 placeholder-slate-500 font-mono outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-[#8E9EB8]">
                    PASSWORD CREDENTIAL
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-mono text-[#00D2D3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#00D2D3] absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080D1A] border border-[#1F3158] focus:border-[#00D2D3] text-sm text-slate-100 placeholder-slate-500 font-mono outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00D2D3] to-[#3B82F6] hover:from-[#00E5E6] hover:to-[#2563EB] text-[#0A0F1D] font-bold font-mono text-sm transition-all shadow-cyan-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    AUTHORIZE DIGITAL SESSION
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Preset Quick Logins */}
              <div className="pt-4 border-t border-[#182747]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#00D2D3]" />
                  <span className="text-[11px] font-mono text-[#8E9EB8] uppercase tracking-wider">
                    Instant Demo SOC Profiles (One-Click)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {availableUsers.map((u) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => demoLogin(u)}
                      className="p-2.5 rounded-lg bg-[#0D1527] hover:bg-[#182747] border border-[#1F3158] hover:border-[#00D2D3] transition-all text-left flex items-center gap-2.5 cursor-pointer group"
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover border border-[#00D2D3]/40"
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-[#00D2D3] truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {u.tier.replace('_', ' ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: REGISTER (SIGN UP WITH EMAIL OR PHONE OTP) */}
          {/* ========================================================================= */}
          {authModalMode === 'signup' && (
            <form onSubmit={handleSignUpSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8E9EB8] mb-1.5">
                  OPERATOR FULL NAME
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#00D2D3] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Commander Marcus Kane"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080D1A] border border-[#1F3158] focus:border-[#00D2D3] text-sm text-slate-100 font-mono outline-none transition-all"
                  />
                </div>
              </div>

              {/* Contact Verification Channel Switcher */}
              <div>
                <label className="block text-xs font-mono text-[#8E9EB8] mb-1.5">
                  SELECT OTP DISPATCH CHANNEL
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignUpChannel('email')}
                    className={`py-2 px-3 rounded-lg border font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      signUpChannel === 'email'
                        ? 'bg-[#00D2D3]/15 border-[#00D2D3] text-[#00D2D3] shadow-cyan-glow'
                        : 'bg-[#0D1527] border-[#1F3158] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Verify via Email
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignUpChannel('sms')}
                    className={`py-2 px-3 rounded-lg border font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      signUpChannel === 'sms'
                        ? 'bg-[#00D2D3]/15 border-[#00D2D3] text-[#00D2D3] shadow-cyan-glow'
                        : 'bg-[#0D1527] border-[#1F3158] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Verify via Phone (SMS)
                  </button>
                </div>
              </div>

              {/* Dynamic Input based on Channel */}
              {signUpChannel === 'email' ? (
                <div>
                  <label className="block text-xs font-mono text-[#8E9EB8] mb-1.5">
                    CORPORATE EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#00D2D3] absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="operator@sentinelx.security"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080D1A] border border-[#1F3158] focus:border-[#00D2D3] text-sm text-slate-100 font-mono outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono text-[#8E9EB8] mb-1.5">
                    MOBILE PHONE NUMBER (FOR SMS OTP)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#00D2D3] absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      placeholder="+1 (555) 349-9201"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080D1A] border border-[#1F3158] focus:border-[#00D2D3] text-sm text-slate-100 font-mono outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Role & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#8E9EB8] mb-1.5">
                    SOC ROLE
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#00D2D3] absolute left-3 top-3" />
                    <select
                      value={signUpRole}
                      onChange={(e) => setSignUpRole(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#080D1A] border border-[#1F3158] text-xs text-slate-200 font-mono outline-none"
                    >
                      <option value="SOC Security Analyst">SOC Security Analyst</option>
                      <option value="Lead Threat Hunter">Lead Threat Hunter</option>
                      <option value="Incident Response Lead">Incident Response Lead</option>
                      <option value="CISO Executive">CISO Executive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8E9EB8] mb-1.5">
                    DEPARTMENT
                  </label>
                  <select
                    value={signUpDept}
                    onChange={(e) => setSignUpDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#080D1A] border border-[#1F3158] text-xs text-slate-200 font-mono outline-none"
                  >
                    <option value="Cyber Threat Intelligence">Cyber Threat Intelligence</option>
                    <option value="Fraud Operations & ATO">Fraud Operations & ATO</option>
                    <option value="Identity & Access Governance">Identity & Access Governance</option>
                    <option value="Executive Security Detail">Executive Security Detail</option>
                  </select>
                </div>
              </div>

              {/* Password & Entropy Meter */}
              <div>
                <label className="block text-xs font-mono text-[#8E9EB8] mb-1.5">
                  SECURITY MASTER KEY / PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#00D2D3] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create a strong password (min 6 chars)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080D1A] border border-[#1F3158] focus:border-[#00D2D3] text-sm text-slate-100 font-mono outline-none transition-all"
                  />
                </div>
                {signUpPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Entropy Strength:</span>
                      <span className="text-[#00D2D3] font-bold">{passwordStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00D2D3] to-[#3B82F6] hover:from-[#00E5E6] hover:to-[#2563EB] text-[#0A0F1D] font-bold font-mono text-sm transition-all shadow-cyan-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    DISPATCHING OTP...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    SEND 6-DIGIT OTP VERIFICATION
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: OTP VERIFICATION SCREEN */}
          {/* ========================================================================= */}
          {authModalMode === 'verify-otp' && pendingOtpSession && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-[#00D2D3]/10 border border-[#00D2D3]/50 shadow-cyan-glow">
                  <KeyRound className="w-7 h-7 text-[#00D2D3] animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white font-display">
                  TWO-FACTOR IDENTITY VERIFICATION
                </h3>
                <p className="text-xs text-[#8E9EB8] font-mono max-w-md mx-auto">
                  A 6-digit cryptographic verification code was dispatched to:
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111C33] border border-[#00D2D3]/50 text-[#00D2D3] font-mono text-xs font-bold">
                  {pendingOtpSession.channel === 'email' ? (
                    <Mail className="w-3.5 h-3.5" />
                  ) : (
                    <Phone className="w-3.5 h-3.5" />
                  )}
                  {pendingOtpSession.destination}
                </div>
              </div>

              {/* DEMO / TEST HUD OTP PREVIEW NOTIFICATION */}
              {pendingOtpSession.debugOtp && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/50 shadow-cyan-glow flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                    <div>
                      <div className="text-[11px] font-mono font-bold text-emerald-300">
                        ⚡ DEMO OTP INTERCEPTOR
                      </div>
                      <div className="text-xs font-mono text-slate-300">
                        Verification Code: <span className="text-white font-black tracking-widest text-sm bg-black/40 px-2 py-0.5 rounded border border-emerald-500/40">{pendingOtpSession.debugOtp}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyDebugOtp}
                      className="px-2.5 py-1 rounded bg-[#182747] hover:bg-[#1F3158] border border-[#2A3F6D] text-[11px] font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Copy OTP"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#00D2D3]" />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoFillOtp}
                      className="px-2.5 py-1 rounded bg-[#00D2D3] hover:bg-[#00E5E6] text-[#0A0F1D] font-bold text-[11px] font-mono flex items-center gap-1 cursor-pointer shadow-cyan-glow"
                    >
                      <Zap className="w-3 h-3" />
                      Auto-Fill
                    </button>
                  </div>
                </div>
              )}

              {/* 6-Digit Segmented OTP Input */}
              <div className="flex justify-center items-center gap-2.5 sm:gap-3.5 my-4">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-mono font-black rounded-xl bg-[#080D1A] border transition-all outline-none ${
                      digit
                        ? 'border-[#00D2D3] text-[#00D2D3] shadow-cyan-glow bg-[#00D2D3]/10'
                        : 'border-[#1F3158] text-white focus:border-[#00D2D3] focus:shadow-cyan-glow'
                    }`}
                  />
                ))}
              </div>

              {/* Resend & Timer */}
              <div className="flex items-center justify-between text-xs font-mono text-[#8E9EB8] px-2">
                <span>
                  Expires in:{' '}
                  <strong className={timerSeconds < 15 ? 'text-[#FF2E93]' : 'text-[#00D2D3]'}>
                    00:{timerSeconds.toString().padStart(2, '0')}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timerSeconds > 0 || isSubmitting}
                  className="text-[#00D2D3] hover:underline disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
                >
                  Resend Code
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D2D3] to-emerald-400 hover:from-[#00E5E6] hover:to-emerald-300 text-[#0A0F1D] font-bold font-mono text-sm transition-all shadow-cyan-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    VERIFYING OTP TOKEN...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    VERIFY OTP & ENTER SOC DASHBOARD
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalMode('signup')}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  ← Edit Contact Information
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
