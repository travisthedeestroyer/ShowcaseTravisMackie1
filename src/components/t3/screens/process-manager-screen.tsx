"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Grid3x3, List, RefreshCw, Star, Info, Store, Settings, Rocket,
  CircuitBoard, MemoryStick, HardDrive, Battery, Wifi, Cpu, Clock,
  AlertTriangle,
} from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { InstalledAppInfo, AppCategoryFilter } from "@/lib/t3/types";
import { formatBytes, formatUptime } from "@/lib/t3/types";
import { MOCK_PROCESSES } from "@/lib/t3/mock-data";
import { SudoCard, SectionHeader, StatusPill, MetricTile, UsageBar, EmptyState } from "../primitives";

type SubTab = "mirror" | "telemetry";

export function ProcessManagerScreen() {
  const [sub, setSub] = React.useState<SubTab>("mirror");
  return (
    <div className="space-y-4">
      <SectionHeader
        title="System"
        subtitle="App mirror · live telemetry · active processes"
        trailing={
          <div className="flex gap-1 p-1 rounded-full" style={{ background: "var(--glass-surface-variant)" }}>
            {(["mirror", "telemetry"] as SubTab[]).map((s) => (
              <button
                key={s}
                onClick={() => setSub(s)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={
                  sub === s
                    ? { background: "var(--glass-surface-light)", color: "var(--earth-deep-espresso)", boxShadow: "0 1px 3px rgba(34,30,25,0.08)" }
                    : { color: "var(--earth-secondary-text)" }
                }
              >
                {s === "mirror" ? "App mirror" : "Telemetry"}
              </button>
            ))}
          </div>
        }
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={sub}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {sub === "mirror" ? <AppMirrorContent /> : <SystemTelemetryContent />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const FILTERS: AppCategoryFilter[] = ["LAUNCHABLE", "USER", "SYSTEM", "FAVORITES", "ALL"];

function AppMirrorContent() {
  const apps = useT3Store((s) => s.installedApps);
  const search = useT3Store((s) => s.appSearchQuery);
  const filter = useT3Store((s) => s.appFilter);
  const favorites = useT3Store((s) => s.favoriteApps);
  const updateAppSearchQuery = useT3Store((s) => s.updateAppSearchQuery);
  const setAppFilter = useT3Store((s) => s.setAppFilter);
  const toggleFavoriteApp = useT3Store((s) => s.toggleFavoriteApp);
  const launchApp = useT3Store((s) => s.launchApp);
  const forceStopApp = useT3Store((s) => s.dispatchAction);

  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [refreshing, setRefreshing] = React.useState(false);
  const [selected, setSelected] = React.useState<InstalledAppInfo | null>(null);

  const filtered = React.useMemo(() => {
    let list = apps;
    if (filter === "SYSTEM") list = list.filter((a) => a.isSystemApp);
    else if (filter === "USER") list = list.filter((a) => !a.isSystemApp);
    else if (filter === "LAUNCHABLE") list = list.filter((a) => a.isLaunchable);
    else if (filter === "FAVORITES")
      list = list.filter((a) => favorites.includes(a.packageName));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.appName.toLowerCase().includes(q) ||
          a.packageName.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (a.isLaunchable !== b.isLaunchable) return a.isLaunchable ? -1 : 1;
      if (a.isSystemApp !== b.isSystemApp) return a.isSystemApp ? 1 : -1;
      return a.appName.localeCompare(b.appName);
    });
  }, [apps, filter, search, favorites]);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <div className="space-y-3">
      {/* search + actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full flex-1" style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)" }}>
          <Search size={15} style={{ color: "var(--earth-secondary-text)" }} />
          <input
            value={search}
            onChange={(e) => updateAppSearchQuery(e.target.value)}
            placeholder="Search apps"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--earth-deep-espresso)" }}
          />
        </div>
        <button
          onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
          aria-label="Toggle view"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full"
          style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
        >
          {view === "grid" ? <List size={16} /> : <Grid3x3 size={16} />}
        </button>
        <button
          onClick={refresh}
          aria-label="Refresh"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full"
          style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* filters */}
      <div className="flex gap-2 overflow-x-auto t3-scroll -mx-1 px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setAppFilter(f)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform capitalize"
            style={{
              background: filter === f ? "var(--earth-terracotta)" : "var(--glass-surface-card)",
              color: filter === f ? "var(--bento-deep-purple)" : "var(--earth-deep-espresso)",
              border: "1px solid var(--glass-border)",
            }}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {refreshing ? (
        <EmptyState icon={<RefreshCw size={22} className="animate-spin" />} title="Scanning installed applications…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No applications found" description="Try a different filter or search query." />
      ) : view === "grid" ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filtered.map((app) => (
            <AppGridItem
              key={app.packageName}
              app={app}
              isFavorite={favorites.includes(app.packageName)}
              onLaunch={() => launchApp(app.packageName)}
              onToggleFav={() => toggleFavoriteApp(app.packageName)}
              onInfo={() => setSelected(app)}
            />
          ))}
        </div>
      ) : (
        <SudoCard className="overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto t3-scroll divide-y" style={{ borderColor: "var(--glass-border)" }}>
            {filtered.map((app) => (
              <AppListItem
                key={app.packageName}
                app={app}
                isFavorite={favorites.includes(app.packageName)}
                onLaunch={() => launchApp(app.packageName)}
                onToggleFav={() => toggleFavoriteApp(app.packageName)}
                onInfo={() => setSelected(app)}
              />
            ))}
          </div>
        </SudoCard>
      )}

      {/* detail sheet */}
      <AnimatePresence>
        {selected && (
          <AppDetailSheet
            app={selected}
            isFavorite={favorites.includes(selected.packageName)}
            onClose={() => setSelected(null)}
            onLaunch={() => launchApp(selected.packageName)}
            onToggleFav={() => toggleFavoriteApp(selected.packageName)}
            onForceStop={() => {
              forceStopApp({ type: "FORCE_STOP_APP", packageName: selected.packageName });
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AppIcon({ app, size = 48 }: { app: InstalledAppInfo; size?: number }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${app.iconGradient[0]}, ${app.iconGradient[1]})`,
      }}
    >
      {app.appName.charAt(0)}
    </div>
  );
}

function AppGridItem({ app, isFavorite, onLaunch, onToggleFav, onInfo }: {
  app: InstalledAppInfo; isFavorite: boolean; onLaunch: () => void; onToggleFav: () => void; onInfo: () => void;
}) {
  return (
    <div className="relative">
      <button onClick={onLaunch} className="w-full">
        <SudoCard className="p-3 flex flex-col items-center gap-1.5">
          <div className="relative">
            <AppIcon app={app} />
            {isFavorite && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}>
                <Star size={9} fill="currentColor" />
              </span>
            )}
          </div>
          <span className="text-xs font-semibold truncate w-full text-center" style={{ color: "var(--earth-deep-espresso)" }}>
            {app.appName}
          </span>
        </SudoCard>
      </button>
      <button
        onClick={onInfo}
        aria-label="Info"
        className="absolute top-2 right-2 p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity"
        style={{ background: "var(--glass-surface-variant)", color: "var(--earth-secondary-text)" }}
      >
        <Info size={11} />
      </button>
    </div>
  );
}

function AppListItem({ app, isFavorite, onLaunch, onToggleFav, onInfo }: {
  app: InstalledAppInfo; isFavorite: boolean; onLaunch: () => void; onToggleFav: () => void; onInfo: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderColor: "var(--glass-border)" }}>
      <AppIcon app={app} size={42} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--earth-deep-espresso)" }}>{app.appName}</p>
          {app.isSystemApp && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--earth-slate-blue) 14%, transparent)", color: "var(--earth-slate-blue)" }}>SYS</span>
          )}
        </div>
        <p className="t3-mono text-[10px] truncate" style={{ color: "var(--earth-secondary-text)" }}>{app.packageName}</p>
      </div>
      <button onClick={onToggleFav} aria-label="Favorite" className="p-1.5 rounded-full" style={{ color: isFavorite ? "var(--earth-terracotta)" : "var(--earth-secondary-text)" }}>
        <Star size={15} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <button onClick={onInfo} aria-label="Info" className="p-1.5 rounded-full" style={{ color: "var(--earth-secondary-text)" }}>
        <Info size={15} />
      </button>
      <button onClick={onLaunch} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-transform hover:scale-105" style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}>
        Open
      </button>
    </div>
  );
}

function AppDetailSheet({ app, isFavorite, onClose, onLaunch, onToggleFav, onForceStop }: {
  app: InstalledAppInfo; isFavorite: boolean; onClose: () => void; onLaunch: () => void; onToggleFav: () => void; onForceStop: () => void;
}) {
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
          borderTop: "1px solid var(--glass-border)",
          borderTopLeftRadius: "var(--t3-radius-sheet)",
          borderTopRightRadius: "var(--t3-radius-sheet)",
          borderBottomLeftRadius: "var(--t3-radius-sheet)",
          borderBottomRightRadius: "var(--t3-radius-sheet)",
          backdropFilter: "blur(16px) saturate(160%)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <AppIcon app={app} size={64} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate" style={{ color: "var(--earth-deep-espresso)" }}>{app.appName}</h3>
            <p className="t3-mono text-xs truncate" style={{ color: "var(--earth-secondary-text)" }}>{app.packageName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={onLaunch} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-transform hover:scale-105" style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}>
            <Rocket size={14} /> Open app
          </button>
          <button onClick={onToggleFav} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold" style={{ border: "1px solid var(--glass-border)", color: isFavorite ? "var(--earth-terracotta)" : "var(--earth-deep-espresso)" }}>
            <Star size={14} fill={isFavorite ? "currentColor" : "none"} /> {isFavorite ? "Favorited" : "Favorite"}
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold" style={{ border: "1px solid var(--glass-border)", color: "var(--earth-slate-blue)" }}>
            <Settings size={14} /> System
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold" style={{ border: "1px solid var(--glass-border)", color: "var(--earth-sage-green)" }}>
            <Store size={14} /> Play Store
          </button>
        </div>
        <SudoCard style={{ background: "var(--glass-surface-card)" }} className="p-3.5 space-y-2.5">
          <DetailRow label="Version" value={`${app.versionName} (${app.versionCode})`} />
          <DetailRow label="Type" value={app.isSystemApp ? "System app" : "User application"} />
          <DetailRow label="Target SDK" value={`API ${app.targetSdkVersion}`} />
          <DetailRow label="APK size" value={formatBytes(app.apkSize)} />
          <DetailRow label="Installed" value={new Date(app.installTimeMillis).toLocaleDateString()} />
          <DetailRow label="Updated" value={new Date(app.updateTimeMillis).toLocaleDateString()} />
        </SudoCard>
        <button
          onClick={onForceStop}
          className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold"
          style={{ border: "1px solid color-mix(in srgb, var(--cyber-alert-red) 35%, transparent)", color: "var(--cyber-alert-red)" }}
        >
          <AlertTriangle size={14} /> Force stop · needs root
        </button>
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>{label}</span>
      <span className="t3-mono text-xs font-semibold text-right" style={{ color: "var(--earth-deep-espresso)" }}>{value}</span>
    </div>
  );
}

function SystemTelemetryContent() {
  const telemetry = useT3Store((s) => s.telemetry);
  const refreshTelemetry = useT3Store((s) => s.refreshTelemetry);
  const sandboxLevel = useT3Store((s) => s.config.sandboxLevel);
  const [processes, setProcesses] = React.useState(MOCK_PROCESSES);
  const [refreshing, setRefreshing] = React.useState(false);

  const refresh = () => {
    setRefreshing(true);
    refreshTelemetry();
    setTimeout(() => {
      setProcesses([...MOCK_PROCESSES].sort(() => Math.random() - 0.5));
      setRefreshing(false);
    }, 600);
  };

  const memPct = (telemetry.usedMemBytes / telemetry.totalMemBytes) * 100;
  const storagePct = (telemetry.storageUsedBytes / telemetry.storageTotalBytes) * 100;

  const sorted = [...processes].sort((a, b) => b.rssKb - a.rssKb);

  return (
    <div className="space-y-4">
      <SectionHeader title="Hardware telemetry" subtitle={`${telemetry.manufacturer} ${telemetry.deviceModel} · Android ${telemetry.osRelease}`} />

      <SudoCard className="p-4 space-y-3">
        <UsageBar label="Memory" used={telemetry.usedMemBytes} total={telemetry.totalMemBytes} color={telemetry.lowMemory ? "var(--cyber-alert-red)" : "var(--earth-terracotta)"} formatter={formatBytes} />
        <UsageBar label="Storage" used={telemetry.storageUsedBytes} total={telemetry.storageTotalBytes} color="var(--earth-slate-blue)" formatter={formatBytes} />
      </SudoCard>

      <div className="grid grid-cols-2 gap-3">
        <MetricTile label="Battery" value={`${telemetry.batteryPercent.toFixed(0)}%`} icon={<Battery size={14} />} accent="var(--earth-sage-green)" />
        <MetricTile label="CPU cores" value={String(telemetry.cpuCores)} icon={<Cpu size={14} />} accent="var(--earth-slate-blue)" />
        <MetricTile label="Uptime" value={formatUptime(telemetry.uptimeMillis)} icon={<Clock size={14} />} accent="var(--earth-terracotta)" />
        <MetricTile label="Network" value={telemetry.network} icon={<Wifi size={14} />} accent="var(--earth-slate-blue)" />
      </div>

      <SectionHeader
        title="Active system processes"
        subtitle="Real ps -A sorted by RSS · tap to force-stop"
        trailing={
          <button onClick={refresh} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}>
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <SudoCard className="overflow-hidden">
        <div className="max-h-80 overflow-y-auto t3-scroll divide-y" style={{ borderColor: "var(--glass-border)" }}>
          {sorted.map((p) => (
            <ProcessRow
              key={p.pid}
              pid={p.pid}
              user={p.user}
              rssKb={p.rssKb}
              name={p.name}
              onForceStop={sandboxLevel === "ROOT_SUDO" ? () => useT3Store.getState().dispatchAction({ type: "FORCE_STOP_APP", packageName: p.name }) : undefined}
            />
          ))}
        </div>
      </SudoCard>
      <p className="text-[11px] text-center italic" style={{ color: "var(--earth-secondary-text)" }}>
        Android limits process visibility to this app's sandbox — this is the real, permitted view.
      </p>
    </div>
  );
}

function ProcessRow({ pid, user, rssKb, name, onForceStop }: {
  pid: number; user: string; rssKb: number; name: string; onForceStop?: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5" style={{ borderColor: "var(--glass-border)" }}>
      <div className="flex-1 min-w-0">
        <p className="t3-mono text-sm font-semibold truncate" style={{ color: "var(--earth-deep-espresso)" }}>{name}</p>
        <p className="t3-mono text-[11px]" style={{ color: "var(--earth-secondary-text)" }}>PID {pid} · {user}</p>
      </div>
      <span className="t3-mono text-xs font-semibold" style={{ color: "var(--earth-secondary-text)" }}>
        {(rssKb / 1024).toFixed(1)} MB
      </span>
      {onForceStop && (
        <button
          onClick={onForceStop}
          aria-label="Force stop"
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full transition-opacity"
          style={{ color: "var(--cyber-alert-red)" }}
        >
          <AlertTriangle size={13} />
        </button>
      )}
    </div>
  );
}
