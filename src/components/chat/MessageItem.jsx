import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { renderFormattedText } from '../../utils/textFormatter';
import { formatTimeAgo, formatClockTime } from '../../utils/timeAgo';
import { MediaGallery } from './MediaGallery';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import confetti from 'canvas-confetti';
import { 
  Copy, 
  Edit3, 
  Trash2, 
  Pin, 
  Reply, 
  ShieldCheck, 
  User, 
  AlertCircle, 
  Check,
  X,
  CheckSquare
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '👏', '🎉'];

export const MessageItem = React.memo(({
  message,
  currentUser,
  isAdmin,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onStartSelectionMode,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onToggleReaction,
  onOpenImage,
  onOpenVideo,
  onScrollToMessage,
}) => {
  const toast = useToast();
  const { activeBgThemeObj } = useTheme();
  
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const [editError, setEditError] = useState('');
  const [copied, setCopied] = useState(false);

  const bubbleRef = useRef(null);

  // Gesture Tracker Refs (Triple Tap & Long Press)
  const clickCountRef = useRef(0);
  const clickResetTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const isMe = currentUser?.uid === message.senderId;
  const isMessageAdmin = message.senderRole === 'admin';

  if (message.deleted) {
    return null;
  }

  const openMenuSmart = () => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
    setShowContextMenu(true);
  };

  const handlePressStart = () => {
    if (isSelectionMode) return;
    longPressTimerRef.current = setTimeout(() => {
      openMenuSmart();
    }, 400);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleBubbleClick = (e) => {
    e.stopPropagation();

    if (isSelectionMode) {
      if (onToggleSelect) onToggleSelect(message.id);
      return;
    }

    clickCountRef.current += 1;

    if (clickResetTimerRef.current) {
      clearTimeout(clickResetTimerRef.current);
    }

    if (clickCountRef.current === 3) {
      openMenuSmart();
      clickCountRef.current = 0;
    } else {
      clickResetTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 450);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelectionMode) {
      if (onToggleSelect) onToggleSelect(message.id);
    } else {
      openMenuSmart();
    }
  };

  const handleCopyText = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    toast.success('Message copied to clipboard!');
    setShowContextMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectReaction = (emoji) => {
    if (onToggleReaction) onToggleReaction(message.id, emoji);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
    setShowContextMenu(false);
  };

  const handleTogglePin = () => {
    onPin(message.id);
    setShowContextMenu(false);
    if (!message.pinned) {
      toast.success('Message pinned to top banner!');
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.3 } });
    } else {
      toast.info('Message unpinned!');
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditError('');

    if (message.editCount >= 3) {
      setEditError('This message has been edited the maximum limit of 3 times.');
      return;
    }

    if (!editText.trim()) {
      setEditError('Edited message content cannot be empty.');
      return;
    }

    try {
      onEdit(message.id, editText);
      setShowEditModal(false);
    } catch (err) {
      setEditError(err.message || 'Failed to edit message.');
    }
  };

  const reactionsMap = message.reactions || {};
  const activeReactionEntries = Object.entries(reactionsMap).filter(([_, users]) => users && users.length > 0);

  return (
    <div 
      id={`msg-${message.id}`} 
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 60px' }}
      className={`group relative flex items-center gap-3 my-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} max-w-full select-none`}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <button
          onClick={() => onToggleSelect && onToggleSelect(message.id)}
          className="p-1 text-indigo-500 hover:text-indigo-400 transition-transform active:scale-110 shrink-0"
        >
          {isSelected ? (
            <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center border border-indigo-400">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-400 dark:border-slate-700" />
          )}
        </button>
      )}

      {/* Received Message Messenger Avatar Pill */}
      {!isMe && (
        <div 
          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow-md shrink-0 self-end mb-1 select-none ${
            isMessageAdmin
              ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 ring-1 ring-amber-400/50'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600 ring-1 ring-indigo-400/30'
          }`}
          title={message.senderName}
        >
          {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      )}

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full flex-1`}>
        {/* Sender Header */}
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400">
          {isMessageAdmin ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
              <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>ADMIN</span>
            </span>
          ) : (
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{message.senderName}</span>
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500 text-[10px]">&bull; {formatTimeAgo(message.timestamp)}</span>
          {message.pinned && (
            <span className="text-amber-500 dark:text-amber-400 font-semibold flex items-center gap-0.5 ml-1">
              <Pin className="w-3 h-3 fill-amber-400/20" />
              <span>Pinned</span>
            </span>
          )}
        </div>

        {/* Main Messenger Rounded Message Bubble */}
        <div
          ref={bubbleRef}
          onClick={handleBubbleClick}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchMove={handlePressEnd}
          onContextMenu={handleContextMenu}
          className={`relative max-w-[88%] sm:max-w-[78%] px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 active:scale-[0.98] ${
            isSelected ? 'ring-2 ring-indigo-500 shadow-xl' : ''
          } ${
            isMe
              ? `msg-bubble-sent bg-gradient-to-r ${activeBgThemeObj?.gradient || 'from-blue-600 via-indigo-600 to-violet-600'} text-white rounded-[22px] rounded-br-[5px] shadow-md shadow-indigo-600/25 border border-indigo-400/20`
              : isMessageAdmin
              ? 'msg-bubble-admin bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/50 text-slate-100 rounded-[22px] rounded-bl-[5px] shadow-lg shadow-indigo-950/40'
              : 'msg-bubble-received bg-slate-900/95 dark:bg-slate-900 border border-slate-800 text-slate-100 rounded-[22px] rounded-bl-[5px] shadow-sm'
          }`}
        >
          {/* Reply Reference */}
          {message.replyTo && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (onScrollToMessage && message.replyTo.id) {
                  onScrollToMessage(message.replyTo.id);
                }
              }}
              className="mb-2 p-2 rounded-lg bg-black/20 dark:bg-black/30 border-l-2 border-indigo-400 text-xs text-indigo-200 cursor-pointer hover:bg-black/30 transition-colors"
            >
              <div className="font-semibold text-[11px] text-indigo-300">{message.replyTo.senderName}</div>
              <div className="truncate text-slate-200 opacity-90">{message.replyTo.text}</div>
            </div>
          )}

          {/* Message Text */}
          {message.text && (
            <div
              className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full font-sans text-[14px] leading-relaxed select-text"
              dangerouslySetInnerHTML={{ __html: renderFormattedText(message.text) }}
            />
          )}

          {/* Multi-Media Gallery */}
          {message.media && message.media.length > 0 && (
            <MediaGallery
              media={message.media}
              onOpenImage={onOpenImage}
              onOpenVideo={onOpenVideo}
            />
          )}

          {/* Timestamp Footer */}
          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-80 select-none">
            {message.edited && (
              <span className="italic font-medium" title={`Edits: ${message.editCount}/3`}>
                edited ({message.editCount}/3)
              </span>
            )}
            <span>{formatClockTime(message.timestamp)}</span>
          </div>
        </div>

        {/* Emoji Reactions Pills */}
        {activeReactionEntries.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {activeReactionEntries.map(([emoji, users]) => {
              const hasReacted = currentUser && users.includes(currentUser.uid);
              return (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction && onToggleReaction(message.id, emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                    hasReacted
                      ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-500/60 text-indigo-700 dark:text-indigo-200 shadow-xs'
                      : 'bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tap / Click Hold Floating Context Menu (Portal to Body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showContextMenu && !isSelectionMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Screen Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40"
                onClick={() => setShowContextMenu(false)}
              />

              {/* Centered Floating Actions Menu */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative z-50 w-full max-w-xs bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700/90 dark:border-slate-700/90 light:border-slate-300 rounded-3xl shadow-2xl p-3.5 flex flex-col gap-2 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900"
              >
                {/* Emoji Reactions Bar */}
                <div className="flex items-center justify-between gap-1 p-1.5 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl overflow-x-auto scrollbar-none">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectReaction(emoji)}
                      className="text-lg hover:scale-125 transition-transform p-1 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200"
                      title={`React ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Menu Title Header */}
                <div className="px-2 py-1 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600">
                  <span>Message Actions</span>
                  <button
                    onClick={() => setShowContextMenu(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Select Multiple Messages */}
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    if (onStartSelectionMode) onStartSelectionMode(message.id);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition-colors font-medium text-left"
                >
                  <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Select Multiple</span>
                </button>

                {/* Pin / Unpin Message */}
                <button
                  onClick={handleTogglePin}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition-colors font-medium text-left"
                >
                  <Pin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{message.pinned ? 'Unpin Message' : '📌 Pin Message'}</span>
                </button>

                {/* Copy Text */}
                {message.text && (
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition-colors font-medium text-left"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-cyan-400 shrink-0" />}
                    <span>Copy Text</span>
                  </button>
                )}

                {/* Reply */}
                <button
                  onClick={() => {
                    onReply(message);
                    setShowContextMenu(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition-colors font-medium text-left"
                >
                  <Reply className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Reply</span>
                </button>

                {/* Edit */}
                {(isMe || isAdmin) && !message.deleted && (
                  <button
                    onClick={() => {
                      if (message.editCount >= 3) {
                        alert('This message has been edited the maximum limit of 3 times.');
                      } else {
                        setEditText(message.text || '');
                        setShowEditModal(true);
                      }
                      setShowContextMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition-colors font-medium text-left"
                  >
                    <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Edit Message</span>
                  </button>
                )}

                {/* Delete */}
                {(isMe || isAdmin) && (
                  <button
                    onClick={() => {
                      onDelete(message.id);
                      setShowContextMenu(false);
                      toast.success('Message deleted!');
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/60 transition-colors font-medium text-left border-t border-slate-800 mt-0.5 pt-2"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Delete Message</span>
                  </button>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Message Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Message"
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Maximum 3 edits allowed per message.</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              Current Edits: {message.editCount}/3
            </span>
          </div>

          <textarea
            rows={5}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              setEditError('');
            }}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-pre-wrap"
            placeholder="Type updated message..."
          />

          {editError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/50 text-rose-700 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={message.editCount >= 3}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
});

