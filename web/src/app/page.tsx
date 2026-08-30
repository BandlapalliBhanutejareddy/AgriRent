'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Tractor, 
  Search, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  Leaf, 
  MapPin, 
  ArrowRight,
  Menu,
  X,
  Star
} from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useStore } from '@/store/useStore';

export default function LandingPage() {
  const { t } = useTranslation();
  const { session, user } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 selection:bg-emerald-500/30">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-2 rounded-xl">
              <Tractor size={24} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">AgroRent<span className="text-emerald-600">.</span>AI</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-sm font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors">How it Works</a>
            <a href="#categories" className="text-sm font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors">Equipment</a>
            <a href="#ai-advisor" className="text-sm font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors">AI Advisor</a>
            
            {session ? (
              <Link href={user?.role === 'FARMER' ? '/dashboard/farmer' : '/dashboard'} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Login</Link>
                <Link href="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all">Sign Up</Link>
              </div>
            )}
          </div>

          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-slate-950 pt-24 px-4 flex flex-col space-y-4">
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold p-4 border-b border-slate-100 dark:border-slate-800">How it Works</a>
          <a href="#categories" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold p-4 border-b border-slate-100 dark:border-slate-800">Equipment</a>
          <a href="#ai-advisor" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold p-4 border-b border-slate-100 dark:border-slate-800">AI Advisor</a>
          {session ? (
            <Link href="/dashboard" className="text-lg font-bold p-4 text-emerald-600">Go to Dashboard</Link>
          ) : (
             <div className="flex flex-col space-y-4 p-4">
                <Link href="/login" className="w-full py-4 text-center border border-slate-200 dark:border-slate-800 rounded-xl font-bold">Login</Link>
                <Link href="/register" className="w-full py-4 text-center bg-emerald-600 text-white rounded-xl font-bold">Sign Up</Link>
             </div>
          )}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                <Leaf size={14} /> Smart Farming Platform
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                Rent Farm <br/><span className="text-emerald-600">Equipment</span> Easily.
              </motion.h1>
              
              <motion.p variants={fadeIn} className="text-lg text-slate-600 dark:text-slate-400 max-w-xl font-medium leading-relaxed">
                Find reliable agricultural machinery, compare prices, book equipment securely, and get AI-powered farming guidance for your next harvest.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                <Link href="/register?role=FARMER" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all text-center flex items-center justify-center gap-2">
                  Find Equipment <ArrowRight size={20} />
                </Link>
                <Link href="/register?role=OWNER" className="px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-900 dark:text-white rounded-2xl font-bold text-lg transition-all text-center">
                  List Your Equipment
                </Link>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative hidden md:block"
            >
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1592860956272-9eb5d8c366ff?auto=format&fit=crop&q=80&w=1200" 
                  alt="Modern tractor working in field" 
                  className="w-full object-cover h-[600px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                
                {/* Floating UI Elements */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <Tractor size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">John Deere 5050</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Available in Nellore</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 text-lg">₹2,500</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Per Day</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">How AgroRent Works</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">A simple, transparent process to get the machinery you need, exactly when you need it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="text-8xl font-black text-slate-50 dark:text-slate-800/50 absolute -top-4 -right-4 transition-transform group-hover:scale-110">1</div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 relative z-10">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">Search & Compare</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed relative z-10">Browse local inventory by category, price, and distance. Compare specs to find the perfect match for your farm.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="text-8xl font-black text-slate-50 dark:text-slate-800/50 absolute -top-4 -right-4 transition-transform group-hover:scale-110">2</div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 relative z-10">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">Book securely</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed relative z-10">Select your dates and book instantly. Escrow payments ensure your money is safe until the equipment arrives.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="text-8xl font-black text-slate-50 dark:text-slate-800/50 absolute -top-4 -right-4 transition-transform group-hover:scale-110">3</div>
              <div className="bg-amber-50 dark:bg-amber-900/30 w-16 h-16 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 relative z-10">
                <Tractor size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">Farm & Yield</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed relative z-10">Get the equipment delivered or pick it up. Complete your harvest faster and return it when you're done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">Equipment Categories</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Find exactly what your farm needs from our verified owners.</p>
            </div>
            <Link href="/register" className="text-emerald-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
              View All Inventory <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: 'Tractors', count: '124 Listed', img: 'https://images.unsplash.com/photo-1592860956272-9eb5d8c366ff?auto=format&fit=crop&q=80&w=400' },
              { name: 'Harvesters', count: '45 Listed', img: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?auto=format&fit=crop&q=80&w=400' },
              { name: 'Implements', count: '89 Listed', img: 'https://images.unsplash.com/photo-1589922253303-3b03867dfb61?auto=format&fit=crop&q=80&w=400' },
              { name: 'Cultivators', count: '67 Listed', img: 'https://images.unsplash.com/photo-1590089851695-1f9e80c8df63?auto=format&fit=crop&q=80&w=400' }
            ].map((cat, i) => (
              <Link href="/register" key={i} className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-white text-xl font-bold">{cat.name}</h3>
                  <p className="text-emerald-400 text-sm font-semibold mt-1">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Advisor */}
      <section id="ai-advisor" className="py-20 bg-slate-900 dark:bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/20 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
               <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
                 <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                     <Leaf size={20} className="text-white" />
                   </div>
                   <div className="bg-slate-700/50 rounded-2xl rounded-tl-none p-4 text-sm font-medium leading-relaxed">
                     Based on your 4-acre soil type in Nellore and current rainfall predictions, I recommend renting a <strong>Paddy Transplanter</strong> next week to maximize crop yield.
                   </div>
                 </div>
                 <div className="flex gap-4 justify-end mt-4">
                   <div className="bg-emerald-600/20 text-emerald-100 rounded-2xl rounded-tr-none p-4 text-sm font-medium leading-relaxed border border-emerald-500/20">
                     Show me available transplanters nearby.
                   </div>
                   <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                     <span className="font-bold">You</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <MessageSquare size={14} /> Powered by AgroRent AI
              </div>
              <h2 className="text-3xl md:text-5xl font-black leading-tight">Your Personal <br/><span className="text-emerald-400">Agricultural Expert.</span></h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Not sure which equipment to rent? Our integrated AI advisor analyzes your crop type, land size, and local weather patterns to recommend the exact machinery you need.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  'Crop-specific machinery recommendations',
                  'Optimal sowing and harvesting timeframes',
                  'Cost-benefit analysis for rentals'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-semibold text-slate-300">
                    <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Tractor size={24} className="text-emerald-600" />
            <span className="text-xl font-black text-slate-900 dark:text-white">AgroRent<span className="text-emerald-600">.</span>AI</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            &copy; {new Date().getFullYear()} AgroRent Platform. Designed for modern farmers.
          </p>
        </div>
      </footer>
    </div>
  );
}

function CheckCircle({ className, size }: { className?: string; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
