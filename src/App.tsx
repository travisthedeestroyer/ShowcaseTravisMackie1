import { CustomCursor } from "./components/CustomCursor";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Projects } from "./components/Projects";
import { Pipeline } from "./components/Pipeline";
import { Terminal } from "./components/Terminal";
import { Skills } from "./components/Skills";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen bg-bg overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-400/20 blur-[120px] pointer-events-none mix-blend-multiply" />
      
      <CustomCursor />
      <Navbar />
      
      <main className="relative z-10 flex flex-col gap-24 sm:gap-32 pb-24 pt-12">
        <Hero />
        <About />
        <Projects />
        <Pipeline />
        <Terminal />
        <Skills />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
