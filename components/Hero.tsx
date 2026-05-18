export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-800">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-28 sm:pb-28 text-center">
        <a
          href="#playground"
          className="label-chip mb-6 animate-fade-in hover:border-brand-500/50 hover:text-brand-200"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
          Interactive playground for Indian startup cap tables
        </a>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight animate-slide-up">
          Understand share capital <br />
          <span className="gradient-text">like a founder should</span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-ink-300 animate-slide-up">
          Authorised vs paid-up capital, valuation vs face value, founder
          infusions, ESOP pools — explained from scratch and modelled
          interactively. Tweak inputs, watch the cap table flow.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3 animate-slide-up">
          <a href="#playground" className="btn-primary">
            Open the Playground
            <ArrowRight />
          </a>
          <a href="#concepts" className="btn-ghost">
            Start with concepts
          </a>
        </div>

        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { k: "Authorised capital", v: "MOA ceiling" },
            { k: "Paid-up capital", v: "Money actually in" },
            { k: "Securities premium", v: "Above face value" },
            { k: "Founder loan", v: "No dilution" },
          ].map((s) => (
            <div key={s.k} className="card card-hover p-4 text-left">
              <div className="text-[11px] uppercase tracking-wider text-ink-400">
                {s.k}
              </div>
              <div className="mt-1 font-medium text-sm text-ink-100">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
