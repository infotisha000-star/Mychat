import React from 'react';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Vortex Chat ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleSoftRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleFullReset = () => {
    try {
      localStorage.removeItem('vortex_chat_user_session');
      sessionStorage.clear();
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19] text-slate-100 p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-100">Application Notice</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              A temporary display error occurred. You can reload the page to continue using your current session, or reset to start fresh.
            </p>

            {this.state.error && (
              <div className="w-full text-left p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-[11px] font-mono leading-tight break-all max-h-32 overflow-y-auto">
                <span className="font-bold text-rose-400 block mb-1">Diagnostic Detail:</span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button
                onClick={this.handleSoftRetry}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Reloading Page</span>
              </button>

              <button
                onClick={this.handleFullReset}
                className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Reset Session & Join Fresh</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
