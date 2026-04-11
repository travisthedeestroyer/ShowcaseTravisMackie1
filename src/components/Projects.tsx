import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";

interface ProjectCardProps {
  subtitle: string;
  title: string;
  description: string;
  features: string[];
  tech: string[];
  link?: string;
  media?: React.ReactNode;
  accentColor?: string;
}

interface Chapter {
  label: string;
  time: number;
  icon: string;
  color: string;
}

// ── Shared helper: format seconds → M:SS ─────────────────────────────────────
function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Shared hook: drag-scrub (mouse + touch) ───────────────────────────────────
function useDragScrub(
  progressRef: React.RefObject<HTMLDivElement | null>,
  duration: number,
  onSeek: (t: number) => void
) {
  const dragging = useRef(false);

  const seek = useCallback(
    (clientX: number) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(pct * duration);
    },
    [duration, onSeek, progressRef]
  );

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragging.current = true;
    seek(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    dragging.current = true;
    seek(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) seek(e.clientX); };
    const onTMove = (e: TouchEvent) => { if (dragging.current) seek(e.touches[0].clientX); };
    const stop = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onTMove, { passive: true });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onTMove);
      window.removeEventListener("touchend", stop);
    };
  }, [seek]);

  return { onMouseDown, onTouchStart };
}

const CHAPTERS: Chapter[] = [
  { label: "Landing & Auth",   time: 0,  icon: "◈", color: "#3b82f6" },
  { label: "Voice Director",   time: 14, icon: "◉", color: "#8b5cf6" },
  { label: "Scene Generation", time: 30, icon: "◆", color: "#10b981" },
  { label: "Cartoon Playback", time: 46, icon: "▶", color: "#ec4899" },
  { label: "Mini-Games",       time: 58, icon: "◎", color: "#f59e0b" },
];

