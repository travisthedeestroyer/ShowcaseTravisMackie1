"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, BarChart3, Gauge as GaugeIcon, Hash, List as ListIcon, StickyNote,
  Timer as TimerIcon, Clock as ClockIcon, CloudSun, FileText, Cpu, BarChart2,
  CheckCircle, AlertCircle, XCircle, Calendar, Quote as QuoteIcon, Zap, X,
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw,
  Sun, Moon, Cloud, CloudRain, CloudSnow, Star, Heart, Bell, Coffee, Music,
  Camera, Mail, Phone, MapPin, Globe, Download, Upload, Code, Terminal as TerminalIcon,
  Folder, Settings, Lock, Eye, TrendingUp, TrendingDown, DollarSign, Percent,
  Wifi, Signal, Battery, BatteryCharging, BatteryFull, HardDrive, Server,
  Shield, ShieldCheck, ShieldAlert, KeyRound, User, Users, Rocket, Wrench,
  Monitor, Smartphone, MessageSquare, Mic, Headphones, Volume2,
  type LucideIcon,
} from "lucide-react";
import type { CustomWidget, WidgetKind } from "@/lib/t3/types";

// Icon whitelist for widget headers
const WIDGET_ICONS: Record<string, LucideIcon> = {
  Activity, BarChart3, Gauge: GaugeIcon, Hash, List: ListIcon, StickyNote,
  Timer: TimerIcon, Clock: ClockIcon, CloudSun, FileText, Cpu, BarChart2,
  CheckCircle, AlertCircle, XCircle, Calendar, Quote: QuoteIcon, Zap, X,
  Sun, Moon, Cloud, CloudRain, CloudSnow, Star, Heart, Bell, Coffee, Music,
  Camera, Mail, Phone, MapPin, Globe, Download, Upload, Code, Terminal: TerminalIcon,
  Folder, Settings, Lock, Eye, TrendingUp, TrendingDown, DollarSign, Percent,
  Wifi, Signal, Battery, BatteryCharging, BatteryFull, HardDrive, Server,
  Shield, ShieldCheck, ShieldAlert, KeyRound, User, Users, Rocket, Wrench,
  Monitor, Smartphone, MessageSquare, Mic, Headphones, Volume2,
};

// WidgetRenderer — renders ANY widget type from its JSON definition.
// This is the core of the generative widget system.
export function WidgetRenderer({ widget, onNotesChange }: { widget: CustomWidget; onNotesChange?: (id: string, content: string) => void }) {
  if (!widget.enabled) return null;

  const headerIconName = widget.icon ?? "";
  const accent = widget.accent || "var(--earth-terracotta)";
  const bg = widget.background === "glass" ? "var(--glass-surface-card)" : widget.background || "var(--glass-surface-light)";

  const renderHeaderIcon = () => {
    const Icon = WIDGET_ICONS[headerIconName] ?? defaultIconForKind(widget.kind);
    return <Icon size={16} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: bg,
        border: "1px solid var(--glass-border)",
        backdropFilter: "blur(12px) saturate(140%)",
        boxShadow: "0 2px 12px -4px rgba(34,30,25,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
        >
          {renderHeaderIcon()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate" style={{ color: "var(--earth-deep-espresso)" }}>{widget.title}</h3>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0" style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}>{widget.kind}</span>
          </div>
          {widget.description && (
            <p className="text-xs truncate mt-0.5" style={{ color: "var(--earth-secondary-text)" }}>{widget.description}</p>
          )}
        </div>
      </div>

      {/* Body — rendered by kind */}
      <WidgetBody widget={widget} accent={accent} onNotesChange={onNotesChange} />
    </motion.div>
  );
}

