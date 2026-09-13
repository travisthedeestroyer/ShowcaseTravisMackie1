"use client";

import * as React from "react";
import type { GenerativeTheme } from "@/lib/t3/types";

// AdvancedFuturisticVoiceOrb — a smooth, reactive liquid orb with multi-layer
// audio-reactive waveforms, idle breathing, and state-driven color shifts.
//
// Reactivity modes:
//   idle     — gentle breathing pulse, soft wobble
//   active   — audio-reactive waveform deformation + rotating frequency ticks
//   media    — "video watching" mode: smooth flowing rings + richer glow
//   dragging — exaggerated wobble + brightened accent
export type OrbMode = "idle" | "active" | "media" | "dragging";

export function AdvancedFuturisticVoiceOrb({
  theme,
  level,
  mode,
  size = 96,
  scrollVelocity = 0,
}: {
  theme: GenerativeTheme;
  level: number; // 0..1
  mode: OrbMode;
  size?: number;
  scrollVelocity?: number; // px/s, for scroll-reactive wobble
}) {
  const [tick, setTick] = React.useState(0);
  const rafRef = React.useRef(0);
  const lastRef = React.useRef(performance.now());
  const levelRef = React.useRef(level);
  const scrollRef = React.useRef(scrollVelocity);

  // Smooth level interpolation for buttery transitions
  const smoothLevel = React.useRef(0);
  React.useEffect(() => {
    levelRef.current = level;
  }, [level]);
  React.useEffect(() => {
    scrollRef.current = scrollVelocity;
  }, [scrollVelocity]);

  React.useEffect(() => {
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      // Interpolate level toward target for smoothness
      smoothLevel.current += (levelRef.current - smoothLevel.current) * Math.min(1, dt * 8);
      setTick((t) => t + dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const lvl = smoothLevel.current;
  const phase = tick * 1.9;
  const spin = (tick * 40) % 360;
  const mediaPhase = tick * 0.8;

  // Idle breathing — scale oscillates gently
  const idle = mode === "idle"
    ? 0.94 + Math.sin(tick * 2.2) * 0.04
    : mode === "dragging"
    ? 0.92 + Math.sin(tick * 5) * 0.06
    : 0.96 + Math.sin(tick * 3.7) * 0.03;

  // Amplitude — higher when active, adds scroll velocity influence
  const scrollAmp = Math.min(0.12, Math.abs(scrollRef.current) / 4000);
  const amp = mode === "active"
    ? 0.16 + lvl * 0.42
    : mode === "media"
    ? 0.10 + Math.sin(mediaPhase) * 0.04 + 0.06
    : mode === "dragging"
    ? 0.18 + scrollAmp
    : 0.06 + scrollAmp;

  const [o1, o2, o3, o4] = theme.orbColors;
  const accent = mode === "active"
    ? (lvl > 0.5 ? theme.primaryColor : lvl > 0.2 ? theme.secondaryColor : theme.tertiaryColor)
    : mode === "media"
    ? theme.secondaryColor
    : mode === "dragging"
    ? theme.primaryColor
    : theme.tertiaryColor;

  // Build a 48-point liquid path with multi-harmonic wobble
  const pts: string[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wobble =
      Math.sin(a * 3 + phase) * amp +
      Math.cos(a * 5 - phase) * (amp * 0.5) +
      Math.sin(a * 7 + phase * 1.3) * (amp * 0.25);
    const r = 0.5 + wobble;
    const x = 50 + Math.cos(a) * 40 * r * idle;
    const y = 50 + Math.sin(a) * 40 * r * idle;
    pts.push(i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : `L${x.toFixed(2)},${y.toFixed(2)}`);
  }
  pts.push("Z");

  const gradId = React.useId();
  const glowId = React.useId();
  const hlId = React.useId();
  const ringGlowId = React.useId();

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: "block", filter: `drop-shadow(0 8px ${20 + (mode === "media" ? 12 : 0)}px rgba(34,30,25,0.18))` }}
      aria-hidden
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity={mode === "media" ? 0.65 : 0.55} />
          <stop offset="60%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={o1} />
          <stop offset="33%" stopColor={o2} />
          <stop offset="66%" stopColor={o3} />
          <stop offset="100%" stopColor={o4} />
        </linearGradient>
        <radialGradient id={hlId} cx="32%" cy="28%" r="40%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ringGlowId} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={accent} stopOpacity="0" />
          <stop offset="85%" stopColor={accent} stopOpacity={mode === "media" ? 0.3 : 0.15} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* outer ambient glow ring — stronger in media mode */}
      <circle cx="50" cy="50" r="49" fill={`url(#${ringGlowId})`} />

      {/* ambient glow */}
      <circle cx="50" cy="50" r="48" fill={`url(#${glowId})`} />

      {/* media mode: flowing concentric rings */}
      {mode === "media" &&
        [0, 1, 2].map((ring) => {
          const rPhase = mediaPhase + ring * 1.2;
          const ringR = 38 + (Math.sin(rPhase) * 0.5 + 0.5) * 10 + ring * 2;
          const ringOpacity = 0.25 - ring * 0.07;
          return (
            <circle
              key={ring}
              cx="50"
              cy="50"
              r={ringR}
              fill="none"
              stroke={accent}
              strokeWidth="0.5"
              opacity={ringOpacity}
              strokeDasharray="2 3"
            />
          );
        })}

      {/* liquid body */}
      <path
        d={pts.join(" ")}
        fill={`url(#${gradId})`}
        style={{ transition: "fill 0.6s ease" }}
      />

      {/* specular highlight */}
      <ellipse cx="38" cy="34" rx="20" ry="14" fill={`url(#${hlId})`} />

      {/* rotating frequency ticks while active */}
      {(mode === "active" || mode === "dragging") &&
        Array.from({ length: 32 }).map((_, i) => {
          const a = (i / 32) * Math.PI * 2 + (spin * Math.PI) / 180;
          const r1 = 47;
          const tickLen = 3 + Math.sin(a * 4 + phase) * 2 + lvl * 6 + (mode === "dragging" ? 2 : 0);
          const r2 = 47 + tickLen;
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * r1}
              y1={50 + Math.sin(a) * r1}
              x2={50 + Math.cos(a) * r2}
              y2={50 + Math.sin(a) * r2}
              stroke={accent}
              strokeWidth={0.6}
              strokeLinecap="round"
              opacity={0.5 + lvl * 0.4}
            />
          );
        })}

      {/* glass rim */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={0.8}
      />
    </svg>
  );
}
