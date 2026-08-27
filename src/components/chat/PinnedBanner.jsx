import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, ChevronRight, ChevronLeft, X, Layers } from 'lucide-react';

export const PinnedBanner = ({ pinnedMessages = [], onScrollToMessage, onUnpinMessage, isAdmin }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAllModal, setShowAllModal] = useState(false);

  const safePinned = (Array.isArray(pinnedMessages) ? pinnedMessages : []).filter((m) => m && m.id && !m.deleted);

  // Keep index within bounds whenever safePinned changes
  useEffect(() => {
    if (safePinned.length > 0) {
      setCurrentIndex((prev) => (prev >= safePinned.length ? safePinned.length - 1 : prev));
    }
  }, [safePinned.length]);

  if (safePinned.length === 0) return null;

  const currentMsg = safePinned[currentIndex % safePinned.length] || safePinned[0];

  const handleBannerClick = () => {
    if (!currentMsg) return;
    if (onScrollToMessage) onScrollToMessage(currentMsg.id);
    if (safePinned.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % safePinned.length);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (safePinned.length > 1) {
      const nextIdx = (currentIndex + 1) % safePinned.length;
      setCurrentIndex(nextIdx);
      if (onScrollToMessage && safePinned[nextIdx]) {
        onScrollToMessage(safePinned[nextIdx].id);
      }
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (safePinned.length > 1) {
      const prevIdx = (currentIndex - 1 + safePinned.length) % safePinned.length;
      setCurrentIndex(prevIdx);
      if (onScrollToMessage && safePinned[prevIdx]) {
        onScrollToMessage(safePinned[prevIdx].id);
      }
    }
  };

  return (
    <div className="relative z-20 shrink-0 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900/95 dark:bg-slate-900/95 light:bg-amber-50/90 border-b border-indigo-500/30 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs shadow-md backdrop-blur-md"
        >
          {/* Telegram Accent Bar & Animated Text */}
          <div 
            onClick={handleBannerClick}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
            title="Click to jump to pinned message (Click again to cycle)"
          >
            {/* Telegram Vertical Accent Pill */}
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-amber-400 to-indigo-500 shrink-0 shadow-sm group-hover:scale-y-110 transition-transform" />

            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400 dark:text-amber-400 light:text-amber-700 text-[11px] sm:text-xs flex items-center gap-1">
                  <Pin className="w-3 h-3 fill-amber-400/40" />
                  <span>Pinned Message</span>
                </span>
                {safePinned.length > 1 && (
                  <span className="text-[10px] text-amber-300 font-mono bg-amber-950/90 px-1.5 py-0.2 rounded-md border border-amber-500/40">
                    {(currentIndex % safePinned.length) + 1} / {safePinned.length}
                  </span>
                )}
              </div>

              {/* Animated Text Content */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMsg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="text-slate-200 dark:text-slate-200 light:text-slate-800 truncate text-[11px] font-medium group-hover:text-white transition-colors"
                >
                  <span className="font-semibold text-indigo-300 dark:text-indigo-300 light:text-indigo-600 mr-1">
                    {currentMsg.senderName || 'User'}:
                  </span>
                  {currentMsg.text || (currentMsg.media?.length ? '📷 [Media attachment]' : '')}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {safePinned.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Previous Pinned"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Next Pinned"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllModal((prev) => !prev);
                  }}
                  className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 px-1.5"
                  title="View All Pinned"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{safePinned.length}</span>
                </button>
              </>
            )}

            {isAdmin && currentMsg && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUnpinMessage) onUnpinMessage(currentMsg.id);
                }}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Unpin Current Message"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Popover Listing All Pinned Messages */}
      {showAllModal && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40"
            onClick={() => setShowAllModal(false)}
          />
          <div className="absolute left-2 right-2 top-full mt-1 z-40 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 max-h-64 overflow-y-auto flex flex-col gap-2 text-xs animate-fadeIn">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-bold text-amber-400">
              <span>All Pinned Messages ({safePinned.length})</span>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {safePinned.map((msg, idx) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    if (onScrollToMessage) onScrollToMessage(msg.id);
                    setShowAllModal(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-800/60 cursor-pointer transition-all group"
                >
                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-slate-300 text-[11px] group-hover:text-amber-300">
                      {msg.senderName || 'User'}
                    </span>
                    <p className="text-slate-400 truncate text-[10px]">
                      {msg.text || (msg.media?.length ? '📷 [Media attachment]' : '')}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUnpinMessage) onUnpinMessage(msg.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                      title="Unpin"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
