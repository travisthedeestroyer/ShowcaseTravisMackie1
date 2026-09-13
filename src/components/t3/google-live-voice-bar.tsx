"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { AdvancedFuturisticVoiceOrb } from "./advanced-voice-orb";
import { useT3Store } from "@/lib/t3/store";
import { voiceIsActive } from "@/lib/t3/types";

// GoogleLiveVoiceBar — compact live-voice card with waveform
export function GoogleLiveVoiceBar() {
  const liveVoiceState = useT3Store((s) => s.liveVoiceState);
  const activeTheme = useT3Store((s) => s.activeTheme);
  const toggleLiveVoice = useT3Store((s) => s.toggleLiveVoice);

  const active = voiceIsActive(liveVoiceState);
  const transcript = liveVoiceState.aiTranscript || liveVoiceState.userTranscript;
  const accent = liveVoiceState.isSpeaking
    ? activeTheme.primaryColor
    : liveVoiceState.isListening
    ? activeTheme.secondaryColor
    : activeTheme.tertiaryColor;

  // idle amplitude animation — always animates so the waveform looks alive
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        background: "var(--glass-surface-light)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--t3-radius-card)",
        backdropFilter: "blur(12px) saturate(140%)",
      }}
      className="p-3.5 flex items-center gap-3"
    >
      {/* Advanced mini orb */}
      <div className="relative shrink-0">
        <AdvancedFuturisticVoiceOrb
          theme={activeTheme}
          level={active ? (liveVoiceState.amplitudes[0] ?? 0) : 0}
          mode={active ? "active" : "idle"}
          size={48}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold truncate" style={{ color: "var(--earth-deep-espresso)" }}>
            {liveVoiceState.activeVoiceName}
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `color-mix(in srgb, ${accent} 18%, transparent)`,
              color: accent,
              border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
            }}
          >
            {liveVoiceState.statusText}
          </span>
        </div>
        {transcript ? (
          <p className="text-sm leading-snug line-clamp-2" style={{ color: "var(--earth-secondary-text)" }}>
            {transcript}
          </p>
        ) : (
          <Waveform active={active} accent={accent} amplitudes={liveVoiceState.amplitudes} tick={tick} />
        )}
        {liveVoiceState.errorMessage && (
          <p className="text-xs mt-1" style={{ color: "var(--cyber-alert-red)" }}>
            {liveVoiceState.errorMessage}
          </p>
        )}
      </div>

      <button
        onClick={toggleLiveVoice}
        aria-label={active ? "Stop" : "Start voice"}
        className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-105 active:scale-95"
        style={{
          background: active ? "var(--cyber-alert-red)" : activeTheme.primaryColor,
          color: "var(--bento-deep-purple)",
        }}
      >
        {active ? <Square size={16} /> : <Mic size={18} />}
      </button>
    </div>
  );
}

function Waveform({ active, accent, amplitudes, tick }: { active: boolean; accent: string; amplitudes: number[]; tick: number }) {
  return (
    <div className="flex items-center gap-1 h-8" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => {
        const raw = active
          ? 0.2 + Math.abs(Math.sin((i + tick) * 0.7)) * (0.5 + (amplitudes[i] ?? 0) * 0.5)
          : 0.15 + Math.abs(Math.sin((i + tick) * 0.5)) * 0.35;
        // visible minimum 5px, max 28px, width 4px for clear bar shape
        const h = Math.max(5, Math.min(28, raw * 28));
        return (
          <motion.span
            key={i}
            className="rounded-full shrink-0"
            style={{ width: 4, height: h, background: accent, display: "inline-block" }}
            animate={{ height: h }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
