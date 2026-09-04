import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

export const LightboxViewer = ({ isOpen, imageUrl, onClose }) => {
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    if (!isOpen) setScale(1);
  }, [isOpen]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 3.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 1));

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `photo_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none"
        >
          {/* Top Control Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors text-white flex items-center gap-1.5 text-xs font-semibold"
                title="Download Photo"
              >
                <Download className="w-5 h-5 text-indigo-400" />
                <span className="hidden xs:inline">Download</span>
              </button>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-900/80 border border-slate-800 transition-colors text-white"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Content Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-full max-h-full flex items-center justify-center overflow-auto p-2 mt-12"
          >
            <img
              src={imageUrl}
              alt="Full view attachment"
              style={{ transform: `scale(${scale})` }}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-transform duration-200"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
