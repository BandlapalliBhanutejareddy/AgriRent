"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Database, Bot, Server, RefreshCw, CheckCircle, AlertTriangle, XCircle, Activity, Cpu } from 'lucide-react';

export default function SystemHealth() {
  const [health, setHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ service: string; message: string; success: boolean } | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    api.get('/admin/system-health')
      .then(res => {
        setHealth(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleTestService = async (serviceName: string) => {
    setTestingService(serviceName);
    setTestResult(null);
    try {
      let endpoint = '';
      if (serviceName.toLowerCase().includes('database')) {
        endpoint = '/admin/system-health/test-db';
      } else if (serviceName.toLowerCase().includes('ai')) {
        endpoint = '/admin/system-health/test-ai';
      } else {
        endpoint = '/admin/system-health/test-api';
      }

      const res = await api.post(endpoint);
      setTestResult({
        service: serviceName,
        message: res.data.message || `${serviceName} verified successfully.`,
        success: res.data.success ?? true
      });
      fetchHealth();
    } catch (err: any) {
      setTestResult({
        service: serviceName,
        message: err.response?.data?.message || err.response?.data?.error || `Diagnostic test failed for ${serviceName}.`,
        success: false
      });
    } finally {
      setTestingService(null);
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.toLowerCase().includes('database')) return <Database className="w-5 h-5 text-indigo-500" />;
    if (name.toLowerCase().includes('ai')) return <Bot className="w-5 h-5 text-purple-500" />;
    return <Server className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">System Health & Diagnostics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Live operational status and technical test controls for AgroRent infrastructure.</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300'
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 text-xs">
            <span className="font-bold block mb-0.5">{testResult.service} Diagnostic Result</span>
            {testResult.message}
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Checking infrastructure endpoints...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {health.map((h, i) => {
            const isOnline = h.status === 'ONLINE';
            const isDegraded = h.status === 'DEGRADED';
            const isTesting = testingService === h.service;

            return (
              <div
                key={i}
                className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {getServiceIcon(h.service)}
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{h.service}</h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        isOnline
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                          : isDegraded
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {isOnline ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : isDegraded ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {h.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span>Response Latency</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {h.responseTime ? `${h.responseTime}ms` : 'N/A'}
                    </span>
                  </div>

                  {h.error && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-100 dark:border-red-900/30 text-[11px] text-red-600 dark:text-red-400">
                      {h.error}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleTestService(h.service)}
                  disabled={isTesting}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? `Pinging ${h.service}...` : `Run Actionable Test`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