function defaultIconForKind(kind: WidgetKind): LucideIcon {
  switch (kind) {
    case "CHART": return BarChart3;
    case "GAUGE": return GaugeIcon;
    case "COUNTER": return Hash;
    case "LIST": return ListIcon;
    case "NOTES": return StickyNote;
    case "TIMER": return TimerIcon;
    case "CLOCK": return ClockIcon;
    case "WEATHER": return CloudSun;
    case "MARKDOWN": return FileText;
    case "METRICS": return Cpu;
    case "PROGRESS": return BarChart2;
    case "STATUS": return CheckCircle;
    case "QUOTE": return QuoteIcon;
    case "CALENDAR": return Calendar;
    case "ACTIVITY": return Activity;
    case "CUSTOM": return Zap;
    default: return Activity;
  }
}

function WidgetBody({ widget, accent, onNotesChange }: { widget: CustomWidget; accent: string; onNotesChange?: (id: string, content: string) => void }) {
  const d = widget.data ?? {};
  switch (widget.kind) {
    case "CHART":
      return <ChartWidget points={d.points ?? []} chartType={d.chartType ?? "bar"} accent={accent} />;
    case "GAUGE":
      return <GaugeWidget value={d.gaugeValue ?? 0} label={d.gaugeLabel ?? ""} max={d.gaugeMax ?? 100} accent={accent} />;
    case "COUNTER":
      return <CounterWidget value={d.counterValue ?? 0} label={d.counterLabel ?? ""} delta={d.counterDelta} accent={accent} />;
    case "LIST":
      return <ListWidget items={d.items ?? []} />;
    case "NOTES":
      return <NotesWidget content={d.noteContent ?? ""} accent={accent} widgetId={widget.id} onNotesChange={onNotesChange} />;
    case "TIMER":
      return <TimerWidget seconds={d.timerSeconds ?? 300} accent={accent} />;
    case "CLOCK":
      return <ClockWidget timezone={d.clockTimezone} format={d.clockFormat ?? "12h"} accent={accent} />;
    case "WEATHER":
      return <WeatherWidget temp={d.weatherTemp ?? 68} condition={d.weatherCondition ?? "Sunny"} location={d.weatherLocation ?? ""} icon={d.weatherIcon ?? "Sun"} accent={accent} />;
    case "MARKDOWN":
      return <MarkdownWidget content={d.markdown ?? ""} accent={accent} />;
    case "METRICS":
      return <MetricsWidget metrics={d.metrics ?? []} />;
    case "PROGRESS":
      return <ProgressWidget items={d.progress ?? []} accent={accent} />;
    case "STATUS":
      return <StatusWidget statuses={d.statuses ?? []} />;
    case "QUOTE":
      return <QuoteWidget quotes={d.quotes ?? []} accent={accent} />;
    case "CALENDAR":
      return <CalendarWidget events={d.calendarEvents ?? []} accent={accent} />;
    case "ACTIVITY":
      return <ActivityWidget activities={d.activities ?? []} accent={accent} />;
    case "CUSTOM":
      return <CustomHtmlWidget html={d.customHtml ?? ""} />;
    default:
      return <p className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>Unknown widget type</p>;
  }
}

