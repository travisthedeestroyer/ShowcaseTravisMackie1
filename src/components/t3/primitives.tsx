"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// SudoCard — canonical glass card with optional click handler
export function SudoCard({
  children,
  className,
  onClick,
  as,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: React.ElementType;
  style?: React.CSSProperties;
}) {
  const Comp = (as ?? "div") as React.ElementType;
  return (
    <Comp
      onClick={onClick}
      style={{
        background: "var(--glass-surface-light)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--t3-radius-card)",
        backdropFilter: "blur(12px) saturate(140%)",
        ...style,
      }}
      className={cn(
        "transition-[transform,box-shadow,background] duration-300 ease-out",
        onClick && "cursor-pointer hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_8px_30px_-12px_rgba(34,30,25,0.18)]",
        className
      )}
    >
      {children}
    </Comp>
  );
}

// SectionHeader — 3px terracotta accent bar + sentence-case title + subtitle
export function SectionHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div className="flex items-start gap-3 min-w-0">
        <span
          aria-hidden
          style={{
            width: 3,
            alignSelf: "stretch",
            minHeight: 28,
            borderRadius: 9999,
            background: "var(--earth-terracotta)",
          }}
        />
        <div className="min-w-0">
          <h2
            className="t3-sentence text-xl font-semibold tracking-tight truncate"
            style={{ color: "var(--earth-deep-espresso)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-sm mt-0.5 truncate"
              style={{ color: "var(--earth-secondary-text)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

// StatusPill — small pill with tinted background + colored border
export function StatusPill({
  text,
  color = "var(--earth-sage-green)",
  className,
}: {
  text: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap",
        className
      )}
      style={{
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        color: color,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: color,
        }}
      />
      {text}
    </span>
  );
}

// MetricTile — label (sans) + value (mono)
export function MetricTile({
  label,
  value,
  icon,
  accent = "var(--earth-slate-blue)",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <SudoCard style={{ background: "var(--glass-surface-card)" }} className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: `color-mix(in srgb, ${accent} 14%, transparent)`,
              color: accent,
            }}
          >
            {icon}
          </span>
        )}
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--earth-secondary-text)" }}
        >
          {label}
        </span>
      </div>
      <div
        className="t3-mono text-lg font-semibold tabular-nums"
        style={{ color: "var(--earth-deep-espresso)" }}
      >
        {value}
      </div>
    </SudoCard>
  );
}

// UsageBar — labeled progress with mono detail
export function UsageBar({
  label,
  used,
  total,
  color = "var(--earth-terracotta)",
  formatter,
}: {
  label: string;
  used: number;
  total: number;
  color?: string;
  formatter?: (n: number) => string;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const fmt = formatter ?? ((n) => `${n}`);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--earth-deep-espresso)" }}
        >
          {label}
        </span>
        <span
          className="t3-mono text-xs"
          style={{ color: "var(--earth-secondary-text)" }}
        >
          {fmt(used)} of {fmt(total)}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "color-mix(in srgb, var(--earth-deep-espresso) 8%, transparent)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// EmptyState
export function EmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-10 px-6", className)}>
      {icon && (
        <div
          className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-2xl"
          style={{
            background: "color-mix(in srgb, var(--earth-terracotta) 12%, transparent)",
            color: "var(--earth-terracotta)",
          }}
        >
          {icon}
        </div>
      )}
      <p className="text-base font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>
        {title}
      </p>
      {description && (
        <p className="text-sm mt-1 max-w-sm" style={{ color: "var(--earth-secondary-text)" }}>
          {description}
        </p>
      )}
    </div>
  );
}

// LinkRow — a SudoCard used for navigation entries in Settings
export function LinkRow({
  icon,
  title,
  subtitle,
  onClick,
  accent = "var(--earth-terracotta)",
  trailing,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  accent?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <SudoCard onClick={onClick} className="p-4 flex items-center gap-3">
      {icon && (
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{
            background: `color-mix(in srgb, ${accent} 14%, transparent)`,
            color: accent,
          }}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate" style={{ color: "var(--earth-deep-espresso)" }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-sm truncate" style={{ color: "var(--earth-secondary-text)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {trailing ?? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden style={{ color: "var(--earth-secondary-text)" }}>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </SudoCard>
  );
}
