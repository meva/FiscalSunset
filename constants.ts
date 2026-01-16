import { FilingStatus } from './types';

// 2026 Standard Deductions (Estimated)
export const STANDARD_DEDUCTION = {
  [FilingStatus.Single]: 16100,
  [FilingStatus.MarriedJoint]: 32200,
};

// Additional deduction for Age 65+ (per person)
export const AGE_DEDUCTION = {
  [FilingStatus.Single]: 2050,
  [FilingStatus.MarriedJoint]: 1650, // Per person
};

// 2026 Tax Brackets (Ordinary Income) - Taxable Income limits
export const TAX_BRACKETS = {
  [FilingStatus.Single]: [
    { limit: 12400, rate: 0.10 },
    { limit: 50400, rate: 0.12 },
    { limit: 105700, rate: 0.22 },
    { limit: 201775, rate: 0.24 },
    { limit: 256225, rate: 0.32 },
    { limit: 640600, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  [FilingStatus.MarriedJoint]: [
    { limit: 24800, rate: 0.10 },
    { limit: 100800, rate: 0.12 },
    { limit: 211400, rate: 0.22 },
    { limit: 403550, rate: 0.24 },
    { limit: 512450, rate: 0.32 },
    { limit: 768700, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
};

// 2026 Capital Gains Brackets - Taxable Income limits
export const CAP_GAINS_BRACKETS = {
  [FilingStatus.Single]: [
    { limit: 49450, rate: 0.0 }, // 0% up to ~$49k taxable income
    { limit: 545500, rate: 0.15 },
    { limit: Infinity, rate: 0.20 },
  ],
  [FilingStatus.MarriedJoint]: [
    { limit: 98900, rate: 0.0 }, // 0% up to ~$98k taxable income
    { limit: 613700, rate: 0.15 },
    { limit: Infinity, rate: 0.20 },
  ],
};

// Uniform Lifetime Table (Select entries for RMD calculation)
export const UNIFORM_LIFETIME_TABLE: Record<number, number> = {
  73: 26.5,
  74: 25.5,
  75: 24.6,
  76: 23.7,
  77: 22.9,
  78: 22.0,
  79: 21.1,
  80: 20.2,
  81: 19.4,
  82: 18.5,
  83: 17.7,
  84: 16.8,
  85: 16.0,
  86: 15.2,
  87: 14.4,
  88: 13.7,
  89: 12.9,
  90: 12.2,
  91: 11.5,
  92: 10.8,
  93: 10.1,
  94: 9.5,
  95: 8.9,
  96: 8.4,
  97: 7.8,
  98: 7.3,
  99: 6.8,
  100: 6.4,
  101: 6.0,
  102: 5.6,
  103: 5.2,
  104: 4.9,
  105: 4.6,
  106: 4.3,
  107: 4.1,
  108: 3.9,
  109: 3.7,
  110: 3.5,
  111: 3.4,
  112: 3.3,
  113: 3.1,
  114: 3.0,
  115: 2.9,
  116: 2.8,
  117: 2.7,
  118: 2.5,
  119: 2.3,
  120: 2.0,

  // Fallback logic implemented in service for ages not listed 
};

export const RMD_START_AGE = 73;

// ============================================================================
// OBBBA (One Big Beautiful Bill Act) 2025-2028 Constants
// ============================================================================

// Senior Deduction (Additional deduction for taxpayers 65+)
export const SENIOR_DEDUCTION = {
  [FilingStatus.Single]: 6000,
  [FilingStatus.MarriedJoint]: 12000, // $6k per spouse if both 65+
};

// Senior Deduction Phase-Out (reduces by 6 cents per dollar over threshold)
export const SENIOR_DEDUCTION_PHASEOUT = {
  [FilingStatus.Single]: { start: 75000, end: 175000, rate: 0.06 },
  [FilingStatus.MarriedJoint]: { start: 150000, end: 250000, rate: 0.06 },
};

// Social Security Taxation Thresholds (Fixed, NOT indexed for inflation)
// Combined Income = AGI (excluding SS) + Tax-Exempt Interest + 0.5 * SS Benefit
export const SS_TAX_THRESHOLDS = {
  [FilingStatus.Single]: { base1: 25000, base2: 34000 },
  [FilingStatus.MarriedJoint]: { base1: 32000, base2: 44000 },
};

// Medicare IRMAA Thresholds (2025 MAGI triggers 2027 premiums)
// Each tier is a cliff - crossing by $1 triggers full annual surcharge
export interface IRMAATier {
  limit: number;
  monthlyPartB: number;
  monthlyPartD: number;
}

export const IRMAA_THRESHOLDS: Record<FilingStatus, IRMAATier[]> = {
  [FilingStatus.Single]: [
    { limit: 106000, monthlyPartB: 0, monthlyPartD: 0 },
    { limit: 133000, monthlyPartB: 74.00, monthlyPartD: 13.70 },
    { limit: 167000, monthlyPartB: 185.00, monthlyPartD: 35.30 },
    { limit: 200000, monthlyPartB: 295.90, monthlyPartD: 57.00 },
    { limit: 500000, monthlyPartB: 406.90, monthlyPartD: 78.60 },
    { limit: Infinity, monthlyPartB: 443.90, monthlyPartD: 85.80 },
  ],
  [FilingStatus.MarriedJoint]: [
    { limit: 212000, monthlyPartB: 0, monthlyPartD: 0 },
    { limit: 266000, monthlyPartB: 74.00, monthlyPartD: 13.70 },
    { limit: 334000, monthlyPartB: 185.00, monthlyPartD: 35.30 },
    { limit: 400000, monthlyPartB: 295.90, monthlyPartD: 57.00 },
    { limit: 750000, monthlyPartB: 406.90, monthlyPartD: 78.60 },
    { limit: Infinity, monthlyPartB: 443.90, monthlyPartD: 85.80 },
  ],
};

// IRMAA Safety Buffer (avoid getting within $1k of a cliff)
export const IRMAA_SAFETY_BUFFER = 1000;

// ============================================================================
// FIRE / Early Withdrawal Constants
// ============================================================================

// 120% of Federal Mid-Term Rate (approx for 2025/2026 demo purposes)
// Used for 72(t) Amortization Method
export const FED_MIDTERM_RATE_120 = 0.052; // 5.2%

// Single Life Expectancy Table (IRS Pub 590-B Table I)
// Used for 72(t) calculations
export const SINGLE_LIFE_EXPECTANCY_TABLE: Record<number, number> = {
  30: 55.3, 31: 54.4, 32: 53.4, 33: 52.5, 34: 51.5,
  35: 50.5, 36: 49.6, 37: 48.6, 38: 47.7, 39: 46.7,
  40: 45.7, 41: 44.8, 42: 43.8, 43: 42.9, 44: 41.9,
  45: 41.0, 46: 40.0, 47: 39.0, 48: 38.1, 49: 37.1,
  50: 36.2, 51: 35.3, 52: 34.3, 53: 33.4, 54: 32.5,
  55: 31.6, 56: 30.6, 57: 29.8, 58: 28.9, 59: 28.0,
  60: 27.1, 61: 26.2, 62: 25.4, 63: 24.5, 64: 23.7,
  65: 22.9, 66: 22.0, 67: 21.2, 68: 20.4, 69: 19.6,
  70: 18.8, 71: 18.0, 72: 17.2, 73: 16.4, 74: 15.6,
  75: 14.8,
};
