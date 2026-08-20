import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, ChevronRight, X } from 'lucide-react';

export const PinnedBanner = ({ pinnedMessages = [], onScrollToMessage, onUnpinMessage, isAdmin }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const currentMsg = pinnedMessages[currentIndex % pinnedMessages.length];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-slate-900/95 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs z-20 shrink-0 shadow-md backdrop-blur-sm"
      >
        {/* Left: Icon & Text preview */}
        <div 
          onClick={() => onScrollToMessage(currentMsg.id)}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
        >
          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 group-hover:scale-105 transition-transform">
            <Pin className="w-3.5 h-3.5 fill-indigo-400/20" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-300">📌 Pinned Message</span>
              {pinnedMessages.length > 1 && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ({(currentIndex % pinnedMessages.length) + 1}/{pinnedMessages.length})
                </span>
              )}
            </div>
            <p className="text-slate-200 truncate text-[11px] group-hover:text-white transition-colors">
              <span className="font-semibold text-slate-400 mr-1">{currentMsg.senderName}:</span>
              {currentMsg.text || (currentMsg.media?.length ? '📷 [Media attachment]' : '')}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {pinnedMessages.length > 1 && (
            <button
              onClick={handleNext}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              title="Next Pinned Message"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onUnpinMessage(currentMsg.id)}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
              title="Unpin Message"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
