import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Eye, Zap, BookOpen, Heart, Sparkles, X, Key, ChevronDown, AlertCircle, Copy, Check } from "lucide-react";
import { GoogleGenAI, FileState } from "@google/genai";

// ── Agent definitions ─────────────────────────────────────────────────────────
const AGENTS = [
  {
    id:     "visual",
    name:   "Visual Semantics",
    role:   "Objects · Composition · Color · Space",
    icon:   Eye,
    color:  "#38bdf8",
    glow:   "rgba(56,189,248,0.35)",
    border: "rgba(56,189,248,0.5)",
    prompt: `You are a precision visual analyst AI agent. Examine every frame of this video and report:
• Every object, person, animal, or element visible
• Scene composition, framing, and camera work
• Color palette, lighting style, and visual mood
• On-screen text, graphics, logos, or UI elements
• Scene changes and visual transitions
Be exhaustive. Use bullet points per scene.`,
  },
  {
    id:     "temporal",
    name:   "Temporal Flow",
    role:   "Timeline · Pacing · Sequence",
    icon:   Zap,
    color:  "#fbbf24",
    glow:   "rgba(251,191,36,0.35)",
    border: "rgba(251,191,36,0.5)",
    prompt: `You are a temporal analysis AI agent. Map this video's timeline precisely:
• Chronological breakdown of events with approximate timestamps
• Pacing and rhythm — fast cuts vs. slow scenes
• How the content evolves from opening to close
• Key moments and turning points
• Duration and weight of each segment
Format as a timeline.`,
  },
  {
    id:     "narrative",
    name:   "Narrative Core",
    role:   "Story · Message · Subtext",
    icon:   BookOpen,
    color:  "#a78bfa",
    glow:   "rgba(167,139,250,0.35)",
    border: "rgba(167,139,250,0.5)",
    prompt: `You are a narrative intelligence AI agent. Extract the story from this video:
• Core message or story being communicated
• Characters or subjects and their arcs
• Thematic elements and symbolism
• Intended audience and purpose
• What is implied vs. what is shown
• How effectively the narrative lands
Write analytically like a film critic.`,
  },
  {
    id:     "emotional",
    name:   "Emotional Depth",
    role:   "Mood · Tone · Resonance",
    icon:   Heart,
    color:  "#f472b6",
    glow:   "rgba(244,114,182,0.35)",
    border: "rgba(244,114,182,0.5)",
    prompt: `You are an emotional resonance AI agent. Map the emotional landscape of this video:
• Overall emotional tone and mood
• Emotional arc — how feelings shift throughout
• Sound, music, and pacing's emotional role
• Production choices that amplify impact
• What feelings this is engineered to evoke
• Visceral vs. intellectual emotional appeal
Provide a nuanced emotional map.`,
  },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentId = typeof AGENTS[number]["id"];
type AgentStatus = "idle" | "processing" | "complete" | "error";

interface AgentResult {
  id:     AgentId;
  status: AgentStatus;
  text:   string;
}

type GlobalStatus = "idle" | "uploading" | "analyzing" | "synthesizing" | "complete";

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusDot({ status, color }: { status: AgentStatus; color: string }) {
  if (status === "idle")       return <span className="w-2 h-2 rounded-full bg-white/20" />;
  if (status === "complete")   return <span className="w-2 h-2 rounded-full" style={{ background: color }} />;
  if (status === "error")      return <span className="w-2 h-2 rounded-full bg-red-400" />;
  return (
    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
  );
}

function ProcessingBars({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {[0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9].map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: color }}
          animate={{ scaleY: [h, h * 0.3 + 0.1, h] }}
          transition={{ duration: 0.6 + i * 0.08, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function VideoIntelligence() {
  // API key — use baked-in env var if set, otherwise blank
  const envKey = typeof process !== "undefined" ? (process.env?.GEMINI_API_KEY ?? "") : "";
  const [apiKey,      setApiKey]      = useState(envKey);
  const [keyOpen,     setKeyOpen]     = useState(!envKey);
  const [videoFile,   setVideoFile]   = useState<File | null>(null);
  const [videoUrl,    setVideoUrl]    = useState<string>("");
  const [isDragging,  setIsDragging]  = useState(false);
  const [globalStatus, setGlobalStatus] = useState<GlobalStatus>("idle");
  const [uploadPct,   setUploadPct]   = useState(0);
  const [error,       setError]       = useState<string | null>(null);
  const [results,     setResults]     = useState<AgentResult[]>(
    AGENTS.map((a) => ({ id: a.id, status: "idle", text: "" }))
  );
  const [synthesis,       setSynthesis]       = useState("");
  const [synthesisStatus, setSynthesisStatus] = useState<AgentStatus>("idle");

  const [copiedId, setCopiedId] = useState<AgentId | null>(null);
  const [copiedSynthesis, setCopiedSynthesis] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef     = useRef(false);

  const updateResult = useCallback((id: AgentId, patch: Partial<AgentResult>) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("video/"));
    if (file) loadVideo(file);
  };

  const copyToClipboard = async (text: string, id: AgentId | "synthesis") => {
    try {
      await navigator.clipboard.writeText(text);
      if (id === "synthesis") {
        setCopiedSynthesis(true);
        setTimeout(() => setCopiedSynthesis(false), 2000);
      } else {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch { /* ignore */ }
  };

  const loadVideo = (file: File) => {
    const MAX_MB = 500;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(0)} MB). Max ${MAX_MB} MB.`);
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setResults(AGENTS.map((a) => ({ id: a.id, status: "idle", text: "" })));
    setSynthesis("");
    setSynthesisStatus("idle");
    setGlobalStatus("idle");
    setError(null);
  };

  // ── Core analysis flow ────────────────────────────────────────────────────
  const runAgent = async (
    ai: GoogleGenAI,
    agent: typeof AGENTS[number],
    fileUri: string,
    mimeType: string
  ): Promise<string> => {
    updateResult(agent.id, { status: "processing", text: "" });
    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
        contents: [{
          parts: [
            { fileData: { mimeType, fileUri } },
            { text: agent.prompt },
          ],
        }],
      });

      let acc = "";
      for await (const chunk of stream) {
        if (abortRef.current) break;
        acc += chunk.text ?? "";
        updateResult(agent.id, { text: acc });
      }
      updateResult(agent.id, { status: "complete", text: acc });
      return acc;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      updateResult(agent.id, { status: "error", text: `⚠ ${msg}` });
      return "";
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile || !apiKey.trim()) return;
    abortRef.current = false;
    setError(null);
    setResults(AGENTS.map((a) => ({ id: a.id, status: "idle", text: "" })));
    setSynthesis("");
    setSynthesisStatus("idle");

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    try {
      // ── 1. Upload ──────────────────────────────────────────────────────────
      setGlobalStatus("uploading");
      setUploadPct(0);
      // Fake progress while uploading (real upload has no progress events)
      const prog = setInterval(() => setUploadPct((p) => Math.min(p + 8, 88)), 350);

      const uploaded = await ai.files.upload({
        file:   videoFile,
        config: { mimeType: videoFile.type || "video/mp4", displayName: videoFile.name },
      });
      clearInterval(prog);
      setUploadPct(100);

      // ── 2. Poll until ACTIVE ───────────────────────────────────────────────
      let fileInfo = uploaded;
      let attempts = 0;
      while (fileInfo.state === FileState.PROCESSING && attempts < 40) {
        await new Promise((r) => setTimeout(r, 2500));
        fileInfo = await ai.files.get({ name: fileInfo.name! });
        attempts++;
      }

      if (fileInfo.state !== FileState.ACTIVE) {
        throw new Error("Video processing timed out. Try a shorter clip (under 2 min).");
      }

      const fileUri  = fileInfo.uri!;
      const mimeType = fileInfo.mimeType ?? videoFile.type;

      // ── 3. Run all 4 agents in parallel ───────────────────────────────────
      setGlobalStatus("analyzing");
      const agentOutputs = await Promise.all(
        AGENTS.map((agent) => runAgent(ai, agent, fileUri, mimeType))
      );

      if (abortRef.current) return;

      // ── 4. Synthesis ───────────────────────────────────────────────────────
      setGlobalStatus("synthesizing");
      setSynthesisStatus("processing");

      const synthPrompt = `You are a master synthesis AI agent. Four specialist agents have each analyzed the same video from different angles. Weave their findings into one definitive, flowing description — vivid, precise, and complete. Read each report, then synthesize:

---VISUAL SEMANTICS---
${agentOutputs[0]}

---TEMPORAL FLOW---
${agentOutputs[1]}

---NARRATIVE CORE---
${agentOutputs[2]}

---EMOTIONAL DEPTH---
${agentOutputs[3]}

Write the unified description now. Make it read as a single authoritative document, not a list. Cover everything.`;

      const synthStream = await ai.models.generateContentStream({
        model:    "gemini-2.0-flash",
        contents: [{ parts: [{ text: synthPrompt }] }],
      });

      let synthText = "";
      for await (const chunk of synthStream) {
        if (abortRef.current) break;
        synthText += chunk.text ?? "";
        setSynthesis(synthText);
      }

      setSynthesisStatus("complete");
      setGlobalStatus("complete");

      // Clean up uploaded file (non-blocking)
      ai.files.delete({ name: fileInfo.name! }).catch(() => {});

    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      setGlobalStatus("idle");
      setUploadPct(0);
    }
  };

  const handleReset = () => {
    abortRef.current = true;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl("");
    setResults(AGENTS.map((a) => ({ id: a.id, status: "idle", text: "" })));
    setSynthesis("");
    setSynthesisStatus("idle");
    setGlobalStatus("idle");
    setError(null);
    setUploadPct(0);
  };

  const isRunning   = globalStatus === "uploading" || globalStatus === "analyzing" || globalStatus === "synthesizing";
  const canAnalyze  = !!videoFile && !!apiKey.trim() && !isRunning;
  const agentActive = globalStatus === "analyzing" || globalStatus === "synthesizing" || globalStatus === "complete";

  return (
    <section id="work" className="px-0 sm:px-6 max-w-[1200px] mx-auto w-full">

      {/* Section header */}
      <div className="mb-12 sm:mb-16 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-mono text-[0.6rem] text-blue-300 uppercase tracking-widest">Live AI Demo · Gemini 2.0 Flash</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(2.5rem,6vw,4rem)] font-bold leading-none text-ink mb-4"
        >
          VIDEO <span className="text-gradient">INTELLIGENCE</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-ink-dim text-lg font-light max-w-[600px] mx-auto"
        >
          Upload any video. Four specialized Gemini agents analyze it in parallel — then synthesize a unified intelligence report.
        </motion.p>
      </div>

      {/* Main dark panel */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl overflow-hidden border border-white/[0.07] shadow-2xl mx-0 sm:mx-0"
        style={{ background: "linear-gradient(160deg, #080812 0%, #0c0c1a 50%, #0a0a14 100%)" }}
      >
        {/* Inner grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-3xl overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative p-6 sm:p-8 lg:p-10">

          {/* API Key drawer */}
          <div className="mb-6">
            <button
              onClick={() => setKeyOpen((o) => !o)}
              className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
            >
              <Key size={11} />
              {keyOpen ? "Hide" : "Set"} Gemini API Key
              <motion.span animate={{ rotate: keyOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={11} />
              </motion.span>
            </button>
            <AnimatePresence>
              {keyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{   height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 flex gap-3">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIza..."
                      className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 transition-colors"
                    />
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
                    >
                      Get free key ↗
                    </a>
                  </div>
                  <p className="mt-2 text-[0.6rem] font-mono text-white/25 uppercase tracking-widest">
                    Key is never stored · runs in your browser only
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{   opacity: 0, y: -8 }}
                className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3"
              >
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 font-mono">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-300 transition-colors"><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

            {/* ── Left column: upload + controls ── */}
            <div className="flex flex-col gap-4">

              {/* Upload zone */}
              {!videoFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 aspect-video"
                  style={{
                    borderColor: isDragging ? "rgba(56,189,248,0.6)" : "rgba(255,255,255,0.1)",
                    background:  isDragging ? "rgba(56,189,248,0.06)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Animated corner brackets */}
                  {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
                    <motion.div
                      key={i}
                      className={`absolute ${pos} w-5 h-5 border-white/30`}
                      style={{
                        borderTopWidth:    i < 2 ? 1 : 0,
                        borderBottomWidth: i >= 2 ? 1 : 0,
                        borderLeftWidth:   i % 2 === 0 ? 1 : 0,
                        borderRightWidth:  i % 2 !== 0 ? 1 : 0,
                      }}
                      animate={{ opacity: isDragging ? [0.3, 1, 0.3] : 0.3 }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}

                  <motion.div
                    animate={isDragging ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}
                  >
                    <Upload size={24} className="text-sky-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/70">Drop video here</p>
                    <p className="text-xs text-white/30 mt-1">or click to browse · MP4, MOV, WebM · max 500 MB</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) loadVideo(f); }}
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black group">
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  {/* File info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                    <p className="font-mono text-[0.6rem] text-white/60 truncate">{videoFile.name}</p>
                    <p className="font-mono text-[0.55rem] text-white/30">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
              )}

              {/* Upload progress */}
              <AnimatePresence>
                {globalStatus === "uploading" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{   opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">Uploading to Gemini Files API</span>
                      <span className="font-mono text-[0.6rem] text-sky-400">{uploadPct}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #38bdf8, #818cf8)" }}
                        animate={{ width: `${uploadPct}%` }}
                        transition={{ duration: 0.3, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Deploy button */}
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="relative w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 overflow-hidden group/btn"
                style={{
                  background:  canAnalyze ? "linear-gradient(135deg, #1d4ed8, #7c3aed)" : "rgba(255,255,255,0.05)",
                  color:       canAnalyze ? "white" : "rgba(255,255,255,0.2)",
                  cursor:      canAnalyze ? "pointer" : "not-allowed",
                  boxShadow:   canAnalyze ? "0 0 40px rgba(99,102,241,0.3)" : "none",
                }}
              >
                {/* Shimmer on hover */}
                {canAnalyze && (
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent 60%)" }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isRunning ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        ◈
                      </motion.span>
                      {globalStatus === "uploading"    && "Uploading video…"}
                      {globalStatus === "analyzing"    && "Agents analyzing…"}
                      {globalStatus === "synthesizing" && "Synthesizing…"}
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Deploy Agent Crew
                    </>
                  )}
                </span>
              </button>

              {/* Cancel button */}
              <AnimatePresence>
                {isRunning && (
                  <motion.button
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      abortRef.current = true;
                      setGlobalStatus("idle");
                      setResults(AGENTS.map((a) => ({ id: a.id, status: "idle", text: "" })));
                      setSynthesis("");
                      setSynthesisStatus("idle");
                      setUploadPct(0);
                    }}
                    className="w-full py-2 rounded-xl border border-red-500/20 hover:border-red-500/40 text-red-400/60 hover:text-red-400 text-xs font-mono uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Status legend */}
              {agentActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-5 py-2"
                >
                  {(["idle", "processing", "complete"] as AgentStatus[]).map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <StatusDot status={s} color="#38bdf8" />
                      <span className="font-mono text-[0.55rem] text-white/30 uppercase tracking-wider">{s}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* ── Right column: agent cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AGENTS.map((agent, i) => {
                const result = results.find((r) => r.id === agent.id)!;
                const Icon   = agent.icon;
                const active = result.status === "processing";
                const done   = result.status === "complete";
                const err    = result.status === "error";

                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.5 }}
                    className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500"
                    style={{
                      background:   active ? `linear-gradient(160deg, ${agent.color}10, rgba(255,255,255,0.02))` : "rgba(255,255,255,0.02)",
                      border:       `1px solid ${active ? agent.border : done ? `${agent.color}40` : "rgba(255,255,255,0.06)"}`,
                      boxShadow:    active ? `0 0 30px ${agent.glow}` : done ? `0 0 12px ${agent.glow.replace("0.35", "0.12")}` : "none",
                    }}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                        style={{
                          background: active ? `${agent.color}25` : done ? `${agent.color}15` : "rgba(255,255,255,0.05)",
                          border:     `1px solid ${active ? agent.border : "rgba(255,255,255,0.06)"}`,
                        }}
                      >
                        <Icon size={15} style={{ color: active || done ? agent.color : "rgba(255,255,255,0.3)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-display font-bold text-sm leading-tight transition-colors duration-300"
                          style={{ color: active || done ? agent.color : "rgba(255,255,255,0.5)" }}
                        >
                          {agent.name}
                        </div>
                        <div className="font-mono text-[0.5rem] text-white/25 uppercase tracking-wider leading-tight mt-0.5">
                          {agent.role}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {active && <ProcessingBars color={agent.color} />}
                        {done && (
                          <button
                            onClick={() => copyToClipboard(result.text, agent.id)}
                            className="text-white/20 hover:text-white/60 transition-colors"
                            title="Copy result"
                          >
                            {copiedId === agent.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        )}
                        <StatusDot status={result.status} color={agent.color} />
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex-1 px-4 py-3 min-h-[120px] max-h-[220px] overflow-y-auto scrollbar-hide">
                      {result.status === "idle" ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="font-mono text-[0.6rem] text-white/15 uppercase tracking-widest">Awaiting deployment</p>
                        </div>
                      ) : (
                        <div className="font-mono text-[0.65rem] leading-relaxed whitespace-pre-wrap break-words" style={{ color: "rgba(255,255,255,0.65)" }}>
                          {result.text}
                          {active && (
                            <span
                              className="terminal-cursor inline-block w-1.5 h-[0.75em] align-bottom ml-0.5"
                              style={{ background: agent.color }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── Synthesis panel ── */}
          <AnimatePresence>
            {(synthesisStatus === "processing" || synthesisStatus === "complete") && (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{   opacity: 0, y: 24, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 rounded-2xl overflow-hidden border border-violet-500/30"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))", boxShadow: "0 0 50px rgba(139,92,246,0.12)" }}
              >
                {/* Synthesis header */}
                <div
                  className="flex items-center gap-3 px-6 py-4 border-b"
                  style={{ borderColor: "rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.08)" }}
                >
                  <motion.div
                    animate={synthesisStatus === "processing" ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={18} className="text-violet-400" />
                  </motion.div>
                  <div>
                    <div className="font-display font-bold text-white text-base">Master Synthesis</div>
                    <div className="font-mono text-[0.55rem] text-violet-300/60 uppercase tracking-widest">
                      {synthesisStatus === "processing" ? "Weaving agent reports…" : "Analysis complete"}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    {synthesisStatus === "complete" && (
                      <button
                        onClick={() => copyToClipboard(synthesis, "synthesis")}
                        className="text-white/30 hover:text-white/70 transition-colors"
                        title="Copy synthesis"
                      >
                        {copiedSynthesis ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    )}
                    <StatusDot status={synthesisStatus} color="#a78bfa" />
                  </div>
                </div>

                {/* Synthesis text */}
                <div className="px-6 py-5 max-h-[400px] overflow-y-auto scrollbar-hide">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/75 font-light">
                    {synthesis}
                    {synthesisStatus === "processing" && (
                      <span
                        className="terminal-cursor inline-block w-2 h-[1em] align-bottom ml-1"
                        style={{ background: "#a78bfa" }}
                      />
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </section>
  );
}
