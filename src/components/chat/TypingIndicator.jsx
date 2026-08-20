import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const TypingIndicator = ({ isTyping = false, userName = 'Someone' }) => {
  if (!isTyping) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/95 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-lg text-xs w-max my-1.5 z-20"
      >
        <span className="font-semibold text-indigo-400 dark:text-indigo-400 light:text-indigo-600">
          {userName}
        </span>
        <span className="text-slate-400">is typing</span>

        {/* 3 Bouncing Gradient Typing Dots */}
        <div className="flex items-center gap-1 ml-1">
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
            className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          />
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
          />
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
