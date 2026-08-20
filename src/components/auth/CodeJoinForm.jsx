import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { KeyRound, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CodeJoinForm = () => {
  const { validateAndJoinWithCode } = useAuth();
  const toast = useToast();
  
  const [code, setCode] = useState('');
  const [userName, setUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!code.trim()) {
      setErrorMessage('Please enter an access code.');
      return;
    }

    if (!userName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      await validateAndJoinWithCode(code, userName);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('Successfully joined the chat room!');
    } catch (err) {
      console.error('Code validation error:', err);
      const errorMsg = err.message || 'Sorry, this access code is invalid or has expired. Please use a new code.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider bg-cyan-950/40 border border-cyan-800/40 p-2.5 rounded-xl mb-1">
        <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
        <span>Join With Temporary Access Code</span>
      </div>

      <Input
        label="Access Code"
        type="text"
        placeholder="Enter your access code (e.g. ROOM-XXXX)"
        icon={KeyRound}
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase());
          setErrorMessage('');
        }}
        required
      />

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
    </form>
  );
};
