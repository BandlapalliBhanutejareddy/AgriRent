'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useStore, useThemeStore } from '@/store/useStore';
import { api } from '@/lib/api';
import {
  User as UserIcon,
  Phone,
  MapPin,
  Shield,
  Camera,
  Check,
  Bell,
  Globe,
  Lock,
  Sprout,
  Tractor,
  ShieldCheck,
  Eye,
  EyeOff,
  Landmark,
  ArrowRight,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState<string | null>(user?.profileImage || null);
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Synchronize state when user changes
  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEmail(user?.email || '');
    setAvatar(user?.profileImage || null);
    setPreferredLanguage(user?.preferredLanguage || 'en');
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'warning');
      return;
    }

    try {
      showToast('Uploading profile image...', 'info');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');

      const uploadRes = await api.post('/upload/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
      if (uploadedUrl) {
        const versionedUrl = `${uploadedUrl}?t=${Date.now()}`;
        setAvatar(versionedUrl);

        // Immediately update profile in database
        const updateRes = await api.put('/auth/me', {
          profileImage: versionedUrl
        });

        if (user) {
          const updated = { ...user, profileImage: versionedUrl };
          setUser(updated);
        }
        showToast('Profile photo updated successfully!', 'success');
      } else {
        showToast('Failed to upload image. Please try again.', 'warning');
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      showToast(err.response?.data?.error || 'Failed to upload photo', 'warning');
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'warning');
      return;
    }

    try {
      const response = await api.put('/auth/me', {
        name: name.trim(),
        phone: phone.trim(),
        preferredLanguage: preferredLanguage,
        profileImage: avatar
      });

      if (response.data && (response.data.id || response.data.name || response.data.data)) {
        const fresh = response.data.data || response.data;
        const updatedUser = {
          ...user!,
          name: fresh.name,
          phone: fresh.phone,
          preferredLanguage: fresh.preferredLanguage,
          profileImage: fresh.profileImage
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('i18nextLng', fresh.preferredLanguage || 'en');
          i18n.changeLanguage(fresh.preferredLanguage || 'en');
        } catch (_) {}
        showToast('Profile updated and saved to database successfully!', 'success');
      } else {
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Save Profile Error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to update profile. Please check your network connection.';
      showToast(errorMsg, 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in both current and new passwords.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data?.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        showToast('Password changed successfully!', 'success');
      } else {
        setPasswordError(res.data?.error || 'Failed to update password.');
      }
    } catch (err: any) {
      console.error('Change password error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to update password. Please check your current password.';
      setPasswordError(msg);
      showToast(msg, 'warning');
    } finally {
      setPasswordLoading(false);
    }
  };

  const isOwner = user?.role === 'OWNER' || user?.role === 'BOTH';

  const getRoleHeaderDetails = () => {
    switch (user?.role) {
      case 'ADMIN':
        return {
          gradient: 'from-purple-600 via-purple-750 to-slate-900 border-purple-500/20',
          title: 'System Administrator 🛡️',
          badge: 'Security Level: Root Access'
        };
      case 'FARMER':
        return {
          gradient: 'from-emerald-600 via-teal-650 to-emerald-700 border-emerald-500/20',
          title: 'Producer Farmer Account 🌾',
          badge: 'Crop & Equipment Producer'
        };
      case 'OWNER':
      default:
        return {
          gradient: 'from-indigo-600 via-indigo-750 to-slate-900 border-indigo-500/20',
          title: 'Fleet Partner Owner 🚜',
          badge: 'AgroRent Logistics & Machinery Partner'
        };
    }
  };

  const roleConfig = getRoleHeaderDetails();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Block */}
      <div className={`flex flex-col md:flex-row md:items-center gap-6 bg-gradient-to-r ${roleConfig.gradient} p-8 rounded-[32px] text-white shadow-xl border relative overflow-hidden`}>
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl bg-white/10" />

        <div className="relative shrink-0 self-center md:self-auto group cursor-pointer" onClick={handleAvatarClick}>
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-slate-200 to-white dark:from-slate-700 dark:to-slate-800 border-4 border-white dark:border-slate-900 overflow-hidden shadow-2xl relative flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" />
            ) : (
              <span className="text-4xl font-black text-slate-850 dark:text-white">
                {name.charAt(0) || user?.role?.charAt(0) || 'U'}
              </span>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
          </div>
          <button
            type="button"
            className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-900 transition-all hover:scale-115"
          >
            <Camera size={12} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="space-y-1.5 text-center md:text-left">
          <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-white/20 rounded-full border border-white/10">
            {t('profile_settings')}
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-1">{roleConfig.title}</h1>
          <p className="text-slate-200 text-xs font-semibold">{roleConfig.badge}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column Settings Tabs Navigation */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/85 dark:border-slate-850/85 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('account_overview', { defaultValue: 'Account Overview' })}</h3>

            <div className="space-y-3.5">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                <UserIcon size={16} className="text-slate-400" />
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">ROLE</span>
                  <span className="text-slate-800 dark:text-white uppercase font-black tracking-wide">{user?.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                <Phone size={16} className="text-slate-400" />
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">PHONE</span>
                  <span className="text-slate-800 dark:text-white font-black">{phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Bank Settings CTA Card */}
          {isOwner && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl text-white space-y-3 shadow-sm border border-indigo-800/40">
              <div className="flex items-center gap-2 text-indigo-300">
                <Landmark size={18} />
                <span className="text-xs font-black uppercase tracking-wider">Payout Account</span>
              </div>
              <p className="text-xs text-indigo-100/90 leading-relaxed font-medium">
                Manage your verified IFSC code, masked account number, and escrow payout schedule.
              </p>
              <Link
                href="/dashboard/bank-details"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all mt-1"
              >
                <span>Manage Bank Details</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-900/50 p-6 rounded-3xl text-white space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              Verified Account
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Synchronized with the AgroRent backend and Supabase authentication service.
            </p>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl w-fit text-[9px] font-black uppercase tracking-wider">
              ● Active Platform Status
            </div>
          </div>
        </div>

        {/* Right Column: Editing Form & Password Change */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information Form */}
          <form onSubmit={handleSaveChanges} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/85 dark:border-slate-850/85 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-850 dark:text-white">Personal Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium text-slate-900 dark:text-slate-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium text-slate-900 dark:text-slate-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Linked Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium text-slate-900 dark:text-slate-50"
                required
              />
            </div>

            {/* Notification & Theme Settings */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Bell size={16} className="text-slate-400" /> Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <span className="block font-bold text-xs text-slate-850 dark:text-white">Preferred Language</span>
                  <select
                    value={preferredLanguage}
                    onChange={e => setPreferredLanguage(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-slate-900 dark:text-slate-50"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-2xl cursor-pointer">
                  <div className="text-xs">
                    <span className="block font-bold text-slate-850 dark:text-white">Dark Theme</span>
                    <span className="text-slate-400 font-medium">Activate sleek dark mode</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg cursor-pointer text-xs"
              >
                <Check size={16} /> Save Changes
              </button>
            </div>
          </form>

          {/* Authenticated Change Password Form */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200/85 dark:border-slate-850/85 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Security & Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your authentication password directly without requiring an email OTP.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-semibold">
                <AlertCircle size={18} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Check size={18} className="shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit"
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
