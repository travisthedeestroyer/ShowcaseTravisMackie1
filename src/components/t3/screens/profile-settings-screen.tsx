"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PersonStanding, Palette, Sparkles, Shield, Blocks, Cpu, ChevronRight,
  KeyRound, Eye, EyeOff, Check, Bell, Cloud, Mic2, ArrowDownUp, AudioLines, ShieldCheck, Crown, User, Sun, Moon, Battery,
} from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { OsTab } from "@/lib/t3/types";
import { SudoCard, SectionHeader, LinkRow, StatusPill } from "../primitives";

const AVATARS = [
  { id: "Shield-X", icon: ShieldCheck, label: "Shield" },
  { id: "Crown", icon: Crown, label: "Crown" },
  { id: "User", icon: User, label: "User" },
  { id: "Person", icon: PersonStanding, label: "Person" },
  { id: "Cpu", icon: Cpu, label: "Cpu" },
  { id: "AudioLines", icon: AudioLines, label: "Audio" },
];

const VOICES = ["Journey", "Aurora", "Sage", "Onyx", "Molten", "Zen"];

export function ProfileSettingsScreen() {
  const config = useT3Store((s) => s.config);
  const activeTheme = useT3Store((s) => s.activeTheme);
  const selectTab = useT3Store((s) => s.selectTab);
  const updateProfile = useT3Store((s) => s.updateProfile);
  const setSpokenResponses = useT3Store((s) => s.setSpokenResponses);
  const setDarkMode = useT3Store((s) => s.setDarkMode);
  const setBatterySaver = useT3Store((s) => s.setBatterySaver);

  const [name, setName] = React.useState(config.username);
  const [avatar, setAvatar] = React.useState(config.avatarStyle);
  const [voice, setVoice] = React.useState(config.selectedVoice);
  const [notifications, setNotifications] = React.useState(config.enableNotifications);
  const [cloudSync, setCloudSync] = React.useState(config.cloudSyncEnabled);
  const [showKeys, setShowKeys] = React.useState(false);
  const [keys, setKeys] = React.useState({
    gemini: config.apiKey,
    openai: config.openAiApiKey,
    anthropic: config.anthropicApiKey,
  });
  const [keysSaved, setKeysSaved] = React.useState(false);

  const saveProfile = () => updateProfile(name, avatar, voice, notifications, cloudSync);

  return (
    <div className="space-y-5">
      <SectionHeader title="Settings" subtitle="Profile, preferences, and connected services" />

      {/* Profile card */}
      <SudoCard className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${activeTheme.primaryColor} 16%, transparent)`, color: activeTheme.primaryColor }}
          >
            {(() => {
              const Av = AVATARS.find((a) => a.id === avatar)?.icon ?? PersonStanding;
              return <Av size={26} />;
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-lg truncate" style={{ color: "var(--earth-deep-espresso)" }}>{config.username || "rootadmin"}</p>
            <p className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>{config.userRole} · Local profile</p>
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
          />
        </div>

        {/* Avatar picker (NEW — uses config.avatarStyle) */}
        <div className="mt-4">
          <label className="text-xs font-medium flex items-center gap-1.5 mb-2" style={{ color: "var(--earth-secondary-text)" }}>
            <PersonStanding size={13} /> Avatar style
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => {
              const Icon = a.icon;
              const active = avatar === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAvatar(a.id)}
                  aria-label={a.label}
                  className="aspect-square rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: active ? `color-mix(in srgb, ${activeTheme.primaryColor} 16%, transparent)` : "var(--glass-surface-card)",
                    border: `1.5px solid ${active ? activeTheme.primaryColor : "var(--glass-border)"}`,
                    color: active ? activeTheme.primaryColor : "var(--earth-secondary-text)",
                  }}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice picker (NEW — uses config.selectedVoice) */}
        <div className="mt-4">
          <label className="text-xs font-medium flex items-center gap-1.5 mb-2" style={{ color: "var(--earth-secondary-text)" }}>
            <Mic2 size={13} /> Voice persona
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VOICES.map((v) => {
              const active = voice === v;
              return (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-transform"
                  style={{
                    background: active ? activeTheme.primaryColor : "var(--glass-surface-card)",
                    color: active ? "var(--bento-deep-purple)" : "var(--earth-deep-espresso)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications (NEW — uses config.enableNotifications) */}
        <ToggleRow
          icon={<Bell size={15} />}
          title="Notifications"
          subtitle="Status bar alerts for downloads, voice, and security"
          value={notifications}
          onToggle={() => setNotifications((n) => !n)}
        />

        {/* Cloud sync (NEW — uses config.cloudSyncEnabled) */}
        <ToggleRow
          icon={<Cloud size={15} />}
          title="Cloud sync"
          subtitle="Back up themes and preferences across devices"
          value={cloudSync}
          onToggle={() => setCloudSync((c) => !c)}
        />

        {/* Dark mode (NEW — drives .dark CSS variant on <html>) */}
        <ToggleRow
          icon={config.darkMode ? <Moon size={15} /> : <Sun size={15} />}
          title="Dark mode"
          subtitle="Recolor surfaces, text, and cards across both shells"
          value={config.darkMode}
          onToggle={() => setDarkMode(!config.darkMode)}
        />

        {/* Battery saver (NEW — dims screen with warm tint) */}
        <ToggleRow
          icon={<Battery size={15} />}
          title="Battery saver"
          subtitle="Dim the screen with a warm tint to reduce power usage"
          value={config.batterySaver}
          onToggle={() => setBatterySaver(!config.batterySaver)}
        />

        <button
          onClick={saveProfile}
          className="w-full mt-4 px-4 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-95"
          style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
        >
          Save profile
        </button>
      </SudoCard>

      {/* API key vault */}
      <SudoCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: "color-mix(in srgb, var(--earth-slate-blue) 14%, transparent)", color: "var(--earth-slate-blue)" }}>
              <KeyRound size={15} />
            </span>
            <p className="text-sm font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>API keys</p>
          </div>
          <button
            onClick={() => setShowKeys((s) => !s)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "var(--glass-surface-variant)", color: "var(--earth-secondary-text)" }}
          >
            {showKeys ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
          </button>
        </div>
        <div className="space-y-2.5">
          <KeyRow label="Google Gemini" value={keys.gemini} show={showKeys} onChange={(v) => setKeys((k) => ({ ...k, gemini: v }))} />
          <KeyRow label="OpenAI" value={keys.openai} show={showKeys} onChange={(v) => setKeys((k) => ({ ...k, openai: v }))} />
          <KeyRow label="Anthropic" value={keys.anthropic} show={showKeys} onChange={(v) => setKeys((k) => ({ ...k, anthropic: v }))} />
        </div>
        <button
          onClick={() => {
            useT3Store.getState().saveModelConfig("GEMINI_API", keys.gemini);
            useT3Store.setState((s) => ({ config: { ...s.config, openAiApiKey: keys.openai, anthropicApiKey: keys.anthropic } }));
            setKeysSaved(true);
            setTimeout(() => setKeysSaved(false), 1800);
          }}
          className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold"
          style={{ border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
        >
          {keysSaved ? <><Check size={14} /> Saved</> : "Save keys"}
        </button>
      </SudoCard>

      {/* Theme studio teaser */}
      <SudoCard onClick={() => selectTab("THEMES")} className="p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full shrink-0"
          style={{ background: `conic-gradient(from 0deg, ${activeTheme.orbColors[0]}, ${activeTheme.orbColors[1]}, ${activeTheme.orbColors[2]}, ${activeTheme.orbColors[3]}, ${activeTheme.orbColors[0]})` }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Palette size={14} style={{ color: "var(--earth-terracotta)" }} />
            <p className="font-semibold text-sm" style={{ color: "var(--earth-deep-espresso)" }}>Theme studio</p>
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--earth-secondary-text)" }}>Active: {activeTheme.name} — describe a vibe to generate a new one</p>
          <div className="flex gap-1 mt-1.5">
            {[activeTheme.primaryColor, activeTheme.secondaryColor, activeTheme.tertiaryColor].map((c, i) => (
              <span key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
            ))}
          </div>
        </div>
        <ChevronRight size={18} style={{ color: "var(--earth-secondary-text)" }} />
      </SudoCard>

      {/* More */}
      <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: "var(--earth-secondary-text)" }}>More</p>
      <div className="space-y-2.5">
        <LinkRow icon={<Cpu size={16} />} title="AI model" subtitle="On-device Gemma or cloud providers" onClick={() => selectTab("MODELS")} accent="var(--earth-terracotta)" />
        <LinkRow icon={<Palette size={16} />} title="Appearance" subtitle="Themes and Omni-UI design tokens" onClick={() => selectTab("THEMES")} accent="var(--earth-sage-green)" />
        <LinkRow icon={<Shield size={16} />} title="Security" subtitle="Sandbox mode and command risk analyzer" onClick={() => selectTab("SANDBOX")} accent="var(--earth-slate-blue)" />
        <LinkRow icon={<Blocks size={16} />} title="Capabilities" subtitle="Plugins and what T³ can do" onClick={() => selectTab("MARKETPLACE")} accent="var(--earth-terracotta)" />
      </div>

      <p className="text-center text-[11px] pt-2 pb-4" style={{ color: "var(--earth-secondary-text)" }}>
        T³ web edition · {config.selectedProvider.replace("_", " ")} · all data stored locally
      </p>
    </div>
  );
}

function ToggleRow({ icon, title, subtitle, value, onToggle }: {
  icon: React.ReactNode; title: string; subtitle: string; value: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl shrink-0" style={{ background: "color-mix(in srgb, var(--earth-slate-blue) 14%, transparent)", color: "var(--earth-slate-blue)" }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: "var(--earth-deep-espresso)" }}>{title}</p>
        <p className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>{subtitle}</p>
      </div>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={value}
        className="relative w-12 h-7 rounded-full transition-colors shrink-0"
        style={{ background: value ? "var(--earth-terracotta)" : "var(--glass-surface-variant)" }}
      >
        <motion.span
          className="absolute top-0.5 w-6 h-6 rounded-full"
          style={{ background: value ? "var(--bento-deep-purple)" : "#FFFFFF", boxShadow: "0 1px 3px rgba(34,30,25,0.2)" }}
          animate={{ left: value ? "22px" : "2px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function KeyRow({ label, value, show, onChange }: {
  label: string; value: string; show: boolean; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>{label}</label>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="not set"
        className="mt-1 w-full px-3 py-2 rounded-2xl text-sm outline-none t3-mono"
        style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
      />
    </div>
  );
}
