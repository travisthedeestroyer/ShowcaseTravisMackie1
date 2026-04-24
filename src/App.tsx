import { motion } from "motion/react";
import { Analytics } from "@vercel/analytics/react";
import { CustomCursor } from "./components/CustomCursor";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Projects } from "./components/Projects";
import { GeminiChatOrb } from "./components/GeminiChatOrb";
import { Terminal } from "./components/Terminal";
import { Skills } from "./components/Skills";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen bg-bg overflow-hidden">

      {/* Skip to main content — visible only on keyboard focus */}
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:font-bold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Ambient Background Glows — slowly drift */}
      <motion.div
        className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none mix-blend-multiply"
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      />
      <motion.div
        className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-400/20 blur-[120px] pointer-events-none mix-blend-multiply"
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        style={{ willChange: "transform" }}
      />
      <motion.div
        className="fixed top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-emerald-300/10 blur-[100px] pointer-events-none mix-blend-multiply"
        animate={{ x: [0, 40, -10, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 10 }}
        style={{ willChange: "transform" }}
      />

      <CustomCursor />
      <Navbar />

      <main className="relative z-10 flex flex-col gap-24 sm:gap-32 pb-24 pt-12">
        <Hero />
        <About />
        <Projects />
        <GeminiChatOrb />
        <Terminal />
        <Skills />
        <Contact />
      </main>

      <Footer />

      {/* Vercel Analytics — tracks page views, no PII collected */}
      <Analytics />
    </div>
  );
}