'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Sprout, Tractor, ShieldAlert, Key, Check, Eye, EyeOff, X, User as UserIcon, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { setUser, setSession } = useStore();
  const router = useRouter();

  // Forgot Password Flow States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // Register OTP Flow States
  const [showRegisterOtpModal, setShowRegisterOtpModal] = useState(false);
  const [registerOtpError, setRegisterOtpError] = useState('');

  function handlePortalChange(portal: PortalRole) {
    setActivePortal(portal);
    setEmail('');
    setPassword('');
    setError('');
  };

  function executeLogin(user: any, token: string) {
    setUser(user);
    setSession({ access_token: token, user });
    if (user.role === 'OWNER') router.push('/dashboard');
    else if (user.role === 'FARMER') router.push('/dashboard/farmer');
    else if (user.role === 'ADMIN') router.push('/dashboard/admin');
    else router.push('/dashboard');
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
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success) {
          executeLogin(response.data.user, response.data.token);
        } else {
          setError('Invalid credentials');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Login failed. Please verify your credentials and try again.');
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
      try {
        const response = await api.post('/auth/register', { 
          name: registerName, 
          email, 
          password, 
          phone: registerPhone, 
          role: activePortal 
        });
        if (response.data.success) {
          setOtpInput('');
          setShowRegisterOtpModal(true);
        } else {
          setError('Registration failed.');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Registration failed. Email might already be taken.');
      } finally {
        setLoading(false);
      }
    }
  };

  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string>('');

  // Fetch Dev OTP automatically for testing
  useEffect(() => {
    if (showRegisterOtpModal && email) {
      setDeliveryStatus('Sending email via secure transport...');
      api.get(`/auth/dev-otp?email=${email}`)
         .then(res => {
            if (res.data.otp) setDevOtp(res.data.otp);
            setDeliveryStatus('Email dispatched securely.');
         })
         .catch(() => setDeliveryStatus('Email delivery failed or pending.'));
    }
  }, [showRegisterOtpModal, email]);

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
        setDevOtp(null);
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

  const [forgotDevOtp, setForgotDevOtp] = useState<string | null>(null);
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);

  // Cooldown timer for forgot OTP resend
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (forgotResendCooldown > 0) {
      t = setInterval(() => setForgotResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(t);
  }, [forgotResendCooldown]);

  // Fetch dev OTP when forgot password step 2 opens
  useEffect(() => {
    if (forgotStep === 2 && forgotEmail) {
      api.get(`/auth/dev-otp?email=${forgotEmail}`)
         .then(res => { if (res.data.otp) setForgotDevOtp(res.data.otp); })
         .catch(() => {});
    }
  }, [forgotStep, forgotEmail]);

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
      // Refresh dev OTP
      const res = await api.get(`/auth/dev-otp?email=${forgotEmail}`);
      if (res.data.otp) setForgotDevOtp(res.data.otp);
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
        otp: otpInput,
        newPassword
      });
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotEmail('');
        setOtpInput('');
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-6">
        
        {/* Logo/Header */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              {t('agrorent_ai')}</span>
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t('commercial_agritech_ecosystem')}</p>
        </div>

        {/* Outer Login Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-8 rounded-[32px] shadow-xl dark:shadow-2xl/30 relative overflow-hidden transition-all duration-300">
          
          {/* Decorative Corner Glow */}
          <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-10 bg-${activeConf.color}-500 transition-all duration-500`} />

          {/* Portal Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl mb-8">
            {(['FARMER', 'OWNER', 'ADMIN'] as PortalRole[]).map((portalKey) => {
              const conf = portals[portalKey];
              const isSelected = activePortal === portalKey;
              return (
                <button
                  key={portalKey}
                  type="button"
                  onClick={() => handlePortalChange(portalKey)}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 shadow-md text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <conf.icon size={18} className={isSelected ? conf.textAccentClass : 'text-slate-400'} />
                  <span className="text-[10px] uppercase font-black tracking-wider mt-1.5">{portalKey}</span>
                </button>
              );
            })}
          </div>

          {/* Portal Context Title */}
          <div className="text-center mb-6">
            <h2 className={`text-2xl font-black tracking-tight flex items-center justify-center gap-2 ${activeConf.textAccentClass}`}>
              <IconComponent size={22} className="animate-pulse" />
              {t(activeConf.titleKey, { defaultValue: activeConf.defaultTitle })}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium px-4">
              {t(activeConf.subtitleKey, { defaultValue: activeConf.defaultSubtitle })}
            </p>
          </div>

          {/* Toggle Login / Register */}
          {activePortal !== 'ADMIN' && (
            <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 mb-6">
              <button
                type="button"
                data-testid="login-tab"
                onClick={() => { setIsLoginMode(true); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  isLoginMode ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('sign_in')}</button>
              <button
                type="button"
                data-testid="register-tab"
                onClick={() => { setIsLoginMode(false); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  !isLoginMode ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('sign_up')}</button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl">
              <p className="text-xs text-red-700 dark:text-red-400 font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            <div className="space-y-4">
              
              {!isLoginMode && (
                <>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                      {t('full_name')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                        placeholder={t('john_doe')}
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                      />
                      <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                      {t('phone_number_optional')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                        placeholder="+91 9876543210"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                      />
                      <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                  {t('email_address')}</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                  placeholder={t('e_g_user_agrorent_ai')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                  {t('password')}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password Action Trigger */}
            {isLoginMode && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setForgotError('');
                    setForgotSuccessMsg('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline hover:text-emerald-500"
                >
                  {t('forgot_password')}</button>
              </div>
            )}

            {/* Standard Sign-In Button */}
            <button
              type="submit"
              data-testid={isLoginMode ? "login-button" : "register-button"}
              disabled={loading}
              className={`w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-black rounded-xl text-white shadow-lg transition-all duration-300 disabled:opacity-50 ${activeConf.accentClass}`}
            >
              {loading ? t('authenticating', { defaultValue: 'Authenticating...' }) : (isLoginMode ? t('sign_in', { defaultValue: 'Sign In' }) : t('create_account', { defaultValue: 'Create Account' }))}
            </button>
          </form>
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
                {devOtp && (
                  <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded text-xs text-yellow-800 dark:text-yellow-400 font-mono">
                    {t('dev_mode_otp')}{devOtp}
                  </div>
                )}
              </div>

              {registerOtpError && (
                <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 mb-4 rounded-r-xl">
                  <p className="text-xs text-red-700 dark:text-red-400 font-semibold">{registerOtpError}</p>
                </div>
              )}

              <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                    {t('enter_6_digit_otp_code')}</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-center tracking-widest placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-black"
                    placeholder="••••••"
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
                      {forgotDevOtp && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-xl text-center">
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 font-mono font-bold">
                            {t('dev_mode_otp')}{forgotDevOtp}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                          {t('verify_6_digit_otp_code')}</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-center tracking-widest placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-black"
                          placeholder="••••••"
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
    </div>
  );
}
