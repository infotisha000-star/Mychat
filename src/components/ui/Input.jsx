import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-300 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full bg-slate-900/80 border ${
            error ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/30'
          } rounded-xl ${Icon ? 'pl-11' : 'px-4'} py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 shadow-inner ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-rose-400 font-medium pl-1 animate-fadeIn">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
