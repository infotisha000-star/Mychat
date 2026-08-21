import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Background3D = React.memo(() => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Telegram Chat Geometric Background Pattern Overlay */}
      <div 
        className={`absolute inset-0 opacity-[0.03] ${isDark ? 'invert-0' : 'invert'}`}
        style={{
          backgroundImage: `radial-gradient(#6366f1 1px, transparent 1px), radial-gradient(#06b6d4 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
          transform: 'translateZ(0)',
        }}
      />

      {/* Hardware Accelerated Ambient Glow Orbs */}
      <div
        style={{ transform: 'translateZ(0)' }}
        className={`absolute -top-40 -left-40 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[60px] sm:blur-[100px] opacity-50 ${
          isDark ? 'bg-indigo-600/20' : 'bg-indigo-300/30'
        }`}
      />

      <div
        style={{ transform: 'translateZ(0)' }}
        className={`absolute -bottom-40 -right-40 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[60px] sm:blur-[100px] opacity-40 ${
          isDark ? 'bg-cyan-600/15' : 'bg-cyan-300/25'
        }`}
      />

      <div 
        style={{ transform: 'translateZ(0)' }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full blur-[70px] sm:blur-[120px] opacity-30 ${
          isDark ? 'bg-violet-900/10' : 'bg-indigo-200/20'
        }`}
      />
    </div>
  );
});

