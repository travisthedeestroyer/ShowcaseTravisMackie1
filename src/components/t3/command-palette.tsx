"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CornerDownLeft, ArrowUp, ArrowDown, Home, Activity, Terminal as TerminalIcon,
  Folder, Settings, Palette, Shield, Cpu, Blocks, Sparkles, Lock, Sun, Moon, Mic, X, Battery, Play,
  type LucideIcon,
} from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { OsTab } from "@/lib/t3/types";
import { OS_TABS, NAV_TABS } from "@/lib/t3/types";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  accent: string;
  run: () => void;
  group: "Navigate" | "Actions" | "Settings";
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const selectTab = useT3Store((s) => s.selectTab);
  const config = useT3Store((s) => s.config);
  const setSandboxLevel = useT3Store((s) => s.setSandboxLevel);
  const toggleLiveVoice = useT3Store((s) => s.toggleLiveVoice);
  const liveVoiceState = useT3Store((s) => s.liveVoiceState);
  const setSpokenResponses = useT3Store((s) => s.setSpokenResponses);
  const setDarkMode = useT3Store((s) => s.setDarkMode);
  const setBatterySaver = useT3Store((s) => s.setBatterySaver);
  const mediaMode = useT3Store((s) => s.mediaMode);
  const toggleMediaMode = useT3Store((s) => s.toggleMediaMode);
  const askModel = useT3Store((s) => s.askModel);
  const [query, setQuery] = React.useState("");
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [aiResult, setAiResult] = React.useState<{ prompt: string; text: string; actionNote: string } | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const TAB_ICONS: Record<OsTab, LucideIcon> = {
    DASHBOARD: Home, TERMINAL: TerminalIcon, FILES: Folder, APPS: Activity,
    THEMES: Palette, SANDBOX: Shield, MODELS: Cpu, MARKETPLACE: Blocks, PROFILE: Settings,
  };

  const items: CommandItem[] = React.useMemo(() => {
    const navItems: CommandItem[] = OS_TABS.map((t) => ({
      id: `nav-${t.id}`,
      label: `Go to ${t.title}`,
      hint: t.id,
      icon: TAB_ICONS[t.id],
      accent: "var(--earth-terracotta)",
      group: "Navigate",
      run: () => { selectTab(t.id); onClose(); },
    }));
    const actionItems: CommandItem[] = [
      {
        id: "voice",
        label: liveVoiceState.isConnecting || liveVoiceState.isListening || liveVoiceState.isSpeaking ? "Stop voice session" : "Start voice session",
        icon: Mic, accent: "var(--earth-sage-green)", group: "Actions",
        run: () => { toggleLiveVoice(); onClose(); },
      },
      {
        id: "sandbox-strict",
        label: "Switch to Strict Sandbox (Android phone UIX)",
        icon: Lock, accent: "var(--earth-sage-green)", group: "Actions",
        run: () => { setSandboxLevel("STRICT_SANDBOX"); onClose(); },
      },
      {
        id: "sandbox-root",
        label: "Switch to Root / Sudo mode (T³ desktop UIX)",
        icon: Shield, accent: "var(--earth-terracotta)", group: "Actions",
        run: () => { setSandboxLevel("ROOT_SUDO"); onClose(); },
      },
      {
        id: "toggle-spoken",
        label: config.googleLiveVoiceEnabled ? "Disable spoken responses" : "Enable spoken responses",
        icon: Sparkles, accent: "var(--earth-slate-blue)", group: "Actions",
        run: () => { setSpokenResponses(!config.googleLiveVoiceEnabled); onClose(); },
      },
      {
        id: "toggle-dark",
        label: config.darkMode ? "Switch to light mode" : "Switch to dark mode",
        icon: config.darkMode ? Sun : Moon, accent: "var(--earth-slate-blue)", group: "Actions",
        run: () => { setDarkMode(!config.darkMode); onClose(); },
      },
      {
        id: "toggle-battery-saver",
        label: config.batterySaver ? "Disable battery saver" : "Enable battery saver",
        icon: Battery, accent: "var(--cyber-warning-yellow)", group: "Actions",
        run: () => { setBatterySaver(!config.batterySaver); onClose(); },
      },
      {
        id: "toggle-media-mode",
        label: mediaMode ? "Stop media mode" : "Start media mode (reactive liquid border)",
        icon: Play, accent: "var(--earth-terracotta)", group: "Actions",
        run: () => { toggleMediaMode(); onClose(); },
      },
    ];
    return [...navItems, ...actionItems];
  }, [selectTab, config, liveVoiceState, toggleLiveVoice, setSandboxLevel, setSpokenResponses, setDarkMode, setBatterySaver, mediaMode, toggleMediaMode, onClose]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    const matched = items.filter((i) => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q));
    // If no exact matches, offer an "Ask T³ AI" item
    if (matched.length === 0 && query.trim().length > 1) {
      return [{
        id: "ask-ai",
        label: `Ask T³ AI: "${query.trim()}"`,
        hint: "ask",
        icon: Sparkles,
        accent: "var(--earth-terracotta)",
        group: "Ask AI",
        run: async () => {
          setAiLoading(true);
          setAiResult({ prompt: query.trim(), text: "", actionNote: "" });
          try {
            const res = await askModel(query.trim());
            setAiResult({ prompt: query.trim(), text: res.text, actionNote: res.actionNote });
          } catch {
            setAiResult({ prompt: query.trim(), text: "(Couldn't reach the model.)", actionNote: "" });
          } finally {
            setAiLoading(false);
          }
        },
      } as CommandItem];
    }
    return matched;
  }, [items, query, askModel]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setAiResult(null);
      setAiLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  React.useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  React.useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(filtered.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); filtered[selectedIdx]?.run(); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  // Group items
  const groups = React.useMemo(() => {
    const g: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      (g[item.group] ??= []).push(item);
    }
    return g;
  }, [filtered]);

  let runningIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] px-4"
          style={{ background: "rgba(34,30,25,0.45)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: -12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden"
            style={{
              background: "var(--glass-surface-light)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--t3-radius-sheet)",
              backdropFilter: "blur(20px) saturate(180%)",
              boxShadow: "0 24px 60px -12px rgba(34,30,25,0.35)",
            }}
          >
            {/* Search header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--glass-border)" }}>
              <Search size={18} style={{ color: "var(--earth-secondary-text)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, tabs, actions…"
                className="flex-1 bg-transparent outline-none text-base"
                style={{ color: "var(--earth-deep-espresso)" }}
              />
              <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "var(--glass-surface-variant)", color: "var(--earth-secondary-text)" }}>ESC</kbd>
            </div>

            {/* AI result panel (shows when ask-ai was run) */}
            {aiResult && (
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--glass-border)", background: "color-mix(in srgb, var(--earth-terracotta) 6%, transparent)" }}>
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0" style={{ background: "color-mix(in srgb, var(--earth-terracotta) 14%, transparent)", color: "var(--earth-terracotta)" }}>
                    <Sparkles size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--earth-secondary-text)" }}>{aiResult.prompt}</p>
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--earth-secondary-text)" }}>
                        <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> Thinking…
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--earth-deep-espresso)" }}>{aiResult.text}</p>
                        {aiResult.actionNote && (
                          <p className="text-xs mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--earth-sage-green) 14%, transparent)", color: "var(--earth-sage-green)" }}>
                            ✓ {aiResult.actionNote}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <button onClick={() => setAiResult(null)} aria-label="Close result" className="p-1 rounded-full" style={{ color: "var(--earth-secondary-text)" }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto t3-scroll py-2">
              {Object.entries(groups).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--earth-secondary-text)" }}>
                    {group}
                  </div>
                  {groupItems.map((item) => {
                    const idx = runningIdx++;
                    const isSelected = idx === selectedIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => item.run()}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={{
                          background: isSelected ? `color-mix(in srgb, ${item.accent} 10%, transparent)` : "transparent",
                        }}
                      >
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                          style={{ background: `color-mix(in srgb, ${item.accent} 14%, transparent)`, color: item.accent }}
                        >
                          <Icon size={15} />
                        </span>
                        <span className="flex-1 text-sm font-medium" style={{ color: "var(--earth-deep-espresso)" }}>
                          {item.label}
                        </span>
                        {isSelected && (
                          <CornerDownLeft size={14} style={{ color: "var(--earth-secondary-text)" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--earth-secondary-text)" }}>
                  No commands match “{query}”.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t text-[10px]" style={{ borderColor: "var(--glass-border)", color: "var(--earth-secondary-text)" }}>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><ArrowUp size={11} /><ArrowDown size={11} /> navigate</span>
                <span className="inline-flex items-center gap-1"><CornerDownLeft size={11} /> select</span>
              </div>
              <span className="font-semibold">T³ Command</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