// ── MyCartoon demo with chapter markers ───────────────────────────────────────
function FreshKidsHighlights() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(64);
  const [activeChapter, setActiveChapter] = useState(0);
  const [showOverlay,   setShowOverlay]   = useState(true);
  const [chapterToast,  setChapterToast]  = useState<string | null>(null);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const syncTime = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    let ci = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (t >= CHAPTERS[i].time) ci = i;
    }
    setActiveChapter(ci);
    if (!videoRef.current.paused) rafRef.current = requestAnimationFrame(syncTime);
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(toastTimer.current);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Keyboard shortcuts when focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
    if (e.key === "ArrowRight") { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, currentTime + 5); }
    if (e.key === "ArrowLeft")  { if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 5); }
    if (e.key === "f") toggleFullscreen();
  };

  const handleSeek = useCallback((t: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  const { onMouseDown, onTouchStart } = useDragScrub(progressRef, duration, handleSeek);

  const jumpToChapter = (ch: Chapter, idx: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = ch.time;
    setActiveChapter(idx);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    setShowOverlay(false);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(syncTime);
    // Show chapter toast
    clearTimeout(toastTimer.current);
    setChapterToast(ch.label);
    toastTimer.current = setTimeout(() => setChapterToast(null), 1800);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      cancelAnimationFrame(rafRef.current);
    } else {
      videoRef.current.play().catch(() => {});
      setShowOverlay(false);
      rafRef.current = requestAnimationFrame(syncTime);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      wrapRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const chapter  = CHAPTERS[activeChapter];

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl select-none group/vp outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      <video
        ref={videoRef}
        src="/freshkids-demo.mp4"
        className="w-full h-full object-cover"
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
          setIsLoading(false);
        }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onEnded={() => { setIsPlaying(false); setShowOverlay(true); cancelAnimationFrame(rafRef.current); }}
        playsInline muted preload="metadata"
      />

      {/* Loading spinner */}
      {isLoading && !showOverlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Chapter toast */}
      <AnimatePresence>
        {chapterToast && (
          <motion.div
            key={chapterToast}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-sm text-white font-mono text-xs uppercase tracking-wider whitespace-nowrap pointer-events-none"
            style={{ borderColor: chapter.color, border: `1px solid ${chapter.color}66` }}
          >
            <span style={{ color: chapter.color }}>{chapter.icon}</span> {chapterToast}
          </motion.div>
        )}
      </AnimatePresence>

      {showOverlay && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-white/70 mb-1">Live UI Demo</div>
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            <Play size={24} className="ml-1" />
          </button>
          <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mt-1">MYCARTOON.ORG</div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-[opacity,transform] duration-300 ease-out ${
          !isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover/vp:opacity-100 group-hover/vp:translate-y-0"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 bg-white/20 cursor-pointer mx-4 mb-2 rounded-full"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${progress}%`, background: chapter.color, transition: "width 0.05s linear" }}
          />
          {/* Scrub thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg -translate-x-1/2 transition-[left] duration-75"
            style={{ left: `${progress}%` }}
          />
          {CHAPTERS.map((ch, i) => (
            <div key={i} className="absolute top-0 w-px h-full opacity-40"
              style={{ left: `${(ch.time / duration) * 100}%`, background: "white" }} />
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 pb-3 bg-gradient-to-t from-black/80 to-transparent pt-2">
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors flex-shrink-0">
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>

          {/* Time display */}
          <span className="font-mono text-[0.55rem] text-white/50 flex-shrink-0 tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            {CHAPTERS.map((ch, i) => (
              <button
                key={i}
                onClick={() => jumpToChapter(ch, i)}
                className="flex-shrink-0 font-mono text-[0.5rem] uppercase tracking-wider px-2 py-1 rounded-full border transition-all duration-200"
                style={{
                  borderColor: i === activeChapter ? ch.color : "rgba(255,255,255,0.2)",
                  color: i === activeChapter ? ch.color : "rgba(255,255,255,0.7)",
                  background: i === activeChapter ? `${ch.color}22` : "transparent",
                }}
              >
                {ch.icon} {ch.label}
              </button>
            ))}
          </div>

          <button onClick={toggleFullscreen} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Vocal Studio demo (slowed + segmented) ─────────────────────────────────
const VOCAL_CHAPTERS = [
  { label: "Record",   time: 0,  icon: "🎤", color: "#f43f5e" },
  { label: "Generate", time: 5,  icon: "⚡", color: "#a855f7" },
  { label: "Mix",      time: 12, icon: "🎛️", color: "#06b6d4" },
  { label: "Master",   time: 17, icon: "✨", color: "#10b981" },
];

function VocalStudioDemo() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(20);
  const [activeChapter, setActiveChapter] = useState(0);
  const [showOverlay,   setShowOverlay]   = useState(true);
  const [muted,         setMuted]         = useState(true);
  const [chapterToast,  setChapterToast]  = useState<string | null>(null);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const syncTime = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    let ci = 0;
    for (let i = 0; i < VOCAL_CHAPTERS.length; i++) {
      if (t >= VOCAL_CHAPTERS[i].time) ci = i;
    }
    setActiveChapter(ci);
    if (!videoRef.current.paused) rafRef.current = requestAnimationFrame(syncTime);
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleLoaded = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.playbackRate = 0.65;
    setIsLoading(false);
  };

  const handleSeek = useCallback((t: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  const { onMouseDown, onTouchStart } = useDragScrub(progressRef, duration, handleSeek);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
    if (e.key === "ArrowRight") { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, currentTime + 5); }
    if (e.key === "ArrowLeft")  { if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 5); }
    if (e.key === "m") toggleMute();
    if (e.key === "f") toggleFullscreen();
  };

  const jumpToChapter = (ch: typeof VOCAL_CHAPTERS[0], idx: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = ch.time;
    setActiveChapter(idx);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    setShowOverlay(false);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(syncTime);
    clearTimeout(toastTimer.current);
    setChapterToast(ch.label);
    toastTimer.current = setTimeout(() => setChapterToast(null), 1800);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      cancelAnimationFrame(rafRef.current);
    } else {
      videoRef.current.play().catch(() => {});
      setShowOverlay(false);
      rafRef.current = requestAnimationFrame(syncTime);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  };

  const toggleFullscreen = () => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      wrapRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const chapter  = VOCAL_CHAPTERS[activeChapter];

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl select-none group/vp outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      <video
        ref={videoRef}
        src="/vocal-studio-demo-slow.mp4"
        className="w-full h-full object-cover"
        onLoadedMetadata={handleLoaded}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onEnded={() => { setIsPlaying(false); setShowOverlay(true); cancelAnimationFrame(rafRef.current); }}
        playsInline
        muted={muted}
        preload="metadata"
      />

      {/* Depth gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

      {/* Loading spinner */}
      {isLoading && !showOverlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-rose-400 animate-spin" />
        </div>
      )}

      {/* Chapter toast */}
      <AnimatePresence>
        {chapterToast && (
          <motion.div
            key={chapterToast}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-sm text-white font-mono text-xs uppercase tracking-wider whitespace-nowrap pointer-events-none"
            style={{ border: `1px solid ${chapter.color}66` }}
          >
            <span style={{ color: chapter.color }}>{chapter.icon}</span> {chapterToast}
          </motion.div>
        )}
      </AnimatePresence>

      {showOverlay && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-white/60 mb-1">Product Demo</div>
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-rose-500 text-white hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-rose-500/30"
          >
            <Play size={24} className="ml-1" />
          </button>
          <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mt-1">AI Vocal Studio</div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-[opacity,transform] duration-300 ease-out ${
          !isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover/vp:opacity-100 group-hover/vp:translate-y-0"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 bg-white/20 cursor-pointer mx-4 mb-2 rounded-full"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${progress}%`, background: chapter.color, transition: "width 0.05s linear" }}
          />
          {/* Scrub thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg -translate-x-1/2 transition-[left] duration-75"
            style={{ left: `${progress}%` }}
          />
          {VOCAL_CHAPTERS.map((ch, i) => (
            <div key={i} className="absolute top-0 w-px h-full opacity-40"
              style={{ left: `${(ch.time / duration) * 100}%`, background: "white" }} />
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 pb-3 bg-gradient-to-t from-black/80 to-transparent pt-2">
          <button onClick={togglePlay} className="text-white hover:text-rose-400 transition-colors flex-shrink-0">
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>

          {/* Time display */}
          <span className="font-mono text-[0.55rem] text-white/50 flex-shrink-0 tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            {VOCAL_CHAPTERS.map((ch, i) => (
              <button
                key={i}
                onClick={() => jumpToChapter(ch, i)}
                className="flex-shrink-0 font-mono text-[0.5rem] uppercase tracking-wider px-2 py-1 rounded-full border transition-all duration-200"
                style={{
                  borderColor: i === activeChapter ? ch.color : "rgba(255,255,255,0.2)",
                  color: i === activeChapter ? ch.color : "rgba(255,255,255,0.7)",
                  background: i === activeChapter ? `${ch.color}22` : "transparent",
                }}
              >
                {ch.icon} {ch.label}
              </button>
            ))}
          </div>

          <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button onClick={toggleFullscreen} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Remix Vocal Studio Pro — animated pipeline visualization ──────────────────
