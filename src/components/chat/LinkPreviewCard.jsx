import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';

export const LinkPreviewCard = ({ url = '', isMe = false }) => {
  if (!url) return null;

  let domain = '';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname.replace('www.', '');
  } catch (e) {
    domain = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-3 p-2.5 rounded-2xl border my-1.5 transition-all hover:opacity-95 active:scale-[0.99] ${
        isMe
          ? 'bg-black/25 border-white/25 text-white hover:bg-black/35'
          : 'bg-slate-950/80 border-indigo-500/30 text-indigo-100 hover:bg-slate-950'
      } max-w-xs block text-xs`}
    >
      <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-cyan-400 shrink-0">
        <Globe className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-[11px] text-cyan-300 truncate">
          {domain}
        </div>
        <div className="text-[10px] opacity-75 truncate text-slate-300 font-mono">
          {url}
        </div>
      </div>

      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-80" />
    </a>
  );
};
