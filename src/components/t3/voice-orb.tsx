"use client";

import * as React from "react";
import type { GenerativeTheme } from "@/lib/t3/types";

// FuturisticVoiceOrb — self-contained liquid orb drawn with CSS/SVG.
// Driven by a real-ish audio `level` (0..1) + gentle idle motion.
export function FuturisticVoiceOrb({
  theme,
  level,
  active,
  size = 96,
}: {
  theme: GenerativeTheme;
  level: number; // 0..1
  active: boolean;
  size?: number;
}) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (theme.glassAlpha === 0) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setTick((t) => t + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const phase = tick * 1.9; // 3.2s for 2π
  const spin = (tick * 40) % 360; // 9s for 360
  const idle = 0.94 + Math.sin(tick * 3.7) * 0.05 * (active ? 0 : 1);
  const amp = active ? 0.16 + level * 0.42 : 0.06;

  const [o1, o2, o3, o4] = theme.orbColors;
  const accent = active ? (level > 0.5 ? theme.primaryColor : level > 0.2 ? theme.secondaryColor : theme.tertiaryColor) : theme.tertiaryColor;

  // Build a 40-point liquid path with sine wobble
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const wobble = Math.sin(a * 3 + phase) * amp + Math.cos(a * 5 - phase) * (amp * 0.5);
    const r = 0.5 + wobble;
    const x = 50 + Math.cos(a) * 40 * r * idle;
    const y = 50 + Math.sin(a) * 40 * r * idle;
    pts.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }
  pts.push("Z");

  const gradId = React.useId();
  const glowId = React.useId();
  const hlId = React.useId();

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: "block", filter: "drop-shadow(0 8px 20px rgba(34,30,25,0.18))" }}
      aria-hidden
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
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
      </defs>
      {/* ambient glow */}
      <circle cx="50" cy="50" r="48" fill={`url(#${glowId})`} />
      {/* liquid body */}
      <path
        d={pts.join(" ")}
        fill={`url(#${gradId})`}
        style={{ transition: "fill 0.6s ease" }}
      />
      {/* specular highlight */}
      <ellipse cx="38" cy="34" rx="20" ry="14" fill={`url(#${hlId})`} />
      {/* rotating frequency ticks while active */}
      {active &&
        Array.from({ length: 28 }).map((_, i) => {
          const a = (i / 28) * Math.PI * 2 + (spin * Math.PI) / 180;
          const r1 = 47;
          const r2 = 47 + 3 + Math.sin(a * 4 + phase) * 2 + level * 6;
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
              opacity={0.5 + level * 0.4}
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
