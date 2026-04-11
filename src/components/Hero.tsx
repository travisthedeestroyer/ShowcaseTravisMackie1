import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export function Hero() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 80) setScrolled(true); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section id="hero" className="min-h-[90vh] flex flex-col items-center justify-center relative px-6 pt-20">
      <div className="max-w-[1000px] w-full text-center relative z-10">

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-black/10 bg-white/70 backdrop-blur-md mb-8 sm:mb-10 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-[0.65rem] sm:text-xs font-mono text-ink-dim uppercase tracking-widest">
            Available for new opportunities
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3.5rem,12vw,9rem)] font-bold leading-[0.85] tracking-tighter mb-8"
        >
          <span className="text-ink">ENGINEERING</span><br />
          <span className="text-gradient">THE IMPOSSIBLE.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-ink-dim max-w-[600px] mx-auto font-light leading-relaxed mb-12"
        >
          I'm <strong className="font-semibold text-ink">Travis Mackie</strong> — a solo AI engineer building
          production-grade, multi-agent platforms that scale. From zero to shipped.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#work"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-ink text-white font-bold hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_24px_rgba(15,23,42,0.25)]"
          >
            Explore My Work
          </a>
          <a
            href="#contact"
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-black/15 bg-white/60 backdrop-blur-sm text-ink hover:bg-white/80 hover:border-black/25 transition-all font-bold"
          >
            Let's Talk
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator — hides once user scrolls */}
      <AnimatePresence>
        {!scrolled && (
          <motion.a
            href="#about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink-dim hover:text-ink transition-colors group"
            aria-label="Scroll to About"
          >
            <span className="font-mono text-[0.6rem] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={18} strokeWidth={1.5} />
            </motion.div>
          </motion.a>
        )}
      </AnimatePresence>
    </section>
  );
}
