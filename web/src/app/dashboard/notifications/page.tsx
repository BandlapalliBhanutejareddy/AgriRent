'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useNotificationStore } from '@/store/notificationStore';
import { 
  Bell, 
  Check, 
  Trash2, 
  Clock, 
  Info, 
  Tractor, 
  CheckCircle2, 
  AlertTriangle,
  MailOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "react-i18next";

export default function NotificationsPage() {
    const { t } = useTranslation();
  const { user } = useStore();
  const { notifications, setNotifications, markAsRead } = useNotificationStore();
  const { showToast } = useToast();
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);

  const role = user?.role || 'OWNER';

  useEffect(() => {
    // Generate role-specific initial alerts if none exist
    if (notifications.length === 0) {
      const generated = getInitialNotificationsByRole(role);
      setNotifications(generated);
      setLocalNotifications(generated);
    } else {
      setLocalNotifications(notifications);
    }
  }, [notifications, role]);

  function getInitialNotificationsByRole(userRole: string) {
    const timestamp = '10 mins ago';
    switch (userRole) {
      case 'ADMIN':
        return [
          {
            id: 'n-admin-1',
            title: 'Machinery Moderation Request',
            description: 'Owner Bhanu Pratap submitted "John Deere 5050 D" tractor for review in Nellore.',
            type: 'MODERATION',
            time: '5 mins ago',
            read: false
          },
          {
            id: 'n-admin-2',
            title: 'Audit Warning',
            description: 'API Request Latency exceeded 1.5s in AI Advisor cluster during crop recommendation stream.',
            type: 'WARNING',
            time: '2 hrs ago',
            read: false
          },
          {
            id: 'n-admin-3',
            title: 'New Account Listed',
            description: 'A new farmer profile "Ramesh Kumar" registered from Kurnool.',
            type: 'INFO',
            time: '1 day ago',
            read: true
          }
        ];
      case 'FARMER':
        return [
          {
            id: 'n-farmer-1',
            title: 'Booking Request Approved! 🚜',
            description: 'Your rental request for "Swaraj 744 FE" has been accepted by owner Harish Reddy. Scheduled from Jun 10 to Jun 14.',
            type: 'SUCCESS',
            time: '3 mins ago',
            read: false
          },
          {
            id: 'n-farmer-2',
            title: 'AI Crop Advisory Alert',
            description: 'Gemini AI Advisor generated new seasonal cropping suggestions for Basmati Rice sowing in soil conditions.',
            type: 'AI',
            time: '1 hr ago',
            read: false
          },
          {
            id: 'n-farmer-3',
            title: 'Invoice Payment Received',
            description: 'Security deposit payment of ₹2,500 has been verified for booking draft.',
            type: 'INFO',
            time: '2 days ago',
            read: true
          }
        ];
      case 'OWNER':
      default:
        return [
          {
            id: 'n-owner-1',
            title: 'Pending Rental Booking Request 🌾',
            description: 'Farmer Suresh Patil requested booking for "Paddy Transplanter" implement from Jun 18 to Jun 20.',
            type: 'BOOKING',
            time: '8 mins ago',
            read: false
          },
          {
            id: 'n-owner-2',
            title: 'Fleet Pricing Suggestion',
            description: 'Our analytics platform suggests increasing Swaraj tractor pricing by 5% due to high localized crop sowing season demand.',
            type: 'INFO',
            time: '5 hrs ago',
            read: false
          },
          {
            id: 'n-owner-3',
            title: 'Equipment Live Status',
            description: 'Your John Deere 5050 tractor listing is now live on the global marketplace portal.',
            type: 'SUCCESS',
            time: '3 days ago',
            read: true
          }
        ];
    }
  };

  function handleMarkAsRead(id: string) {
    markAsRead(id);
    const updated = localNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    setLocalNotifications(updated);
    setNotifications(updated);
    showToast('Notification marked as read.', 'success');
  };

  function handleMarkAllAsRead() {
    const updated = localNotifications.map(n => ({ ...n, read: true }));
    setLocalNotifications(updated);
    setNotifications(updated);
    showToast('All notifications marked as read.', 'success');
  };

  function handleDelete(id: string) {
    const updated = localNotifications.filter(n => n.id !== id);
    setLocalNotifications(updated);
    setNotifications(updated);
    showToast('Notification deleted.', 'success');
  };

  function getAlertIcon(type: string) {
    switch (type) {
      case 'SUCCESS':
        return <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl"><CheckCircle2 size={18} /></div>;
      case 'WARNING':
        return <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl"><AlertTriangle size={18} /></div>;
      case 'MODERATION':
      case 'BOOKING':
        return <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl"><Tractor size={18} /></div>;
      case 'AI':
        return <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl"><Sparkles size={18} /></div>;
      case 'INFO':
      default:
        return <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl"><Info size={18} /></div>;
    }
  };

  const unreadCount = localNotifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Dynamic Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl bg-emerald-500/10" />
        <div className="relative z-10 space-y-1.5">
          <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-white/10 rounded-full border border-white/5">
            {t('platform_inbox')}</span>
          <h1 className="text-3xl font-black tracking-tight">{t('notification_hub')}</h1>
          <p className="text-slate-400 text-xs font-semibold">
            {unreadCount > 0 ? `You have ${unreadCount} unread system messages.` : 'Your platform inbox is completely up-to-date.'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="relative z-10 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 shrink-0 self-start sm:self-center"
          >
            <MailOpen size={16} /> {t('mark_all_read')}</button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/80 dark:border-slate-850/80 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {localNotifications.length === 0 ? (
              
              /* Illustrated Fallback State */
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 text-center flex flex-col items-center justify-center space-y-5"
              >
                <div className="p-6 bg-slate-50 dark:bg-slate-800 text-slate-350 dark:text-slate-650 rounded-full relative shadow-inner">
                  <Bell size={48} className="animate-pulse" />
                  <span className="absolute top-1 right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </div>
                <div className="max-w-xs space-y-2">
                  <h3 className="text-xl font-bold text-slate-850 dark:text-white">{t('inbox_clean_cleared')}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
                    {t('you_have_zero_pending_notifications_we_w')}</p>
                </div>
                <button 
                  onClick={() => {
                    const fresh = getInitialNotificationsByRole(role);
                    setNotifications(fresh);
                    setLocalNotifications(fresh);
                    showToast('Mock notifications re-seeded for testing!', 'success');
                  }}
                  className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {t('reload_mock_data')}</button>
              </motion.div>
            ) : (
              localNotifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`flex gap-4 p-5 rounded-2xl border transition-all duration-350 ${
                    notif.read 
                      ? 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 opacity-70' 
                      : 'bg-slate-50/70 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800/80 shadow-sm relative'
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!notif.read && (
                    <span className="absolute top-5 right-5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}

                  <div className="shrink-0">
                    {getAlertIcon(notif.type)}
                  </div>

                  <div className="flex-1 space-y-1.5 pr-6">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h4 className={`font-bold text-sm sm:text-base leading-tight ${notif.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-850 dark:text-white'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Clock size={10} /> {notif.time}
                      </span>
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${notif.read ? 'text-slate-405 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {notif.description}
                    </p>
                    
                    <div className="flex gap-2 pt-2">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                          <Check size={12} /> {t('mark_read')}</button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/25 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        <Trash2 size={12} /> {t('delete')}</button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