// ---- CHART ----
function ChartWidget({ points, chartType, accent }: { points: { label: string; value: number; color?: string }[]; chartType: string; accent: string }) {
  if (!points.length) return <p className="text-xs text-center py-3" style={{ color: "var(--earth-secondary-text)" }}>No data</p>;
  const max = Math.max(...points.map((p) => p.value), 1);
  if (chartType === "donut") {
    const total = points.reduce((s, p) => s + p.value, 0) || 1;
    const offsets = points.reduce<{ dash: number; offset: number }[]>((acc, p, i) => {
      const dash = (p.value / total) * 251.2;
      const prevOffset = i > 0 ? acc[i - 1].offset + acc[i - 1].dash : 0;
      return [...acc, { dash, offset: prevOffset }];
    }, []);
    return (
      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 100 100" width="120" height="120">
          {points.map((p, i) => (
            <circle
              key={i}
              cx="50" cy="50" r="40"
              fill="none"
              stroke={p.color || accent}
              strokeWidth="10"
              strokeDasharray={`${offsets[i].dash} 251.2`}
              strokeDashoffset={-offsets[i].offset}
              transform="rotate(-90 50 50)"
            />
          ))}
          <text x="50" y="48" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--earth-deep-espresso)">{total}</text>
          <text x="50" y="60" textAnchor="middle" fontSize="7" fill="var(--earth-secondary-text)">total</text>
        </svg>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-2">
          {points.map((p, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color || accent }} />
              <span className="text-[10px]" style={{ color: "var(--earth-secondary-text)" }}>{p.label}: {p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // bar / line / area
  return (
    <div className="space-y-2">
      {chartType === "bar" && points.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs w-16 sm:w-20 truncate shrink-0" style={{ color: "var(--earth-secondary-text)" }}>{p.label}</span>
          <div className="flex-1 h-6 rounded-lg overflow-hidden relative" style={{ background: "color-mix(in srgb, var(--earth-deep-espresso) 6%, transparent)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(8, (p.value / max) * 100)}%` }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
              className="h-full rounded-lg flex items-center justify-end pr-1.5 min-w-[24px]"
              style={{ background: p.color || accent }}
            >
              <span className="text-[10px] font-bold text-white whitespace-nowrap">{p.value}</span>
            </motion.div>
          </div>
        </div>
      ))}
      {chartType === "line" && (
        <div>
          <svg viewBox={`0 0 ${points.length * 40 + 10} 110`} width="100%" height="90" preserveAspectRatio="none">
            {/* Grid lines */}
            {[20, 50, 80].map((y) => (
              <line key={y} x1="0" y1={y} x2={points.length * 40 + 10} y2={y} stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="2 2" />
            ))}
            <polyline
              points={points.map((p, i) => `${i * 40 + 5},${100 - (p.value / max) * 90}`).join(" ")}
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={i * 40 + 5} cy={100 - (p.value / max) * 90} r="3" fill={accent} />
                <text x={i * 40 + 5} y="108" textAnchor="middle" fontSize="7" fill="var(--earth-secondary-text)">{p.label}</text>
              </g>
            ))}
          </svg>
        </div>
      )}
      {chartType === "area" && (
        <div>
          <svg viewBox={`0 0 ${points.length * 40 + 10} 110`} width="100%" height="90" preserveAspectRatio="none">
            {[20, 50, 80].map((y) => (
              <line key={y} x1="0" y1={y} x2={points.length * 40 + 10} y2={y} stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="2 2" />
            ))}
            <polygon
              points={`5,100 ${points.map((p, i) => `${i * 40 + 5},${100 - (p.value / max) * 90}`).join(" ")} ${points.length * 40 + 5},100`}
              fill={accent}
              opacity="0.18"
            />
            <polyline
              points={points.map((p, i) => `${i * 40 + 5},${100 - (p.value / max) * 90}`).join(" ")}
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <circle key={i} cx={i * 40 + 5} cy={100 - (p.value / max) * 90} r="2.5" fill={accent} />
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

// ---- GAUGE ----
function GaugeWidget({ value, label, max, accent }: { value: number; label: string; max: number; accent: string }) {
  const pct = Math.min(1, Math.max(0, value / max));
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 100 64" width="120" height="80">
          {/* Track */}
          <path d="M 10 50 A 40 40 0 1 1 90 50" fill="none" stroke="var(--glass-surface-variant)" strokeWidth="7" strokeLinecap="round" />
          {/* Value */}
          <motion.path
            d="M 10 50 A 40 40 0 1 1 90 50"
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="188.5"
            initial={{ strokeDashoffset: 188.5 }}
            animate={{ strokeDashoffset: 188.5 - pct * 188.5 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
          {/* Center text */}
          <text x="50" y="42" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--earth-deep-espresso)">{value}</text>
          <text x="50" y="52" textAnchor="middle" fontSize="7" fill="var(--earth-secondary-text)">/ {max}</text>
        </svg>
      </div>
      {label && <span className="text-xs mt-1 font-medium" style={{ color: "var(--earth-secondary-text)" }}>{label}</span>}
    </div>
  );
}

// ---- COUNTER ----
function CounterWidget({ value, label, delta, accent }: { value: number | string; label: string; delta?: string; accent: string }) {
  const isNegative = delta?.startsWith("-") || delta?.toLowerCase().includes("down");
  const deltaColor = isNegative ? "var(--cyber-alert-red)" : accent;
  return (
    <div className="text-center py-3">
      <div className="text-5xl font-extrabold tabular-nums" style={{ color: accent, lineHeight: 1 }}>{value}</div>
      {label && <div className="text-sm mt-2" style={{ color: "var(--earth-secondary-text)" }}>{label}</div>}
      {delta && (
        <div className="text-xs mt-2 font-semibold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${deltaColor} 12%, transparent)`, color: deltaColor }}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ---- LIST ----
function ListWidget({ items }: { items: { label: string; value?: string; icon?: string; color?: string }[] }) {
  if (!items.length) return <p className="text-xs text-center py-3" style={{ color: "var(--earth-secondary-text)" }}>No items</p>;
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => {
        const Icon = item.icon ? WIDGET_ICONS[item.icon] : null;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl"
            style={{ background: "var(--glass-surface-variant)" }}
          >
            {Icon && <Icon size={14} style={{ color: item.color || "var(--earth-terracotta)" }} />}
            <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--earth-deep-espresso)" }}>{item.label}</span>
            {item.value && <span className="t3-mono text-xs font-semibold shrink-0" style={{ color: item.color || "var(--earth-secondary-text)" }}>{item.value}</span>}
          </motion.div>
        );
      })}
    </div>
  );
}

// ---- NOTES ----
function NotesWidget({ content, accent, widgetId, onNotesChange }: { content: string; accent: string; widgetId: string; onNotesChange?: (id: string, content: string) => void }) {
  const [text, setText] = React.useState(content);
  return (
    <textarea
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onNotesChange?.(widgetId, e.target.value);
      }}
      placeholder="Type your notes…"
      className="w-full min-h-[80px] p-3 rounded-xl text-xs outline-none resize-y leading-relaxed"
      style={{
        background: `color-mix(in srgb, ${accent} 6%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 18%, transparent)`,
        color: "var(--earth-deep-espresso)",
        fontFamily: "inherit",
      }}
    />
  );
}

// ---- TIMER ----
function TimerWidget({ seconds, accent }: { seconds: number; accent: string }) {
  const [remaining, setRemaining] = React.useState(seconds);
  const [running, setRunning] = React.useState(false);
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const pct = ((seconds - remaining) / seconds) * 100;
  const isComplete = remaining === 0 && seconds > 0;
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      {/* Progress ring */}
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 100 100" width="80" height="80" className="absolute inset-0">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--glass-surface-variant)" strokeWidth="5" />
          <motion.circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={isComplete ? "var(--earth-sage-green)" : accent}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="276.5"
            initial={{ strokeDashoffset: 276.5 }}
            animate={{ strokeDashoffset: 276.5 - (pct / 100) * 276.5 }}
            transform="rotate(-90 50 50)"
            transition={{ ease: "linear", duration: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold tabular-nums" style={{ color: isComplete ? "var(--earth-sage-green)" : accent }}>
            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={isComplete}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform active:scale-95 disabled:opacity-40"
          style={{ background: isComplete ? "var(--earth-sage-green)" : accent, color: "#fff" }}
        >
          {running ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start</>}
        </button>
        <button
          onClick={() => { setRemaining(seconds); setRunning(false); }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ border: "1px solid var(--glass-border)", color: "var(--earth-secondary-text)" }}
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
      {isComplete && <span className="text-xs font-semibold" style={{ color: "var(--earth-sage-green)" }}>Timer complete! 🎉</span>}
    </div>
  );
}

// ---- CLOCK ----
function ClockWidget({ timezone, format, accent }: { timezone?: string; format: string; accent: string }) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric", minute: "2-digit",
    second: format === "24h" ? "2-digit" : undefined,
    hour12: format !== "24h",
  };
  if (timezone) timeOpts.timeZone = timezone;
  const time = now.toLocaleTimeString([], timeOpts);
  if (format === "analog") {
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    return (
      <div className="flex justify-center py-1">
        <svg viewBox="0 0 100 100" width="90" height="90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--glass-surface-variant)" strokeWidth="3" />
          {/* Hour markers */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const x1 = 50 + Math.cos(angle) * 42;
            const y1 = 50 + Math.sin(angle) * 42;
            const x2 = 50 + Math.cos(angle) * (i % 3 === 0 ? 36 : 39);
            const y2 = 50 + Math.sin(angle) * (i % 3 === 0 ? 36 : 39);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--earth-secondary-text)" strokeWidth={i % 3 === 0 ? 1.5 : 0.8} opacity={i % 3 === 0 ? 0.6 : 0.3} />;
          })}
          {/* Hour hand */}
          <line x1="50" y1="50" x2={50 + Math.cos((h / 12 + m / 720) * Math.PI * 2 - Math.PI / 2) * 22} y2={50 + Math.sin((h / 12 + m / 720) * Math.PI * 2 - Math.PI / 2) * 22} stroke={accent} strokeWidth="3" strokeLinecap="round" />
          {/* Minute hand */}
          <line x1="50" y1="50" x2={50 + Math.cos((m / 60) * Math.PI * 2 - Math.PI / 2) * 32} y2={50 + Math.sin((m / 60) * Math.PI * 2 - Math.PI / 2) * 32} stroke="var(--earth-secondary-text)" strokeWidth="2" strokeLinecap="round" />
          {/* Second hand */}
          <line x1="50" y1="50" x2={50 + Math.cos((s / 60) * Math.PI * 2 - Math.PI / 2) * 36} y2={50 + Math.sin((s / 60) * Math.PI * 2 - Math.PI / 2) * 36} stroke={accent} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <circle cx="50" cy="50" r="3" fill={accent} />
        </svg>
      </div>
    );
  }
  return (
    <div className="text-center py-2">
      <div className="text-3xl font-extralight tabular-nums tracking-tight" style={{ color: accent }}>{time}</div>
      <div className="text-xs mt-1.5" style={{ color: "var(--earth-secondary-text)" }}>
        {now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        {timezone ? ` · ${timezone}` : ""}
      </div>
    </div>
  );
}

