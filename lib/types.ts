export type ShareholderType = "founder" | "investor" | "esop" | "advisor";

export interface Shareholder {
  id: string;
  name: string;
  type: ShareholderType;
  shares: number;
  /** Per-share price paid (>= face value). Face value if subscribed at face. */
  pricePerShare: number;
  /** Display note */
  note?: string;
}

export interface Loan {
  id: string;
  lender: string; // founder/director name
  amount: number;
  interestRate?: number; // %, optional
  note?: string;
}

export interface ESOPPool {
  enabled: boolean;
  /** Pool size as % of post-pool fully diluted shares */
  percent: number;
}

export interface CompanyConfig {
  authorisedCapital: number;
  faceValue: number;
  currentFMV: number;
}

export interface CapTableState {
  config: CompanyConfig;
  shareholders: Shareholder[];
  loans: Loan[];
  esop: ESOPPool;
}

export type InfusionRoute =
  | "equity-face"
  | "equity-fmv-one"
  | "equity-fmv-proportional"
  | "loan";
