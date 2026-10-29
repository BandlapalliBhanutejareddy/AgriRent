'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Sprout, Tractor, ShieldAlert, Key, Check, Eye, EyeOff, X, User as UserIcon, Phone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OTPInput from '@/components/OTPInput';

type PortalRole = 'FARMER' | 'OWNER' | 'ADMIN';

const portals = {
  FARMER: {
    titleKey: 'farmer_portal',
    subtitleKey: 'farmer_portal_subtitle',
    defaultTitle: 'Farmer Portal',
    defaultSubtitle: 'Rent advanced agricultural machinery & consult AI Farm Advisor',
    icon: Sprout,
    color: 'emerald',
    accentClass: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    textAccentClass: 'text-emerald-600 dark:text-emerald-400',
    bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300',
    tabBorderClass: 'border-emerald-500',
  },
  OWNER: {
    titleKey: 'owner_portal',
    subtitleKey: 'owner_portal_subtitle',
    defaultTitle: 'Owner Portal',
    defaultSubtitle: 'List your equipment, manage bookings, and increase earnings',
    icon: Tractor,
    color: 'indigo',
    accentClass: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    textAccentClass: 'text-indigo-600 dark:text-indigo-400',
    bgLightClass: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300',
    tabBorderClass: 'border-indigo-500',
  },
  ADMIN: {
    titleKey: 'admin_portal',
    subtitleKey: 'admin_portal_subtitle',
    defaultTitle: 'Admin Control Center',
    defaultSubtitle: 'Oversee platform activity, moderate listings, and view system metrics',
    icon: ShieldAlert,
    color: 'amber',
    accentClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    textAccentClass: 'text-amber-600 dark:text-amber-400',
    bgLightClass: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300',
    tabBorderClass: 'border-amber-500',
  },
};

