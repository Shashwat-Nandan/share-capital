"use client";

import { useMemo, useState } from "react";
import { CapTableState, InfusionRoute } from "@/lib/types";
import { computeInfusion } from "@/lib/calc";
import { compactINR, formatINR, formatNumber, formatPercent } from "@/lib/format";

const ROUTES: { id: InfusionRoute; label: string; subtitle: string }[] = [
  {
    id: "equity-face",
    label: "Equity at face value",
    subtitle: "Issue new shares at ₹10",
  },
  {
    id: "equity-fmv-one",
    label: "Equity at FMV (one founder)",
    subtitle: "Only one founder buys more shares at FMV",
  },
  {
    id: "equity-fmv-proportional",
    label: "Equity at FMV (proportional)",
    subtitle: "Every founder buys equally at FMV",
  },
  {
    id: "loan",
    label: "Director's loan",
    subtitle: "Cash in as a liability, no shares issued",
  },
];

const RISK_BADGE: Record<"low" | "medium" | "high", string> = {
  low: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  high: "bg-red-500/10 text-red-300 border-red-500/30",
};

const RISK_LABEL: Record<"low" | "medium" | "high", string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export default function InfusionComparator({ state }: { state: CapTableState }) {
  const founders = state.shareholders.filter((s) => s.type === "founder");
  const [amount, setAmount] = useState<number>(5_00_000);
  const [investingFounderId, setInvestingFounderId] = useState<string | null>(
    founders[0]?.id ?? null
  );

  // Keep selection valid if founders change
  const validInvestingId = useMemo(() => {
    if (investingFounderId && founders.some((f) => f.id === investingFounderId)) {
      return investingFounderId;
    }
    return founders[0]?.id ?? null;
  }, [founders, investingFounderId]);

  const results = ROUTES.map((r) =>
    computeInfusion(r.id, {
      state,
      amount,
      investingFounderId: validInvestingId,
    })
  );

  if (founders.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-ink-400">
        Add at least one founder above to use the infusion comparator.
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-2xl">
        <div className="label-chip mb-4">⚖️ Side-by-side</div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Founders pumping in <span className="gradient-text">more money</span>
        </h2>
        <p className="mt-3 text-ink-400">
          Four routes, four very different outcomes. Set the infusion amount
          and see what each route does to dilution, paid-up capital, and tax
          exposure.
        </p>
      </div>

      {/* Inputs */}
      <div className="mt-8 card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-ink-300">
              Infusion amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="input mt-1.5 font-mono"
            />
            <p className="mt-1 text-[11px] text-ink-500">
              Amount one founder puts in (proportional case: each founder
              puts in this much).
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-300">
              Investing founder (Options 1 & 2)
            </label>
            <select
              value={validInvestingId ?? ""}
              onChange={(e) => setInvestingFounderId(e.target.value || null)}
              className="input mt-1.5"
            >
              {founders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-ink-500">
              Which founder is putting in the money.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 self-end">
            <Mini
              label="Current FMV / share"
              value={formatINR(state.config.currentFMV)}
            />
            <Mini
              label="Face value"
              value={formatINR(state.config.faceValue)}
            />
          </div>
        </div>
      </div>

      {/* Comparison cards */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {results.map((r) => {
          const route = ROUTES.find((x) => x.id === r.route)!;
          return (
            <div key={r.route} className="card p-5 flex flex-col gap-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink-50 text-sm leading-tight">
                    {route.label}
                  </h3>
                  <span className={`pill border shrink-0 ${RISK_BADGE[r.riskLevel]}`}>
                    {RISK_LABEL[r.riskLevel]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-400">{route.subtitle}</p>
              </div>

              {/* Key metrics */}
              <div className="space-y-1.5 text-xs">
                <Metric
                  k="New shares"
                  v={formatNumber(Math.round(r.newSharesIssued))}
                />
                <Metric k="Cash in" v={compactINR(r.cashInToCompany)} />
                <Metric
                  k="Paid-up after"
                  v={compactINR(r.paidUpAfter)}
                />
                <Metric
                  k="Premium added"
                  v={compactINR(
                    r.premiumAfter -
                      state.shareholders.reduce(
                        (a, s) =>
                          a +
                          s.shares *
                            Math.max(0, s.pricePerShare - state.config.faceValue),
                        0
                      )
                  )}
                />
                <Metric k="Loan added" v={compactINR(r.loanAfter - state.loans.reduce((a, l) => a + l.amount, 0))} />
                {r.impliedBenefit > 0 && (
                  <Metric
                    k="Sec 56 exposure"
                    v={compactINR(r.impliedBenefit)}
                    warn
                  />
                )}
              </div>

              {/* Founder dilution view */}
              <div className="border-t border-ink-800 pt-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-ink-500">
                  Founder ownership
                </div>
                {r.founderRows.map((f) => {
                  const delta = f.percentAfter - f.percentBefore;
                  return (
                    <div key={f.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-300">{f.name}</span>
                        <span className="font-mono text-ink-100">
                          {formatPercent(f.percentAfter, 1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-fuchsia-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, f.percentAfter * 100)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-mono w-12 text-right ${
                            delta > 0.0001
                              ? "text-emerald-400"
                              : delta < -0.0001
                              ? "text-red-400"
                              : "text-ink-500"
                          }`}
                        >
                          {delta > 0 ? "+" : ""}
                          {(delta * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] italic text-ink-400 mt-auto">
                {r.verdict}
              </p>
            </div>
          );
        })}
      </div>

      {/* Compliance footer */}
      <div className="mt-8 card p-5">
        <h3 className="text-sm font-semibold text-ink-100 mb-3">
          📋 Compliance flags by route
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-ink-400">
          {[
            "Sec 56(2)(viib) — Issuing shares above FMV to residents attracts angel-tax treatment unless backed by valuation.",
            "Sec 56(2)(x) — Receiving shares for less than FMV may be taxable as income above ₹50,000 benefit.",
            "Sec 73(2) Companies Act — Director loans require a written declaration that funds are the director's own.",
            "DPT-3 — Director loans are exempt deposits; non-director shareholder loans may need DPT-3 filing.",
            "TDS u/s 194A — If interest is paid on a director's loan, TDS applies.",
            "PAS-3 — Any fresh allotment must be filed with ROC within 30 days of allotment.",
          ].map((line) => (
            <div key={line} className="flex gap-2">
              <span className="text-brand-400 shrink-0">•</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div className="text-xs font-mono text-ink-100 mt-0.5">{value}</div>
    </div>
  );
}

function Metric({
  k,
  v,
  warn,
}: {
  k: string;
  v: string;
  warn?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-ink-400">{k}</span>
      <span
        className={`font-mono ${
          warn ? "text-amber-300 font-semibold" : "text-ink-100"
        }`}
      >
        {v}
      </span>
    </div>
  );
}
