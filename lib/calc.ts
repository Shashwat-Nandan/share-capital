import { CapTableState, Shareholder } from "./types";

export interface DerivedCapTable {
  rows: Array<Shareholder & { percent: number; investment: number; premium: number }>;
  totals: {
    shares: number;
    investment: number;
    paidUpCapital: number;
    securitiesPremium: number;
    loanTotal: number;
  };
  authorised: {
    capital: number;
    maxShares: number;
    sharesUsed: number;
    sharesRemaining: number;
    capitalRemaining: number;
    headroomPercent: number; // 0..1
    overLimit: boolean;
  };
  warnings: string[];
}

export function deriveCapTable(state: CapTableState): DerivedCapTable {
  const { config, shareholders, loans } = state;
  const totalShares = shareholders.reduce((a, s) => a + s.shares, 0);

  const rows = shareholders.map((s) => {
    const investment = s.shares * s.pricePerShare;
    const premium = s.shares * Math.max(0, s.pricePerShare - config.faceValue);
    const percent = totalShares > 0 ? s.shares / totalShares : 0;
    return { ...s, percent, investment, premium };
  });

  const investment = rows.reduce((a, r) => a + r.investment, 0);
  const paidUpCapital = rows.reduce((a, r) => a + r.shares * config.faceValue, 0);
  const securitiesPremium = rows.reduce((a, r) => a + r.premium, 0);
  const loanTotal = loans.reduce((a, l) => a + l.amount, 0);

  const maxShares = config.faceValue > 0 ? Math.floor(config.authorisedCapital / config.faceValue) : 0;
  const sharesRemaining = Math.max(0, maxShares - totalShares);
  const capitalRemaining = Math.max(0, config.authorisedCapital - paidUpCapital);
  const headroomPercent = maxShares > 0 ? sharesRemaining / maxShares : 0;
  const overLimit = totalShares > maxShares;

  const warnings: string[] = [];
  if (overLimit) {
    warnings.push(
      `You've issued ${totalShares.toLocaleString("en-IN")} shares but authorised capital only allows ${maxShares.toLocaleString("en-IN")}. File SH-7 to increase authorised capital.`
    );
  } else if (headroomPercent < 0.1 && maxShares > 0) {
    warnings.push(
      `Less than 10% headroom left under authorised capital. Plan to increase it before the next round.`
    );
  }

  // Detect possible Sec 56 issues: shares issued below face value
  const belowFace = shareholders.find((s) => s.pricePerShare < config.faceValue && s.shares > 0);
  if (belowFace) {
    warnings.push(
      `${belowFace.name} holds shares priced below face value (₹${belowFace.pricePerShare} vs face ₹${config.faceValue}). This is generally not permitted.`
    );
  }

  // Detect investor shares issued at face when company has FMV > face
  const belowFMV = shareholders.find(
    (s) =>
      s.type === "investor" &&
      s.shares > 0 &&
      config.currentFMV > config.faceValue &&
      s.pricePerShare < config.currentFMV * 0.9
  );
  if (belowFMV) {
    warnings.push(
      `${belowFMV.name} bought shares well below current FMV (₹${config.currentFMV}). Section 56(2)(x) may treat the difference as taxable income.`
    );
  }

  return {
    rows,
    totals: {
      shares: totalShares,
      investment,
      paidUpCapital,
      securitiesPremium,
      loanTotal,
    },
    authorised: {
      capital: config.authorisedCapital,
      maxShares,
      sharesUsed: totalShares,
      sharesRemaining,
      capitalRemaining,
      headroomPercent,
      overLimit,
    },
    warnings,
  };
}

export interface InfusionResult {
  route: "equity-face" | "equity-fmv-one" | "equity-fmv-proportional" | "loan";
  newSharesIssued: number;
  cashInToCompany: number;
  paidUpAfter: number;
  premiumAfter: number;
  loanAfter: number;
  founderRows: Array<{
    id: string;
    name: string;
    sharesBefore: number;
    sharesAfter: number;
    percentBefore: number;
    percentAfter: number;
  }>;
  /** Implied tax exposure under Sec 56(2)(x) if issued below FMV */
  impliedBenefit: number;
  verdict: string;
  riskLevel: "low" | "medium" | "high";
}

