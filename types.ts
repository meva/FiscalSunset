export enum FilingStatus {
  Single = 'Single',
  MarriedJoint = 'MarriedJoint',
}

export interface Assets {
  traditionalIRA: number;
  rothIRA: number;
  brokerage: number;
  hsa: number;
}

export interface Contributions {
  traditionalIRA: number;
  rothIRA: number;
  brokerage: number;
  hsa: number;
}

export interface IncomeProfile {
  socialSecurity: number;
  pension: number;
  brokerageDividends: number;
  qualifiedDividendRatio: number;
}

export interface MarketAssumptions {
  inflationRate: number;
  rateOfReturn: number;
}

export interface UserProfile {
  age: number;
  baseAge: number; // The age when the plan started (for inflation ref)
  filingStatus: FilingStatus;
  spendingNeed: number;
  isSpendingReal: boolean; // Is the spending need in today's dollars?
  assets: Assets;
  contributions: Contributions;
  income: IncomeProfile;
  assumptions: MarketAssumptions;
}

export interface WithdrawalSource {
  source: string;
  amount: number;
  taxableAmount: number;
  taxType: 'Ordinary' | 'CapitalGains' | 'None';
  description: string;
}

export interface StrategyResult {
  totalWithdrawal: number;
  gapFilled: boolean;
  withdrawalPlan: WithdrawalSource[];
  rothConversionAmount: number;
  estimatedFederalTax: number;
  effectiveTaxRate: number;
  rmdAmount: number;
  taxableSocialSecurity: number;
  provisionalIncome: number;
  standardDeduction: number;
  notes: string[];
  nominalSpendingNeeded: number; // Adjusted for inflation if needed
}

export interface YearProjection {
  age: number;
  year: number;
  totalAssets: number;
  withdrawal: number;
  isDepleted: boolean;
}

export interface LongevityResult {
  projection: YearProjection[];
  depletionAge: number | null;
  initialWithdrawalRate: number;
  sustainable: boolean;
}