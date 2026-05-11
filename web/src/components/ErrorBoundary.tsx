'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
          <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center w-full gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
            <div className="mt-6 pt-6 border-t border-slate-50">
               <p className="text-xs text-slate-400 font-mono break-all line-clamp-2">
                 {this.state.error?.message}
               </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
