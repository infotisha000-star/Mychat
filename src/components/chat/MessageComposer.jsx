import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import { useAppwriteUpload } from '../../hooks/useAppwriteUpload';
import { insertFormattingSymbol } from '../../utils/textFormatter';
import { MediaUploader } from './MediaUploader';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Bold, 
  Italic, 
  Code, 
  Quote, 
  Link2, 
  X, 
  Strikethrough,
  Underline as UnderlineIcon,
  EyeOff,
  Type,
  Plus
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '👏', '🎉'];

export const MessageComposer = ({ replyTo = null, onCancelReply }) => {
  const { sendMessage } = useChat();
  const { uploadMediaFiles, uploading, uploadProgress } = useAppwriteUpload();
  const toast = useToast();

  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [sending, setSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSelectText = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    if (start !== end && end - start > 0) {
      setSelectionRange({ start, end });
      setShowSelectionMenu(true);
    } else {
      setShowSelectionMenu(false);
    }
  };

  const applyFormat = (symbol) => {
    if (!textareaRef.current) return;
    const start = selectionRange.start !== selectionRange.end ? selectionRange.start : textareaRef.current.selectionStart;
    const end = selectionRange.start !== selectionRange.end ? selectionRange.end : textareaRef.current.selectionEnd;
    
    const formatted = insertFormattingSymbol(text, symbol, start, end);
    setText(formatted);
    setShowSelectionMenu(false);
    toast.info(`Applied ${symbol} formatting!`);
  };

  const handleKeyDown = (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyFormat('bold');
    } else if (isCtrl && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyFormat('italic');
    } else if (isCtrl && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      applyFormat('underline');
    } else if (isCtrl && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      applyFormat('link');
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const fileObjects = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    }));

    setSelectedFiles((prev) => [...prev, ...fileObjects]);
  };

  const handleRemoveFile = (idx) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      if (updated[idx].previewUrl) URL.revokeObjectURL(updated[idx].previewUrl);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const handleClearAllFiles = () => {
    selectedFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setSelectedFiles([]);
  };

  const handleAddEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (sending || uploading) return;

    if (!text.trim() && selectedFiles.length === 0) {
      toast.warning('Please enter a message or attach media files.');
      return;
    }

    setSending(true);

    try {
      let uploadedMedia = [];
      if (selectedFiles.length > 0) {
        const rawFiles = selectedFiles.map((item) => item.file);
        uploadedMedia = await uploadMediaFiles(rawFiles);
      }

      await sendMessage({
        text,
        media: uploadedMedia,
        replyTo,
      });

      setText('');
      handleClearAllFiles();
      setShowSelectionMenu(false);
      setIsFocused(false);
      if (onCancelReply) onCancelReply();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error('Send error:', err);
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const canSend = text.trim().length > 0 || selectedFiles.length > 0;

  return (
    <div className="msg-composer bg-slate-900/95 border-t border-slate-800 flex flex-col shrink-0 relative z-20 transition-colors duration-300">
      {/* Reply Reference Header */}
      {replyTo && (
        <div className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-indigo-50 px-4 py-2 border-b border-indigo-500/30 flex items-center justify-between text-xs">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-indigo-400 dark:text-indigo-400 light:text-indigo-700">
              Replying to: {replyTo.senderName}
            </span>
            <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 truncate text-[11px]">
              {replyTo.text || '[Media]'}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Media Pre-upload Preview Drawer */}
      <MediaUploader
        selectedFiles={selectedFiles}
        onRemoveFile={handleRemoveFile}
        onClearAll={handleClearAllFiles}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />

      {/* Selection Formatting Context Menu */}
      <AnimatePresence>
        {showSelectionMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-3 left-4 right-4 z-40 bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl p-2 flex items-center gap-1 overflow-x-auto text-xs backdrop-blur-xl"
          >
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-2 uppercase tracking-wider shrink-0">
              Formatting:
            </span>
            <button
              onClick={() => applyFormat('bold')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors shrink-0"
              title="Ctrl+B"
            >
              <Bold className="w-3.5 h-3.5" />
              <span>Bold</span>
            </button>
            <button
              onClick={() => applyFormat('italic')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors shrink-0"
              title="Ctrl+I"
            >
              <Italic className="w-3.5 h-3.5" />
              <span>Italic</span>
            </button>
            <button
              onClick={() => applyFormat('underline')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors shrink-0"
              title="Ctrl+U"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
              <span>Underline</span>
            </button>
            <button
              onClick={() => applyFormat('strikethrough')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors shrink-0"
            >
              <Strikethrough className="w-3.5 h-3.5" />
              <span>Strike</span>
            </button>
            <button
              onClick={() => applyFormat('monospace')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors shrink-0"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Monospace</span>
            </button>
            <button
              onClick={() => applyFormat('spoiler')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors shrink-0"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
              <span>Spoiler</span>
            </button>
            <button
              onClick={() => applyFormat('quote')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors shrink-0"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Quote</span>
            </button>
            <button
              onClick={() => applyFormat('link')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors shrink-0"
              title="Ctrl+K"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>Link</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formatting Toolbar Drawer */}
      {showFormatToolbar && (
        <div className="px-4 py-1.5 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-100 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-2 overflow-x-auto text-slate-400">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className="p-1.5 hover:text-indigo-600 dark:hover:text-white rounded transition-colors flex items-center gap-1 text-xs"
            title="Bold *text*"
          >
            <Bold className="w-4 h-4" />
            <span>Bold</span>
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className="p-1.5 hover:text-indigo-600 dark:hover:text-white rounded transition-colors flex items-center gap-1 text-xs"
            title="Italic _text_"
          >
            <Italic className="w-4 h-4" />
            <span>Italic</span>
          </button>
          <button
            type="button"
            onClick={() => applyFormat('underline')}
            className="p-1.5 hover:text-indigo-600 dark:hover:text-white rounded transition-colors flex items-center gap-1 text-xs"
            title="Underline __text__"
          >
            <UnderlineIcon className="w-4 h-4" />
            <span>Underline</span>
          </button>
          <button
            type="button"
            onClick={() => applyFormat('strikethrough')}
            className="p-1.5 hover:text-indigo-600 dark:hover:text-white rounded transition-colors flex items-center gap-1 text-xs"
            title="Strikethrough ~text~"
          >
            <Strikethrough className="w-4 h-4" />
            <span>Strike</span>
          </button>
          <button
            type="button"
            onClick={() => applyFormat('monospace')}
            className="p-1.5 hover:text-indigo-600 dark:hover:text-white rounded transition-colors flex items-center gap-1 text-xs"
            title="Monospace `text`"
          >
            <Code className="w-4 h-4" />
            <span>Monospace</span>
          </button>
          <button
            type="button"
            onClick={() => applyFormat('spoiler')}
            className="p-1.5 hover:text-indigo-600 dark:hover:text-white rounded transition-colors flex items-center gap-1 text-xs text-amber-500"
            title="Spoiler ||text||"
          >
            <EyeOff className="w-4 h-4" />
            <span>Spoiler</span>
          </button>
          <button
            type="button"
            onClick={() => applyFormat('quote')}
            className="p-1.5 hover:text-indigo-600 dark:hover:text-white rounded transition-colors flex items-center gap-1 text-xs"
            title="Quote > text"
          >
            <Quote className="w-4 h-4" />
            <span>Quote</span>
          </button>
          <button
            type="button"
            onClick={() => applyFormat('link')}
            className="p-1.5 hover:text-indigo-600 dark:hover:text-white rounded transition-colors flex items-center gap-1 text-xs text-cyan-500"
            title="Link [text](url)"
          >
            <Link2 className="w-4 h-4" />
            <span>Link</span>
          </button>
        </div>
      )}

      {/* Quick Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="p-2.5 bg-slate-950 dark:bg-slate-950 light:bg-slate-100 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="text-lg hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Bar */}
      <form onSubmit={handleSend} className="p-3 flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Collapsible Left Side Option Buttons */}
        <AnimatePresence mode="wait">
          {!isFocused ? (
            <motion.div
              key="expanded-options"
              initial={{ opacity: 0, width: 0, scale: 0.8 }}
              animate={{ opacity: 1, width: 'auto', scale: 1 }}
              exit={{ opacity: 0, width: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex items-center gap-2 overflow-hidden shrink-0"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                className="composer-btn p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 transition-colors shrink-0 flex items-center justify-center"
                title="Attach photos/videos"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowFormatToolbar(!showFormatToolbar)}
                className={`p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center ${
                  showFormatToolbar
                    ? 'bg-indigo-600 text-white'
                    : 'composer-btn bg-slate-800/80 border border-slate-700/80'
                }`}
                title="Formatting Menu"
              >
                <Type className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="composer-btn p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 transition-colors shrink-0 flex items-center justify-center"
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-plus"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <button
                type="button"
                onClick={() => setIsFocused(false)}
                className="composer-btn p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 transition-colors shrink-0 flex items-center justify-center text-indigo-500"
                title="Show actions"
              >
                <Plus className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (!text.trim() && selectedFiles.length === 0) {
              setIsFocused(false);
            }
          }}
          onSelect={handleSelectText}
          onMouseUp={handleSelectText}
          onTouchEnd={handleSelectText}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="msg-input flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none max-h-32 transition-all scrollbar-none overflow-hidden"
        />

        {/* Dedicated Send Button (No Mic Toggle) */}
        <button
          type="submit"
          disabled={sending || uploading || !canSend}
          className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95 flex items-center justify-center"
          title="Send Message"
        >
          {sending || uploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
