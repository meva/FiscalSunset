import { FilingStatus } from './types';

// 2025 Standard Deductions (Estimated)
export const STANDARD_DEDUCTION = {
  [FilingStatus.Single]: 15000, 
  [FilingStatus.MarriedJoint]: 30000,
};

// Additional deduction for Age 65+ (per person)
export const AGE_DEDUCTION = {
  [FilingStatus.Single]: 1950,
  [FilingStatus.MarriedJoint]: 1550, // Per person
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
  // Fallback logic implemented in service for ages not listed or > 85
};

export const RMD_START_AGE = 73;
