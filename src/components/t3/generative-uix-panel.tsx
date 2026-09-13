"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Check, Trash2, Smartphone, Wand2, X, AlertCircle } from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import { SudoCard, SectionHeader, StatusPill } from "./primitives";

const ANDROID_VIBE_CHIPS = [
  "Stock Android 15 calm",
  "Neon cyberpunk night",
  "Zen garden morning",
  "Retro 80s sunset",
  "Minimal paper white",
  "Aurora borealis dark",
  "Coral reef tropic",
  "Midnight orchid glass",
  "Warm clay tablet",
];

export function GenerativeUixPanel() {
  const config = useT3Store((s) => s.config);
  const manifest = useT3Store((s) => s.androidUixManifest);
  const draft = useT3Store((s) => s.androidUixDraft);
  const isGenerating = useT3Store((s) => s.isGeneratingAndroidUix);
  const error = useT3Store((s) => s.androidUixError);
  const generateAndroidUix = useT3Store((s) => s.generateAndroidUix);
  const applyAndroidUixDraft = useT3Store((s) => s.applyAndroidUixDraft);
  const discardAndroidUixDraft = useT3Store((s) => s.discardAndroidUixDraft);
  const resetAndroidUixToDefault = useT3Store((s) => s.resetAndroidUixToDefault);

  const [vibe, setVibe] = React.useState("");
  const lastVibeRef = React.useRef("");

  const isRoot = config.sandboxLevel === "ROOT_SUDO";
  const display = draft ?? manifest;

  const generate = (v: string) => {
    const prompt = (v || "").trim();
    if (!prompt || isGenerating) return;
    lastVibeRef.current = prompt;
    generateAndroidUix(prompt);
  };

  return (
    <SudoCard className="p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "color-mix(in srgb, var(--earth-sage-green) 14%, transparent)", color: "var(--earth-sage-green)" }}>
          <Smartphone size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base" style={{ color: "var(--earth-deep-espresso)" }}>Generative UIX agent</h3>
            <StatusPill text={isRoot ? "Inactive (Root mode)" : "Active (Strict Sandbox)"} color={isRoot ? "var(--earth-secondary-text)" : "var(--earth-sage-green)"} />
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--earth-secondary-text)" }}>
            In Strict Sandbox, T³ drops the desktop shell and runs as a generative Android phone UIX. Describe a vibe and the agent designs the whole home screen, status bar, app drawer, quick settings, and notifications.
          </p>
        </div>
      </div>

      {isRoot && (
        <div className="rounded-2xl p-3 mb-4 flex items-start gap-2" style={{ background: "color-mix(in srgb, var(--cyber-warning-yellow) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--cyber-warning-yellow) 25%, transparent)" }}>
          <AlertCircle size={15} style={{ color: "var(--cyber-warning-yellow)", marginTop: 2 }} />
          <p className="text-xs" style={{ color: "var(--earth-deep-espresso)" }}>
            Root / Sudo mode keeps the T³ desktop shell. Switch to <strong>Strict Sandbox</strong> in Security to use this agent.
          </p>
        </div>
      )}

      {/* Current manifest summary */}
      <div className="rounded-2xl p-3 mb-4" style={{ background: "var(--glass-surface-card)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--earth-secondary-text)" }}>
            {draft ? "Draft preview" : "Current phone UIX"}
          </span>
          <span className="t3-mono text-[10px]" style={{ color: "var(--earth-secondary-text)" }}>
            {new Date(display.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--earth-deep-espresso)" }}>“{display.vibe}”</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <ManifestRow label="Wallpaper" value={`${display.wallpaper.type.toLowerCase()}`} />
          <ManifestRow label="Accent" value={
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: display.accent }} />
              <span className="t3-mono">{display.accent}</span>
            </span>
          } />
          <ManifestRow label="Grid" value={`${display.home.gridStyle.replace("_", " ").toLowerCase()} · ${display.home.columns} cols`} />
          <ManifestRow label="Icon shape" value={display.home.iconShape.toLowerCase()} />
          <ManifestRow label="Status bar" value={display.statusBar.style.toLowerCase()} />
          <ManifestRow label="Nav bar" value={display.navBar.style.replace("_", " ").toLowerCase()} />
          <ManifestRow label="Font scale" value={`${Math.round(display.fontScale * 100)}%`} />
          <ManifestRow label="Corner radius" value={`${display.cornerRadius}px`} />
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>Quick tiles:</span>
          {display.quickSettings.tiles.slice(0, 6).map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: t.active ? "color-mix(in srgb, " + display.accent + " 14%, transparent)" : "var(--glass-surface-variant)", color: t.active ? display.accent : "var(--earth-secondary-text)" }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Generate from vibe */}
      <p className="text-sm font-semibold mb-2" style={{ color: "var(--earth-deep-espresso)" }}>Generate a new phone UIX</p>
      <div className="flex gap-2">
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") generate(vibe); }}
          placeholder="e.g. neon cyberpunk night, warm clay tablet…"
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
          style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
        />
        <button
          onClick={() => generate(vibe)}
          disabled={isGenerating || !vibe.trim() || isRoot}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40"
          style={{ background: "var(--earth-sage-green)", color: "var(--bento-deep-purple)" }}
        >
          {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {isGenerating ? "Designing…" : "Generate"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {ANDROID_VIBE_CHIPS.map((v) => (
          <button
            key={v}
            onClick={() => { setVibe(v); generate(v); }}
            disabled={isGenerating || isRoot}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-transform hover:scale-105 disabled:opacity-40"
            style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
          >
            {v}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs mt-3" style={{ color: "var(--cyber-alert-red)" }}>
          The agent couldn't be reached ({error}). A deterministic fallback UIX was used instead — try again in a moment.
        </p>
      )}

      {/* Draft apply / discard */}
      <AnimatePresence>
        {draft && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
              <button
                onClick={applyAndroidUixDraft}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
                style={{ background: "var(--earth-sage-green)", color: "var(--bento-deep-purple)" }}
              >
                <Check size={14} /> Apply phone UIX
              </button>
              <button
                onClick={() => generate(lastVibeRef.current)}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5"
                style={{ border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
              >
                <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} /> Regenerate
              </button>
              <button
                onClick={discardAndroidUixDraft}
                className="px-4 py-2.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5"
                style={{ border: "1px solid var(--glass-border)", color: "var(--earth-secondary-text)" }}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
        <button
          onClick={resetAndroidUixToDefault}
          disabled={isRoot}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-40"
          style={{ border: "1px solid var(--glass-border)", color: "var(--earth-secondary-text)" }}
        >
          <Trash2 size={12} /> Reset to default Android
        </button>
        <span className="text-[10px] t3-mono" style={{ color: "var(--earth-secondary-text)" }}>
          {display.notifications.length} notif · {display.quickSettings.tiles.length} tiles
        </span>
      </div>
    </SudoCard>
  );
}

function ManifestRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>{label}</span>
      <span className="text-xs font-semibold text-right truncate" style={{ color: "var(--earth-deep-espresso)" }}>{value}</span>
    </div>
  );
}
