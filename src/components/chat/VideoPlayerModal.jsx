import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

export const VideoPlayerModal = ({ isOpen, videoUrl, onClose }) => {
  const handleDownload = async () => {
    if (!videoUrl) return;
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && videoUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none"
        >
          {/* Top Header Control Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white">
            <span className="font-semibold text-xs text-slate-300">Video Preview</span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Download Video"
              >
                <Download className="w-5 h-5 text-indigo-400" />
                <span className="hidden xs:inline">Download</span>
              </button>

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-900/80 border border-slate-800 text-white transition-colors"
                title="Close Video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 mt-12"
          >
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
