import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";

// Animated count-up hook
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  const start = () => {
    if (started) return;
    setStarted(true);
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return { count, start };
}

function StatCard({ value, suffix = "+", label, delay = 0 }: { value: number; suffix?: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const { count, start } = useCountUp(value);

  useEffect(() => {
    if (isInView) start();
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel p-8 sm:p-10 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="font-display text-6xl sm:text-7xl font-bold text-gradient mb-2 tabular-nums">
        {count}{suffix}
      </div>
      <div className="text-xs font-mono text-ink-dim uppercase tracking-widest leading-relaxed">{label}</div>
    </motion.div>
  );
}

export function About() {
  return (
    <section id="about" className="px-6 max-w-[1200px] mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

        {/* Main copy — spans 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-8 sm:p-10 md:col-span-2 flex flex-col justify-center"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-ink">
            Solo Execution. Agency Output.
          </h2>
          <p className="text-ink-dim leading-relaxed text-lg font-light">
            Based in Mt. Vernon, Ohio, I specialize in full-stack AI product development.
            I don't just build prototypes — I architect complete, production-ready platforms
            with real payments, compliance, and multi-agent orchestration.
          </p>
        </motion.div>

        {/* Stats column */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <StatCard value={15} label="Technologies Mastered" delay={0.1} />
          <StatCard value={8}  label="AI APIs Integrated"    delay={0.2} />
          <StatCard value={2}  suffix=" ✦" label="Products in Production" delay={0.3} />
        </div>

        {/* Advantage copy — spans 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-8 sm:p-10 md:col-span-2 flex flex-col justify-center"
        >
          <h3 className="font-display text-2xl font-bold mb-3 text-ink">The Advantage</h3>
          <p className="text-ink-dim leading-relaxed font-light text-lg">
            By leveraging advanced AI coding agents and modern tooling, I deliver the velocity
            and quality of an entire engineering team. No overhead, no communication silos —
            just rapid, relentless execution.
          </p>
        </motion.div>

        {/* Availability card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-8 sm:p-10 flex flex-col items-center justify-center text-center gap-4"
        >
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse" />
          <div className="font-display text-xl font-bold text-ink">Open to Work</div>
          <div className="text-xs font-mono text-ink-dim uppercase tracking-widest">
            Full-time · Contract · Consulting
          </div>
        </motion.div>
      </div>
    </section>
  );
}