export default function LoginPage() {
  const { t } = useTranslation();
  const [activePortal, setActivePortal] = useState<PortalRole>('FARMER');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setSession, setActiveRole } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [showRoleSelectModal, setShowRoleSelectModal] = useState(false);

  // Forgot Password Flow States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [otpInput, setOtpInput] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // Register OTP Flow States
  const [showRegisterOtpModal, setShowRegisterOtpModal] = useState(false);
  const [registerOtpError, setRegisterOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState('');

  function handlePortalChange(portal: PortalRole) {
    setActivePortal(portal);
    setEmail('');
    setPassword('');
    setError('');
  };

  function executeLogin(user: any, token: string) {
    setUser(user);
    setSession({ access_token: token, user });

    if (user.role === 'BOTH') {
      setActiveRole(null);
      router.push('/dashboard/role-select');
      return;
    }

    if (user.role === 'FARMER') {
      setActiveRole('FARMER');
      router.push('/dashboard/farmer');
    } else if (user.role === 'OWNER') {
      setActiveRole('OWNER');
      router.push('/dashboard');
    } else if (user.role === 'ADMIN') {
      setActiveRole('ADMIN');
      router.push('/dashboard/admin');
    } else {
      setActiveRole('FARMER');
      router.push('/dashboard/farmer');
    }
  };

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const targetRole = activePortal === 'OWNER' ? 'OWNER' : 'FARMER';
      const { data, error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?role=${targetRole}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (sbError) {
        setError(sbError.message);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setError(err?.message || 'Google sign-in initiation failed. Please try again.');
      setLoading(false);
    }
  };

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');

    if (isLoginMode) {
      // LOGIN MODE
      try {
        const response = await api.post('/auth/login', { email, password, role: activePortal });
        if (response.data.success) {
          executeLogin(response.data.user, response.data.token);
        } else {
          setError('Invalid credentials');
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Login failed. Please verify your credentials and try again.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    } else {
      // REGISTER MODE
      if (!registerName) {
        setError('Name is required for registration.');
        setLoading(false);
        return;
      }
      if (registerPhone.trim().length < 10) {
        setError('A valid 10-digit phone number is required for registration.');
        setLoading(false);
        return;
      }
      try {
        const response = await api.post('/auth/register', {
          name: registerName,
          email,
          password,
          phone: registerPhone,
          role: activePortal
        });
        if (response.data.success && response.data.token) {
          executeLogin(response.data.user, response.data.token);
        } else {
          setError(response.data.error || 'Registration failed.');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Registration failed. Email might already be taken.');
      } finally {
        setLoading(false);
      }
    }
  };


  // Timer for cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleVerifyRegisterOtp(e?: React.FormEvent, autoOtp?: string) {
    if (e) e.preventDefault();
    const code = autoOtp || otpInput;
    if (!code) {
      setRegisterOtpError('Please enter the OTP sent to your email.');
      return;
    }
    setRegisterOtpError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp: code, purpose: 'REGISTER' });
      if (response.data.success) {
        setShowRegisterOtpModal(false);
        executeLogin(response.data.user, response.data.token);
      } else {
        setRegisterOtpError('Invalid OTP code. Please check and try again.');
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('expired')) {
        setRegisterOtpError('This OTP code has expired. Please request a new one.');
      } else if (err.response?.status === 400 && err.response?.data?.error?.includes('required')) {
        setRegisterOtpError('Please ensure all fields are filled.');
      } else {
        setRegisterOtpError('OTP verification failed. Incorrect or expired code.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (otpInput.length === 6 && !loading) {
      handleVerifyRegisterOtp(undefined, otpInput);
    }
  }, [otpInput]);

  async function handleResendOtp() {
    if (resendCooldown > 0 || !email) return;
    setLoading(true);
    setRegisterOtpError('');
    try {
      const response = await api.post('/auth/resend-otp', { email, purpose: 'REGISTER' });
      if (response.data.success) {
        setResendCooldown(60); // 60 seconds cooldown
        // We can just show success by clearing error or a toast
      }
    } catch (err: any) {
      setRegisterOtpError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);

  // Cooldown timer for forgot OTP resend
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (forgotResendCooldown > 0) {
      t = setInterval(() => setForgotResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(t);
  }, [forgotResendCooldown]);

  // Auto-verify forgot OTP on 6 digits
  useEffect(() => {
    if (otpInput.length === 6 && forgotStep === 2 && !loading) {
      handleVerifyForgotOtp(undefined, otpInput);
    }
  }, [otpInput, forgotStep]);

  async function handleResendForgotOtp() {
    if (forgotResendCooldown > 0 || !forgotEmail) return;
    setForgotError('');
    try {
      await api.post('/auth/resend-otp', { email: forgotEmail, purpose: 'FORGOT_PASSWORD' });
      setForgotResendCooldown(60);
      setForgotSuccessMsg('New OTP sent to your email!');
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to resend OTP.');
    }
  };

  async function handleSendForgotOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address');
      return;
    }
    setForgotError('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccessMsg('Security One-Time Password sent to your email address!');
      setForgotStep(2);
    } catch (error: any) {
      setForgotError(error.response?.data?.error || 'Failed to request password recovery. Verify your email.');
    }
  };

  async function handleVerifyForgotOtp(e?: React.FormEvent, autoCode?: string) {
    if (e) e.preventDefault();
    const code = autoCode || otpInput;
    if (!code) {
      setForgotError('Please enter the OTP verification code.');
      return;
    }
    setForgotError('');
    setForgotSuccessMsg('');
    setLoading(true);
    try {
      // Actually verify against backend before allowing step 3
      const res = await api.post('/auth/verify-otp', {
        email: forgotEmail,
        otp: code,
        purpose: 'FORGOT_PASSWORD'
      });
      if (res.data.success) {
        setResetToken(res.data.resetToken);
        setForgotStep(3);
      } else {
        setForgotError('Invalid OTP. Please check and try again.');
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('expired')) {
        setForgotError('OTP expired. Please request a new one.');
      } else {
        setForgotError('Invalid or expired OTP code.');
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setForgotError('Password must be at least 8 characters, including 1 uppercase, 1 lowercase, 1 number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotError('');
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        resetToken: resetToken,
        newPassword
      });
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotEmail('');
        setOtpInput('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotStep(1);
        setForgotSuccess(false);
      }, 2000);
    } catch (error: any) {
      setForgotError(error.response?.data?.error || 'Failed to reset password. OTP code may be invalid or expired.');
    }
  };

  const activeConf = portals[activePortal];
  const IconComponent = activeConf.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8F6] dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-6">

        {/* Logo/Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#163A2D] flex items-center justify-center text-[#84CC16] shadow-sm">
              <Tractor size={26} />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold tracking-tight text-[#163A2D] dark:text-white block leading-none">
                AgroRent <span className="text-[#16845B] dark:text-[#84CC16]">AI</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mt-1 tracking-wide">
                Smart Agriculture Platform
              </span>
            </div>
          </div>
        </div>

        {/* Outer Login Box */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1E8E2] dark:border-slate-800 p-8 rounded-2xl shadow-card transition-all duration-300">

          {/* Portal Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-6">
            {(['FARMER', 'OWNER', 'ADMIN'] as PortalRole[]).map((portalKey) => {
              const conf = portals[portalKey];
              const isSelected = activePortal === portalKey;
              const displayName = portalKey === 'FARMER' ? 'Farmer' : portalKey === 'OWNER' ? 'Fleet Owner' : 'Admin';
              return (
                <button
                  key={portalKey}
                  type="button"
                  onClick={() => handlePortalChange(portalKey)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-[#163A2D] dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <conf.icon size={15} className={isSelected ? 'text-[#16845B] dark:text-[#84CC16]' : 'text-slate-400'} />
                  <span>{displayName}</span>
                </button>
              );
            })}
          </div>

          {/* Portal Context Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {activePortal === 'FARMER' ? 'Farmer Portal' : activePortal === 'OWNER' ? 'Equipment Owner Portal' : 'Administrator Control'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
              {t(activeConf.subtitleKey, { defaultValue: activeConf.defaultSubtitle })}
            </p>
          </div>

          {/* Toggle Login / Register */}
          {activePortal !== 'ADMIN' && (
            <div className="flex bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 mb-6">
              <button
                type="button"
                data-testid="login-tab"
                onClick={() => { setIsLoginMode(true); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isLoginMode
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                data-testid="register-tab"
                onClick={() => { setIsLoginMode(false); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  !isLoginMode
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-[#B42318] p-3.5 mb-6 rounded-r-xl">
              <p className="text-xs text-[#B42318] dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            <div className="space-y-4">

              {!isLoginMode && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                      Full name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16845B]/20 focus:border-[#16845B] transition-all text-sm font-normal"
                        placeholder="e.g. Ramesh Patel"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                      />
                      <UserIcon size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                      Phone number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16845B]/20 focus:border-[#16845B] transition-all text-sm font-normal"
                        placeholder="+91 9876543210"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                      />
                      <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16845B]/20 focus:border-[#16845B] transition-all text-sm font-normal"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-3.5 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16845B]/20 focus:border-[#16845B] transition-all text-sm font-normal"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password Action Trigger */}
            {isLoginMode && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setForgotError('');
                    setForgotSuccessMsg('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-medium text-[#16845B] dark:text-[#84CC16] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Standard Sign-In Button */}
            <button
              type="submit"
              data-testid={isLoginMode ? "login-button" : "register-button"}
              disabled={loading || !mounted}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#163A2D] hover:bg-[#205140] transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || !mounted}
            data-testid="google-signin-button"
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>

      {/* Registration OTP Modal */}
      <AnimatePresence>
        {showRegisterOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 w-full max-w-md p-8 rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="text-center mb-6">
                <span className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl inline-block mb-3">
                  <Check size={24} className="animate-bounce" />
                </span>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">{t('verify_your_account', { defaultValue: 'Verify Your Account' })}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
                  {t('we_ve_sent_a_secure_one_time_password_to')}{email}.
                </p>
                {deliveryStatus && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold mt-1">
                    {deliveryStatus}
                  </p>
                )}
              </div>

              {registerOtpError && (
                <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 mb-4 rounded-r-xl">
                  <p className="text-xs text-red-700 dark:text-red-400 font-semibold">{registerOtpError}</p>
                </div>
              )}

              <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1 text-center">
                    {t('enter_6_digit_otp_code')}</label>
                  <OTPInput
                    length={6}
                    onComplete={(code) => setOtpInput(code)}
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20 text-white font-black text-sm rounded-xl shadow-lg transition-colors disabled:opacity-50"
                >
                  {loading ? t('verifying', { defaultValue: 'Verifying...' }) : t('verify_continue', { defaultValue: 'Verify & Continue' })}
                </button>

                <div className="mt-4 flex flex-col items-center space-y-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:opacity-50 transition-colors"
                  >
                    {resendCooldown > 0 ? t('resend_otp_in', { defaultValue: `Resend OTP in ${resendCooldown}s`, cooldown: resendCooldown }) : t('resend_otp', { defaultValue: 'Resend OTP' })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegisterOtpModal(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium hover:underline transition-colors"
                  >
                    {t('change_email_address')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Elegant Forgot Password Modal with OTP Steps */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 w-full max-w-md p-8 rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <span className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl inline-block mb-3">
                  <Key size={24} className="animate-bounce" />
                </span>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">{t('recover_password', { defaultValue: 'Recover Password' })}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
                  {t('verify_your_account_utilizing_secure_one')}</p>
              </div>

              {forgotError && (
                <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 mb-4 rounded-r-xl">
                  <p className="text-xs text-red-700 dark:text-red-400 font-semibold">{forgotError}</p>
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 mb-4 rounded-r-xl">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{forgotSuccessMsg}</p>
                </div>
              )}

              {forgotSuccess ? (
                <div className="text-center py-6">
                  <span className="p-3 bg-emerald-500 text-white rounded-full inline-block mb-3 animate-pulse">
                    <Check size={28} />
                  </span>
                  <h4 className="font-black text-emerald-600 dark:text-emerald-400">{t('password_reset_successful', { defaultValue: 'Password Reset Successful!' })}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2">
                    {t('returning_to_the_main_portal_sign_in_vie')}</p>
                </div>
              ) : (
                <>
                  {forgotStep === 1 && (
                    <form onSubmit={handleSendForgotOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                          {t('account_email_address')}</label>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                          placeholder={t('your_email_com')}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20 text-white font-black text-sm rounded-xl shadow-lg transition-colors"
                      >
                        {t('request_one_time_password')}</button>
                    </form>
                  )}

                  {forgotStep === 2 && (
                    <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1 text-center">
                          {t('verify_6_digit_otp_code')}</label>
                        <OTPInput
                          length={6}
                          onComplete={(code) => setOtpInput(code)}
                          disabled={loading}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20 text-white font-black text-sm rounded-xl shadow-lg transition-colors disabled:opacity-50"
                      >
                        {loading ? t('verifying', { defaultValue: 'Verifying...' }) : t('verify_code', { defaultValue: 'Verify Code' })}
                      </button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendForgotOtp}
                          disabled={forgotResendCooldown > 0 || loading}
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:opacity-50 transition-colors"
                        >
                          {forgotResendCooldown > 0 ? t('resend_otp_in', { defaultValue: `Resend OTP in ${forgotResendCooldown}s`, cooldown: forgotResendCooldown }) : t('resend_otp', { defaultValue: 'Resend OTP' })}
                        </button>
                      </div>
                    </form>
                  )}

                  {forgotStep === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                          {t('new_secure_password')}</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                          placeholder={t('at_least_8_characters')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                          {t('confirm_new_password')}</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                          placeholder={t('re_type_new_password')}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20 text-white font-black text-sm rounded-xl shadow-lg transition-colors"
                      >
                        {t('reset_and_save_password')}</button>
                    </form>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Multi-Role Portal Mode Selection Modal */}
      {showRoleSelectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6"
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Multi-Role Account Detected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your account possesses both Farmer and Fleet Owner capabilities. Which portal would you like to enter?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => {
                  setActiveRole('FARMER');
                  setShowRoleSelectModal(false);
                  router.push('/dashboard/farmer');
                }}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold transition-all hover:scale-105"
              >
                <Sprout size={28} className="mb-2 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm">Farmer Portal</span>
                <span className="text-[10px] text-emerald-600/70 font-normal mt-0.5">Rent equipment & AI advice</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('OWNER');
                  setShowRoleSelectModal(false);
                  router.push('/dashboard');
                }}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-indigo-500/30 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 font-bold transition-all hover:scale-105"
              >
                <Tractor size={28} className="mb-2 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm">Owner Portal</span>
                <span className="text-[10px] text-indigo-600/70 font-normal mt-0.5">Manage fleet & earnings</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
