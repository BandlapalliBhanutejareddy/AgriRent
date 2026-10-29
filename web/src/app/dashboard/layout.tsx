'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Tractor,
  LogOut,
  Bell,
  BookOpen,
  Sparkles,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  User,
  ShieldAlert,
  Settings,
  ClipboardList,
  PlusCircle,
  Users,
  Activity,
  CheckCircle,
  BarChart3,
  CalendarDays,
  CreditCard,
  History,
  MessageSquare,
  Bookmark,
  CloudSun,
  Landmark,
  TrendingUp
} from 'lucide-react';
import { useStore, useThemeStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from "react-i18next";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, activeRole, setActiveRole, logout } = useStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerAvatar, setHeaderAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profileImage) {
      setHeaderAvatar(user.profileImage);
    } else {
      setHeaderAvatar(null);
    }

    // Synchronize canonical profile with backend across mobile & web
    const syncCanonicalProfile = async () => {
      try {
        const { api } = await import('@/lib/api');
        const res = await api.get('/auth/me');
        if (res.data && res.data.id) {
          const fresh = res.data;
          const currentStoreUser = useStore.getState().user;
          if (currentStoreUser) {
            useStore.getState().setUser({
              ...currentStoreUser,
              name: fresh.name,
              phone: fresh.phone,
              preferredLanguage: fresh.preferredLanguage,
              profileImage: fresh.profileImage
            });
          }
          if (fresh.profileImage) {
            setHeaderAvatar(fresh.profileImage);
          }
        }
      } catch (_) {}
    };
    syncCanonicalProfile();
  }, [user?.id]);

  const storedActive = activeRole;
  const currentRole = storedActive || (user?.role === 'BOTH' ? 'ROLE_SELECT' : user?.role || 'OWNER');

  // Strict Role Guards to prevent role leakage
  useEffect(() => {
    if (!user) return;

    if (pathname === '/dashboard/role-select') {
      if (user.role !== 'BOTH' || storedActive) {
        window.location.href = storedActive === 'FARMER' ? '/dashboard/farmer' : '/dashboard';
      }
      return;
    }

    const role = currentRole;

    if (role === 'ROLE_SELECT') {
      window.location.href = '/dashboard/role-select';
      return;
    }

    if (role === 'FARMER') {
      if (
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/equipment') ||
        pathname.startsWith('/dashboard/admin') ||
        pathname === '/dashboard/history' ||
        pathname === '/dashboard/bank-details' ||
        pathname === '/dashboard/analytics'
      ) {
        window.location.href = '/dashboard/farmer';
      }
    } else if (role === 'OWNER') {
      if (
        pathname.startsWith('/dashboard/farmer') ||
        pathname.startsWith('/dashboard/admin') ||
        pathname === '/dashboard/saved'
      ) {
        window.location.href = '/dashboard';
      }
    } else if (role === 'ADMIN') {
      if (
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/farmer') ||
        pathname.startsWith('/dashboard/equipment')
      ) {
        window.location.href = '/dashboard/admin';
      }
    }
  }, [user, currentRole, pathname, storedActive]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('agrorent_dev_session');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('@cache_')) {
        localStorage.removeItem(key);
      }
    }
    logout();
    window.location.href = '/login';
  };

  const role = currentRole;

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-sm backdrop-blur-md">
            <ShieldAlert size={14} /> {t('admin', 'Admin')}
          </span>
        );
      case 'FARMER':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 shadow-sm backdrop-blur-md">
            <Sparkles size={14} /> {t('farmer', 'Farmer')}
          </span>
        );
      case 'OWNER':
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm backdrop-blur-md">
            <Tractor size={14} /> {t('fleet_owner', 'Fleet Owner')}
          </span>
        );
    }
  };

  const NavLink = ({ href, icon: Icon, label, exact = false }: { href: string, icon: any, label: string, exact?: boolean }) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');
    return (
      <Link
        href={href}
        className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-[#163A2D]/10 dark:bg-[#163A2D]/40 text-[#163A2D] dark:text-[#84CC16] font-semibold border border-[#16845B]/20 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 font-normal'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon size={18} className={isActive ? 'text-[#16845B] dark:text-[#84CC16]' : 'text-slate-400'} />
        <span className="text-[13px]">{label}</span>
      </Link>
    );
  };

  const renderSidebarLinks = () => {
    if (role === 'ADMIN') {
      return (
        <>
          <NavLink href="/dashboard/admin" icon={LayoutDashboard} label={t('dashboard', 'Dashboard')} exact />
          <NavLink href="/dashboard/admin/operations" icon={Activity} label={t('nav.operations_monitor', 'Operations Monitor')} />
          <NavLink href="/dashboard/admin/alerts" icon={Bell} label={t('nav.alerts_notifications', 'Alerts & Notifications')} />
          <NavLink href="/dashboard/admin/health" icon={ShieldAlert} label={t('nav.system_health', 'System Health')} />
          <NavLink href="/dashboard/admin/quality" icon={CheckCircle} label={t('nav.data_quality', 'Data Quality')} />
          <NavLink href="/dashboard/profile" icon={Settings} label={t('profile_settings', 'Profile Settings')} />
        </>
      );
    }

    if (role === 'FARMER') {
      return (
        <>
          <NavLink href="/dashboard/farmer" icon={LayoutDashboard} label={t('dashboard', 'Dashboard')} exact />
          <NavLink href="/dashboard/marketplace" icon={Search} label={t('marketplace', 'Marketplace')} />
          <NavLink href="/dashboard/rentals" icon={CalendarDays} label={t('my_rentals', 'My Rentals')} />
          <NavLink href="/dashboard/saved" icon={Bookmark} label={t('saved_machinery', 'Saved Machinery')} />
          <NavLink href="/dashboard/weather" icon={CloudSun} label={t('weather_forecast', 'Weather Forecast')} />
          <NavLink href="/dashboard/community" icon={Users} label={t('farmer_community', 'Farmer Community')} />
          <NavLink href="/dashboard/guides" icon={BookOpen} label={t('crop_guides', 'Crop Guides')} />
          <NavLink href="/dashboard/ai-advisor" icon={Sparkles} label={t('farmer_assistant', 'Farmer Assistant')} />
          <NavLink href="/dashboard/notifications" icon={Bell} label={t('notifications', 'Notifications')} />
          <NavLink href="/dashboard/feedback" icon={MessageSquare} label={t('feedback', 'Feedback')} />
        </>
      );
    }

    return (
      <>
        <NavLink href="/dashboard" icon={LayoutDashboard} label={t('dashboard', 'Dashboard')} exact />
        <NavLink href="/dashboard/equipment" icon={Tractor} label={t('fleet_management', 'Fleet Management')} exact />
        <NavLink href="/dashboard/equipment/new" icon={PlusCircle} label={t('add_equipment', 'Add Equipment')} />
        <NavLink href="/dashboard/bookings" icon={ClipboardList} label={t('booking_requests', 'Booking Requests')} />
        <NavLink href="/dashboard/history" icon={History} label={t('rental_history', 'Rental History')} />
        <NavLink href="/dashboard/analytics" icon={BarChart3} label={t('analytics_yield', 'Analytics & Yield')} />
        <NavLink href="/dashboard/bank-details" icon={Landmark} label={t('bank_payouts', 'Bank & Payouts')} />
        <NavLink href="/dashboard/notifications" icon={Bell} label={t('notifications', 'Notifications')} />
        <NavLink href="/dashboard/feedback" icon={MessageSquare} label={t('feedback', 'Feedback')} />
      </>
    );
  };

  const [unreadNotif, setUnreadNotif] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkNotifications = async () => {
      try {
        const { api } = await import('@/lib/api');
        const [notifRes, chatRes] = await Promise.all([
          api.get('/notifications').catch(() => ({ data: [] })),
          api.get('/chat/unread-count').catch(() => ({ data: { unreadCount: 0 } }))
        ]);

        const list = Array.isArray(notifRes.data) ? notifRes.data : notifRes.data.data || [];
        const hasUnreadNotif = list.some((n: any) => !n.read);
        const hasUnreadChat = (chatRes.data?.unreadCount || 0) > 0;

        setUnreadNotif(hasUnreadNotif || hasUnreadChat);
      } catch (err) {
        setUnreadNotif(false);
      }
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  if (currentRole === 'ROLE_SELECT') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-emerald-500/30">
        <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl h-20 flex items-center justify-between px-6 md:px-10 z-30 border-b border-slate-200/50 dark:border-slate-800/50">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md">
              <Tractor size={22} />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent tracking-tight">
              AgroRent<span className="text-emerald-500">.</span>AI
            </span>
          </Link>
          <div className="flex items-center space-x-3 md:space-x-5">
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-2xl transition-all"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handleLogout} className="text-sm font-bold text-slate-500 hover:text-red-500 transition-colors">
              {t('sign_out')}
            </button>
          </div>
        </header>
        <main className="pt-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans selection:bg-emerald-500/30">

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 fixed md:relative z-50 h-full transform transition-all duration-300 ease-out ${
        isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      } md:block flex flex-col`}>
        <div className="h-20 px-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#163A2D] text-[#84CC16] flex items-center justify-center shadow-sm">
              <Tractor size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#163A2D] dark:text-white leading-none">
                AgroRent <span className="text-[#16845B] dark:text-[#84CC16]">AI</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                {role === 'ADMIN' ? 'Admin Portal' : role === 'FARMER' ? 'Farmer Portal' : 'Owner Portal'}
              </span>
            </div>
          </Link>
          <button
            className="md:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {renderSidebarLinks()}
        </div>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
          <NavLink href="/dashboard/profile" icon={Settings} label={t('profile_settings')} exact />
          <button
            onClick={handleLogout}
            data-testid="logout-button-mobile"
            className="p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all md:hidden"
            title={t('sign_out')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl h-20 flex items-center justify-between px-6 md:px-10 z-30 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">

          <div className="flex items-center space-x-4">
            <button
              className="md:hidden p-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-3">
              {getRoleBadge()}
              {user?.role === 'BOTH' && (
                <button
                  onClick={() => {
                    const nextRole = currentRole === 'FARMER' ? 'OWNER' : 'FARMER';
                    setActiveRole(nextRole);
                    window.location.href = nextRole === 'FARMER' ? '/dashboard/farmer' : '/dashboard';
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
                  title="Switch active portal mode"
                >
                  <Sparkles size={14} />
                  <span>Switch to {currentRole === 'FARMER' ? 'Owner' : 'Farmer'} Mode</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 md:space-x-5">
            <LanguageSwitcher />

            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 rounded-2xl transition-all"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              href="/dashboard/notifications"
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 rounded-2xl transition-all relative"
            >
              <Bell size={18} />
              {unreadNotif && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse" />
              )}
            </Link>

            <div className="flex items-center space-x-3 md:border-l md:pl-5 border-slate-200 dark:border-slate-700">
              <div className="hidden lg:block text-right">
                <span className="block text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  {user?.role}
                </span>
              </div>
              <Link href="/dashboard/profile" className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 border border-emerald-400/50 hover:scale-105 hover:rotate-3 transition-transform duration-300 overflow-hidden">
                {headerAvatar ? (
                  <img src={headerAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || role.charAt(0)
                )}
              </Link>
              <button
                onClick={handleLogout}
                data-testid="logout-button"
                className="hidden md:flex p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all ml-2"
                title={t('sign_out')}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300 relative">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-500/5 to-transparent dark:from-emerald-500/5 pointer-events-none -z-10" />
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
