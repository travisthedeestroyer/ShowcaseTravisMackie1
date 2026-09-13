"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, RefreshCw, Trash2, Dices } from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import { THEME_PRESETS, VIBE_CHIPS, randomVibe } from "@/lib/t3/theme-presets";
import { SudoCard, SectionHeader, StatusPill } from "../primitives";
import { DesignMockup } from "../design-mockup";
import { GenerativeUixPanel } from "../generative-uix-panel";
import { GenerativeWidgetPanel } from "../generative-widget-panel";

export function GenerativeThemeScreen() {
  const activeTheme = useT3Store((s) => s.activeTheme);
  const draftTheme = useT3Store((s) => s.draftTheme);
  const isGenerating = useT3Store((s) => s.isGeneratingTheme);
  const themeHistory = useT3Store((s) => s.themeHistory);
  const selectTheme = useT3Store((s) => s.selectTheme);
  const generateThemeFromAi = useT3Store((s) => s.generateThemeFromAi);
  const applyDraftTheme = useT3Store((s) => s.applyDraftTheme);
  const discardDraftTheme = useT3Store((s) => s.discardDraftTheme);
  const setSurfaceOpacity = useT3Store((s) => s.setSurfaceOpacity);
  const uiDesignConfig = useT3Store((s) => s.uiDesignConfig);

  const [prompt, setPrompt] = React.useState("");
  const lastPromptRef = React.useRef("");

  const displayTheme = draftTheme ?? activeTheme;
  const [opacity, setOpacity] = React.useState(activeTheme.glassAlpha);

  React.useEffect(() => {
    setOpacity(activeTheme.glassAlpha);
  }, [activeTheme]);

  const generate = (p: string) => {
    if (!p.trim() || isGenerating) return;
    lastPromptRef.current = p;
    generateThemeFromAi(p);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Theme studio" subtitle="Sets the mood: background, voice orb, and accent color across the app" />

      {/* Hero card */}
      <SudoCard className="p-4 sm:p-5">
        {isGenerating ? (
          <div className="h-[168px] rounded-2xl flex items-center justify-center t3-shimmer">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "var(--glass-surface-light)" }}>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" style={{ color: "var(--earth-terracotta)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>Designing your theme…</span>
            </div>
          </div>
        ) : (
          <DesignMockup theme={displayTheme} config={uiDesignConfig} />
        )}
        <div className="flex items-start justify-between gap-3 mt-3">
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>
              {draftTheme ? "Draft preview" : "Active theme"}
            </p>
            <h3 className="font-bold text-base truncate" style={{ color: "var(--earth-deep-espresso)" }}>{displayTheme.name}</h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--earth-secondary-text)" }}>{displayTheme.promptDescription}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            {[displayTheme.primaryColor, displayTheme.secondaryColor, displayTheme.tertiaryColor].map((c, i) => (
              <span key={i} className="w-5 h-5 rounded-full border-2" style={{ background: c, borderColor: "var(--glass-surface-light)" }} />
            ))}
          </div>
        </div>
        {draftTheme && (
          <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
            <button onClick={applyDraftTheme} className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95" style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}>
              Apply
            </button>
            <button onClick={() => generate(lastPromptRef.current)} className="px-4 py-2.5 rounded-full text-sm font-semibold" style={{ border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}>
              <RefreshCw size={14} />
            </button>
            <button onClick={discardDraftTheme} className="px-4 py-2.5 rounded-full text-sm font-semibold" style={{ border: "1px solid var(--glass-border)", color: "var(--earth-secondary-text)" }}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </SudoCard>

      {/* Generate card */}
      <SudoCard className="p-4 sm:p-5">
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--earth-deep-espresso)" }}>Generate from a vibe</p>
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generate(prompt);
            }}
            placeholder="e.g. Warm clay sunset, cyberpunk neon sand…"
            className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
            style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
          />
          <button
            onClick={() => generate(prompt)}
            disabled={isGenerating || !prompt.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
          >
            <Sparkles size={15} /> Generate
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button
            onClick={() => { const v = randomVibe(); setPrompt(v); generate(v); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "color-mix(in srgb, var(--earth-terracotta) 12%, transparent)", color: "var(--earth-terracotta)", border: "1px solid color-mix(in srgb, var(--earth-terracotta) 25%, transparent)" }}
          >
            <Dices size={12} /> Surprise me
          </button>
          {VIBE_CHIPS.map((v) => (
            <button
              key={v}
              onClick={() => { setPrompt(v); generate(v); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-transform hover:scale-105"
              style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
            >
              {v}
            </button>
          ))}
        </div>
      </SudoCard>

      {/* Presets */}
      <div>
        <SectionHeader title="Presets" subtitle="6 curated themes" />
        <div className="flex gap-3 overflow-x-auto t3-scroll -mx-1 px-1 mt-3 pb-1">
          {THEME_PRESETS.map((t) => {
            const active = activeTheme.id === t.id && !draftTheme;
            return (
              <button
                key={t.id}
                onClick={() => selectTheme(t)}
                className="shrink-0 w-40 text-left"
              >
                <SudoCard className="overflow-hidden">
                  <div className="h-20 relative" style={{ background: `linear-gradient(135deg, ${t.bgGradientColors[0]}, ${t.bgGradientColors[2]})` }}>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {[t.primaryColor, t.secondaryColor, t.tertiaryColor].map((c, i) => (
                        <span key={i} className="w-4 h-4 rounded-full border-2" style={{ background: c, borderColor: "rgba(255,255,255,0.6)" }} />
                      ))}
                    </div>
                    {active && (
                      <div className="absolute bottom-2 left-2 inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: t.primaryColor, color: "#FCF9F3" }}>
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-xs truncate" style={{ color: "var(--earth-deep-espresso)" }}>{t.name}</p>
                    <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: "var(--earth-secondary-text)" }}>{t.promptDescription}</p>
                  </div>
                </SudoCard>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently applied */}
      {themeHistory.length > 0 && (
        <div>
          <SectionHeader title="Recently applied" />
          <div className="flex gap-2 overflow-x-auto t3-scroll -mx-1 px-1 mt-3 pb-1">
            {themeHistory.map((t) => (
              <button key={t.id} onClick={() => selectTheme(t)} className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)" }}>
                <span className="w-3 h-3 rounded-full" style={{ background: t.primaryColor }} />
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "var(--earth-deep-espresso)" }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fine-tune card */}
      <SudoCard className="p-4 sm:p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--earth-deep-espresso)" }}>Fine-tune</p>
        <p className="text-xs mb-3" style={{ color: "var(--earth-secondary-text)" }}>Surface opacity controls how translucent cards appear.</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>Surface opacity</span>
          <span className="t3-mono text-xs font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={0.8}
          step={0.01}
          value={opacity}
          disabled={!!draftTheme}
          onChange={(e) => {
            const v = Number(e.target.value);
            setOpacity(v);
            setSurfaceOpacity(v);
          }}
          className="w-full accent-[#C1613D] disabled:opacity-40"
          aria-label="Surface opacity"
        />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--earth-secondary-text)" }}>
          <span>10%</span>
          <span>80%</span>
        </div>
      </SudoCard>

      {/* Generative UIX Agent (Android phone shell) */}
      <div className="pt-2">
        <SectionHeader title="Phone UIX" subtitle="Generative Android shell for Strict Sandbox mode" />
        <div className="mt-3">
          <GenerativeUixPanel />
        </div>
      </div>

      {/* Generative Widgets — AI-generated widgets with any functionality */}
      <div className="pt-2">
        <SectionHeader title="Generative widgets" subtitle="AI-generated widgets with any functionality and design" />
        <div className="mt-3">
          <GenerativeWidgetPanel />
        </div>
      </div>
    </div>
  );
}
