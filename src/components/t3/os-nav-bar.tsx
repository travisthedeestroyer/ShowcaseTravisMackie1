"use client";

import * as React from "react";
import { Home, Activity, Terminal as TerminalIcon, Folder, Settings } from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { OsTab } from "@/lib/t3/types";
import { NAV_TABS, SETTINGS_CLUSTER } from "@/lib/t3/types";

const NAV_META: Record<OsTab, { title: string; icon: React.ComponentType<{ size?: number }> }> = {
  DASHBOARD: { title: "Home", icon: Home },
  APPS: { title: "System", icon: Activity },
  TERMINAL: { title: "Terminal", icon: TerminalIcon },
  FILES: { title: "Files", icon: Folder },
  PROFILE: { title: "Settings", icon: Settings },
  THEMES: { title: "Appearance", icon: Settings },
  SANDBOX: { title: "Security", icon: Settings },
  MODELS: { title: "AI Model", icon: Settings },
  MARKETPLACE: { title: "Capabilities", icon: Settings },
};

export function OsNavBar({ accentColor, showLabels }: { accentColor: string; showLabels: boolean }) {
  const selectedTab = useT3Store((s) => s.selectedTab);
  const selectTab = useT3Store((s) => s.selectTab);

  return (
    <nav
      aria-label="Primary"
      style={{
        background: "var(--glass-surface-light)",
        borderTop: "1px solid var(--glass-border)",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        backdropFilter: "blur(12px) saturate(140%)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      className="px-2 pt-1.5 pb-1.5 grid grid-cols-5 gap-1 z-30 shrink-0"
    >
      {NAV_TABS.map((tab) => {
        const meta = NAV_META[tab];
        const Icon = meta.icon;
        const isActive = selectedTab === tab || (tab === "PROFILE" && SETTINGS_CLUSTER.includes(selectedTab));
        return (
          <button
            key={tab}
            onClick={() => selectTab(tab)}
            aria-label={meta.title}
            aria-current={isActive ? "page" : undefined}
            className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-colors t3-focus"
            style={{
              color: isActive ? accentColor : "var(--earth-secondary-text)",
              background: isActive ? `color-mix(in srgb, ${accentColor} 14%, transparent)` : "transparent",
            }}
          >
            {isActive && <LayoutIndicator accent={accentColor} />}
            <Icon size={22} />
            {showLabels && (
              <span className="text-[11px] font-semibold leading-none">{meta.title}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function LayoutIndicator({ accent }: { accent: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        bottom: 4,
        width: 18,
        height: 3,
        borderRadius: 999,
        background: accent,
      }}
    />
  );
}
