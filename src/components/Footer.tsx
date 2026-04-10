export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-6 py-8 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 bg-bg">
      <div className="font-mono text-xs text-ink-dim tracking-wider uppercase text-center sm:text-left">
        © {year} Travis Mackie — AI Engineer
      </div>
      <div className="font-mono text-xs text-ink-dim tracking-wider uppercase text-center sm:text-right">
        Based in Mt. Vernon, Ohio
      </div>
    </footer>
  );
}
