"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Terminal, Activity, Folder, Sparkles, Palette, Shield, Blocks, Settings,
  ArrowRight, Search, Rocket, HardDrive, Cpu, Battery, Wifi,
} from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { OsTab } from "@/lib/t3/types";
import { formatBytes, formatUptime } from "@/lib/t3/types";
import { SudoCard, SectionHeader, StatusPill } from "../primitives";
import { GoogleLiveVoiceBar } from "../google-live-voice-bar";
import { GoogleSearchWidgetPanel } from "../google-search-widget";
import { WidgetRenderer } from "../widget-renderer";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}

const QUICK_COMMANDS = [
  { label: "Storage", cmd: "df -h" },
  { label: "Kernel", cmd: "uname -a" },
  { label: "Uptime", cmd: "uptime" },
  { label: "Identity", cmd: "id" },
];

const SHORTCUTS: { tab: OsTab; label: string; icon: React.ComponentType<{ size?: number }>; accent: string }[] = [
  { tab: "TERMINAL", label: "Terminal", icon: Terminal, accent: "var(--earth-terracotta)" },
  { tab: "APPS", label: "System monitor", icon: Activity, accent: "var(--earth-sage-green)" },
  { tab: "FILES", label: "File browser", icon: Folder, accent: "var(--earth-slate-blue)" },
  { tab: "MODELS", label: "AI model", icon: Sparkles, accent: "var(--earth-terracotta)" },
  { tab: "THEMES", label: "Theme studio", icon: Palette, accent: "var(--earth-sage-green)" },
  { tab: "SANDBOX", label: "Security", icon: Shield, accent: "var(--earth-slate-blue)" },
  { tab: "MARKETPLACE", label: "Capabilities", icon: Blocks, accent: "var(--earth-terracotta)" },
  { tab: "PROFILE", label: "Settings", icon: Settings, accent: "var(--earth-sage-green)" },
];

