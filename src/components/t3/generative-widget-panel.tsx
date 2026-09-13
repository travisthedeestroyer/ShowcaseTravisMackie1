"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, RotateCw, X, Trash2, Zap, Sparkles, ChevronDown } from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import { SudoCard, SectionHeader, StatusPill } from "./primitives";
import { WidgetRenderer } from "./widget-renderer";

const WIDGET_IDEAS = [
  "A CPU usage gauge",
  "A weekly bar chart of app launches",
  "A pomodoro timer",
  "Inspirational quotes that rotate every 5 seconds",
  "A mini calendar with upcoming events",
  "System status indicators (API, database, cache)",
  "A stock ticker with 5 tech stocks",
  "A donut chart of storage usage by category",
  "A sticky note for quick reminders",
  "An activity feed of recent terminal commands",
  "A markdown summary of today's tasks",
  "A progress board for project completion",
  "A counter showing total commands executed",
  "An analog clock with timezone",
  "A weather card for Tokyo",
  "A metrics grid for system health",
];

export function GenerativeWidgetPanel() {
  const customWidgets = useT3Store((s) => s.customWidgets);
  const isGenerating = useT3Store((s) => s.isGeneratingWidget);
  const generateWidget = useT3Store((s) => s.generateWidget);
  const removeCustomWidget = useT3Store((s) => s.removeCustomWidget);
  const toggleCustomWidget = useT3Store((s) => s.toggleCustomWidget);

  const [description, setDescription] = React.useState("");
  const [showAllIdeas, setShowAllIdeas] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const generate = (desc: string) => {
    const prompt = (desc || "").trim();
    if (!prompt || isGenerating) return;
    generateWidget(prompt);
  };

  const handleNotesChange = React.useCallback((id: string, content: string) => {
    // Update the widget's note content in the store
    useT3Store.setState((s) => ({
      customWidgets: s.customWidgets.map((w) =>
        w.id === id ? { ...w, data: { ...w.data, noteContent: content } } : w
      ),
    }));
  }, []);

  const visibleIdeas = showAllIdeas ? WIDGET_IDEAS : WIDGET_IDEAS.slice(0, 8);

  return (
    <SudoCard className="p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "color-mix(in srgb, var(--earth-terracotta) 14%, transparent)", color: "var(--earth-terracotta)" }}>
          <Zap size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base" style={{ color: "var(--earth-deep-espresso)" }}>Generative widgets</h3>
            <StatusPill text={customWidgets.length > 0 ? `${customWidgets.length} widget${customWidgets.length !== 1 ? "s" : ""}` : "No widgets yet"} color={customWidgets.length > 0 ? "var(--earth-sage-green)" : "var(--earth-secondary-text)"} />
          </div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--earth-secondary-text)" }}>
            Describe any widget you want — the AI generates it with full functionality and design. Charts, gauges, timers, notes, calendars, activity feeds, status indicators, and more. Anything you can imagine.
          </p>
        </div>
      </div>

      {/* Generate input */}
      <p className="text-sm font-semibold mb-2" style={{ color: "var(--earth-deep-espresso)" }}>Describe a widget</p>
      <div className="flex gap-2">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") generate(description); }}
          placeholder="e.g. A CPU usage gauge, a pomodoro timer, a stock ticker…"
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none transition-shadow focus:ring-2"
          style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
        />
        <button
          onClick={() => generate(description)}
          disabled={isGenerating || !description.trim()}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
        >
          {isGenerating ? <RotateCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {isGenerating ? "Generating…" : "Generate"}
        </button>
      </div>

      {/* Idea chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {visibleIdeas.map((idea) => (
          <button
            key={idea}
            onClick={() => { setDescription(idea); generate(idea); }}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 hover:shadow-sm disabled:opacity-40 active:scale-95"
            style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
          >
            {idea}
          </button>
        ))}
        {!showAllIdeas && WIDGET_IDEAS.length > 8 && (
          <button
            onClick={() => setShowAllIdeas(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 inline-flex items-center gap-1"
            style={{ background: "color-mix(in srgb, var(--earth-terracotta) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--earth-terracotta) 25%, transparent)", color: "var(--earth-terracotta)" }}
          >
            Show {WIDGET_IDEAS.length - 8} more <ChevronDown size={12} />
          </button>
        )}
        {showAllIdeas && (
          <button
            onClick={() => setShowAllIdeas(false)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
            style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-secondary-text)" }}
          >
            Show less
          </button>
        )}
      </div>

      {/* Generating indicator */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
            style={{ background: "color-mix(in srgb, var(--earth-terracotta) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--earth-terracotta) 18%, transparent)" }}
          >
            <RotateCw size={14} className="animate-spin" style={{ color: "var(--earth-terracotta)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--earth-terracotta)" }}>The AI is designing your widget…</span>
            <span className="text-[10px] ml-auto" style={{ color: "var(--earth-secondary-text)" }}>This takes a few seconds</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rendered custom widgets */}
      {customWidgets.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Your widgets" subtitle={`${customWidgets.length} AI-generated widget${customWidgets.length !== 1 ? "s" : ""}`} />
            <AnimatePresence>
              {!showClearConfirm ? (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "color-mix(in srgb, var(--cyber-alert-red) 10%, transparent)", color: "var(--cyber-alert-red)" }}
                >
                  <Trash2 size={11} /> Clear all
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={() => { customWidgets.forEach((w) => removeCustomWidget(w.id)); setShowClearConfirm(false); }}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "var(--cyber-alert-red)", color: "#fff" }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ border: "1px solid var(--glass-border)", color: "var(--earth-secondary-text)" }}
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customWidgets.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 24 }}
                className="relative group"
              >
                <WidgetRenderer widget={w} onNotesChange={handleNotesChange} />
                {/* Widget controls */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => toggleCustomWidget(w.id)}
                    className="p-1.5 rounded-full transition-transform hover:scale-110 active:scale-95"
                    style={{ background: "var(--glass-surface-light)", color: w.enabled ? "var(--earth-sage-green)" : "var(--earth-secondary-text)", border: "1px solid var(--glass-border)" }}
                    aria-label={w.enabled ? "Disable widget" : "Enable widget"}
                    title={w.enabled ? "Disable" : "Enable"}
                  >
                    <Sparkles size={13} />
                  </button>
                  <button
                    onClick={() => removeCustomWidget(w.id)}
                    className="p-1.5 rounded-full transition-transform hover:scale-110 active:scale-95"
                    style={{ background: "var(--glass-surface-light)", color: "var(--cyber-alert-red)", border: "1px solid var(--glass-border)" }}
                    aria-label="Remove widget"
                    title="Remove"
                  >
                    <X size={13} />
                  </button>
                </div>
                {/* Disabled overlay */}
                {!w.enabled && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center" style={{ background: "rgba(244,238,228,0.6)", backdropFilter: "blur(2px)" }}>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "var(--glass-surface-light)", color: "var(--earth-secondary-text)" }}>Disabled</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        !isGenerating && (
          <div className="mt-4 flex flex-col items-center justify-center py-8 px-4 rounded-2xl" style={{ background: "var(--glass-surface-card)", border: "1px dashed var(--glass-border)" }}>
            <Zap size={28} style={{ color: "var(--earth-secondary-text)", opacity: 0.4 }} />
            <p className="text-sm font-medium mt-3 mb-1" style={{ color: "var(--earth-deep-espresso)" }}>No widgets yet</p>
            <p className="text-xs text-center max-w-xs" style={{ color: "var(--earth-secondary-text)" }}>Describe a widget above or tap an idea chip to generate your first custom widget. The AI will handle the design, data, and functionality.</p>
          </div>
        )
      )}
    </SudoCard>
  );
}
