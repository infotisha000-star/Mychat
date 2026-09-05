import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

export const AudioPlayer = ({ src = '', duration = 0, isMe = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.warn);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex items-center gap-3 my-1.5 p-2.5 rounded-2xl border ${
      isMe
        ? 'bg-black/20 border-white/20 text-white'
        : 'bg-slate-800/80 border-slate-700 text-slate-100'
    } min-w-[220px] max-w-[280px]`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Circle Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 ${
          isMe
            ? 'bg-white text-indigo-700 hover:bg-slate-100'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform Progress Slider */}
      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={audioDuration || 100}
          value={currentTime}
          onChange={handleSeek}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-1.5 accent-indigo-400 bg-slate-700/60 rounded-lg appearance-none cursor-pointer"
        />

        <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3 text-indigo-400" />
            <span>Voice</span>
          </span>
          <span>
            {formatSeconds(isPlaying ? currentTime : audioDuration || currentTime)}
          </span>
        </div>
      </div>
    </div>
  );
};
