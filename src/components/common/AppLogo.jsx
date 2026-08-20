import React from 'react';

export const AppLogo = ({ size = 'md', showText = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full" />
        <img
          src="/logo.svg"
          alt="Vortex Chat Logo"
          className="w-full h-full object-contain relative z-10 filter drop-shadow-md"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold ${textSizes[size]} tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 font-sans`}>
            VORTEX <span className="font-light text-slate-400">CHAT</span>
          </div>
          {size !== 'sm' && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400/80 -mt-1">
              Private Access
            </span>
          )}
        </div>
      )}
    </div>
  );
};
