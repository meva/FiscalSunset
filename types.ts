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

export interface ContributionAllocation {
  taxDeferred: number;
  taxable: number;
  taxExempt: number;
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
  inflationRateInRetirement: number;
  rateOfReturnInRetirement: number;
}

export interface UserProfile {
  age: number; // Retirement Start Age (Start of Withdrawals)
  baseAge: number; // Current Age (Start of Plan/Inflation Anchor)
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
  rothConversionDetail?: RothConversionRecommendation; // Detailed optimization info
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

// ============================================================================
// Roth Conversion Optimization Types
// ============================================================================

export type ConversionConstraintType = 'bracket' | 'irmaa' | 'senior_phaseout' | 'ss_torpedo';

export interface ConversionConstraint {
  type: ConversionConstraintType;
  headroom: number;
  description: string;
  effectiveRate?: number; // Includes phantom rates from multipliers/phase-outs
  annualCost?: number; // For IRMAA, the annual surcharge if crossed
}

export interface RothConversionRecommendation {
  recommendedAmount: number;
  effectiveMarginalRate: number;
  constraints: ConversionConstraint[];
  bindingConstraint: ConversionConstraintType | null; // Which constraint capped the recommendation
  reasoning: string[];
  warnings: string[];
  inTorpedoZone: boolean;
  torpedoMultiplier: number; // 1.0, 1.5, or 1.85
}