export function DesktopScreen() {
  const config = useT3Store((s) => s.config);
  const telemetry = useT3Store((s) => s.telemetry);
  const selectTab = useT3Store((s) => s.selectTab);
  const executeTerminalCommand = useT3Store((s) => s.executeTerminalCommand);
  const installedApps = useT3Store((s) => s.installedApps);
  const launchApp = useT3Store((s) => s.launchApp);
  const activeTheme = useT3Store((s) => s.activeTheme);
  const customWidgets = useT3Store((s) => s.customWidgets);

  const launchableApps = installedApps.filter((a) => a.isLaunchable).slice(0, 10);

  const now = new Date();
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const memPct = Math.round((telemetry.usedMemBytes / telemetry.totalMemBytes) * 100);
  const storagePct = Math.round((telemetry.storageUsedBytes / telemetry.storageTotalBytes) * 100);

  return (
    <div className="space-y-5">
      {/* Greeting header */}
      <SudoCard className="p-5 sm:p-6">
        <p className="text-sm font-medium" style={{ color: "var(--earth-secondary-text)" }}>
          {greeting()}, {config.username || "rootadmin"}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5" style={{ color: "var(--earth-deep-espresso)" }}>
          {dateStr} · {timeStr}
        </h1>
      </SudoCard>

      {/* System glance */}
      <SudoCard onClick={() => selectTab("APPS")} className="p-4">
        <div className="grid grid-cols-4 gap-3">
          <GlanceStat
            icon={<Battery size={16} />}
            label="Battery"
            value={`${telemetry.batteryPercent.toFixed(0)}%`}
            sub={telemetry.isCharging ? "Charging" : "Discharging"}
          />
          <GlanceStat
            icon={<Cpu size={16} />}
            label="Memory"
            value={`${memPct}%`}
            sub={formatBytes(telemetry.usedMemBytes)}
          />
          <GlanceStat
            icon={<HardDrive size={16} />}
            label="Storage"
            value={`${storagePct}%`}
            sub={formatBytes(telemetry.storageUsedBytes)}
          />
          <GlanceStat
            icon={<Wifi size={16} />}
            label="Network"
            value={telemetry.network === "OFFLINE" ? "Offline" : telemetry.network.charAt(0) + telemetry.network.slice(1).toLowerCase()}
            sub={`${telemetry.cpuCores} cores · ${telemetry.manufacturer}`}
          />
        </div>
      </SudoCard>

      {/* Live voice bar */}
      <GoogleLiveVoiceBar />

      {/* Search / ask panel */}
      <GoogleSearchWidgetPanel />

      {/* Mirrored apps */}
      {launchableApps.length > 0 && (
        <div>
          <SectionHeader
            title="Mirrored apps"
            subtitle={`${launchableApps.length} apps installed`}
            trailing={
              <button
                onClick={() => selectTab("APPS")}
                className="text-xs font-semibold inline-flex items-center gap-1"
                style={{ color: activeTheme.primaryColor }}
              >
                All apps <ArrowRight size={12} />
              </button>
            }
          />
          <div className="flex gap-2.5 overflow-x-auto t3-scroll mt-3 pb-1 -mx-1 px-1">
            {launchableApps.map((app) => (
              <button
                key={app.packageName}
                onClick={() => launchApp(app.packageName)}
                className="shrink-0 w-[88px] text-center"
              >
                <SudoCard className="p-3 flex flex-col items-center gap-1.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${app.iconGradient[0]}, ${app.iconGradient[1]})` }}
                  >
                    {app.appName.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold truncate w-full" style={{ color: "var(--earth-deep-espresso)" }}>
                    {app.appName}
                  </span>
                </SudoCard>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick commands */}
      <div>
        <SectionHeader title="Quick commands" />
        <div className="flex gap-2 overflow-x-auto t3-scroll mt-3 pb-1 -mx-1 px-1">
          {QUICK_COMMANDS.map((q) => (
            <button
              key={q.label}
              onClick={() => {
                executeTerminalCommand(q.cmd);
                selectTab("TERMINAL");
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95"
              style={{
                background: "var(--glass-surface-card)",
                border: "1px solid var(--glass-border)",
                color: "var(--earth-deep-espresso)",
              }}
            >
              <Search size={13} style={{ color: activeTheme.primaryColor }} />
              {q.label}
              <span className="t3-mono text-[10px] opacity-50">{q.cmd}</span>
            </button>
          ))}
        </div>
      </div>

      {/* System modules grid */}
      <div>
        <SectionHeader title="System modules" subtitle="Jump to any part of the OS" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {SHORTCUTS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
              >
                <SudoCard onClick={() => selectTab(s.tab)} className="p-4 flex flex-col items-start gap-2.5 h-full">
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{ background: `color-mix(in srgb, ${s.accent} 14%, transparent)`, color: s.accent }}
                  >
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--earth-deep-espresso)" }}>{s.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--earth-secondary-text)" }}>
                      Open {s.label.toLowerCase()}
                    </p>
                  </div>
                </SudoCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Custom generative widgets */}
      {customWidgets.filter((w) => w.enabled).length > 0 && (
        <div className="pt-2">
          <SectionHeader title="Your widgets" subtitle={`${customWidgets.filter((w) => w.enabled).length} AI-generated widgets`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {customWidgets.filter((w) => w.enabled).map((w) => (
              <WidgetRenderer key={w.id} widget={w} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs pt-2 pb-4" style={{ color: "var(--earth-secondary-text)" }}>
        Uptime {formatUptime(telemetry.uptimeMillis)} · {telemetry.manufacturer} {telemetry.deviceModel} · Android {telemetry.osRelease}
      </div>
    </div>
  );
}

function GlanceStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-1">
      <span style={{ color: "var(--earth-secondary-text)" }}>{icon}</span>
      <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--earth-secondary-text)" }}>
        {label}
      </span>
      <span className="t3-mono text-base font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>
        {value}
      </span>
      <span className="text-[10px]" style={{ color: "var(--earth-secondary-text)" }}>{sub}</span>
    </div>
  );
}
