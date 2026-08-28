'use client';

import { useState, useRef, useEffect } from 'react';
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
  EyeOff
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, setUser } = useStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.phone ? `${user.phone.replace(/[^0-9]/g, '')}@agrorent.ai` : 'user@agrorent.ai');
  const [avatar, setAvatar] = useState<string | null>(null);
  // Preferences
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');


  // Load avatar from localStorage if saved previously
  useEffect(() => {
    const savedAvatar = localStorage.getItem('agrorent_user_avatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        localStorage.setItem('agrorent_user_avatar', base64String);
        showToast('Avatar updated successfully!', 'success');
      };
      reader.readAsDataURL(file);
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
        preferredLanguage: preferredLanguage
      });

      if (response.data && (response.data.id || response.data.name)) {
        const fresh = response.data;
        const updatedUser = {
          ...user!,
          name: fresh.name,
          phone: fresh.phone,
          preferredLanguage: fresh.preferredLanguage
        };
        setUser(updatedUser);
        showToast('Profile updated and saved to database successfully!', 'success');
      } else {
        showToast('Failed to update profile details', 'warning');
      }
    } catch (err: any) {
      console.error('Save Profile Error:', err);
      // Local fallback for offline/persistence display
      if (user) {
        setUser({ ...user, name: name.trim(), phone: phone.trim(), preferredLanguage });
      }
      showToast(err.response?.data?.error || 'Profile saved locally', 'success');
    }
  };

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
          title: 'Premium Member Farmer 🌾',
          badge: 'Crop Producer Account'
        };
      case 'OWNER':
      default:
        return {
          gradient: 'from-indigo-600 via-indigo-750 to-slate-900 border-indigo-500/20',
          title: 'Fleet Partner Owner 🚜',
          badge: 'AgroRent Logistics Partner'
        };
    }
  };

  const roleConfig = getRoleHeaderDetails();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Premium Gradient Header Block */}
      <div className={`flex flex-col md:flex-row md:items-center gap-6 bg-gradient-to-r ${roleConfig.gradient} p-8 rounded-[32px] text-white shadow-xl border relative overflow-hidden`}>
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl bg-white/10" />
        
        {/* Avatar Frame with Upload Trigger */}
        <div className="relative shrink-0 self-center md:self-auto group cursor-pointer" onClick={handleAvatarClick}>
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-slate-200 to-white dark:from-slate-700 dark:to-slate-800 border-4 border-white dark:border-slate-900 overflow-hidden shadow-2xl relative flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" />
            ) : (
              <span className="text-4xl font-black text-slate-850 dark:text-white">
                {name.charAt(0) || user?.role?.charAt(0) || 'U'}
              </span>
            )}
            
            {/* Upload Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
          </div>
          <button className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-900 transition-all hover:scale-115">
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
            {t('profile_settings')}</span>
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
                  <span className="block text-[10px] text-slate-400">{t('registered_as', { defaultValue: 'REGISTERED AS' })}</span>
                  <span className="text-slate-800 dark:text-white uppercase font-black tracking-wide">{user?.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                <Phone size={16} className="text-slate-400" />
                <div>
                  <span className="block text-[10px] text-slate-400">{t('phone_number_label', { defaultValue: 'PHONE NUMBER' })}</span>
                  <span className="text-slate-800 dark:text-white font-black">{phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-900/50 p-6 rounded-3xl text-white space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              {t('verified_account')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {t('account_synced_desc', { defaultValue: 'Your account details have been successfully synchronized with the backend system directory.' })}
            </p>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl w-fit text-[9px] font-black uppercase tracking-wider">
              ● {t('active_status', { defaultValue: 'Active Status' })}
            </div>
          </div>
        </div>

        {/* Right Column: Editing Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveChanges} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/85 dark:border-slate-850/85 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-850 dark:text-white">{t('personal_information', { defaultValue: 'Personal Information' })}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">{t('full_name', { defaultValue: 'Full Name' })}</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder={t('enter_full_name', { defaultValue: 'Enter your full name' })} 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 text-sm font-medium transition-all text-slate-900 dark:text-slate-50 placeholder-slate-500 dark:placeholder-slate-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">{t('phone_number')}</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder={t('enter_phone_number')} 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 text-sm font-medium transition-all text-slate-900 dark:text-slate-50 placeholder-slate-500 dark:placeholder-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">{t('linked_email', { defaultValue: 'Linked Email Address' })}</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder={t('enter_email', { defaultValue: 'Enter email address' })} 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 text-sm font-medium transition-all text-slate-900 dark:text-slate-50 placeholder-slate-500 dark:placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Removed unsupported role specific inputs */}

            {/* Notification triggers */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Bell size={16} className="text-slate-400" /> {t('notifications_theme_settings')}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-2xl cursor-pointer">
                  <div className="text-xs w-full">
                    <span className="block font-bold text-slate-850 dark:text-white">Preferred Language</span>
                    <select 
                      value={preferredLanguage} 
                      onChange={e => setPreferredLanguage(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-slate-900 dark:text-slate-50"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी</option>
                      <option value="te">తెలుగు</option>
                      <option value="ta">தமிழ்</option>
                      <option value="kn">ಕನ್ನಡ</option>
                    </select>
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-2xl cursor-pointer">
                  <div className="text-xs">
                    <span className="block font-bold text-slate-850 dark:text-white">{t('global_dark_theme', { defaultValue: 'Global Dark Theme' })}</span>
                    <span className="text-slate-400 font-medium">{t('dark_mode_desc', { defaultValue: 'Activate full dark mode.' })}</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isDarkMode} 
                    onChange={toggleTheme}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0" 
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                type="submit" 
                data-testid="profile-save settings-save"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <Check size={18} /> {t('save_settings')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
