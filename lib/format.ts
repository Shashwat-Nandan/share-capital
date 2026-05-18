/**
 * Indian number formatting helpers.
 * 12,34,567 (Indian grouping) and rupee symbol.
 */

export function formatINR(value: number, opts: { decimals?: number; compact?: boolean } = {}): string {
  if (!isFinite(value)) return "—";
  const { decimals = 0, compact = false } = opts;
  if (compact) return compactINR(value);
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const fixed = abs.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  // Indian grouping: last 3 digits, then groups of 2
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const withCommas =
    rest === ""
      ? lastThree
      : rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  return `${sign}₹${withCommas}${decPart ? "." + decPart : ""}`;
}

export function compactINR(value: number): string {
  if (!isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) {
    return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (abs >= 1_00_000) {
    return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
  }
  if (abs >= 1_000) {
    return `${sign}₹${(abs / 1_000).toFixed(1)}k`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
}

export function formatNumber(value: number, decimals = 0): string {
  if (!isFinite(value)) return "—";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 2): string {
  if (!isFinite(value)) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function shortId(): string {
  return Math.random().toString(36).slice(2, 9);
}
