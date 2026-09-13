"use client";

import * as React from "react";
import { Wifi, Signal, Cable, CloudOff, BatteryCharging, BatteryFull } from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import { PROVIDER_LABELS } from "@/lib/t3/types";

function modelLabel(provider: keyof typeof PROVIDER_LABELS) {
  switch (provider) {
    case "GEMMA_LOCAL": return "Gemini (cloud)";
    case "GEMINI_API": return "Gemini";
    case "OPENAI_API": return "OpenAI";
    case "ANTHROPIC_API": return "Claude";
    case "CUSTOM_REST": return "Custom model";
    default: return provider;
  }
}

export function OsTopBar() {
  const config = useT3Store((s) => s.config);
  const telemetry = useT3Store((s) => s.telemetry);
  const refreshTelemetry = useT3Store((s) => s.refreshTelemetry);
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      refreshTelemetry();
    }, 5000);
    return () => clearInterval(id);
  }, [refreshTelemetry]);

  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const isRoot = config.sandboxLevel === "ROOT_SUDO";

  const NetworkIcon =
    telemetry.network === "WIFI" ? Wifi :
    telemetry.network === "CELLULAR" ? Signal :
    telemetry.network === "ETHERNET" ? Cable : CloudOff;

  return (
    <header
      style={{
        background: "var(--glass-surface-light)",
        borderBottom: "1px solid var(--glass-border)",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: "var(--t3-radius-sheet)",
        borderBottomRightRadius: "var(--t3-radius-sheet)",
        backdropFilter: "blur(12px) saturate(140%)",
      }}
      className="px-4 py-2.5 flex items-center justify-between gap-3 z-30 shrink-0 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="t3-mono text-sm font-semibold tabular-nums" style={{ color: "var(--earth-deep-espresso)" }}>
          {time}
        </span>
        <span aria-hidden style={{ width: 4, height: 4, borderRadius: 999, background: "var(--earth-secondary-text)", opacity: 0.5 }} />
        <span className="text-xs font-semibold truncate" style={{ color: "var(--earth-secondary-text)" }}>
          T³ · {modelLabel(config.selectedProvider)}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: isRoot
              ? "color-mix(in srgb, var(--earth-terracotta) 14%, transparent)"
              : "color-mix(in srgb, var(--earth-sage-green) 14%, transparent)",
            color: isRoot ? "var(--earth-terracotta)" : "var(--earth-sage-green)",
            border: `1px solid ${isRoot
              ? "color-mix(in srgb, var(--earth-terracotta) 35%, transparent)"
              : "color-mix(in srgb, var(--earth-sage-green) 35%, transparent)"}`,
          }}
        >
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />
          {isRoot ? "Root" : "Sandbox"}
        </span>
        <NetworkIcon size={16} style={{ color: "var(--earth-secondary-text)" }} aria-label={`Network: ${telemetry.network}`} />
        <span className="t3-mono text-xs font-semibold inline-flex items-center gap-1" style={{ color: "var(--earth-deep-espresso)" }}>
          {telemetry.batteryPercent.toFixed(0)}%
          {telemetry.isCharging
            ? <BatteryCharging size={14} style={{ color: "var(--earth-sage-green)" }} />
            : <BatteryFull size={14} style={{ color: "var(--earth-secondary-text)" }} />}
        </span>
      </div>
    </header>
  );
}
