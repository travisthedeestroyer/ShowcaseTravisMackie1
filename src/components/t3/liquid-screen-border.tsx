"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GenerativeTheme } from "@/lib/t3/types";

// LiquidScreenBorder — an animated flowing liquid border around the entire
// screen edge. Activates when:
//   - the voice orb is dragged to the center of the screen
//   - media is "playing" (video watching mode)
// The border flows with a sweep gradient + animated wave + particle dots.
export function LiquidScreenBorder({
  active,
  theme,
  intensity = 1,
  mode = "edge",
}: {
  active: boolean;
  theme: GenerativeTheme;
  intensity?: number; // 0..1, controls brightness/thickness
  mode?: "edge" | "media"; // edge = orb-in-center, media = video watching
}) {
  const [tick, setTick] = React.useState(0);
  const rafRef = React.useRef(0);
  const lastRef = React.useRef(performance.now());

  React.useEffect(() => {
    if (!active) return;
    const loop = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setTick((t) => t + dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  const [o1, o2, o3, o4] = theme.orbColors;
  const phase = tick * 1.5;
  const sweep = (tick * 60) % 360; // rotating sweep

  // Build the wave path for the border (top edge example, we'll use a rounded rect)
  // We create a flowing wave along all 4 edges using a rounded-rect path
  const wavePts: string[] = [];
  const segments = 80;
  const w = 100;
  const h = 100;
  const margin = 1.5;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Walk the perimeter: 0-0.25 top, 0.25-0.5 right, 0.5-0.75 bottom, 0.75-1 left
    let x: number, y: number;
    const wave = Math.sin(t * Math.PI * 8 + phase) * 0.8 * intensity;
    if (t < 0.25) {
      x = margin + (w - 2 * margin) * (t * 4);
      y = margin + wave;
    } else if (t < 0.5) {
      x = w - margin - wave;
      y = margin + (h - 2 * margin) * ((t - 0.25) * 4);
    } else if (t < 0.75) {
      x = w - margin - (w - 2 * margin) * ((t - 0.5) * 4);
      y = h - margin - wave;
    } else {
      x = margin + wave;
      y = h - margin - (h - 2 * margin) * ((t - 0.75) * 4);
    }
    wavePts.push(i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : `L${x.toFixed(2)},${y.toFixed(2)}`);
  }
  wavePts.push("Z");

  const gradId = React.useId();
  const glowId = React.useId();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[90] pointer-events-none"
          style={{ overflow: "hidden" }}
          aria-hidden
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform={`rotate(${sweep})`}>
                <stop offset="0%" stopColor={o1} stopOpacity={0.9 * intensity} />
                <stop offset="25%" stopColor={o2} stopOpacity={0.7 * intensity} />
                <stop offset="50%" stopColor={o3} stopOpacity={0.9 * intensity} />
                <stop offset="75%" stopColor={o4} stopOpacity={0.7 * intensity} />
                <stop offset="100%" stopColor={o1} stopOpacity={0.9 * intensity} />
              </linearGradient>
              <filter id={glowId}>
                <feGaussianBlur stdDeviation="0.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Outer glow border (thicker, blurred) */}
            <path
              d={wavePts.join(" ")}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={mode === "media" ? 1.2 : 0.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowId})`}
              opacity={0.6 * intensity}
            />
            {/* Sharp inner border */}
            <path
              d={wavePts.join(" ")}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={mode === "media" ? 0.5 : 0.35}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9 * intensity}
            />
            {/* Flowing particle dots along the border */}
            {Array.from({ length: 12 }).map((_, i) => {
              const t = ((tick * 0.15 + i / 12) % 1);
              let x: number, y: number;
              if (t < 0.25) { x = 1.5 + 97 * (t * 4); y = 1.5; }
              else if (t < 0.5) { x = 98.5; y = 1.5 + 97 * ((t - 0.25) * 4); }
              else if (t < 0.75) { x = 98.5 - 97 * ((t - 0.5) * 4); y = 98.5; }
              else { x = 1.5; y = 98.5 - 97 * ((t - 0.75) * 4); }
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={mode === "media" ? 0.8 : 0.5}
                  fill={i % 2 === 0 ? o1 : o3}
                  opacity={0.8 * intensity}
                />
              );
            })}
          </svg>
          {/* Corner accent glows */}
          {[
            { top: 0, left: 0 },
            { top: 0, right: 0 },
            { bottom: 0, left: 0 },
            { bottom: 0, right: 0 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                ...pos,
                width: 120,
                height: 120,
                background: `radial-gradient(circle at ${pos.left !== undefined ? "0% 0%" : pos.right !== undefined ? "100% 0%" : "0% 100%"}, ${theme.primaryColor}33, transparent 70%)`,
                opacity: 0.6 * intensity,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
