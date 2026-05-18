# Cap Table Studio

An interactive playground for understanding share capital, valuations, dilution and founder infusions for an Indian private limited company.

Built with Next.js 14, TypeScript, and Tailwind CSS. Deploys to Vercel in one click.

## Features

- **Educational concepts** — authorised capital, paid-up capital, face value vs FMV, securities premium, increasing capital
- **Live cap table builder** — add/remove founders, investors, ESOP, advisors with any number of entries
- **Authorised capital headroom tracker** — visual warning when you're close to or over the MOA limit
- **Founder infusion comparator** — side-by-side comparison of the 4 routes (equity at face / FMV / proportional FMV / director's loan) with Section 56 exposure flagged
- **CSV / JSON export** — download your cap table
- **All-client-side** — no backend, no database, no analytics

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Deploy to Vercel

The fastest path:

1. Push this folder to a GitHub repository.
2. Go to <https://vercel.com/new> and import the repo.
3. Vercel auto-detects Next.js — click **Deploy**.

Or use the Vercel CLI:

```bash
npm install -g vercel
vercel
```

That's it. No environment variables, no database — it's a pure static-ish app.

## Project structure

```
.
├── app/
│   ├── layout.tsx        # Root layout, fonts, metadata
│   ├── page.tsx          # Composition root
│   └── globals.css       # Tailwind + custom components
├── components/
│   ├── Nav.tsx
│   ├── Hero.tsx
│   ├── Concepts.tsx
│   ├── CapTablePlayground.tsx   # Main interactive sandbox
│   ├── InfusionComparator.tsx   # 4-route comparison
│   └── Footer.tsx
├── lib/
│   ├── types.ts          # Domain types (Shareholder, Loan, ...)
│   ├── calc.ts           # Pure derivation logic (deriveCapTable, computeInfusion)
│   └── format.ts         # ₹ / Indian-grouping helpers
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Customise

- **Colors / palette** — `tailwind.config.ts` (brand + ink scales)
- **Concept copy** — `components/Concepts.tsx` (edit the `concepts` array)
- **Default cap table** — `components/CapTablePlayground.tsx`, `defaultState()`
- **Compliance footnotes** — `components/InfusionComparator.tsx`, bottom card

## Disclaimer

Educational only. Not legal, tax, or financial advice. Consult a CA/CS before any real cap-table actions.

## License

MIT — do whatever you want with it.
