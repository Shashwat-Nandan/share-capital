"use client";

import { useMemo, useState } from "react";
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

export default function CapTablePlayground() {
  const [state, setState] = useState<CapTableState>(defaultState());

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
      setState(defaultState());
    }
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
                />
                <InputField
                  label="Face value per share (₹)"
                  hint="Standard convention in India is ₹10."
                  value={state.config.faceValue}
                  onChange={(v) => updateConfig("faceValue", v)}
                />
                <InputField
                  label="Current FMV per share (₹)"
                  hint="Per-share market value. Used for tax warnings & infusion modelling."
                  value={state.config.currentFMV}
                  onChange={(v) => updateConfig("currentFMV", v)}
                />
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
              </p>
              <div className="space-y-3">
                {state.loans.map((l) => (
                  <LoanRow
                    key={l.id}
                    loan={l}
                    onChange={(patch) => updateLoan(l.id, patch)}
                    onRemove={() => removeLoan(l.id)}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <HeadroomBox derived={derived} />
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
}: {
  label: string;
  value: number;
  hint?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-300">{label}</label>
      <input
        type="number"
        className="input mt-1.5 font-mono"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
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
            value={shareholder.shares}
            onChange={(e) =>
              onChange({ shares: Number(e.target.value) || 0 })
            }
            className="input mt-1 !py-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-500">
            Price / share (₹)
          </label>
          <input
            type="number"
            value={shareholder.pricePerShare}
            onChange={(e) =>
              onChange({ pricePerShare: Number(e.target.value) || 0 })
            }
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
}: {
  loan: Loan;
  onChange: (patch: Partial<Loan>) => void;
  onRemove: () => void;
}) {
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
            value={loan.amount}
            onChange={(e) => onChange({ amount: Number(e.target.value) || 0 })}
            className="input mt-1 !py-1.5 font-mono text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-ink-500">
            Interest %
          </label>
          <input
            type="number"
            value={loan.interestRate ?? 0}
            onChange={(e) =>
              onChange({ interestRate: Number(e.target.value) || 0 })
            }
            className="input mt-1 !py-1.5 font-mono text-xs"
          />
        </div>
      </div>
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
  rows: Array<Shareholder & { percent: number }>;
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
}: {
  derived: ReturnType<typeof deriveCapTable>;
}) {
  const usedPct = Math.min(
    100,
    derived.authorised.maxShares > 0
      ? (derived.authorised.sharesUsed / derived.authorised.maxShares) * 100
      : 0
  );
  const overLimit = derived.authorised.overLimit;

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