const PIPELINE_NODES = [
  { id: "input",    label: "Vocal Input",    icon: "🎤", color: "#8b5cf6", x: 0 },
  { id: "analyst",  label: "Analyst",        icon: "🔬", color: "#a78bfa", x: 1 },
  { id: "lyrics",   label: "Lyric Writer",   icon: "✍️",  color: "#ec4899", x: 2, parallel: true },
  { id: "beat",     label: "Beat Producer",  icon: "🎹", color: "#f43f5e", x: 2, parallel: true },
  { id: "ar",       label: "A&R Review",     icon: "🎧", color: "#f97316", x: 2, parallel: true },
  { id: "mix",      label: "Mix Engineer",   icon: "🎛️", color: "#06b6d4", x: 3 },
  { id: "ffmpeg",   label: "FFmpeg Master",  icon: "⚙️",  color: "#10b981", x: 4 },
];

function AgentPipelineViz() {
  const [activeNode, setActiveNode] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setActiveNode(n => (n + 1) % PIPELINE_NODES.length);
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const cols = [
    PIPELINE_NODES.filter(n => n.x === 0),
    PIPELINE_NODES.filter(n => n.x === 1),
    PIPELINE_NODES.filter(n => n.x === 2),
    PIPELINE_NODES.filter(n => n.x === 3),
    PIPELINE_NODES.filter(n => n.x === 4),
  ];

  return (
    <div
      className="w-full rounded-xl overflow-hidden bg-[#0a0a0f] border border-white/5 shadow-2xl select-none"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      {/* Terminal bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[0.6rem] text-white/30 uppercase tracking-widest">6-Agent Pipeline · Promise.all</span>
      </div>

      {/* Pipeline columns */}
      <div className="flex items-center justify-between px-4 py-6 gap-2">
        {cols.map((col, ci) => (
          <React.Fragment key={ci}>
            {/* Connector arrow between columns */}
            {ci > 0 && (
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <motion.div
                  animate={{ scaleX: [0.4, 1, 0.4], opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: ci * 0.15 }}
                  className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                />
              </div>
            )}
            {/* Column of nodes */}
            <div className={`flex flex-col gap-2 ${col.length > 1 ? "items-center" : ""}`}>
              {col.length > 1 && (
                <div className="font-mono text-[0.45rem] text-white/20 uppercase tracking-widest text-center mb-1">parallel</div>
              )}
              {col.map((node) => {
                const isActive = PIPELINE_NODES[activeNode].id === node.id;
                return (
                  <motion.div
                    key={node.id}
                    animate={isActive ? {
                      boxShadow: [`0 0 0px ${node.color}00`, `0 0 20px ${node.color}88`, `0 0 0px ${node.color}00`],
                    } : { boxShadow: `0 0 0px ${node.color}00` }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      borderColor: isActive ? `${node.color}88` : "rgba(255,255,255,0.06)",
                      background: isActive ? `${node.color}12` : "rgba(255,255,255,0.02)",
                      minWidth: "52px",
                    }}
                  >
                    <span className="text-base leading-none">{node.icon}</span>
                    <span
                      className="font-mono text-[0.4rem] uppercase tracking-wide text-center leading-tight"
                      style={{ color: isActive ? node.color : "rgba(255,255,255,0.35)" }}
                    >
                      {node.label}
                    </span>
                    {isActive && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.0, ease: "linear" }}
                        className="h-px mt-0.5"
                        style={{ background: node.color }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Live log lines */}
      <div className="border-t border-white/5 px-4 py-3 space-y-1 h-[72px] overflow-hidden">
        <AnimatePresence mode="popLayout">
          {[0, 1].map((offset) => {
            const ni = (activeNode - offset + PIPELINE_NODES.length) % PIPELINE_NODES.length;
            const n = PIPELINE_NODES[ni];
            return (
              <motion.div
                key={`${tick}-${offset}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: offset === 0 ? 1 : 0.35, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="font-mono text-[0.55rem] flex items-center gap-2"
              >
                <span style={{ color: n.color }}>▶</span>
                <span className="text-white/60">
                  {offset === 0 ? "running" : "done"}
                </span>
                <span style={{ color: n.color }}>{n.label}</span>
                {offset === 0 && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-white/30"
                  >
                    ···
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────
function ProjectCard({ title, subtitle, description, features, tech, link, media, accentColor = "#3b82f6" }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel overflow-hidden flex flex-col lg:flex-row gap-0 group"
      style={{ willChange: "opacity, transform" }}
    >
      <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center relative z-10">
        <div className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: accentColor }}>
          {subtitle}
        </div>
        <h3 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-ink">{title}</h3>
        <p className="text-ink-dim text-lg font-light leading-relaxed mb-8">{description}</p>

        <ul className="space-y-3 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-ink-dim leading-relaxed">
              <span className="mt-1" style={{ color: accentColor }}>✦</span>
              {f}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2 mt-auto">
          {tech.map((t, i) => (
            <span key={i} className="text-xs font-mono px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-ink-dim">
              {t}
            </span>
          ))}
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-all duration-200"
            style={{ transform: "translateZ(0)" }}
          >
            <ExternalLink size={20} />
          </a>
        )}
      </div>

      {media && (
        <div className="flex-1 bg-black/5 relative overflow-hidden flex items-center justify-center p-6 sm:p-10 border-t lg:border-t-0 lg:border-l border-black/5">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${accentColor}18, transparent 70%)` }}
          />
          <div className="w-full relative z-10">{media}</div>
        </div>
      )}
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export function Projects() {
  return (
    <section id="work" className="px-6 max-w-[1200px] mx-auto w-full">
      <div className="mb-16 sm:mb-24 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3rem,8vw,5rem)] font-bold leading-none text-ink mb-6"
        >
          SELECTED <span className="text-gradient">WORKS</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-ink-dim font-light max-w-[600px] mx-auto"
        >
          End-to-end AI product engineering. From architecture to deployment, payment integration to compliance.
        </motion.p>
      </div>

      <div className="flex flex-col gap-8 sm:gap-12">
        {/* MyCartoon */}
        <ProjectCard
          subtitle="Children's AI Platform"
          title="MYCARTOON.ORG"
          accentColor="#3b82f6"
          description="Production-grade AI platform enabling children to voice-direct 30-minute animated cartoons. Features Live API integration with Gemini 2.0, real-time video generation via Veo 2, and a complete token economy with Stripe payment processing. Implements COPPA compliance with age gates and privacy controls."
          features={[
            "Real-time voice direction using Gemini Live API with WebRTC audio streaming",
            "Multi-stage content pipeline: scriptwriting → scene generation (DALL-E) → Veo 2 video",
            "Token-based economy with Stripe checkout integration and subscription tiers",
            "Interactive mini-games during production: Whack-a-Mole and Bubble Pop",
            "Supabase backend with IndexedDB local storage and COPPA age verification",
          ]}
          tech={["React", "TypeScript", "Gemini 2.0 Live", "Veo 2", "Supabase", "Stripe"]}
          link="https://mycartoon.org"
          media={<FreshKidsHighlights />}
        />

        {/* AI Vocal Studio */}
        <ProjectCard
          subtitle="AI Music Production"
          title="AI VOCAL STUDIO"
          accentColor="#f43f5e"
          description="Full-stack AI music production platform with a 4-agent Gemini pipeline. Record your vocals and receive a complete mastered track — AI-generated lyrics, professional beat production via Lyria, automated mix planning, and an FFmpeg-powered mastering chain. Fully in-browser, no install required."
          features={[
            "4-agent Gemini pipeline: Vocal Analyst → Lyric Writer + Beat Producer + Mix Engineer → QC Master",
            "Concurrent Promise.all processing dramatically cuts generation time vs sequential execution",
            "Lyria beat generation with graceful fallback to algorithmic clip composition",
            "FFmpeg server-side mastering: parametric EQ, multi-band compression, limiting chain",
            "Exponential backoff retry logic with graceful 429/503 rate-limit handling",
          ]}
          tech={["React", "TypeScript", "Gemini 2.5 Flash", "Lyria Pro", "FFmpeg", "Web Audio API"]}
          link="https://xutonomous-xound.vercel.app/"
          media={<VocalStudioDemo />}
        />

        {/* Remix Vocal Studio Pro (v1) */}
        <ProjectCard
          subtitle="AI Music Production · v1"
          title="REMIX: VOCAL STUDIO PRO"
          accentColor="#8b5cf6"
          description="The original vocal studio — a 6-agent parallel processing pipeline built entirely solo. This version pioneered the multi-agent architecture that powers the AI Vocal Studio above, with an expanded agent roster handling A&R review and advanced quality control."
          features={[
            "Parallel 6-agent workflow: Lyrics Generator, Beat Producer, A&R Review, Mix Engineer…",
            "Lyria Pro integration with graceful degradation to algorithmic fallback",
            "Advanced FFmpeg audio processing: parametric EQ, multi-band compression, limiting",
            "OfflineAudioContext pre-rendering with Express.js backend for async audio processing",
            "Exponential backoff retry logic with rate limit handling (429/503 errors)",
          ]}
          tech={["React", "TypeScript", "Gemini 2.5 Flash", "Lyria Pro", "FFmpeg", "Web Audio API"]}
          media={<AgentPipelineViz />}
        />
      </div>
    </section>
  );
}
