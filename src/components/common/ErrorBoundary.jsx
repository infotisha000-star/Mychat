import React from 'react';
import { ShieldAlert, RefreshCw, KeyRound } from 'lucide-react';

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
    // Purge session to prevent infinite crash loops on startup
    try {
      localStorage.removeItem('vortex_chat_user_session');
    } catch (e) {}
  }

  handleReset = () => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19] text-slate-100 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-100">Session Reset Required</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your previous session key has expired or encountered a network update. Tap below to start a fresh login.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Join With New Code</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
