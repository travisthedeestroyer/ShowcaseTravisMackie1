import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { ExternalLink, Play, Pause, Volume2, VolumeX } from "lucide-react";

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
  const rafRef      = useRef<number>(0);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(64);
  const [activeChapter, setActiveChapter] = useState(0);
  const [showOverlay,   setShowOverlay]   = useState(true);

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

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const jumpToChapter = (ch: Chapter, idx: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = ch.time;
    setActiveChapter(idx);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    setShowOverlay(false);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(syncTime);
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

  const scrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const chapter  = CHAPTERS[activeChapter];

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl select-none group/vp"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      <video
        ref={videoRef}
        src="/freshkids-demo.mp4"
        className="w-full h-full object-cover"
        onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
        onEnded={() => { setIsPlaying(false); setShowOverlay(true); cancelAnimationFrame(rafRef.current); }}
        playsInline muted preload="metadata"
      />

      {showOverlay && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-white/70 mb-1">Live UI Demo</div>
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            <Play size={24} className="ml-1" />
          </button>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-[opacity,transform] duration-300 ease-out ${
          !isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover/vp:opacity-100 group-hover/vp:translate-y-0"
        }`}
      >
        <div
          ref={progressRef}
          className="relative h-1.5 bg-white/20 cursor-pointer mx-4 mb-2 rounded-full overflow-hidden"
          onClick={scrub}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${progress}%`, background: chapter.color, transition: "width 0.05s linear" }}
          />
          {CHAPTERS.map((ch, i) => (
            <div key={i} className="absolute top-0 w-px h-full opacity-40"
              style={{ left: `${(ch.time / duration) * 100}%`, background: "white" }} />
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 pb-3 bg-gradient-to-t from-black/80 to-transparent pt-2">
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
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
  const rafRef      = useRef<number>(0);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(20);
  const [activeChapter, setActiveChapter] = useState(0);
  const [showOverlay,   setShowOverlay]   = useState(true);
  const [muted,         setMuted]         = useState(true);

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

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const handleLoaded = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.playbackRate = 0.65;
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

  const scrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const chapter  = VOCAL_CHAPTERS[activeChapter];

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl select-none group/vp"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      <video
        ref={videoRef}
        src="/vocal-studio-demo-slow.mp4"
        className="w-full h-full object-cover"
        onLoadedMetadata={handleLoaded}
        onEnded={() => { setIsPlaying(false); setShowOverlay(true); cancelAnimationFrame(rafRef.current); }}
        playsInline
        muted={muted}
        preload="metadata"
      />

      {/* Depth gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

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
        <div
          ref={progressRef}
          className="relative h-1.5 bg-white/20 cursor-pointer mx-4 mb-2 rounded-full overflow-hidden"
          onClick={scrub}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${progress}%`, background: chapter.color, transition: "width 0.05s linear" }}
          />
          {VOCAL_CHAPTERS.map((ch, i) => (
            <div key={i} className="absolute top-0 w-px h-full opacity-40"
              style={{ left: `${(ch.time / duration) * 100}%`, background: "white" }} />
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 pb-3 bg-gradient-to-t from-black/80 to-transparent pt-2">
          <button onClick={togglePlay} className="text-white hover:text-rose-400 transition-colors">
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
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
        </div>
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
        />
      </div>
    </section>
  );
}
