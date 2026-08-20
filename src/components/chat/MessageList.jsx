import React, { useRef, useEffect, useState } from 'react';
import { MessageItem } from './MessageItem';
import { Skeleton } from '../ui/Skeleton';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import { ArrowDown, MessageSquare, Trash2, X, CheckSquare, Square } from 'lucide-react';

export const MessageList = ({
  messages = [],
  loading = false,
  currentUser = null,
  isAdmin = false,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onOpenImage,
  onOpenVideo,
}) => {
  const { deleteMultipleMessages } = useChat();
  const toast = useToast();

  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Multi-Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (!isSelectionMode) {
      scrollToBottom(false);
    }
  }, [messages.length, isSelectionMode]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  // Start selection mode from a message
  const handleStartSelectionMode = (initialId) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([initialId]));
    toast.info('Selection mode activated. Tap messages to select.');
  };

  // Toggle selection for a message ID
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Select All messages
  const handleSelectAll = () => {
    const allIds = messages.filter((m) => !m.deleted).map((m) => m.id);
    setSelectedIds(new Set(allIds));
  };

  // Bulk Delete Action
  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    if (confirm(`Are you sure you want to delete ${count} selected ${count === 1 ? 'message' : 'messages'}?`)) {
      deleteMultipleMessages(Array.from(selectedIds));
      toast.success(`${count} ${count === 1 ? 'message' : 'messages'} deleted!`);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        <Skeleton className="h-16 w-3/4 self-start" />
        <Skeleton className="h-12 w-1/2 self-end" />
        <Skeleton className="h-20 w-4/5 self-start" />
        <Skeleton className="h-14 w-2/3 self-end" />
      </div>
    );
  }

  if (!messages || messages.filter((m) => !m.deleted).length === 0) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-3 text-slate-500">
        <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-indigo-400">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="font-semibold text-slate-300">No Messages Yet</div>
        <p className="text-xs max-w-xs text-slate-400">
          Send the first message to start the real-time conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Telegram-style Bulk Selection Floating Toolbar */}
      {isSelectionMode && (
        <div className="sticky top-0 z-30 bg-indigo-950/95 border-b border-indigo-500/40 px-4 py-2.5 flex items-center justify-between shadow-xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelSelection}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-indigo-200">
              {selectedIds.size} Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Message Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto flex flex-col gap-1 relative scroll-smooth"
      >
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            currentUser={currentUser}
            isAdmin={isAdmin}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(msg.id)}
            onToggleSelect={handleToggleSelect}
            onStartSelectionMode={handleStartSelectionMode}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            onOpenImage={onOpenImage}
            onOpenVideo={onOpenVideo}
          />
        ))}
        <div ref={bottomRef} className="h-1" />

        {showScrollBottom && !isSelectionMode && (
          <button
            onClick={() => scrollToBottom(true)}
            className="sticky bottom-4 right-4 ml-auto p-3 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-950/60 border border-indigo-400/40 z-20 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
