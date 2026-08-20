import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AppLogo } from '../common/AppLogo';
import { CodeJoinForm } from './CodeJoinForm';
import { LoginForm } from './LoginForm';
import { KeyRound, ShieldAlert } from 'lucide-react';

export const AuthCard = () => {
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'admin'

  return (
    <div className="relative w-full max-w-md mx-auto p-4 sm:p-6">
      {/* Background Glow Spheres */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col gap-6"
      >
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <AppLogo size="lg" />
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Private temporary access real-time messaging room for secure cross-device communication.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'code'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Join With Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Dynamic Form Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'code' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'code' ? <CodeJoinForm /> : <LoginForm />}
        </motion.div>

        {/* Footer Disclaimer */}
        <div className="text-center pt-2 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500">
            End-to-End Privacy & Temporary Access Reserved &bull; Vortex PWA
          </span>
        </div>
      </motion.div>
    </div>
  );
};
