import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export const Background3D = () => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Telegram Chat Geometric Background Pattern Overlay */}
      <div 
        className={`absolute inset-0 opacity-[0.03] ${isDark ? 'invert-0' : 'invert'}`}
        style={{
          backgroundImage: `radial-gradient(#6366f1 1px, transparent 1px), radial-gradient(#06b6d4 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />

      {/* Soft Aurora Ambient Glow Spheres (2D Static / Soft Motion) */}
      <motion.div
        animate={{
          opacity: [0.4, 0.6, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] ${
          isDark ? 'bg-indigo-600/20' : 'bg-indigo-300/30'
        }`}
      />

      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] ${
          isDark ? 'bg-cyan-600/15' : 'bg-cyan-300/25'
        }`}
      />

      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] ${
          isDark ? 'bg-violet-900/10' : 'bg-indigo-200/20'
        }`}
      />
    </div>
  );
};
