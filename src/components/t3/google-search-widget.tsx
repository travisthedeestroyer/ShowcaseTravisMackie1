"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Globe, Palette, ArrowUpRight, Loader2 } from "lucide-react";
import { useT3Store } from "@/lib/t3/store";

type Mode = "ask" | "web";

interface Exchange {
  id: string;
  mode: Mode | "uix";
  prompt: string;
  response: string;
  isLoading: boolean;
}

// GoogleSearchWidgetPanel — Ask AI / Web / /UIX
export function GoogleSearchWidgetPanel() {
  const askModel = useT3Store((s) => s.askModel);
  const requestUiDesignChange = useT3Store((s) => s.requestUiDesignChange);
  const recentExchanges = useT3Store((s) => s.recentExchanges);
  const addExchange = useT3Store((s) => s.addExchange);
  const resolveExchange = useT3Store((s) => s.resolveExchange);
  const activeTheme = useT3Store((s) => s.activeTheme);

  const [mode, setMode] = React.useState<Mode>("ask");
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    const q = input.trim();
    if (!q || busy) return;

    // /UIX routes to Omni-UI engine
    if (q.toLowerCase().startsWith("/uix")) {
      const request = q.slice(4).trim();
      if (!request) return;
      const id = Math.random().toString(36).slice(2);
      addExchange({ id, mode: "uix", prompt: request });
      setInput("");
      await requestUiDesignChange(request);
      resolveExchange(id, "Designing a live preview… check the Omni-UI sheet.");
      return;
    }

    if (mode === "web") {
      const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      const id = Math.random().toString(36).slice(2);
      addExchange({ id, mode: "web", prompt: q });
      resolveExchange(id, url);
      setInput("");
      return;
    }

    // ask mode
    setBusy(true);
    const id = Math.random().toString(36).slice(2);
    addExchange({ id, mode: "ask", prompt: q });
    setInput("");
    try {
      const { text, actionNote } = await askModel(q);
      resolveExchange(id, actionNote ? `${text}\n\n✓ ${actionNote}` : text);
    } catch {
      resolveExchange(id, "(I couldn't reach the model.)");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        style={{
          background: "var(--glass-surface-light)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--t3-radius-card)",
          backdropFilter: "blur(12px) saturate(140%)",
        }}
        className="p-3.5"
      >
        {/* segmented control */}
        <div className="flex gap-1 p-1 rounded-full mb-3" style={{ background: "var(--glass-surface-variant)" }}>
          {(["ask", "web"] as Mode[]).map((m) => {
            const Icon = m === "ask" ? Sparkles : Globe;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
                style={
                  mode === m
                    ? { background: "var(--glass-surface-light)", color: "var(--earth-deep-espresso)", boxShadow: "0 1px 3px rgba(34,30,25,0.08)" }
                    : { color: "var(--earth-secondary-text)" }
                }
              >
                <Icon size={14} />
                {m === "ask" ? "Ask AI" : "Web"}
              </button>
            );
          })}
        </div>

        {/* input pill */}
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={mode === "ask" ? "Ask, or type /UIX <design request>" : "Search the web"}
            className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
            style={{
              background: "var(--glass-surface-card)",
              border: "1px solid var(--glass-border)",
              color: "var(--earth-deep-espresso)",
            }}
          />
          <button
            onClick={submit}
            disabled={busy || !input.trim()}
            aria-label="Submit"
            className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: activeTheme.primaryColor, color: "var(--bento-deep-purple)" }}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpRight size={18} />}
          </button>
        </div>

        <p className="text-[11px] mt-2 px-1" style={{ color: "var(--earth-secondary-text)" }}>
          {mode === "ask"
            ? "Tip: ask the agent to navigate, launch apps, change themes, or run a command."
            : "Opens your search in a new browser tab."}
        </p>
      </div>

      {/* recent exchanges */}
      {recentExchanges.length > 0 && (
        <div className="space-y-2.5 mt-3">
          {recentExchanges.map((e) => (
            <ExchangeCard key={e.id} exchange={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExchangeCard({ exchange }: { exchange: Exchange }) {
  const Icon = exchange.mode === "uix" ? Palette : exchange.mode === "web" ? Globe : Sparkles;
  const accent =
    exchange.mode === "uix"
      ? "var(--earth-sage-green)"
      : exchange.mode === "web"
      ? "var(--earth-slate-blue)"
      : "var(--earth-terracotta)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--glass-surface-card)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--t3-radius-tile)",
      }}
      className="p-3.5"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
        >
          <Icon size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--earth-deep-espresso)" }}>
            {exchange.prompt}
          </p>
          {exchange.isLoading ? (
            <div className="flex items-center gap-2 mt-1.5 text-sm" style={{ color: "var(--earth-secondary-text)" }}>
              <Loader2 size={13} className="animate-spin" /> Thinking…
            </div>
          ) : exchange.mode === "web" ? (
            <a
              href={exchange.response}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm mt-1 inline-flex items-center gap-1 underline underline-offset-2"
              style={{ color: "var(--earth-slate-blue)" }}
            >
              Open again <ArrowUpRight size={12} />
            </a>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-line leading-relaxed" style={{ color: "var(--earth-secondary-text)" }}>
              {exchange.response}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
