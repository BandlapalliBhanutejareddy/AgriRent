'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Tractor, LogOut, Bell, BookOpen, Sparkles, Menu, X, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('agrorent_dev_session');
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white dark:bg-gray-800 shadow-md fixed md:relative z-50 h-full transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } md:block`}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">AgroRent Admin</h1>
          <button 
            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-2 mt-4">
          <Link 
            href={user?.role === 'FARMER' ? '/dashboard/farmer' : '/dashboard'}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              (pathname === '/dashboard' || pathname === '/dashboard/farmer') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Overview</span>
          </Link>
          <Link 
            href="/dashboard/marketplace"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === '/dashboard/marketplace' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Search size={20} />
            <span className="font-medium">Marketplace</span>
          </Link>
          {user?.role === 'OWNER' && (
            <Link 
              href="/dashboard/equipment"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                pathname.startsWith('/dashboard/equipment') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Tractor size={20} />
              <span className="font-medium">My Equipment</span>
            </Link>
          )}
          <Link 
            href="/dashboard/guides"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              pathname.startsWith('/dashboard/guides') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <BookOpen size={20} />
            <span className="font-medium">Farming Knowledge</span>
          </Link>
          {user?.role === 'FARMER' && (
            <Link 
              href="/dashboard/ai-advisor"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/ai-advisor' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Sparkles size={20} />
              <span className="font-medium">AI Advisor</span>
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-4 md:px-8 z-10 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {pathname === '/dashboard' || pathname === '/dashboard/farmer' ? 'Overview' : 
               pathname === '/dashboard/marketplace' ? 'Marketplace' :
               pathname.startsWith('/dashboard/equipment') ? 'Equipment Management' :
               pathname.startsWith('/dashboard/guides') ? 'Agricultural Knowledge Base' :
               pathname === '/dashboard/ai-advisor' ? 'AI Farm Advisor' : 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 border-l pl-6 border-gray-200 dark:border-gray-700">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                {user?.name?.charAt(0) || 'O'}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {user?.name || 'Owner'}
              </span>
              <button 
                onClick={handleLogout}
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-4 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
