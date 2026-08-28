'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം (Coming Soon)' },
  { code: 'mr', name: 'मराठी (Coming Soon)' },
  { code: 'bn', name: 'বাংলা (Coming Soon)' },
  { code: 'gu', name: 'ગુજરાતી (Coming Soon)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Coming Soon)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Coming Soon)' }
];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
    
    // Optionally sync with backend
    try {
      const token = localStorage.getItem('agrorent_dev_session');
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/language`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ language: lng })
        });
      }
    } catch (error) {
      console.error('Failed to sync language preference', error);
    }
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        data-testid="language-switcher"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 rounded-2xl transition-all"
        title={t('language')}
      >
        <Globe size={18} />
        <span className="hidden sm:inline text-xs font-semibold">{currentLang.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              data-testid="language-select"
              onClick={() => !lang.name.includes('Coming Soon') && changeLanguage(lang.code)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                lang.name.includes('Coming Soon') ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                i18n.language === lang.code 
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