export interface InfusionInputs {
  state: CapTableState;
  amount: number;
  investingFounderId: string | null; // for equity-face & equity-fmv-one
}

function founderRowsBefore(state: CapTableState) {
  return state.shareholders.filter((s) => s.type === "founder");
}

export function computeInfusion(
  route: InfusionResult["route"],
  inputs: InfusionInputs
): InfusionResult {
  const { state, amount, investingFounderId } = inputs;
  const founders = founderRowsBefore(state);
  const totalSharesBefore = state.shareholders.reduce((a, s) => a + s.shares, 0);
  const faceValue = state.config.faceValue;
  const fmv = state.config.currentFMV;

  let newSharesIssued = 0;
  let cashIn = 0;
  let premiumAdded = 0;
  let loanAfter = state.loans.reduce((a, l) => a + l.amount, 0);
  let impliedBenefit = 0;

  // Founders after the infusion (additions to founder shares only)
  const founderDeltas: Record<string, number> = {};
  founders.forEach((f) => (founderDeltas[f.id] = 0));

  if (route === "equity-face") {
    const inv = investingFounderId ?? founders[0]?.id;
    const add = faceValue > 0 ? amount / faceValue : 0;
    newSharesIssued = add;
    cashIn = amount;
    premiumAdded = 0;
    if (inv && founderDeltas[inv] !== undefined) founderDeltas[inv] += add;
    impliedBenefit = add * Math.max(0, fmv - faceValue);
  } else if (route === "equity-fmv-one") {
    const inv = investingFounderId ?? founders[0]?.id;
    const add = fmv > 0 ? amount / fmv : 0;
    newSharesIssued = add;
    cashIn = amount;
    premiumAdded = add * Math.max(0, fmv - faceValue);
    if (inv && founderDeltas[inv] !== undefined) founderDeltas[inv] += add;
  } else if (route === "equity-fmv-proportional") {
    // Every founder puts in `amount` each (so total cash is amount * founders.length)
    const perFounderShares = fmv > 0 ? amount / fmv : 0;
    newSharesIssued = perFounderShares * founders.length;
    cashIn = amount * founders.length;
    premiumAdded = newSharesIssued * Math.max(0, fmv - faceValue);
    founders.forEach((f) => (founderDeltas[f.id] += perFounderShares));
  } else if (route === "loan") {
    cashIn = amount;
    loanAfter += amount;
  }

  const totalSharesAfter = totalSharesBefore + newSharesIssued;

  // Compose founder rows for display
  const founderRows = founders.map((f) => {
    const sharesAfter = f.shares + (founderDeltas[f.id] || 0);
    return {
      id: f.id,
      name: f.name,
      sharesBefore: f.shares,
      sharesAfter,
      percentBefore: totalSharesBefore > 0 ? f.shares / totalSharesBefore : 0,
      percentAfter: totalSharesAfter > 0 ? sharesAfter / totalSharesAfter : 0,
    };
  });

  // Paid-up capital after = (all current shares incl new) × face value
  const paidUpAfter = totalSharesAfter * faceValue;
  // Existing premium plus newly added premium
  const existingPremium = state.shareholders.reduce(
    (a, s) => a + s.shares * Math.max(0, s.pricePerShare - faceValue),
    0
  );
  const premiumAfter = existingPremium + premiumAdded;

  const verdicts: Record<typeof route, string> = {
    "equity-face": "Avoid — heavy dilution + tax exposure under Sec 56(2)(x).",
    "equity-fmv-one":
      "Acceptable — one founder genuinely buys more equity. Needs valuation report.",
    "equity-fmv-proportional":
      "Cleanest equity route — ownership preserved. Needs valuation report.",
    loan:
      "Default for short-term working capital. No dilution. Sec 73(2) declaration required.",
  };

  const risks: Record<typeof route, InfusionResult["riskLevel"]> = {
    "equity-face": "high",
    "equity-fmv-one": "medium",
    "equity-fmv-proportional": "medium",
    loan: "low",
  };

  return {
    route,
    newSharesIssued,
    cashInToCompany: cashIn,
    paidUpAfter,
    premiumAfter,
    loanAfter,
    founderRows,
    impliedBenefit,
    verdict: verdicts[route],
    riskLevel: risks[route],
  };
}
