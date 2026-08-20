import React, { useState } from 'react';
import { useAccessCodes } from '../../hooks/useAccessCodes';
import { useToast } from '../../context/ToastContext';
import { formatRemainingTime } from '../../utils/timeAgo';
import { Button } from '../ui/Button';
import { 
  KeyRound, 
  Copy, 
  Trash2, 
  Power, 
  Plus, 
  CheckCircle2, 
  Clock, 
  User 
} from 'lucide-react';

export const AccessCodeManager = () => {
  const { accessCodes, loading, createAccessCode, toggleCodeStatus, deleteCode } = useAccessCodes();
  const toast = useToast();

  const [durationHours, setDurationHours] = useState(24);
  const [maxUses, setMaxUses] = useState(1);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleGenerate = async () => {
    setCreating(true);
    try {
      const newCode = await createAccessCode(durationHours, maxUses);
      toast.success(`New code created: ${newCode.code}`);
    } catch (err) {
      toast.error('Failed to create access code.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Access code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Code Generation Card */}
      <div className="p-4.5 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl flex flex-col gap-4 shadow-sm">
        <h4 className="text-sm font-bold text-indigo-400 dark:text-indigo-300 light:text-indigo-700 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Generate Temporary Access Code</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold mb-1 block">
              Expiration Duration
            </label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1 Hour</option>
              <option value={6}>6 Hours</option>
              <option value={12}>12 Hours</option>
              <option value={24}>24 Hours (1 Day)</option>
              <option value={168}>7 Days</option>
              <option value={0}>Unlimited (No Expiry)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold mb-1 block">
              Max Usage Limit
            </label>
            <select
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-full bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1 User (Single Use)</option>
              <option value={5}>5 Users</option>
              <option value={10}>10 Users</option>
              <option value={100}>100 Users (Group)</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          isLoading={creating}
          size="sm"
          className="w-full mt-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold"
        >
          <KeyRound className="w-4 h-4 shrink-0" />
          <span>Generate Access Code</span>
        </Button>
      </div>

      {/* Access Codes List */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600">
          Generated Access Codes ({accessCodes.length})
        </h4>

        {loading ? (
          <div className="text-xs text-slate-500 py-4 text-center">Loading access codes...</div>
        ) : accessCodes.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
            No access codes generated yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
            {accessCodes.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                  item.isActive
                    ? 'bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xs'
                    : 'bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 border-rose-950/40 opacity-60'
                }`}
              >
                {/* Code Info */}
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-400 dark:text-cyan-300 light:text-indigo-700 tracking-wider">
                      {item.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.isActive
                          ? 'bg-emerald-950/80 dark:bg-emerald-950/80 light:bg-emerald-100 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/30'
                          : 'bg-rose-950/80 dark:bg-rose-950/80 light:bg-rose-100 text-rose-400 dark:text-rose-400 light:text-rose-700 border border-rose-500/30'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>{formatRemainingTime(item.expiresAt)}</span>
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>
                        {item.assignedUserName || 'Unassigned'} ({item.currentUses || 0}/{item.maxUses || 1})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(item.code, item.id)}
                    className="p-2 rounded-lg bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 transition-colors"
                    title="Copy Code"
                  >
                    {copiedId === item.id ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-4 h-4 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleCodeStatus(item.id, item.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isActive
                        ? 'bg-amber-950/60 dark:bg-amber-950/60 light:bg-amber-100 text-amber-400 dark:text-amber-400 light:text-amber-700 hover:bg-amber-900'
                        : 'bg-emerald-950/60 dark:bg-emerald-950/60 light:bg-emerald-100 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 hover:bg-emerald-900'
                    }`}
                    title={item.isActive ? 'Disable Code' : 'Enable Code'}
                  >
                    <Power className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete access code ${item.code}?`)) {
                        deleteCode(item.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-rose-950/60 dark:bg-rose-950/60 light:bg-rose-100 text-rose-400 dark:text-rose-400 light:text-rose-700 hover:bg-rose-900 transition-colors"
                    title="Delete Code"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
