"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CapTableState,
  Loan,
  Shareholder,
  ShareholderType,
} from "@/lib/types";
import { deriveCapTable } from "@/lib/calc";
import { compactINR, formatINR, formatNumber, formatPercent, shortId } from "@/lib/format";
import InfusionComparator from "./InfusionComparator";

const TYPE_COLORS: Record<ShareholderType, string> = {
  founder: "from-brand-500 to-indigo-500",
  investor: "from-fuchsia-500 to-pink-500",
  esop: "from-amber-500 to-orange-500",
  advisor: "from-emerald-500 to-teal-500",
};

const TYPE_LABEL: Record<ShareholderType, string> = {
  founder: "Founder",
  investor: "Investor",
  esop: "ESOP",
  advisor: "Advisor",
};

const TYPE_BADGE: Record<ShareholderType, string> = {
  founder: "bg-brand-500/10 text-brand-300 border-brand-500/20",
  investor: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20",
  esop: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  advisor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
};

function defaultState(): CapTableState {
  return {
    config: {
      authorisedCapital: 10_00_000,
      faceValue: 10,
      currentFMV: 100,
    },
    shareholders: [
      {
        id: shortId(),
        name: "Founder A",
        type: "founder",
        shares: 5000,
        pricePerShare: 10,
      },
      {
        id: shortId(),
        name: "Founder B",
        type: "founder",
        shares: 5000,
        pricePerShare: 10,
      },
    ],
    loans: [],
    esop: { enabled: false, percent: 0.1 },
  };
}

const STORAGE_KEY = "cap-table-state";

interface ScenarioTemplate {
  label: string;
  description: string;
  build: () => CapTableState;
}

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    label: "Clean slate",
    description: "Empty company config only",
    build: () => ({
      config: { authorisedCapital: 10_00_000, faceValue: 10, currentFMV: 10 },
      shareholders: [],
      loans: [],
      esop: { enabled: false, percent: 0.1 },
    }),
  },
  {
    label: "2 Founders (default)",
    description: "Standard 50-50 founder split",
    build: defaultState,
  },
  {
    label: "Pre-seed with Angel",
    description: "2 founders + 1 angel investor at FMV",
    build: () => ({
      config: { authorisedCapital: 10_00_000, faceValue: 10, currentFMV: 100 },
      shareholders: [
        { id: shortId(), name: "Founder A", type: "founder", shares: 5000, pricePerShare: 10 },
        { id: shortId(), name: "Founder B", type: "founder", shares: 5000, pricePerShare: 10 },
        { id: shortId(), name: "Angel Investor", type: "investor", shares: 500, pricePerShare: 100 },
      ],
      loans: [],
      esop: { enabled: false, percent: 0.1 },
    }),
  },
  {
    label: "Post-seed with ESOP",
    description: "2 founders + 1 investor + 10% ESOP pool",
    build: () => ({
      config: { authorisedCapital: 25_00_000, faceValue: 10, currentFMV: 250 },
      shareholders: [
        { id: shortId(), name: "Founder A", type: "founder", shares: 5000, pricePerShare: 10 },
        { id: shortId(), name: "Founder B", type: "founder", shares: 5000, pricePerShare: 10 },
        { id: shortId(), name: "Seed Investor", type: "investor", shares: 1000, pricePerShare: 250 },
      ],
      loans: [],
      esop: { enabled: true, percent: 0.1 },
    }),
  },
  {
    label: "3 Co-founders + Advisor",
    description: "3 equal founders + 1 advisor",
    build: () => ({
      config: { authorisedCapital: 10_00_000, faceValue: 10, currentFMV: 100 },
      shareholders: [
        { id: shortId(), name: "Co-founder A", type: "founder", shares: 3333, pricePerShare: 10 },
        { id: shortId(), name: "Co-founder B", type: "founder", shares: 3333, pricePerShare: 10 },
        { id: shortId(), name: "Co-founder C", type: "founder", shares: 3334, pricePerShare: 10 },
        { id: shortId(), name: "Advisor", type: "advisor", shares: 200, pricePerShare: 10 },
      ],
      loans: [],
      esop: { enabled: false, percent: 0.1 },
    }),
  },
];

