interface ConceptItem {
  title: string;
  emoji: string;
  short: string;
  detail: string;
  bullets?: string[];
  example?: { label: string; value: string }[];
}

const concepts: ConceptItem[] = [
  {
    title: "Authorised Share Capital",
    emoji: "🪪",
    short: "The maximum capital your company is allowed to issue.",
    detail:
      "Declared in your Memorandum of Association at incorporation. Acts as a ceiling — you can issue shares up to this limit. To raise the ceiling, you pass an ordinary resolution and file Form SH-7 with the ROC, paying differential stamp duty.",
    bullets: [
      "Set during incorporation in the MOA.",
      "Pay ROC fees + stamp duty based on this amount.",
      "Increase later via SH-7 when needed for new investors or ESOP.",
    ],
    example: [
      { label: "Authorised capital", value: "₹10,00,000" },
      { label: "Face value / share", value: "₹10" },
      { label: "Max shares issuable", value: "1,00,000" },
    ],
  },
  {
    title: "Paid-up Capital",
    emoji: "💸",
    short: "Money actually received against shares issued and allotted.",
    detail:
      "Always ≤ authorised capital. Computed strictly on the face-value portion of all shares issued. Premium paid by investors above face value goes into the Securities Premium reserve — separate from paid-up.",
    bullets: [
      "Minimum paid-up capital requirement was removed in 2015.",
      "Increases each time you allot fresh shares.",
      "Only the face-value portion counts — premium is separate.",
    ],
    example: [
      { label: "Shares issued (2 founders × 5,000)", value: "10,000" },
      { label: "Face value", value: "₹10" },
      { label: "Paid-up capital", value: "₹1,00,000" },
    ],
  },
  {
    title: "Face Value vs Market Value",
    emoji: "🔍",
    short: "Face value is fixed (₹10). Market value is what investors pay.",
    detail:
      "Face value is an accounting number — typically ₹10 in India. Market value (FMV) reflects what someone is willing to pay for the shares based on traction, IP, team, and prospects. Investors usually buy at a premium = market price − face value.",
    bullets: [
      "Face value stays constant unless you do a share split.",
      "FMV needs a valuation report (Rule 11UA) for tax purposes.",
      "Premium portion sits in Securities Premium reserve.",
    ],
    example: [
      { label: "Face value", value: "₹10" },
      { label: "Issue price to angel", value: "₹4,753" },
      { label: "Premium per share", value: "₹4,743" },
    ],
  },
  {
    title: "Securities Premium",
    emoji: "📈",
    short: "The 'above face value' portion of investor money.",
    detail:
      "When an investor pays more than face value, the excess goes to a special reserve called Securities Premium. It is not part of paid-up capital, but can be used for ESOP, buybacks, bonus issues, or writing off preliminary expenses — under restrictions in Section 52 of Companies Act.",
    bullets: [
      "Restricted use under Section 52 of the Companies Act.",
      "Reflected separately on the liabilities side of the balance sheet.",
      "Not available for general distribution as dividend.",
    ],
  },
  {
    title: "Adding a Shareholder",
    emoji: "🪜",
    short: "Two paths: fresh allotment (primary) or share transfer (secondary).",
    detail:
      "Fresh allotment creates new shares — money flows into the company, existing shareholders are diluted in %. Share transfer is between two individuals — paid-up capital and total share count are unchanged; only ownership shifts.",
    bullets: [
      "Primary issuance increases the cap table size; secondary doesn't.",
      "Pricing for non-residents is governed by FEMA / FDI rules.",
      "For residents, Rule 11UA valuation guards against Sec 56(2)(viib).",
    ],
  },
  {
    title: "Increasing Authorised Capital",
    emoji: "⬆️",
    short: "Easy and routine — done when you need more headroom.",
    detail:
      "Hold an EGM, pass an ordinary resolution amending the capital clause of the MOA, file Form SH-7 with ROC within 30 days, and pay the differential ROC fees and stamp duty. Most startups bump up authorised capital right before a priced round or ESOP pool expansion.",
    bullets: [
      "Step 1: Board resolution to call EGM.",
      "Step 2: Ordinary resolution at the EGM.",
      "Step 3: File SH-7 within 30 days.",
      "Step 4: Pay differential fees + stamp duty.",
    ],
  },
];

export default function Concepts() {
  return (
    <section id="concepts" className="relative py-24 border-b border-ink-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <div className="label-chip mb-4">📚 Concepts first</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            The vocabulary your{" "}
            <span className="gradient-text">CA will use on day one</span>
          </h2>
          <p className="mt-3 text-ink-400">
            Six concepts that unlock everything else. Skim them, then jump into
            the playground.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {concepts.map((c) => (
            <article
              key={c.title}
              className="card card-hover p-6 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.emoji}</span>
                <h3 className="text-lg font-semibold text-ink-50">
                  {c.title}
                </h3>
              </div>
              <p className="mt-2 text-sm text-brand-200 font-medium">
                {c.short}
              </p>
              <p className="mt-3 text-sm text-ink-300 leading-relaxed">
                {c.detail}
              </p>

              {c.bullets && (
                <ul className="mt-4 space-y-1.5">
                  {c.bullets.map((b) => (
                    <li
                      key={b}
                      className="text-xs text-ink-400 flex items-start gap-2"
                    >
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-brand-400 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {c.example && (
                <div className="mt-4 rounded-xl border border-ink-800 bg-ink-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-2">
                    Worked example
                  </div>
                  <dl className="space-y-1.5">
                    {c.example.map((e) => (
                      <div
                        key={e.label}
                        className="flex justify-between text-xs"
                      >
                        <dt className="text-ink-400">{e.label}</dt>
                        <dd className="text-ink-100 font-mono font-medium">
                          {e.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
