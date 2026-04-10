import { motion } from "motion/react";

export function About() {
  return (
    <section id="about" className="px-6 max-w-[1200px] mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-8 sm:p-10 md:col-span-2 flex flex-col justify-center"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-ink">Solo Execution. Agency Output.</h2>
          <p className="text-ink-dim leading-relaxed text-lg font-light">
            Based in Mt. Vernon, Ohio, I specialize in full-stack AI product development. I don't just build prototypes; I architect complete, production-ready platforms with real payments, compliance, and multi-agent orchestration.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 sm:p-10 flex flex-col items-center justify-center text-center"
        >
          <div className="font-display text-7xl font-bold text-gradient mb-2">15+</div>
          <div className="text-xs font-mono text-ink-dim uppercase tracking-widest">Technologies Mastered</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8 sm:p-10 flex flex-col items-center justify-center text-center"
        >
          <div className="font-display text-7xl font-bold text-gradient mb-2">8+</div>
          <div className="text-xs font-mono text-ink-dim uppercase tracking-widest">AI APIs Integrated</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 sm:p-10 md:col-span-2 flex flex-col justify-center"
        >
          <h3 className="font-display text-2xl font-bold mb-3 text-ink">The Advantage</h3>
          <p className="text-ink-dim leading-relaxed font-light text-lg">
            By leveraging advanced AI coding agents and modern tooling, I deliver the velocity and quality of an entire engineering team. No overhead, no communication silos—just rapid, relentless execution.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