function loadFromStorage(): CapTableState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic shape check
    if (parsed && parsed.config && Array.isArray(parsed.shareholders)) {
      // Ensure esop exists (backwards compat)
      if (!parsed.esop) parsed.esop = { enabled: false, percent: 0.1 };
      return parsed as CapTableState;
    }
    return null;
  } catch {
    return null;
  }
}

export default function CapTablePlayground() {
  const [state, setState] = useState<CapTableState>(() => loadFromStorage() || defaultState());

  // Persist state to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Silently ignore storage errors
    }
  }, [state]);

  const derived = useMemo(() => deriveCapTable(state), [state]);

  function updateConfig<K extends keyof CapTableState["config"]>(
    key: K,
    value: CapTableState["config"][K]
  ) {
    setState((s) => ({ ...s, config: { ...s.config, [key]: value } }));
  }

  function updateShareholder(id: string, patch: Partial<Shareholder>) {
    setState((s) => ({
      ...s,
      shareholders: s.shareholders.map((sh) =>
        sh.id === id ? { ...sh, ...patch } : sh
      ),
    }));
  }

  function addShareholder(type: ShareholderType) {
    const defaults: Record<ShareholderType, Partial<Shareholder>> = {
      founder: { name: "New Founder", shares: 1000, pricePerShare: state.config.faceValue },
      investor: { name: "Investor", shares: 500, pricePerShare: state.config.currentFMV },
      esop: { name: "ESOP Pool", shares: 1000, pricePerShare: state.config.faceValue },
      advisor: { name: "Advisor", shares: 100, pricePerShare: state.config.faceValue },
    };
    const sh: Shareholder = {
      id: shortId(),
      type,
      name: defaults[type].name!,
      shares: defaults[type].shares!,
      pricePerShare: defaults[type].pricePerShare!,
    };
    setState((s) => ({ ...s, shareholders: [...s.shareholders, sh] }));
  }

  function removeShareholder(id: string) {
    setState((s) => ({
      ...s,
      shareholders: s.shareholders.filter((sh) => sh.id !== id),
    }));
  }

  function addLoan() {
    const l: Loan = {
      id: shortId(),
      lender: "Founder A",
      amount: 5_00_000,
      interestRate: 0,
    };
    setState((s) => ({ ...s, loans: [...s.loans, l] }));
  }

  function updateLoan(id: string, patch: Partial<Loan>) {
    setState((s) => ({
      ...s,
      loans: s.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }

  function removeLoan(id: string) {
    setState((s) => ({ ...s, loans: s.loans.filter((l) => l.id !== id) }));
  }

  function reset() {
    if (confirm("Reset everything to the default 2-founder setup?")) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setState(defaultState());
    }
  }

  function loadScenario(template: ScenarioTemplate) {
    setState(template.build());
  }

  function convertLoanToEquity(loanId: string, atFMV: boolean) {
    setState((s) => {
      const loan = s.loans.find((l) => l.id === loanId);
      if (!loan) return s;
      const price = atFMV ? s.config.currentFMV : s.config.faceValue;
      const shares = price > 0 ? loan.amount / price : 0;
      const newShareholder: Shareholder = {
        id: shortId(),
        name: loan.lender,
        type: "founder",
        shares: Math.round(shares),
        pricePerShare: price,
        note: `Converted from loan of ${formatINR(loan.amount)}`,
      };
      return {
        ...s,
        loans: s.loans.filter((l) => l.id !== loanId),
        shareholders: [...s.shareholders, newShareholder],
      };
    });
  }

  function updateEsop(patch: Partial<CapTableState["esop"]>) {
    setState((s) => ({ ...s, esop: { ...s.esop, ...patch } }));
  }

  function quickFixAuthorisedCapital() {
    setState((s) => {
      const paidUp = s.shareholders.reduce((a, sh) => a + sh.shares * s.config.faceValue, 0);
      const doubled = paidUp * 2;
      // Round up to nearest lakh (1,00,000)
      const lakh = 1_00_000;
      const rounded = Math.ceil(doubled / lakh) * lakh;
      const newCap = Math.max(rounded, lakh); // at least 1 lakh
      return { ...s, config: { ...s.config, authorisedCapital: newCap } };
    });
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cap-table.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const rows: string[] = [
      "Shareholder,Type,Shares,Price per share (₹),Investment (₹),Premium (₹),Ownership %",
    ];
    derived.rows.forEach((r) => {
      rows.push(
        [
          `"${r.name}"`,
          r.type,
          r.shares,
          r.pricePerShare,
          r.investment,
          r.premium,
          (r.percent * 100).toFixed(2),
        ].join(",")
      );
    });
    rows.push("");
    rows.push("Summary");
    rows.push(`Authorised capital,${state.config.authorisedCapital}`);
    rows.push(`Face value,${state.config.faceValue}`);
    rows.push(`Total shares,${derived.totals.shares}`);
    rows.push(`Paid-up capital,${derived.totals.paidUpCapital}`);
    rows.push(`Securities premium,${derived.totals.securitiesPremium}`);
    rows.push(`Total loans,${derived.totals.loanTotal}`);
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cap-table.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="playground" className="relative py-24 border-b border-ink-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-2xl">
            <div className="label-chip mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live sandbox
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Build your <span className="gradient-text">cap table</span>
            </h2>
            <p className="mt-3 text-ink-400">
              Add founders, investors, and ESOP holders. Watch ownership,
              paid-up capital, and authorised-capital headroom update live.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={exportCSV}>
              <DownloadIcon />
              CSV
            </button>
            <button className="btn-ghost" onClick={exportJSON}>
              <DownloadIcon />
              JSON
            </button>
            <button className="btn-ghost" onClick={reset}>
              <ResetIcon />
              Reset
            </button>
          </div>
        </div>

        {/* Layout: 2 cols on lg */}
        <div className="mt-10 grid lg:grid-cols-5 gap-6">
          {/* Inputs column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company config */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-ink-100">
                  Company config
                </h3>
                <span className="label-chip">MOA</span>
              </div>
              <div className="space-y-4">
                <InputField
                  label="Authorised share capital (₹)"
                  hint="The MOA ceiling. Increase via SH-7."
                  value={state.config.authorisedCapital}
                  onChange={(v) => updateConfig("authorisedCapital", v)}
                  min={0}
                />
                <InputField
                  label="Face value per share (₹)"
                  hint="Standard convention in India is ₹10."
                  value={state.config.faceValue}
                  onChange={(v) => updateConfig("faceValue", v)}
                  min={1}
                />
                <InputField
                  label="Current FMV per share (₹)"
                  hint="Per-share market value. Used for tax warnings & infusion modelling."
                  value={state.config.currentFMV}
                  onChange={(v) => updateConfig("currentFMV", v)}
                  min={0}
                />
              </div>
            </div>

            {/* Scenario Templates */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-ink-100">
                  Scenario templates
                </h3>
                <span className="label-chip">Quick start</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SCENARIO_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => loadScenario(t)}
                    className="btn-ghost text-left text-xs flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium text-ink-200">{t.label}</span>
                    <span className="text-ink-500 text-[10px]">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shareholders */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-ink-100">
                  Shareholders
                </h3>
                <span className="text-xs text-ink-500">
                  {state.shareholders.length} entries
                </span>
              </div>

              <div className="space-y-3">
                {state.shareholders.map((sh) => (
                  <ShareholderRow
                    key={sh.id}
                    shareholder={sh}
                    faceValue={state.config.faceValue}
                    onChange={(patch) => updateShareholder(sh.id, patch)}
                    onRemove={() => removeShareholder(sh.id)}
                  />
                ))}
                {state.shareholders.length === 0 && (
                  <p className="text-xs text-ink-500 italic">
                    No shareholders yet. Add at least one founder to begin.
                  </p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  ["founder", "investor", "esop", "advisor"] as ShareholderType[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => addShareholder(t)}
                    className="btn-ghost text-xs"
                  >
                    + {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* ESOP Pool */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-ink-100">
                  ESOP Pool
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-ink-400">
                    {state.esop.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={() => updateEsop({ enabled: !state.esop.enabled })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      state.esop.enabled ? "bg-brand-500" : "bg-ink-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        state.esop.enabled ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>
              {state.esop.enabled && (
                <div>
                  <InputField
                    label="Pool size (% of fully diluted)"
                    hint="Standard: 10-15%. Computed as post-pool percentage."
                    value={state.esop.percent * 100}
                    onChange={(v) => updateEsop({ percent: Math.min(99, Math.max(0, v)) / 100 })}
                    min={0}
                    max={99}
                  />
                  {derived.totals.esopShares > 0 && (
                    <p className="mt-2 text-[11px] text-ink-400">
                      Pool size: <span className="text-ink-200 font-mono">{formatNumber(derived.totals.esopShares)}</span> shares
                      {" "}/ Fully diluted: <span className="text-ink-200 font-mono">{formatNumber(derived.totals.fullyDilutedShares)}</span> shares
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Loans */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-ink-100">
                  Director / shareholder loans
                </h3>
                <span className="text-xs text-ink-500">
                  {state.loans.length} entries
                </span>
              </div>
              <p className="text-xs text-ink-400 mb-3">
                Loans add cash without dilution. Sec 73(2) declaration required.
                {derived.totals.annualInterest > 0 && (
                  <span className="block mt-1 text-amber-300/80">
                    Annual interest liability: <span className="font-mono">{formatINR(derived.totals.annualInterest)}</span>
                  </span>
                )}
              </p>
              <div className="space-y-3">
                {state.loans.map((l) => (
                  <LoanRow
                    key={l.id}
                    loan={l}
                    onChange={(patch) => updateLoan(l.id, patch)}
                    onRemove={() => removeLoan(l.id)}
                    onConvert={(atFMV) => convertLoanToEquity(l.id, atFMV)}
                  />
                ))}
              </div>
              <button onClick={addLoan} className="mt-3 btn-ghost text-xs w-full">
                + Add a loan
              </button>
            </div>
          </div>

          {/* Output column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Kpi label="Total shares" value={formatNumber(derived.totals.shares)} />
              <Kpi
                label="Paid-up capital"
                value={compactINR(derived.totals.paidUpCapital)}
              />
              <Kpi
                label="Securities premium"
                value={compactINR(derived.totals.securitiesPremium)}
                accent
              />
              <Kpi
                label="Director loans"
                value={compactINR(derived.totals.loanTotal)}
              />
              <Kpi
                label="Annual interest"
                value={compactINR(derived.totals.annualInterest)}
              />
            </div>

            {/* Warnings */}
            {derived.warnings.length > 0 && (
              <div className="space-y-2">
                {derived.warnings.map((w, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200 flex items-start gap-2"
                  >
                    <WarningIcon />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stacked bar */}
            <StackedBar rows={derived.rows} />

            {/* Cap table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-ink-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-100">
                  Cap table
                </h3>
                <span className="text-xs text-ink-500">
                  Sorted by ownership %
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-ink-500 bg-ink-950/50">
                      <th className="text-left py-3 px-5 font-medium">Shareholder</th>
                      <th className="text-right py-3 px-3 font-medium">Shares</th>
                      <th className="text-right py-3 px-3 font-medium">Investment</th>
                      <th className="text-right py-3 px-5 font-medium">Ownership</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...derived.rows]
                      .sort((a, b) => b.percent - a.percent)
                      .map((r) => (
                        <tr
                          key={r.id}
                          className="border-t border-ink-800 hover:bg-ink-900/40 transition-colors"
                        >
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`pill border ${TYPE_BADGE[r.type]}`}
                              >
                                {TYPE_LABEL[r.type]}
                              </span>
                              <span className="font-medium">{r.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-3 font-mono text-ink-200">
                            {formatNumber(r.shares)}
                          </td>
                          <td className="text-right py-3 px-3 font-mono text-ink-200">
                            {formatINR(r.investment)}
                          </td>
                          <td className="text-right py-3 px-5 font-mono font-medium text-ink-50">
                            {formatPercent(r.percent, 1)}
                          </td>
                        </tr>
                      ))}
                    <tr className="border-t border-ink-800 bg-ink-950/40 font-medium">
                      <td className="py-3 px-5 text-ink-300">Total</td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatNumber(derived.totals.shares)}
                      </td>
                      <td className="text-right py-3 px-3 font-mono">
                        {formatINR(derived.totals.investment)}
                      </td>
                      <td className="text-right py-3 px-5 font-mono">100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Authorised capital headroom */}
            <HeadroomBox derived={derived} onQuickFix={quickFixAuthorisedCapital} />
          </div>
        </div>

        {/* Founder Infusion sub-section */}
        <div className="mt-16">
          <InfusionComparator state={state} />
        </div>
      </div>
    </section>
  );
}

// -- Sub-components -----------------------------------------------------------

function InputField({
  label,
  value,
  hint,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  hint?: string;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-300">{label}</label>
      <input
        type="number"
        className="input mt-1.5 font-mono"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        onChange={(e) => {
          let v = Number(e.target.value) || 0;
          if (min !== undefined && v < min) v = min;
          if (max !== undefined && v > max) v = max;
          onChange(v);
        }}
      />
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
}

function ShareholderRow({
  shareholder,
  faceValue,
  onChange,
  onRemove,
}: {
  shareholder: Shareholder;
  faceValue: number;
  onChange: (patch: Partial<Shareholder>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950/40 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={shareholder.type}
          onChange={(e) =>
            onChange({ type: e.target.value as ShareholderType })
          }
          className="input !w-auto !py-1.5 !px-2 text-xs font-medium"
        >
          {(["founder", "investor", "esop", "advisor"] as ShareholderType[]).map(
            (t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            )
          )}
        </select>
        <input
          type="text"
          value={shareholder.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="input flex-1 !py-1.5 text-sm font-medium"
          placeholder="Name"
        />
        <button onClick={onRemove} className="btn-danger" aria-label="Remove">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-500">
            Shares
          </label>
          <input
            type="number"
            min={0}
            value={shareholder.shares}
            onChange={(e) => {
              const v = Math.max(0, Number(e.target.value) || 0);
              onChange({ shares: v });
            }}
            className="input mt-1 !py-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-500">
            Price / share (₹)
          </label>
          <input
            type="number"
            min={0}
            value={shareholder.pricePerShare}
            onChange={(e) => {
              const v = Math.max(0, Number(e.target.value) || 0);
              onChange({ pricePerShare: v });
            }}
            className="input mt-1 !py-1.5 font-mono text-xs"
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-ink-500">
        <span>
          Investment:{" "}
          <span className="text-ink-300 font-mono">
            {formatINR(shareholder.shares * shareholder.pricePerShare)}
          </span>
        </span>
        {shareholder.pricePerShare > faceValue && (
          <span>
            Premium:{" "}
            <span className="text-fuchsia-300 font-mono">
              {formatINR(
                shareholder.shares * (shareholder.pricePerShare - faceValue)
              )}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

function LoanRow({
  loan,
  onChange,
  onRemove,
  onConvert,
}: {
  loan: Loan;
  onChange: (patch: Partial<Loan>) => void;
  onRemove: () => void;
  onConvert: (atFMV: boolean) => void;
}) {
  const [showConvert, setShowConvert] = useState(false);

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950/40 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={loan.lender}
          onChange={(e) => onChange({ lender: e.target.value })}
          className="input flex-1 !py-1.5 text-sm font-medium"
          placeholder="Lender name"
        />
        <button onClick={onRemove} className="btn-danger">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-500">
            Amount (₹)
          </label>
          <input
            type="number"
            min={0}
            value={loan.amount}
            onChange={(e) => {
              const v = Math.max(0, Number(e.target.value) || 0);
              onChange({ amount: v });
            }}
            className="input mt-1 !py-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-500">
            Interest %
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={loan.interestRate ?? 0}
            onChange={(e) => {
              let v = Number(e.target.value) || 0;
              v = Math.max(0, Math.min(100, v));
              onChange({ interestRate: v });
            }}
            className="input mt-1 !py-1.5 font-mono text-xs"
          />
        </div>
      </div>
      {!showConvert ? (
        <button
          onClick={() => setShowConvert(true)}
          className="btn-ghost text-[10px] w-full mt-1"
        >
          Convert to equity
        </button>
      ) : (
        <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-2 space-y-2 mt-1">
          <p className="text-[10px] text-ink-400">
            Convert this loan to equity shares. Choose the conversion price:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { onConvert(false); setShowConvert(false); }}
              className="btn-ghost text-[10px] flex-1"
            >
              At face value
            </button>
            <button
              onClick={() => { onConvert(true); setShowConvert(false); }}
              className="btn-ghost text-[10px] flex-1"
            >
              At FMV
            </button>
          </div>
          <button
            onClick={() => setShowConvert(false)}
            className="text-[10px] text-ink-500 hover:text-ink-300 w-full text-center"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`card p-4 ${accent ? "ring-1 ring-fuchsia-500/20" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-bold font-mono ${
          accent ? "gradient-text" : "text-ink-50"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function StackedBar({
  rows,
}: {
  rows: Array<Shareholder & { percent: number; virtual?: boolean }>;
}) {
  const sorted = [...rows].sort((a, b) => b.percent - a.percent);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink-100">Ownership</h3>
        <span className="text-xs text-ink-500">
          {sorted.length} shareholder{sorted.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-ink-900">
        {sorted.map((r) => (
          <div
            key={r.id}
            className={`bg-gradient-to-r ${TYPE_COLORS[r.type]}`}
            style={{ width: `${Math.max(0.5, r.percent * 100)}%` }}
            title={`${r.name}: ${(r.percent * 100).toFixed(2)}%`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {sorted.map((r) => (
          <div key={r.id} className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-full bg-gradient-to-r ${TYPE_COLORS[r.type]}`}
            />
            <span className="text-ink-300">{r.name}</span>
            <span className="text-ink-500 font-mono">
              {(r.percent * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeadroomBox({
  derived,
  onQuickFix,
}: {
  derived: ReturnType<typeof deriveCapTable>;
  onQuickFix: () => void;
}) {
  const usedPct = Math.min(
    100,
    derived.authorised.maxShares > 0
      ? (derived.authorised.sharesUsed / derived.authorised.maxShares) * 100
      : 0
  );
  const overLimit = derived.authorised.overLimit;
  const showQuickFix = overLimit || usedPct > 90;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink-100">
          Authorised capital headroom
        </h3>
        <span
          className={`pill border ${
            overLimit
              ? "bg-red-500/10 text-red-300 border-red-500/30"
              : usedPct > 90
              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
          }`}
        >
          {overLimit
            ? "Over limit"
            : usedPct > 90
            ? "Running low"
            : "Healthy"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            overLimit
              ? "bg-gradient-to-r from-red-500 to-rose-500"
              : usedPct > 90
              ? "bg-gradient-to-r from-amber-500 to-orange-500"
              : "bg-gradient-to-r from-brand-500 to-fuchsia-500"
          }`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-ink-500">Authorised</div>
          <div className="text-ink-100 font-mono">
            {compactINR(derived.authorised.capital)}
          </div>
        </div>
        <div>
          <div className="text-ink-500">Used (face value)</div>
          <div className="text-ink-100 font-mono">
            {formatNumber(derived.authorised.sharesUsed)} sh
          </div>
        </div>
        <div>
          <div className="text-ink-500">Max issuable</div>
          <div className="text-ink-100 font-mono">
            {formatNumber(derived.authorised.maxShares)} sh
          </div>
        </div>
        <div>
          <div className="text-ink-500">Headroom</div>
          <div className="text-ink-100 font-mono">
            {formatNumber(derived.authorised.sharesRemaining)} sh
          </div>
        </div>
      </div>
      {showQuickFix && (
        <button
          onClick={onQuickFix}
          className="mt-3 btn-ghost text-xs w-full border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
        >
          Quick-fix: Increase authorised capital
        </button>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9c-2.5 0-4.7 1-6.4 2.6L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
