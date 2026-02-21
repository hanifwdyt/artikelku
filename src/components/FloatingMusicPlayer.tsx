"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
  image: string;
  duration: number;
}

const JAMENDO_CLIENT_ID = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID;

export default function FloatingMusicPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JamendoTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search Jamendo API
  const searchTracks = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !JAMENDO_CLIENT_ID) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=10&search=${encodeURIComponent(searchQuery)}&tags=instrumental&include=musicinfo`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => searchTracks(query), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchTracks]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentTrack]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const playTrack = useCallback((track: JamendoTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track.id === audioRef.current?.dataset.trackId) {
      // Same track — toggle play/pause
      if (audio.paused) {
        audio.play().catch(() => {});
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    // New track
    audio.pause();
    audio.src = track.audio;
    audio.dataset.trackId = track.id;
    audio.volume = volume;
    audio.play().catch(() => {});
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
  }, [volume]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }, [duration]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const springTransition = { type: "spring" as const, stiffness: 300, damping: 25 };

  // Icons
  const MusicNoteIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );

  const PlayIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );

  const PauseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );

  const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const VolumeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );

  return (
    <>
      <audio ref={audioRef} preload="none" />

      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* Collapsed pill */
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springTransition}
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-6 right-6 z-[55] flex items-center gap-2.5 px-4 py-2.5 bg-[#1a1917]/95 backdrop-blur-xl border border-stone-500/25 rounded-full shadow-2xl shadow-stone-900/40 cursor-pointer hover:border-stone-400/40 transition-colors"
          >
            {currentTrack ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTrack.image}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs text-stone-300 max-w-[120px] truncate font-[family-name:var(--font-lora)]">
                  {currentTrack.name}
                </span>
              </>
            ) : (
              <span className="text-stone-400">
                <MusicNoteIcon />
              </span>
            )}
            {isPlaying && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            )}
          </motion.button>
        ) : (
          /* Expanded panel */
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={springTransition}
            className="fixed bottom-6 right-6 z-[55] w-80 bg-[#1a1917]/95 backdrop-blur-xl border border-stone-500/25 rounded-2xl shadow-2xl shadow-stone-900/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-stone-200 font-[family-name:var(--font-playfair)]">
                Music
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Now Playing */}
            {currentTrack && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-3 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentTrack.image}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-stone-500/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-200 truncate font-[family-name:var(--font-lora)]">
                      {currentTrack.name}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {currentTrack.artist_name}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className="group h-1.5 bg-stone-700/50 rounded-full cursor-pointer mb-1.5"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-amber-500/80 rounded-full transition-all group-hover:bg-amber-400"
                    style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-600">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-stone-500">
                      <VolumeIcon />
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-stone-500/10" />

            {/* Search */}
            <div className="px-4 py-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search instrumental tracks..."
                className="w-full px-3 py-2 text-xs bg-[#292524]/60 border border-stone-500/20 rounded-lg text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-400/40 transition-all"
              />
            </div>

            {/* Results */}
            {(results.length > 0 || isSearching) && (
              <div className="px-4 pb-4">
                {isSearching ? (
                  <p className="text-xs text-stone-500 text-center py-3">Searching...</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
                    {results.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => playTrack(track)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          currentTrack?.id === track.id
                            ? "bg-amber-500/10 text-amber-200"
                            : "hover:bg-stone-700/30 text-stone-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={track.image}
                          alt=""
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{track.name}</p>
                          <p className="text-[10px] text-stone-500 truncate">
                            {track.artist_name}
                          </p>
                        </div>
                        {currentTrack?.id === track.id && isPlaying && (
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
