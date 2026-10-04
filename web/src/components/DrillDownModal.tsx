'use client';

import { X } from 'lucide-react';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headers: string[];
  rows: any[][];
}

export default function DrillDownModal({ isOpen, onClose, title, headers, rows }: DrillDownModalProps) {
  if (!isOpen) return null;

  // Calculate total amount if this is the Revenue report (Amount is at index 7)
  const isRevenueReport = title.includes('Revenue') || title.includes('Rental Value');
  const totalAmount = rows.reduce((sum, row) => {
    if (row[7] && typeof row[7] === 'string' && row[7].startsWith('₹')) {
      const val = parseFloat(row[7].replace(/[^0-9.-]+/g,""));
      return sum + (isNaN(val) ? 0 : val);
    }
    return sum;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} className="stroke-[3]" />
          </button>
        </div>

        {/* Totals Header */}
        <div className="px-6 md:px-8 py-4 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Records</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{rows.length} bookings</p>
          </div>
          {isRevenueReport && (
            <div className="text-right">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Total Rental Value</p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)}
              </p>
            </div>
          )}
        </div>

        {/* Content Table */}
        <div className="p-6 md:p-8 overflow-auto flex-1">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="font-semibold">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    {headers.map((header, i) => (
                      <th key={i} className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
