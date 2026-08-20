import React from 'react';
import { X, Image as ImageIcon, Film, Loader2 } from 'lucide-react';

export const MediaUploader = ({
  selectedFiles = [],
  onRemoveFile,
  onClearAll,
  uploading = false,
  uploadProgress = { current: 0, total: 0, text: '' },
}) => {
  if (!selectedFiles || selectedFiles.length === 0) return null;

  return (
    <div className="bg-slate-900/95 border-t border-slate-800 p-3 flex flex-col gap-2 shrink-0">
      {/* Drawer Header */}
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold text-indigo-400">
          Attached Media ({selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'})
        </span>
        {!uploading && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-rose-400 hover:underline text-[11px]"
          >
            Remove All
          </button>
        )}
      </div>

      {/* Selected File Thumbnails Grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {selectedFiles.map((fileObj, idx) => {
          const isVideo = fileObj.file.type.startsWith('video/');

          return (
            <div
              key={idx}
              className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 group"
            >
              {isVideo ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-1">
                  <Film className="w-6 h-6 text-indigo-400" />
                  <span className="text-[9px] truncate w-full text-center mt-0.5">
                    Video
                  </span>
                </div>
              ) : (
                <img
                  src={fileObj.previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}

              {!uploading && (
                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  className="absolute top-0.5 right-0.5 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>{uploadProgress.text || 'Uploading media files...'}</span>
            </div>
            <span>
              {Math.round((uploadProgress.current / (uploadProgress.total || 1)) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
              style={{
                width: `${(uploadProgress.current / (uploadProgress.total || 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
