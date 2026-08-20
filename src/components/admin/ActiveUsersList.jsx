import React from 'react';
import { useChat } from '../../context/ChatContext';
import { formatTimeAgo } from '../../utils/timeAgo';
import { Users, ShieldCheck, UserCheck, Key } from 'lucide-react';

export const ActiveUsersList = () => {
  const { activeUsers } = useChat();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Online Users ({activeUsers.length})
        </h4>
      </div>

      {activeUsers.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
          No active user sessions found.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {activeUsers.map((session) => (
            <div
              key={session.id}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
                  {session.userName ? session.userName.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="flex flex-col">
                  <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                    {session.userName || 'Temporary User'}
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-mono text-cyan-300">{session.code}</span>
                    <span>&bull;</span>
                    <span>Joined: {formatTimeAgo(session.joinedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
