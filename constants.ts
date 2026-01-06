import { FilingStatus } from './types';

// 2025 Standard Deductions (Estimated)
export const STANDARD_DEDUCTION = {
  [FilingStatus.Single]: 15750,
  [FilingStatus.MarriedJoint]: 31500,
};

// Additional deduction for Age 65+ (per person)
export const AGE_DEDUCTION = {
  [FilingStatus.Single]: 2000,
  [FilingStatus.MarriedJoint]: 1600, // Per person
};

// 2025 Tax Brackets (Ordinary Income) - Taxable Income limits
export const TAX_BRACKETS = {
  [FilingStatus.Single]: [
    { limit: 11925, rate: 0.10 },
    { limit: 48475, rate: 0.12 },
    { limit: 103350, rate: 0.22 },
    { limit: 197300, rate: 0.24 },
    { limit: 250525, rate: 0.32 },
    { limit: 626350, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  [FilingStatus.MarriedJoint]: [
    { limit: 23850, rate: 0.10 },
    { limit: 96950, rate: 0.12 },
    { limit: 206700, rate: 0.22 },
    { limit: 394600, rate: 0.24 },
    { limit: 501050, rate: 0.32 },
    { limit: 751600, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
};

// 2025 Capital Gains Brackets - Taxable Income limits
export const CAP_GAINS_BRACKETS = {
  [FilingStatus.Single]: [
    { limit: 48350, rate: 0.0 }, // 0% up to ~$48k taxable income
    { limit: 533400, rate: 0.15 },
    { limit: Infinity, rate: 0.20 },
  ],
  [FilingStatus.MarriedJoint]: [
    { limit: 96700, rate: 0.0 }, // 0% up to ~$96k taxable income
    { limit: 600050, rate: 0.15 },
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
