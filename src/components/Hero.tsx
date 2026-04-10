import { motion } from "motion/react";

export function Hero() {
  return (
    <section id="hero" className="min-h-[90vh] flex flex-col items-center justify-center relative px-6 pt-20">
      <div className="max-w-[1000px] w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-black/10 bg-black/5 backdrop-blur-md mb-8 sm:mb-10"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          <span className="text-[0.65rem] sm:text-xs font-mono text-ink-dim uppercase tracking-widest">Available for new opportunities</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3.5rem,12vw,9rem)] font-bold leading-[0.85] tracking-tighter mb-8"
        >
          <span className="text-ink-dim">ENGINEERING</span><br />
          <span className="text-gradient">THE IMPOSSIBLE.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-ink-dim max-w-[600px] mx-auto font-light leading-relaxed mb-12"
        >
          I'm Travis Mackie. A solo AI engineer building production-grade, multi-agent platforms that scale. From zero to shipped.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#work" className="w-full sm:w-auto px-8 py-4 rounded-full bg-ink text-white font-bold hover:scale-105 transition-transform">
            Explore My Work
          </a>
          <a href="#contact" className="w-full sm:w-auto px-8 py-4 rounded-full border border-black/20 text-ink hover:bg-black/5 transition-colors font-bold">
            Let's Talk
          </a>
        </motion.div>
      </div>
    </section>
  );
}
