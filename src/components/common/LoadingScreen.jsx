import React from 'react';
import { motion } from 'framer-motion';
import { AppLogo } from './AppLogo';

export const LoadingScreen = ({ message = 'Loading application...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0f19] text-white p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6"
      >
        <AppLogo size="xl" />
        
        <div className="flex items-center gap-3 mt-4 bg-slate-900/80 border border-slate-800 px-5 py-2.5 rounded-full shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-sm font-medium text-slate-300">{message}</span>
        </div>
      </motion.div>
    </div>
  );
};
