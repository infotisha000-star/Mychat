import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { KeyRound, UserCheck, ArrowRight, Sparkles, QrCode, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRScannerModal } from './QRScannerModal';

const LAST_NAME_KEY = 'vortex_last_user_name';

export const CodeJoinForm = () => {
  const { validateAndJoinWithCode } = useAuth();
  const toast = useToast();
  
  const [code, setCode] = useState('');
  const [userName, setUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Restore last used name from local storage on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(LAST_NAME_KEY);
      if (savedName) setUserName(savedName);
    } catch (e) {}
  }, []);

  const executeJoin = async (targetCode, targetName) => {
    const cleanCode = targetCode.trim();
    const cleanName = targetName.trim() || 'Guest';

    setLoading(true);
    setErrorMessage('');

    try {
      localStorage.setItem(LAST_NAME_KEY, cleanName);
      await validateAndJoinWithCode(cleanCode, cleanName);
      
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });

      toast.success(`Welcome to the chat, ${cleanName}!`);
    } catch (err) {
      console.error('Code validation error:', err);
      const errorMsg = err.message || 'Sorry, this access code is invalid or has expired. Please use a new code.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('Please enter an access code.');
      return;
    }

    if (!userName.trim()) {
      setErrorMessage('Please enter your display name.');
      return;
    }

    executeJoin(code, userName);
  };

  // Instant Auto-Login Callback when QR code is scanned via camera
  const handleScanSuccess = (scannedCode) => {
    setCode(scannedCode);
    toast.info(`QR Code scanned: ${scannedCode}. Logging in...`);

    const effectiveName = userName.trim() || localStorage.getItem(LAST_NAME_KEY) || 'User';
    if (!userName.trim()) setUserName(effectiveName);

    // Auto-login instantly!
    executeJoin(scannedCode, effectiveName);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-cyan-400 font-semibold text-xs uppercase tracking-wider bg-cyan-950/40 border border-cyan-800/40 p-2.5 rounded-xl mb-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
          <span>Temporary Access Code</span>
        </div>

        {/* Camera QR Scanner Launch Button */}
        <button
          type="button"
          onClick={() => setShowScannerModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-md transition-all active:scale-95 shrink-0"
          title="Open Camera QR Code Scanner"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Scan QR</span>
        </button>
      </div>

      <div className="relative">
        <Input
          label="Access Code"
          type="text"
          placeholder="Enter access code or tap Scan QR"
          icon={KeyRound}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setErrorMessage('');
          }}
          required
        />
        <button
          type="button"
          onClick={() => setShowScannerModal(true)}
          className="absolute right-3 top-[34px] text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 transition-colors"
          title="Scan QR Code with Camera"
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>

      <Input
        label="Enter Your Name"
        type="text"
        placeholder="Enter your display name"
        icon={UserCheck}
        value={userName}
        onChange={(e) => {
          setUserName(e.target.value);
          setErrorMessage('');
        }}
        required
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-medium leading-relaxed animate-fadeIn">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        isLoading={loading}
        size="lg"
        className="w-full mt-1 group"
      >
        <span>Join Chat Room</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Live Camera Scanner Modal */}
      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={handleScanSuccess}
      />
    </form>
  );
};

