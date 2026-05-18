export default function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-white font-bold text-sm">
            C
          </span>
          <span className="font-semibold tracking-tight">
            Cap Table Studio
          </span>
        </a>
        <div className="hidden sm:flex items-center gap-1 text-sm">
          <a href="#concepts" className="px-3 py-1.5 rounded-lg text-ink-300 hover:text-ink-100 hover:bg-ink-900 transition-colors">
            Concepts
          </a>
          <a href="#playground" className="px-3 py-1.5 rounded-lg text-ink-300 hover:text-ink-100 hover:bg-ink-900 transition-colors">
            Playground
          </a>
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noreferrer"
            className="ml-2 btn-primary !py-1.5 !text-xs"
          >
            Deploy to Vercel
          </a>
        </div>
      </div>
    </nav>
  );
}