// ---- WEATHER ----
function WeatherWidget({ temp, condition, location, icon, accent }: { temp: number; condition: string; location: string; icon: string; accent: string }) {
  const Icon = WIDGET_ICONS[icon] ?? CloudSun;
  const tempC = Math.round((temp - 32) * 5 / 9);
  return (
    <div className="flex items-center gap-4 py-2">
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
      >
        <Icon size={32} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-3xl font-bold tabular-nums" style={{ color: accent }}>{temp}°F</div>
        <div className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>{condition}</div>
        {location && <div className="text-[10px] mt-0.5" style={{ color: "var(--earth-secondary-text)", opacity: 0.7 }}>{location} · {tempC}°C</div>}
      </div>
    </div>
  );
}

// ---- MARKDOWN ----
function MarkdownWidget({ content, accent }: { content: string; accent: string }) {
  return (
    <div className="text-xs leading-relaxed" style={{ color: "var(--earth-deep-espresso)" }}>
      {content.split("\n").map((line, i) => {
        if (line.startsWith("# ")) return <h4 key={i} className="font-bold text-sm mt-2 mb-1" style={{ color: accent }}>{line.slice(2)}</h4>;
        if (line.startsWith("## ")) return <h5 key={i} className="font-semibold text-xs mt-2 mb-1" style={{ color: accent }}>{line.slice(3)}</h5>;
        if (line.startsWith("- ")) return <div key={i} className="flex gap-1.5 mb-0.5"><span style={{ color: accent }}>•</span><span>{line.slice(2)}</span></div>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold my-0.5">{line.slice(2, -2)}</p>;
        if (line.trim() === "") return <div key={i} className="h-1.5" />;
        return <p key={i} className="mb-1">{line}</p>;
      })}
    </div>
  );
}

