import React from 'react';
import { Play, Film } from 'lucide-react';

export const MediaGallery = React.memo(({ media = [], onOpenImage, onOpenVideo }) => {
  if (!media || media.length === 0) return null;

  const count = media.length;

  if (count === 1) {
    const item = media[0];
    const isVideo = item.type && item.type.startsWith('video/');

    return (
      <div className="relative mt-2 rounded-xl overflow-hidden max-w-sm border border-slate-700/60 bg-black/40 group">
        {isVideo ? (
          <div 
            onClick={() => onOpenVideo(item.url)}
            className="relative cursor-pointer aspect-video flex items-center justify-center bg-slate-950 overflow-hidden"
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.name || 'Video preview'}
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4">
                <Film className="w-8 h-8 text-indigo-400 opacity-90 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-300 truncate max-w-[200px]">
                  {item.name || 'Video Attachment'}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.name || 'Attachment'}
            onClick={() => onOpenImage(item.url)}
            className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    );
  }

  // Multi-media Gallery Layout (2, 3, or 4+ grid)
  const displayItems = media.slice(0, 4);
  const remainingCount = count - 4;

  return (
    <div className={`grid gap-1.5 mt-2 rounded-xl overflow-hidden max-w-sm border border-slate-700/60 ${
      count === 2 ? 'grid-cols-2' : 'grid-cols-2'
    }`}>
      {displayItems.map((item, idx) => {
        const isVideo = item.type && item.type.startsWith('video/');
        const isLastItem = idx === 3 && remainingCount > 0;

        return (
          <div
            key={item.fileId || idx}
            onClick={() => isVideo ? onOpenVideo(item.url) : onOpenImage(item.url)}
            className="relative aspect-square bg-slate-950 cursor-pointer overflow-hidden group"
          >
            {isVideo ? (
              <div className="w-full h-full relative flex items-center justify-center">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.name || 'Video'}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400">
                    <Film className="w-6 h-6 text-indigo-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={item.thumbnail || item.url}
                alt={item.name || 'Media'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
              />
            )}

            {/* Remaining Count Overlay Badge */}
            {isLastItem && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-white font-bold text-lg">
                +{remainingCount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

