import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Mail, Lock, ShieldCheck, Info } from 'lucide-react';

export const LoginForm = () => {
  const { adminLogin } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('info.shorif0000@gmail.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(email, password);
      toast.success('Admin login successful!');
    } catch (err) {
      console.error('Admin login error:', err);
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider bg-indigo-950/40 border border-indigo-800/40 p-2.5 rounded-xl mb-1">
        <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
        <span>Admin Panel Authentication</span>
      </div>

      <Input
        label="Admin Email"
        type="email"
        placeholder="info.shorif0000@gmail.com"
        icon={Mail}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••••••"
        icon={Lock}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {/* Dev Bypass Testing Info */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-indigo-400 shrink-0" />
        <div>
          <span className="font-bold text-white">Dev Testing Password: </span>
          <span className="font-mono text-cyan-300 font-bold">admin</span>
        </div>
      </div>

      <Button
        type="submit"
        isLoading={loading}
        size="lg"
        className="w-full mt-1"
      >
        Log In as Admin
      </Button>
    </form>
  );
};
