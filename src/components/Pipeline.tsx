import { motion } from "motion/react";

interface NodeProps {
  icon: string;
  name: string;
  model: string;
  title: string;
}

function PipelineNode({ icon, name, model, title }: NodeProps) {
  return (
    <div
      className="flex-shrink-0 w-[140px] glass-panel p-5 text-center relative group hover:bg-black/[0.03] hover:scale-105 transition-all duration-200 cursor-default"
      title={title}
    >
      <span className="text-3xl mb-3 block opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">{icon}</span>
      <div className="font-display font-bold text-sm text-ink mb-1">{name}</div>
      <div className="font-mono text-[0.6rem] text-ink-dim uppercase tracking-wider">{model}</div>
    </div>
  );
}

const Arrow = () => (
  <motion.div
    animate={{ x: [0, 4, 0], opacity: [0.2, 0.5, 0.2] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    className="flex-shrink-0 w-10 flex items-center justify-center text-black/30 text-xl select-none"
  >
    →
  </motion.div>
);

const parallelNodes = [
  { icon: "✍️", name: "Lyric Writer",  model: "Gemini 2.5 Pro",   title: "Writes lyrics matching vocal style and theme" },
  { icon: "🥁", name: "Beat Generator", model: "Lyria Pro / Clip", title: "Generates beat via Lyria Pro or algorithmic fallback" },
  { icon: "🎛️", name: "Mix Engineer",  model: "Gemini 2.5 Flash", title: "Plans EQ, compression, reverb, stereo width" },
];

export function Pipeline() {
  return (
    <section id="pipeline" className="px-6 max-w-[1200px] mx-auto w-full">
      <div className="mb-12 sm:mb-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(2.5rem,6vw,4rem)] font-bold leading-none text-ink mb-4"
        >
          AGENT <span className="text-gradient">ORCHESTRATION</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-ink-dim text-lg font-light max-w-[600px] mx-auto"
        >
          A 6-agent parallel orchestration system — built solo, runs in production. Hover each node to inspect.
        </motion.p>
      </div>

      {/* Desktop: horizontal scroll */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="hidden sm:flex items-center gap-0 overflow-x-auto pb-8 scrollbar-hide"
      >
        <PipelineNode icon="🎤" name="Vocal Input"   model="MediaRecorder"    title="MediaRecorder captures user vocals as Blob" />
        <Arrow />
        <PipelineNode icon="🔬" name="Vocal Analyst" model="Gemini 2.5 Flash" title="Analyzes vocal tone, pitch, energy, genre fit" />
        <Arrow />

        <div className="flex-shrink-0 flex flex-col gap-3 relative glass-panel p-4 bg-black/[0.02]">
          <div className="font-mono text-[0.55rem] text-blue-600 tracking-[0.15em] text-center uppercase">
            Promise.all — parallel execution
          </div>
          <div className="flex flex-col gap-3">
            {parallelNodes.map((n) => (
              <PipelineNode key={n.name} icon={n.icon} name={n.name} model={n.model} title={n.title} />
            ))}
          </div>
        </div>

        <Arrow />
        <PipelineNode icon="✅" name="QC & Master"  model="Gemini 2.5 Pro"  title="Quality control and mastering chain parameters" />
        <Arrow />
        <PipelineNode icon="⚙️" name="FFmpeg Render" model="Express / Node.js" title="FFmpeg render: EQ → compress → limit → stereo" />
        <Arrow />
        <PipelineNode icon="🎧" name="A&R Review"   model="Async / Flash"   title="Async A&R review — doesn't block playback" />
      </motion.div>

      {/* Mobile: vertical flow */}
      <div className="sm:hidden flex flex-col gap-3">
        {[
          { icon: "🎤", name: "Vocal Input",   model: "MediaRecorder",    title: "Captures user vocals as Blob" },
          { icon: "🔬", name: "Vocal Analyst", model: "Gemini 2.5 Flash", title: "Analyzes tone, pitch, energy, genre" },
        ].map((node) => (
          <div key={node.name}>
            <MobilePipelineRow {...node} />
            <div className="flex justify-center text-black/20 text-lg py-2">↓</div>
          </div>
        ))}

        {/* Parallel block */}
        <div className="glass-panel p-4 bg-black/[0.02]">
          <div className="font-mono text-[0.55rem] tracking-[0.18em] text-blue-600 uppercase text-center mb-4">
            Promise.all — parallel agents
          </div>
          <div className="flex flex-col gap-3">
            {[
              { icon: "✍️", name: "Lyric Writer",  model: "Gemini 2.5 Pro" },
              { icon: "🥁", name: "Beat Gen",       model: "Lyria Pro" },
              { icon: "🎛️", name: "Mix Eng",        model: "Gemini Flash" },
            ].map((n) => (
              <MobilePipelineRow key={n.name} icon={n.icon} name={n.name} model={n.model} title="" />
            ))}
          </div>
        </div>
        <div className="flex justify-center text-black/20 text-lg py-2">↓</div>

        {[
          { icon: "✅", name: "QC & Master",   model: "Gemini 2.5 Pro",   title: "Quality control and mastering chain" },
          { icon: "⚙️", name: "FFmpeg Render", model: "Express / Node.js", title: "EQ → compress → limit → stereo" },
          { icon: "🎧", name: "A&R Review",    model: "Async / Flash",     title: "Async review — doesn't block playback" },
        ].map((node, i, arr) => (
          <div key={node.name}>
            <MobilePipelineRow {...node} />
            {i < arr.length - 1 && (
              <div className="flex justify-center text-black/20 text-lg py-2">↓</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MobilePipelineRow({ icon, name, model }: { icon: string; name: string; model: string; title: string }) {
  return (
    <div className="flex items-center gap-4 glass-panel p-4 hover:bg-black/[0.03] transition-colors">
      <span className="text-2xl flex-shrink-0 opacity-80">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-ink text-lg leading-tight">{name}</div>
        <div className="font-mono text-[0.6rem] text-ink-dim uppercase tracking-wider mt-1">{model}</div>
      </div>
    </div>
  );
}
