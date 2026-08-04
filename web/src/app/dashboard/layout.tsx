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
  BarChart3,
  CalendarDays,
  CreditCard,
  History
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
  const { user, logout } = useStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerAvatar, setHeaderAvatar] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('agrorent_user_avatar');
    if (saved) {
      setHeaderAvatar(saved);
    }
  }, [user]);

  // Strict Role Guards to prevent role leakage
  useEffect(() => {
    if (!user) return;
    const role = user.role;
    
    if (role === 'FARMER') {
      if (pathname === '/dashboard' || pathname.startsWith('/dashboard/equipment') || pathname.startsWith('/dashboard/admin')) {
        window.location.href = '/dashboard/farmer';
      }
    } else if (role === 'OWNER') {
      if (pathname.startsWith('/dashboard/farmer') || pathname.startsWith('/dashboard/ai-advisor') || pathname.startsWith('/dashboard/admin')) {
        window.location.href = '/dashboard';
      }
    } else if (role === 'ADMIN') {
      if (pathname === '/dashboard' || pathname.startsWith('/dashboard/farmer') || pathname.startsWith('/dashboard/ai-advisor') || pathname.startsWith('/dashboard/equipment')) {
        window.location.href = '/dashboard/admin';
      }
    }
  }, [user, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('agrorent_dev_session');
    logout();
    window.location.href = '/login';
  };

  const role = user?.role || 'OWNER';

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-sm backdrop-blur-md">
            <ShieldAlert size={14} /> {t('admin')}</span>
        );
      case 'FARMER':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 shadow-sm backdrop-blur-md">
            <Sparkles size={14} /> {t('farmer')}</span>
        );
      case 'OWNER':
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm backdrop-blur-md">
            <Tractor size={14} /> {t('fleet_owner')}</span>
        );
    }
  };

  const NavLink = ({ href, icon: Icon, label, exact = false }: { href: string, icon: any, label: string, exact?: boolean }) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');
    return (
      <Link 
        href={href}
        className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon size={20} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
        <span className="text-[13px] tracking-wide">{label}</span>
      </Link>
    );
  };

  const renderSidebarLinks = () => {
    if (role === 'ADMIN') {
      return (
        <>
          <NavLink href="/dashboard/admin" icon={LayoutDashboard} label={t('overview')} exact />
          <NavLink href="/dashboard/admin#users" icon={Users} label={t('users')} />
          <NavLink href="/dashboard/admin#moderation" icon={ShieldAlert} label={t('equipment_moderation')} />
          <NavLink href="/dashboard/admin#bookings" icon={ClipboardList} label={t('bookings')} />
          <NavLink href="/dashboard/admin#revenue" icon={BarChart3} label={t('revenue')} />
          <NavLink href="/dashboard/admin#health" icon={Activity} label={t('system_health')} />
          <NavLink href="/dashboard/admin#audit" icon={History} label={t('audit_logs')} />
        </>
      );
    }

    if (role === 'FARMER') {
      return (
        <>
          <NavLink href="/dashboard/farmer" icon={LayoutDashboard} label={t('dashboard')} exact />
          <NavLink href="/dashboard/marketplace" icon={Search} label={t('marketplace')} />
          <NavLink href="/dashboard/farmer#rentals" icon={CalendarDays} label={t('my_rentals')} />
          <NavLink href="/dashboard/guides" icon={BookOpen} label={t('crop_guides')} />
          <NavLink href="/dashboard/ai-advisor" icon={Sparkles} label={t('ai_advisor')} />
          <NavLink href="/dashboard/notifications" icon={Bell} label={t('notifications')} />
        </>
      );
    }

    return (
      <>
        <NavLink href="/dashboard" icon={LayoutDashboard} label={t('dashboard')} exact />
        <NavLink href="/dashboard/equipment" icon={Tractor} label={t('fleet_management')} exact />
        <NavLink href="/dashboard/equipment/new" icon={PlusCircle} label={t('add_equipment')} />
        <NavLink href="/dashboard#bookings" icon={ClipboardList} label={t('booking_requests')} />
        <NavLink href="/dashboard#analytics" icon={BarChart3} label={t('analytics')} />
        <NavLink href="/dashboard#revenue" icon={CreditCard} label={t('revenue')} />
        <NavLink href="/dashboard/notifications" icon={Bell} label={t('notifications')} />
      </>
    );
  };

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
          <Link href="/" className="flex flex-col">
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent tracking-tight">
              {t('agrorent_ai')}</span>
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-0.5">
              {role === 'ADMIN' ? 'Admin Portal' : role === 'FARMER' ? 'Farmer Portal' : 'Owner Portal'}
            </span>
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

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <NavLink href="/dashboard/profile" icon={Settings} label={t('profile_settings')} exact />
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
            <div className="hidden sm:block">
              {getRoleBadge()}
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
              <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
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
