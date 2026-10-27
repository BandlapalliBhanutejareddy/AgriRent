'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Landmark, ShieldCheck, CheckCircle2, AlertCircle, Lock, ArrowRight, Save, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

export default function OwnerBankDetailsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Saved record state
  const [savedDetails, setSavedDetails] = useState<any | null>(null);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  async function fetchBankDetails() {
    try {
      setLoading(true);
      const res = await api.get('/owner/bank-details');
      if (res.data?.data) {
        const d = res.data.data;
        setSavedDetails(d);
        setAccountHolderName(d.accountHolderName || '');
        setBankName(d.bankName || '');
        setIfscCode(d.ifscCode || '');
      }
    } catch (err: any) {
      console.error('Failed to load bank details:', err);
      showToast('Unable to load saved bank details.', 'warning');
    } finally {
      setLoading(false);
    }
  }

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!accountHolderName.trim() || accountHolderName.trim().length < 2) {
      setError('Account Holder Name is required (minimum 2 characters).');
      return;
    }

    if (!bankName.trim()) {
      setError('Bank Name is required.');
      return;
    }

    if (!accountNumber || !/^\d{8,20}$/.test(accountNumber.trim())) {
      setError('Account Number must be between 8 and 20 digits.');
      return;
    }

    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      setError('Account Number and Confirm Account Number must match.');
      return;
    }

    const cleanedIfsc = ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanedIfsc)) {
      setError('Invalid IFSC Code. Must be 11 characters (e.g. SBIN0001234 or HDFC0000456).');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/owner/bank-details', {
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        confirmAccountNumber: confirmAccountNumber.trim(),
        ifscCode: cleanedIfsc,
      });

      if (res.data?.success) {
        setSavedDetails(res.data.data);
        setAccountNumber('');
        setConfirmAccountNumber('');
        setSuccessMsg('Bank & payout account details saved successfully!');
        showToast('Bank details updated and encrypted.', 'success');
      } else {
        setError(res.data?.error || 'Failed to save bank details.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update bank details. Please check your information.';
      setError(msg);
      showToast(msg, 'warning');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-500/30 inline-flex items-center gap-1.5">
            <Landmark size={13} /> Secure Payout Escrow
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            Bank Details & Rental Payouts
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Configure your verified Indian banking credentials for automated rental payouts and direct deposit settlements.
          </p>
        </div>
      </div>

      {/* Saved Bank Account Card */}
      {savedDetails?.maskedAccountNumber && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-[32px] border border-indigo-900/40 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Landmark size={120} />
          </div>

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
              <CheckCircle2 size={12} />
              <span>Active Payout Account</span>
            </div>
            <Lock size={18} className="text-indigo-300 opacity-60" />
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs text-indigo-200 uppercase tracking-widest font-black block">
              {savedDetails.bankName || 'Registered Bank'}
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-white">
              {savedDetails.maskedAccountNumber}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center text-xs text-indigo-200 relative z-10 gap-2">
            <div>
              <span className="text-indigo-400 block text-[10px] font-bold uppercase">Account Holder</span>
              <span className="font-bold text-white text-sm">{savedDetails.accountHolderName}</span>
            </div>
            <div>
              <span className="text-indigo-400 block text-[10px] font-bold uppercase">IFSC Code</span>
              <span className="font-mono font-bold text-white text-sm">{savedDetails.ifscCode}</span>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {savedDetails?.maskedAccountNumber ? 'Update Payout Bank Details' : 'Register Payout Bank Details'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rental payments from farmers are released to this designated account upon successful equipment handover inspection.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-semibold">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveBankDetails} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Name as per bank passbook"
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="State Bank of India / HDFC Bank"
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Account Number
              </label>
              <input
                type="password"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter 8-20 digit account number"
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Confirm Account Number
              </label>
              <input
                type="text"
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value)}
                placeholder="Re-enter account number"
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              IFSC Code
            </label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              placeholder="SBIN0001234"
              required
              maxLength={11}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono uppercase"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              11-character alphanumeric code found on your cheque or bank passbook.
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200">Security & Masking Protection: </span>
              Your full account number is strictly encrypted and never revealed in browser logs, farmer chat, or public listings.
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} />
              <span>{saving ? 'Validating & Saving...' : 'Save Bank Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
