import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Background3D = React.memo(() => {
  const { isDark, activeBgThemeObj } = useTheme();

  const primary = activeBgThemeObj?.primaryColor || '#6366f1';

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 isolation-isolate"
      style={{ contain: 'strict' }}
    >
      {/* Ultra-Fast Radial Gradient Ambient Orbs (Zero GPU/CPU Blur Overhead) */}
      <div 
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: isDark
            ? `radial-gradient(circle at 15% 15%, ${primary}18 0%, transparent 45%), radial-gradient(circle at 85% 85%, #06b6d415 0%, transparent 45%)`
            : `radial-gradient(circle at 15% 15%, ${primary}10 0%, transparent 45%), radial-gradient(circle at 85% 85%, #06b6d410 0%, transparent 45%)`,
        }}
      />

      {/* Subtle Pattern Grid */}
      <div 
        className={`absolute inset-0 opacity-[0.025] ${isDark ? 'invert-0' : 'invert'}`}
        style={{
          backgroundImage: `radial-gradient(${primary} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
});


