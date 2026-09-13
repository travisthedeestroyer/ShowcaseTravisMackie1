"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Terminal, Folder, Activity, Palette, Sparkles, Shield,
  ChevronRight, Star, Download, Power, Lock,
} from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { OsTab, PluginEntity, PluginCategory } from "@/lib/t3/types";
import { OS_TABS } from "@/lib/t3/types";
import { SudoCard, SectionHeader, StatusPill, LinkRow } from "../primitives";

const CAT_COLOR: Record<PluginCategory, string> = {
  AI: "var(--earth-terracotta)",
  SECURITY: "var(--earth-slate-blue)",
  THEMES: "var(--earth-sage-green)",
  UTILITIES: "var(--cyber-warning-yellow)",
};

export function CapabilitiesScreen() {
  const config = useT3Store((s) => s.config);
  const activeTheme = useT3Store((s) => s.activeTheme);
  const selectTab = useT3Store((s) => s.selectTab);
  const setSpokenResponses = useT3Store((s) => s.setSpokenResponses);
  const plugins = useT3Store((s) => s.plugins);
  const installPlugin = useT3Store((s) => s.installPlugin);
  const togglePlugin = useT3Store((s) => s.togglePlugin);
  const [selectedPlugin, setSelectedPlugin] = React.useState<PluginEntity | null>(null);
  const [catFilter, setCatFilter] = React.useState<PluginCategory | "ALL">("ALL");

  const aiStatus =
    config.selectedProvider === "GEMMA_LOCAL"
      ? config.localModelDownloaded
        ? { label: "Ready", color: "var(--earth-sage-green)" }
        : { label: "Needs download", color: "var(--cyber-warning-yellow)" }
      : { label: "Needs key", color: "var(--cyber-warning-yellow)" };

  const sandboxStatus = config.sandboxLevel === "STRICT_SANDBOX"
    ? { label: "Strict", color: "var(--earth-sage-green)" }
    : { label: "Root", color: "var(--earth-terracotta)" };

  const filteredPlugins = catFilter === "ALL" ? plugins : plugins.filter((p) => p.category === catFilter);

  const capabilityRows: { tab: OsTab; icon: React.ReactNode; title: string; subtitle: string; status: { label: string; color: string } }[] = [
    { tab: "TERMINAL", icon: <Terminal size={16} />, title: "Real shell", subtitle: "Run commands on a sandboxed device", status: { label: "Included", color: "var(--earth-sage-green)" } },
    { tab: "FILES", icon: <Folder size={16} />, title: "File browser", subtitle: "Browse the real filesystem with versioning", status: { label: "Included", color: "var(--earth-sage-green)" } },
    { tab: "APPS", icon: <Activity size={16} />, title: "System monitor", subtitle: "Battery, memory, processes, network", status: { label: "Included", color: "var(--earth-sage-green)" } },
    { tab: "THEMES", icon: <Palette size={16} />, title: "Generative themes", subtitle: "AI-designed themes from any vibe", status: { label: "Included", color: "var(--earth-sage-green)" } },
    { tab: "MODELS", icon: <Sparkles size={16} />, title: "AI agent", subtitle: config.selectedProvider === "GEMMA_LOCAL" ? "On-device Gemma" : "Cloud-connected model", status: aiStatus },
    { tab: "SANDBOX", icon: <Shield size={16} />, title: "Safety guard", subtitle: "Risk scoring before commands run", status: sandboxStatus },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Capabilities" subtitle="What T³ can do on this device" />

      {/* Spoken responses toggle */}
      <SudoCard className="p-4 flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "color-mix(in srgb, var(--earth-terracotta) 14%, transparent)", color: "var(--earth-terracotta)" }}>
          <Mic size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>Spoken responses</p>
          <p className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>Read AI replies aloud with text-to-speech.</p>
        </div>
        <button
          onClick={() => setSpokenResponses(!config.googleLiveVoiceEnabled)}
          role="switch"
          aria-checked={config.googleLiveVoiceEnabled}
          className="relative w-12 h-7 rounded-full transition-colors shrink-0"
          style={{ background: config.googleLiveVoiceEnabled ? "var(--earth-terracotta)" : "var(--glass-surface-variant)" }}
        >
          <motion.span
            className="absolute top-0.5 w-6 h-6 rounded-full"
            style={{ background: config.googleLiveVoiceEnabled ? "var(--bento-deep-purple)" : "#FFFFFF", boxShadow: "0 1px 3px rgba(34,30,25,0.2)" }}
            animate={{ left: config.googleLiveVoiceEnabled ? "22px" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </SudoCard>

      {/* Included label */}
      <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: "var(--earth-secondary-text)" }}>Included</p>

      {/* capability rows */}
      <div className="space-y-2.5">
        {capabilityRows.map((r) => (
          <LinkRow
            key={r.tab}
            icon={r.icon}
            title={r.title}
            subtitle={r.subtitle}
            accent={activeTheme.primaryColor}
            onClick={() => selectTab(r.tab)}
            trailing={<div className="flex items-center gap-2">
              <StatusPill text={r.status.label} color={r.status.color} />
              <ChevronRight size={16} style={{ color: "var(--earth-secondary-text)" }} />
            </div>}
          />
        ))}
      </div>

      {/* Plugin marketplace (NEW) */}
      <div className="pt-2">
        <SectionHeader title="Plugin marketplace" subtitle="Extend T³ with community plugins" trailing={<StatusPill text={`${plugins.filter(p => p.isInstalled).length} installed`} color="var(--earth-sage-green)" />} />
      </div>

      {/* category filter */}
      <div className="flex gap-2 overflow-x-auto t3-scroll -mx-1 px-1 pb-1">
        {(["ALL", "AI", "SECURITY", "THEMES", "UTILITIES"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform capitalize"
            style={{
              background: catFilter === c ? "var(--earth-terracotta)" : "var(--glass-surface-card)",
              color: catFilter === c ? "var(--bento-deep-purple)" : "var(--earth-deep-espresso)",
              border: "1px solid var(--glass-border)",
            }}
          >
            {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* plugin cards */}
      <div className="space-y-2.5">
        {filteredPlugins.map((p) => (
          <PluginCard
            key={p.id}
            plugin={p}
            onInstall={() => installPlugin(p.id)}
            onToggle={() => togglePlugin(p.id)}
            onInfo={() => setSelectedPlugin(p)}
          />
        ))}
      </div>

      {/* plugin detail */}
      <AnimatePresence>
        {selectedPlugin && (
          <PluginDetailSheet
            plugin={selectedPlugin}
            onClose={() => setSelectedPlugin(null)}
            onInstall={() => { installPlugin(selectedPlugin.id); setSelectedPlugin(null); }}
            onToggle={() => togglePlugin(selectedPlugin.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PluginCard({ plugin, onInstall, onToggle, onInfo }: {
  plugin: PluginEntity; onInstall: () => void; onToggle: () => void; onInfo: () => void;
}) {
  const accent = CAT_COLOR[plugin.category];
  return (
    <SudoCard onClick={onInfo} className="p-3.5 flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-white font-bold"
        style={{ background: `linear-gradient(135deg, ${plugin.iconGradient[0]}, ${plugin.iconGradient[1]})` }}
      >
        {plugin.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--earth-deep-espresso)" }}>{plugin.name}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}>{plugin.category}</span>
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--earth-secondary-text)" }}>{plugin.description}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: "var(--earth-secondary-text)" }}>
            <Star size={10} fill="var(--cyber-warning-yellow)" style={{ color: "var(--cyber-warning-yellow)" }} /> {plugin.rating}
          </span>
          <span className="t3-mono text-[10px]" style={{ color: "var(--earth-secondary-text)" }}>{(plugin.downloadsCount / 1000).toFixed(0)}k downloads</span>
        </div>
      </div>
      {plugin.isInstalled ? (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          aria-label={plugin.isEnabled ? "Disable" : "Enable"}
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full"
          style={{ background: plugin.isEnabled ? "color-mix(in srgb, var(--earth-sage-green) 14%, transparent)" : "var(--glass-surface-variant)", color: plugin.isEnabled ? "var(--earth-sage-green)" : "var(--earth-secondary-text)" }}
        >
          <Power size={15} />
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onInstall(); }}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold"
          style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
        >
          <Download size={12} /> Install
        </button>
      )}
    </SudoCard>
  );
}

function PluginDetailSheet({ plugin, onClose, onInstall, onToggle }: {
  plugin: PluginEntity; onClose: () => void; onInstall: () => void; onToggle: () => void;
}) {
  const accent = CAT_COLOR[plugin.category];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(34,30,25,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-5 pb-6"
        style={{
          background: "var(--glass-surface-light)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--t3-radius-sheet)",
          backdropFilter: "blur(16px) saturate(160%)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-white font-bold text-xl" style={{ background: `linear-gradient(135deg, ${plugin.iconGradient[0]}, ${plugin.iconGradient[1]})` }}>
            {plugin.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate" style={{ color: "var(--earth-deep-espresso)" }}>{plugin.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}>{plugin.category}</span>
              <span className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>v{plugin.version} · by {plugin.author}</span>
            </div>
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--earth-deep-espresso)" }}>{plugin.description}</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--earth-secondary-text)" }}>
            <Star size={14} fill="var(--cyber-warning-yellow)" style={{ color: "var(--cyber-warning-yellow)" }} /> {plugin.rating}
          </span>
          <span className="t3-mono text-xs" style={{ color: "var(--earth-secondary-text)" }}>{plugin.downloadsCount.toLocaleString()} downloads</span>
        </div>
        <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--earth-secondary-text)" }}>Permissions requested</p>
          <div className="flex flex-wrap gap-1.5">
            {plugin.permissions.map((perm) => (
              <span key={perm} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold t3-mono" style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}>
                <Lock size={9} /> {perm}
              </span>
            ))}
          </div>
        </div>
        {plugin.isInstalled ? (
          <button
            onClick={onToggle}
            className="w-full mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: plugin.isEnabled ? "color-mix(in srgb, var(--cyber-alert-red) 12%, transparent)" : "var(--earth-sage-green)", color: plugin.isEnabled ? "var(--cyber-alert-red)" : "var(--bento-deep-purple)", border: plugin.isEnabled ? "1px solid color-mix(in srgb, var(--cyber-alert-red) 30%, transparent)" : "none" }}
          >
            <Power size={14} /> {plugin.isEnabled ? "Disable plugin" : "Enable plugin"}
          </button>
        ) : (
          <button
            onClick={onInstall}
            className="w-full mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02]"
            style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
          >
            <Download size={14} /> Install plugin
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
