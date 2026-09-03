import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Background3D = React.memo(() => {
  const { isDark, activeBgThemeObj } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-500">
      {/* Telegram Chat Geometric Background Pattern Overlay */}
      <div 
        className={`absolute inset-0 opacity-[0.03] ${isDark ? 'invert-0' : 'invert'}`}
        style={{
          backgroundImage: `radial-gradient(${activeBgThemeObj?.primaryColor || '#6366f1'} 1px, transparent 1px), radial-gradient(#06b6d4 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
          transform: 'translateZ(0)',
        }}
      />

      {/* Hardware Accelerated Ambient Glow Orbs */}
      <div
        style={{ transform: 'translateZ(0)' }}
        className={`absolute -top-40 -left-40 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full blur-[50px] sm:blur-[65px] opacity-50 transition-all duration-700 ${
          activeBgThemeObj?.glowTop || 'bg-indigo-600/20'
        }`}
      />

      <div
        style={{ transform: 'translateZ(0)' }}
        className={`absolute -bottom-40 -right-40 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full blur-[50px] sm:blur-[65px] opacity-40 transition-all duration-700 ${
          activeBgThemeObj?.glowBottom || 'bg-cyan-600/15'
        }`}
      />

      <div 
        style={{ transform: 'translateZ(0)' }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[60px] sm:blur-[75px] opacity-25 ${
          isDark ? 'bg-violet-900/10' : 'bg-indigo-200/20'
        }`}
      />
    </div>
  );
});

