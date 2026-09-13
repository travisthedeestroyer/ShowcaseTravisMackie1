"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, Lock, FileText, ArrowUp, FolderPlus, Search,
  Home, HardDrive, Server, MemoryStick, Trash2, Edit2, Download, X, History,
} from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { FsNode } from "@/lib/t3/types";
import { formatBytes } from "@/lib/t3/types";
import { QUICK_ROOTS } from "@/lib/t3/mock-data";
import { SudoCard, SectionHeader, EmptyState } from "../primitives";

const ROOT_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  "App files": HardDrive,
  "App storage": HardDrive,
  "Shared storage": Server,
  "System root": MemoryStick,
};

export function FileManagerScreen() {
  const fs = useT3Store((s) => s.fs);
  const createFolder = useT3Store((s) => s.createFolder);
  const deleteNode = useT3Store((s) => s.deleteNode);
  const renameNode = useT3Store((s) => s.renameNode);
  const saveFileContent = useT3Store((s) => s.saveFileContent);

  const [cwd, setCwd] = React.useState("/storage/emulated/0");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<FsNode | null>(null);
  const [editing, setEditing] = React.useState<FsNode | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [renameTarget, setRenameTarget] = React.useState<FsNode | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [showVersions, setShowVersions] = React.useState(false);

  const listing = fs[cwd] ?? [];
  const filtered = React.useMemo(() => {
    if (!search.trim()) return listing;
    const q = search.toLowerCase();
    return listing.filter((n) => n.name.toLowerCase().includes(q));
  }, [listing, search]);

  const parent = cwd.split("/").slice(0, -1).join("/") || "/";

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Files"
        subtitle="Browse the real filesystem · sandboxed to this browser session"
        trailing={
          <button
            onClick={() => setNewFolderOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
          >
            <FolderPlus size={14} /> New folder
          </button>
        }
      />

      {/* Quick roots */}
      <div className="flex gap-2 overflow-x-auto t3-scroll -mx-1 px-1 pb-1">
        {QUICK_ROOTS.map((r) => {
          const Icon = ROOT_ICON[r.label] ?? Home;
          const active = cwd === r.path;
          return (
            <button
              key={r.path}
              onClick={() => setCwd(r.path)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform hover:scale-105"
              style={{
                background: active ? "var(--earth-terracotta)" : "var(--glass-surface-card)",
                color: active ? "var(--bento-deep-purple)" : "var(--earth-deep-espresso)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <Icon size={13} /> {r.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)" }}>
        <Search size={15} style={{ color: "var(--earth-secondary-text)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter this folder"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--earth-deep-espresso)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} aria-label="Clear">
            <X size={14} style={{ color: "var(--earth-secondary-text)" }} />
          </button>
        )}
      </div>

      {/* Path bar */}
      <SudoCard className="p-3 flex items-center gap-2">
        <button
          onClick={() => setCwd(parent)}
          disabled={cwd === "/"}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full disabled:opacity-40"
          style={{ background: "var(--glass-surface-variant)", color: "var(--earth-deep-espresso)" }}
          aria-label="Up"
        >
          <ArrowUp size={15} />
        </button>
        <span className="t3-mono text-sm flex-1 truncate" style={{ color: "var(--earth-deep-espresso)" }}>
          {cwd}
        </span>
        <span className="t3-mono text-xs" style={{ color: "var(--earth-secondary-text)" }}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </SudoCard>

      {/* Listing */}
      <SudoCard className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={search ? <Search size={22} /> : <Folder size={22} />}
            title={search ? "No items match your filter" : "Nothing here"}
            description={search ? "Try a different search term." : "This folder is empty. Create a new folder to get started."}
          />
        ) : (
          <div className="max-h-[55vh] overflow-y-auto t3-scroll">
            {filtered.map((node, i) => (
              <FileRow
                key={node.path}
                node={node}
                isFirst={i === 0}
                onOpen={() => {
                  if (node.isDirectory) {
                    setCwd(node.path);
                    setSearch("");
                  } else {
                    setSelected(node);
                  }
                }}
                onRename={() => {
                  setRenameTarget(node);
                  setRenameValue(node.name);
                }}
                onDelete={() => deleteNode(node.path)}
              />
            ))}
          </div>
        )}
      </SudoCard>

      {/* New folder dialog */}
      <AnimatePresence>
        {newFolderOpen && (
          <Dialog title="Create new folder" onClose={() => setNewFolderOpen(false)}>
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  createFolder(cwd, newFolderName.trim());
                  setNewFolderName("");
                  setNewFolderOpen(false);
                }
              }}
              placeholder="folder-name"
              className="w-full px-4 py-2.5 rounded-2xl t3-mono text-sm outline-none"
              style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
            />
            <DialogActions
              onCancel={() => { setNewFolderName(""); setNewFolderOpen(false); }}
              onConfirm={() => {
                if (newFolderName.trim()) {
                  createFolder(cwd, newFolderName.trim());
                  setNewFolderName("");
                  setNewFolderOpen(false);
                }
              }}
            />
          </Dialog>
        )}
      </AnimatePresence>

      {/* Rename dialog */}
      <AnimatePresence>
        {renameTarget && (
          <Dialog title="Rename" onClose={() => setRenameTarget(null)}>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue.trim()) {
                  renameNode(renameTarget.path, renameValue.trim());
                  setRenameTarget(null);
                }
              }}
              className="w-full px-4 py-2.5 rounded-2xl t3-mono text-sm outline-none"
              style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
            />
            <DialogActions
              onCancel={() => setRenameTarget(null)}
              onConfirm={() => {
                if (renameValue.trim()) {
                  renameNode(renameTarget.path, renameValue.trim());
                  setRenameTarget(null);
                }
              }}
            />
          </Dialog>
        )}
      </AnimatePresence>

      {/* File detail / preview */}
      <AnimatePresence>
        {selected && (
          <Dialog
            title={selected.name}
            onClose={() => setSelected(null)}
            footer={
              <div className="flex flex-wrap gap-2 mt-3">
                {selected.content !== undefined && (
                  <button
                    onClick={() => {
                      setEditing(selected);
                      setEditContent(selected.content ?? "");
                      setSelected(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
                    style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                )}
                {(selected.versions?.length ?? 0) > 0 && (
                  <button
                    onClick={() => setShowVersions((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
                    style={{ border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
                  >
                    <History size={13} /> {selected.versions!.length} version{selected.versions!.length !== 1 ? "s" : ""}
                  </button>
                )}
                <button
                  onClick={() => {
                    const blob = new Blob([selected.content ?? ""], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = selected.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
                  style={{ border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
                >
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={() => {
                    deleteNode(selected.path);
                    setSelected(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
                  style={{ border: "1px solid color-mix(in srgb, var(--cyber-alert-red) 35%, transparent)", color: "var(--cyber-alert-red)" }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            }
          >
            <div className="space-y-2 text-sm">
              <MetaRow label="Path" value={selected.path} mono />
              <MetaRow label="Permissions" value={selected.permissions} mono />
              <MetaRow label="Size" value={formatBytes(selected.sizeBytes)} mono />
              <MetaRow label="Modified" value={new Date(selected.lastModified).toLocaleString()} />
            </div>
            {showVersions && (selected.versions?.length ?? 0) > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--earth-secondary-text)" }}>Version history</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto t3-scroll">
                  {selected.versions!.map((v) => (
                    <div key={v.versionId} className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: "var(--glass-surface-card)" }}>
                      <div>
                        <span className="t3-mono text-xs font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>{v.label}</span>
                        <span className="t3-mono text-xs ml-2" style={{ color: "var(--earth-secondary-text)" }}>{formatBytes(v.sizeBytes)}</span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>
                        {new Date(v.savedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selected.content !== undefined && selected.content !== "" && (
              <div
                className="mt-3 rounded-lg p-3 t3-mono text-xs leading-relaxed max-h-64 overflow-y-auto t3-scroll t3-scroll-dark whitespace-pre-wrap break-words"
                style={{
                  background: "var(--terminal-ink)",
                  color: "var(--terminal-text)",
                  border: "1px solid var(--terminal-border)",
                }}
              >
                {selected.content.slice(0, 4000)}
                {selected.content.length > 4000 && "\n…(truncated)"}
              </div>
            )}
          </Dialog>
        )}
      </AnimatePresence>

      {/* Editor */}
      <AnimatePresence>
        {editing && (
          <Dialog title={`Edit · ${editing.name}`} onClose={() => setEditing(null)} wide>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
              className="w-full px-3 py-2.5 rounded-2xl t3-mono text-xs outline-none resize-y min-h-[240px]"
              style={{ background: "var(--terminal-ink)", color: "var(--terminal-text)", border: "1px solid var(--terminal-border)" }}
            />
            <DialogActions
              onCancel={() => setEditing(null)}
              confirmLabel="Save version"
              onConfirm={() => {
                saveFileContent(editing.path, editContent);
                setEditing(null);
              }}
            />
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

function FileRow({
  node, isFirst, onOpen, onRename, onDelete,
}: {
  node: FsNode; isFirst: boolean; onOpen: () => void; onRename: () => void; onDelete: () => void;
}) {
  const Icon = !node.canRead
    ? Lock
    : node.isDirectory
    ? Folder
    : node.content !== undefined
    ? FileText
    : FileText;
  return (
    <div className="group relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[0.03]">
      {!isFirst && <div className="absolute top-0 left-4 right-4 h-px" style={{ background: "var(--glass-border)" }} />}
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left" style={{ color: "var(--earth-deep-espresso)" }}>
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{
            background: node.isDirectory
              ? "color-mix(in srgb, var(--earth-terracotta) 12%, transparent)"
              : "color-mix(in srgb, var(--earth-slate-blue) 12%, transparent)",
            color: node.isDirectory ? "var(--earth-terracotta)" : "var(--earth-slate-blue)",
          }}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--earth-deep-espresso)" }}>
            {node.name}{node.isDirectory && "/"}
          </p>
          <p className="t3-mono text-[11px] truncate" style={{ color: "var(--earth-secondary-text)" }}>
            {node.permissions} · {!node.isDirectory && formatBytes(node.sizeBytes)}
            {node.isDirectory && `${new Date(node.lastModified).toLocaleDateString()}`}
          </p>
        </div>
      </button>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onRename} aria-label="Rename" className="p-1.5 rounded-lg" style={{ color: "var(--earth-secondary-text)" }}>
          <Edit2 size={13} />
        </button>
        <button onClick={onDelete} aria-label="Delete" className="p-1.5 rounded-lg" style={{ color: "var(--cyber-alert-red)" }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-semibold w-24 shrink-0" style={{ color: "var(--earth-secondary-text)" }}>{label}</span>
      <span className={`flex-1 break-all ${mono ? "t3-mono text-xs" : "text-sm"}`} style={{ color: "var(--earth-deep-espresso)" }}>{value}</span>
    </div>
  );
}

function Dialog({ title, children, onClose, footer, wide }: { title: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(34,30,25,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} p-5`}
        style={{ background: "var(--glass-surface-light)", border: "1px solid var(--glass-border)", borderRadius: "var(--t3-radius-sheet)", backdropFilter: "blur(16px) saturate(160%)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base truncate" style={{ color: "var(--earth-deep-espresso)" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ color: "var(--earth-secondary-text)" }} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
        {footer}
      </motion.div>
    </motion.div>
  );
}

function DialogActions({ onCancel, onConfirm, confirmLabel = "Create" }: { onCancel: () => void; onConfirm: () => void; confirmLabel?: string }) {
  return (
    <div className="flex gap-2.5 mt-4">
      <button
        onClick={onCancel}
        className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold"
        style={{ border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
        style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
      >
        {confirmLabel}
      </button>
    </div>
  );
}
