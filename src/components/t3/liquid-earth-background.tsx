"use client";

import * as React from "react";
import type { GenerativeTheme } from "@/lib/t3/types";

// LiquidEarthBackground — 4 floating radial-gradient orbs over a themed base.
// Honors reducedMotion.
export function LiquidEarthBackground({
  theme,
  reducedMotion = false,
  children,
}: {
  theme: GenerativeTheme;
  reducedMotion?: boolean;
  children?: React.ReactNode;
}) {
  const layerRef = React.useRef<HTMLDivElement>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    let start = performance.now();
    const loop = (now: number) => {
      setTick((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  // two slow phase offsets like the Compose infinite transitions
  const p1 = reducedMotion ? 0 : (tick / 8) * Math.PI * 2;
  const p2 = reducedMotion ? 0 : (tick / 6.5) * Math.PI * 2;

  const orb = (cx: number, cy: number, r: number, color: string, alpha: number, phase: number) => {
    const dx = Math.cos(phase) * 6;
    const dy = Math.sin(phase) * 6;
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: `${cx + dx}%`,
          top: `${cy + dy}%`,
          width: `${r}vmax`,
          height: `${r}vmax`,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle at center, ${color} 0%, ${color}00 70%)`,
          opacity: alpha,
          filter: "blur(8px)",
          pointerEvents: "none",
          transition: "background 0.8s ease",
        }}
      />
    );
  };

  const [g1, g2, g3, g4] = theme.bgGradientColors;
  const [o1, o2, o3, o4] = theme.orbColors;

  return (
    <div
      ref={layerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${g1} 0%, ${g2} 38%, ${g3} 72%, ${g4} 100%)`,
        transition: "background 0.6s ease",
      }}
    >
      {orb(18, 22, 64, o1, 0.42, p1)}
      {orb(82, 40, 56, o2, 0.36, p2)}
      {orb(28, 82, 70, o3, 0.32, p1 + Math.PI / 3)}
      {orb(72, 78, 52, o4, 0.4, p2 + Math.PI / 2)}
      {/* subtle paper noise overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {children}
    </div>
  );
}
