import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import { RotateCcw } from "lucide-react";

interface Line {
  type: "prompt" | "output" | "success" | "dim" | "accent" | "blank";
  text?: string;
  delay?: number;
}

const lines: Line[] = [
  { type: "prompt", text: "cd ~/projects/ai-record-label && npm run dev" },
  { type: "output", text: "  VITE v5.2.0  ready in 312ms", delay: 400 },
  { type: "success", text: "  ➜  Local:   http://localhost:3001/", delay: 200 },
  { type: "dim", text: "  ➜  Express: /api/mix proxy active", delay: 100 },
  { type: "blank", delay: 300 },
  { type: "prompt", text: 'node -e "require(\'./dist/agents/conductor\').runPipeline()"', delay: 500 },
  { type: "output", text: "[vocal-analyst]  ✓ tone: warm, energy: 0.72, genre: hip-hop/soul", delay: 600 },
  { type: "output", text: "[lyric-writer]   ✓ 16 bars generated (Gemini 2.5 Pro)", delay: 400 },
  { type: "output", text: "[beat-generator] ✓ Lyria Pro: 8 bar loop, 87bpm, minor pentatonic", delay: 500 },
  { type: "output", text: "[mix-engineer]   ✓ EQ -3dB @ 200Hz, +2dB @ 8kHz, reverb 18%", delay: 300 },
  { type: "output", text: "[mastering-qc]   ✓ LUFS: -14.2, true peak: -1.0 dBTP", delay: 600 },
  { type: "output", text: "[ffmpeg]         ✓ render complete → /output/track_001.mp3", delay: 800 },
  { type: "success", text: "[ar-reviewer]    ✓ async review queued — playback unblocked", delay: 400 },
  { type: "accent", text: "  Pipeline complete in 4.2s ✦", delay: 300 },
];

export function Terminal() {
  const [visibleLines, setVisibleLines] = useState<Line[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const abortRef = useRef(false);

  const startTyping = async () => {
    setVisibleLines([]);
    setDone(false);
    setIsTyping(true);
    abortRef.current = false;

    for (let i = 0; i < lines.length; i++) {
      if (abortRef.current) break;
      const line = lines[i];
      if (line.delay) await new Promise((r) => setTimeout(r, line.delay));
      if (abortRef.current) break;
      setVisibleLines((prev) => [...prev, line]);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    setIsTyping(false);
    setDone(true);
  };

  useEffect(() => {
    if (isInView && !isTyping && !done) startTyping();
  }, [isInView]);

  const replay = () => {
    abortRef.current = true;
    setTimeout(startTyping, 100);
  };

  return (
    <section id="terminal-section" className="px-6 max-w-[1000px] mx-auto w-full">
      <div ref={containerRef}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink mb-2">Under the Hood</h2>
            <p className="text-ink-dim font-light">Real-time execution logs from the orchestration engine.</p>
          </div>
          {done && (
            <button
              onClick={replay}
              className="font-mono text-xs tracking-wider uppercase text-ink-dim hover:text-ink transition-colors flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full border border-black/5"
            >
              <RotateCcw size={12} /> Replay
            </button>
          )}
        </div>

        <div className="glass-panel overflow-hidden shadow-2xl bg-white/80">
          {/* Title bar */}
          <div className="bg-black/5 px-4 py-3 flex items-center gap-2 border-b border-black/5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <div className="text-xs font-mono text-ink-dim ml-4">
              travis@ai-studio ~ zsh
            </div>
          </div>

          {/* Content */}
          <div
            ref={scrollRef}
            className="p-6 h-[300px] sm:h-[360px] overflow-y-auto scrollbar-hide space-y-2 text-sm sm:text-[0.9rem]"
          >
            {visibleLines.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "prompt" ? "text-ink" :
                  line.type === "output" ? "text-blue-600" :
                  line.type === "success" ? "text-green-600" :
                  line.type === "dim" ? "text-ink-dim" :
                  line.type === "accent" ? "text-blue-600 font-bold" : ""
                }
              >
                {line.type === "prompt" && (
                  <span className="text-blue-600 mr-3">❯</span>
                )}
                <span className="break-all sm:break-normal font-mono">{line.text}</span>
              </div>
            ))}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "stepEnd" }}
              className="inline-block w-2 h-[1em] bg-ink align-bottom ml-2"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
