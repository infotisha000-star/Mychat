import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldCheck, ArrowRight, Eye, EyeOff, X } from 'lucide-react';

const APP_LOCK_PIN_KEY = 'vortex_app_lock_pin';
const APP_LOCK_BYPASSED_KEY = 'vortex_app_lock_bypassed_session';

export const AppLockModal = ({ isAuthenticated = false, onUnlocked }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [savedPin, setSavedPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSettingMode, setIsSettingMode] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLocked(false);
      return;
    }

    try {
      const storedPin = localStorage.getItem(APP_LOCK_PIN_KEY);
      const isBypassed = sessionStorage.getItem(APP_LOCK_BYPASSED_KEY) === 'true';

      if (storedPin) {
        setHasPinSet(true);
        setSavedPin(storedPin);
        if (!isBypassed) {
          setIsLocked(true);
        }
      }
    } catch (e) {
      console.warn('App lock load warning:', e);
    }
  }, [isAuthenticated]);

  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (pinInput === savedPin) {
      sessionStorage.setItem(APP_LOCK_BYPASSED_KEY, 'true');
      setIsLocked(false);
      setPinInput('');
      if (onUnlocked) onUnlocked();
    } else {
      setErrorMsg('Incorrect PIN. Please try again or tap Skip.');
      setPinInput('');
    }
  };

  const handleSkipLock = () => {
    sessionStorage.setItem(APP_LOCK_BYPASSED_KEY, 'true');
    setIsLocked(false);
    setPinInput('');
    if (onUnlocked) onUnlocked();
  };

  const handleSaveNewPin = (e) => {
    if (e) e.preventDefault();
    if (newPin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }

    localStorage.setItem(APP_LOCK_PIN_KEY, newPin);
    setSavedPin(newPin);
    setHasPinSet(true);
    setIsSettingMode(false);
    sessionStorage.setItem(APP_LOCK_BYPASSED_KEY, 'true');
    setIsLocked(false);
    setNewPin('');
  };

  const handleRemovePin = () => {
    localStorage.removeItem(APP_LOCK_PIN_KEY);
    sessionStorage.removeItem(APP_LOCK_BYPASSED_KEY);
    setHasPinSet(false);
    setSavedPin('');
    setIsLocked(false);
    setIsSettingMode(false);
  };

  if (!isAuthenticated || (!isLocked && !isSettingMode)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
          <Lock className="w-8 h-8" />
        </div>

        {/* Lock Title */}
        <h3 className="text-lg font-bold text-slate-100 mb-1">
          {isSettingMode ? 'Set Security Passcode' : 'App Passcode Lock'}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          {isSettingMode
            ? 'Set a 4-digit PIN to protect your private chat app.'
            : 'Enter your 4-digit PIN or tap Skip to open chat immediately.'}
        </p>

        {/* Setting Mode vs Unlock Mode Form */}
        {isSettingMode ? (
          <form onSubmit={handleSaveNewPin} className="w-full flex flex-col gap-4">
            <div className="relative flex items-center">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter 4-digit PIN"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-center text-lg tracking-widest text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && <div className="text-xs text-rose-400 font-medium">{errorMsg}</div>}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSettingMode(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                Save PIN
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
            <div className="relative flex items-center">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl tracking-[0.5em] text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && <div className="text-xs text-rose-400 font-medium">{errorMsg}</div>}

            {/* Unlock & Skip Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Unlock Chat</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Skip Option Button */}
              <button
                type="button"
                onClick={handleSkipLock}
                className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>Skip for now (Bypass)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