// ---- METRICS ----
function MetricsWidget({ metrics }: { metrics: { label: string; value: string; icon?: string; color?: string }[] }) {
  if (!metrics.length) return <p className="text-xs text-center py-3" style={{ color: "var(--earth-secondary-text)" }}>No metrics</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((m, i) => {
        const Icon = m.icon ? WIDGET_ICONS[m.icon] : null;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="px-3 py-2.5 rounded-xl"
            style={{ background: "var(--glass-surface-variant)" }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              {Icon && <Icon size={12} style={{ color: m.color || "var(--earth-terracotta)" }} />}
              <span className="text-[10px] uppercase tracking-wide truncate" style={{ color: "var(--earth-secondary-text)" }}>{m.label}</span>
            </div>
            <span className="t3-mono text-base font-bold" style={{ color: "var(--earth-deep-espresso)" }}>{m.value}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---- PROGRESS ----
function ProgressWidget({ items, accent }: { items: { label: string; value: number; color?: string }[]; accent: string }) {
  if (!items.length) return <p className="text-xs text-center py-3" style={{ color: "var(--earth-secondary-text)" }}>No progress items</p>;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium" style={{ color: "var(--earth-deep-espresso)" }}>{item.label}</span>
            <span className="t3-mono font-semibold" style={{ color: item.color || accent }}>{item.value}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--glass-surface-variant)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="h-full rounded-full"
              style={{ background: item.color || accent }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- STATUS ----
function StatusWidget({ statuses }: { statuses: { label: string; status: string; color?: string }[] }) {
  if (!statuses.length) return <p className="text-xs text-center py-3" style={{ color: "var(--earth-secondary-text)" }}>No status items</p>;
  const statusIcon = (s: string): LucideIcon => s === "online" ? CheckCircle : s === "warning" ? AlertCircle : s === "error" ? XCircle : Activity;
  const statusColor = (s: string, c?: string) => c || (s === "online" ? "var(--earth-sage-green)" : s === "warning" ? "var(--cyber-warning-yellow)" : s === "error" ? "var(--cyber-alert-red)" : "var(--earth-secondary-text)");
  return (
    <div className="space-y-1.5">
      {statuses.map((s, i) => {
        const Icon = statusIcon(s.status);
        const color = statusColor(s.status, s.color);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ background: `color-mix(in srgb, ${color} 8%, var(--glass-surface-variant))` }}
          >
            <span className="relative">
              <Icon size={14} style={{ color }} />
              {s.status === "online" && (
                <span className="absolute inset-0 rounded-full animate-ping" style={{ background: color, opacity: 0.2 }} />
              )}
            </span>
            <span className="text-xs font-medium flex-1" style={{ color: "var(--earth-deep-espresso)" }}>{s.label}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{s.status}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---- QUOTE ----
function QuoteWidget({ quotes, accent }: { quotes: string[]; accent: string }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (quotes.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % quotes.length), 5000);
    return () => clearInterval(id);
  }, [quotes.length]);
  if (!quotes.length) return null;
  return (
    <div className="py-2">
      <QuoteIcon size={24} style={{ color: accent, opacity: 0.25 }} className="mb-3" />
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-sm italic leading-relaxed"
          style={{ color: "var(--earth-deep-espresso)" }}
        >
          "{quotes[idx]}"
        </motion.p>
      </AnimatePresence>
      {quotes.length > 1 && (
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setIdx((i) => (i - 1 + quotes.length) % quotes.length)}
            className="p-1 rounded-full transition-transform hover:scale-110 active:scale-95"
            style={{ color: "var(--earth-secondary-text)" }}
            aria-label="Previous quote"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex justify-center gap-1.5">
            {quotes.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 6 : 4,
                  height: i === idx ? 6 : 4,
                  background: i === idx ? accent : "var(--glass-surface-variant)",
                }}
                aria-label={`Quote ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx((i) => (i + 1) % quotes.length)}
            className="p-1 rounded-full transition-transform hover:scale-110 active:scale-95"
            style={{ color: "var(--earth-secondary-text)" }}
            aria-label="Next quote"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ---- CALENDAR ----
function CalendarWidget({ events, accent }: { events: { day: number; title: string; color?: string }[]; accent: string }) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return (
    <div>
      <div className="text-sm font-bold mb-3" style={{ color: accent }}>{now.toLocaleDateString([], { month: "long", year: "numeric" })}</div>
      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[9px] font-semibold text-center pb-1" style={{ color: "var(--earth-secondary-text)" }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {days.map((day) => {
          const event = events.find((e) => e.day === day);
          const isToday = day === now.getDate();
          return (
            <div
              key={day}
              className="text-[10px] text-center py-1 rounded-md relative"
              style={{
                background: isToday ? accent : event ? `color-mix(in srgb, ${event.color || accent} 16%, transparent)` : "transparent",
                color: isToday ? "#fff" : "var(--earth-deep-espresso)",
                fontWeight: isToday ? 700 : event ? 600 : 400,
              }}
            >
              {day}
              {event && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: event.color || accent }} />
              )}
            </div>
          );
        })}
      </div>
      {events.length > 0 && (
        <div className="mt-3 pt-2 border-t space-y-1.5" style={{ borderColor: "var(--glass-border)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--earth-secondary-text)" }}>Upcoming</p>
          {events.slice(0, 4).map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color || accent }} />
              <span className="font-medium shrink-0" style={{ color: accent }}>Day {e.day}:</span>
              <span className="truncate" style={{ color: "var(--earth-deep-espresso)" }}>{e.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- ACTIVITY ----
function ActivityWidget({ activities, accent }: { activities: { time: string; title: string; icon?: string; color?: string }[]; accent: string }) {
  if (!activities.length) return <p className="text-xs text-center py-3" style={{ color: "var(--earth-secondary-text)" }}>No activity</p>;
  return (
    <div className="space-y-0 max-h-48 overflow-y-auto t3-scroll relative">
      {/* Timeline line */}
      <div className="absolute left-[31px] top-2 bottom-2 w-px" style={{ background: `color-mix(in srgb, ${accent} 20%, transparent)` }} />
      {activities.map((a, i) => {
        const Icon = a.icon ? WIDGET_ICONS[a.icon] : Activity;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-2.5 py-1.5 relative"
          >
            <span className="text-[10px] t3-mono shrink-0 w-10 mt-0.5 text-right" style={{ color: "var(--earth-secondary-text)" }}>{a.time}</span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10"
              style={{ background: `color-mix(in srgb, ${a.color || accent} 14%, var(--glass-surface-light))` }}
            >
              <Icon size={11} style={{ color: a.color || accent }} />
            </div>
            <span className="text-xs mt-0.5" style={{ color: "var(--earth-deep-espresso)" }}>{a.title}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---- CUSTOM HTML ----
function CustomHtmlWidget({ html }: { html: string }) {
  return (
    <div
      className="text-xs leading-relaxed"
      style={{ color: "var(--earth-deep-espresso)" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
