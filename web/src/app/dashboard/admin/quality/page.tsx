"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function DataQuality() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/data-quality').then(res => {
      setIssues(res.data || []);
      setLoading(false);
    }).catch(err => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Data Quality Diagnostics</h1>
      <p className="text-slate-500">Identify inconsistent real database records.</p>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4">
          {issues.length === 0 ? <p className="p-6 bg-white dark:bg-slate-900 rounded-2xl font-bold">All data quality checks passed.</p> : null}
          {issues.map((issue, i) => (
            <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded">{issue.entity}</span>
                <h3 className="font-bold mt-2 text-slate-800 dark:text-slate-200">{issue.problem}</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">ID: {issue.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400">Action: {issue.action}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(issue.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
