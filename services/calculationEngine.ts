import { UserProfile, StrategyResult, WithdrawalSource, FilingStatus, LongevityResult, YearProjection, Assets, RothConversionRecommendation, ConversionConstraint, ConversionConstraintType } from '../types';
import {
  STANDARD_DEDUCTION, AGE_DEDUCTION, TAX_BRACKETS, CAP_GAINS_BRACKETS, UNIFORM_LIFETIME_TABLE, RMD_START_AGE,
  SENIOR_DEDUCTION, SENIOR_DEDUCTION_PHASEOUT, SS_TAX_THRESHOLDS, IRMAA_THRESHOLDS, IRMAA_SAFETY_BUFFER
} from '../constants';

/**
 * Calculates how much of Social Security is taxable based on Provisional Income.
 */
const calculateTaxableSocialSecurity = (ssAmount: number, otherIncome: number, filingStatus: FilingStatus): number => {
  const provisionalIncome = otherIncome + (0.5 * ssAmount);
  let base1 = filingStatus === FilingStatus.Single ? 25000 : 32000;
  let base2 = filingStatus === FilingStatus.Single ? 34000 : 44000;

  if (provisionalIncome <= base1) return 0;

  if (provisionalIncome <= base2) {
    return Math.min(0.5 * ssAmount, 0.5 * (provisionalIncome - base1));
  }

  const secondaryAmount = Math.min(0.5 * ssAmount, filingStatus === FilingStatus.Single ? 4500 : 6000);
  return Math.min(
    0.85 * ssAmount,
    (0.85 * (provisionalIncome - base2)) + secondaryAmount
  );
};

/**
 * Calculates Federal Tax using the 'Two-Layer Cake' approach.
 */
const calculateFederalTax = (ordinaryIncome: number, capGainsIncome: number, filingStatus: FilingStatus, standardDeduction: number): number => {
  let tax = 0;
  let remainingOrdinary = Math.max(0, ordinaryIncome - standardDeduction);
  let previousLimit = 0;

  for (const bracket of TAX_BRACKETS[filingStatus]) {
    const taxableInBracket = Math.min(remainingOrdinary, bracket.limit - previousLimit);
    if (taxableInBracket <= 0) break;
    tax += taxableInBracket * bracket.rate;
    remainingOrdinary -= taxableInBracket;
    previousLimit = bracket.limit;
  }

  let remainingCapGains = capGainsIncome;
  let currentIncomePosition = Math.max(0, ordinaryIncome - standardDeduction);

  for (const bracket of CAP_GAINS_BRACKETS[filingStatus]) {
    const roomInBracket = Math.max(0, bracket.limit - currentIncomePosition);
    if (roomInBracket > 0) {
      const gainsTaxedHere = Math.min(remainingCapGains, roomInBracket);
      tax += gainsTaxedHere * bracket.rate;
      remainingCapGains -= gainsTaxedHere;
      currentIncomePosition += gainsTaxedHere;
    }
    if (remainingCapGains <= 0) break;
  }
  return tax;
};

export const calculateStrategy = (profile: UserProfile): StrategyResult => {
  const { age, baseAge, filingStatus, spendingNeed, isSpendingReal, assets, income, assumptions } = profile;

  let nominalSpendingNeeded = spendingNeed;
  if (isSpendingReal && age > baseAge) {
    nominalSpendingNeeded = spendingNeed * Math.pow(1 + assumptions.inflationRate, age - baseAge);
  }

  const standardDeduction = STANDARD_DEDUCTION[filingStatus] +
    (age >= 65 ? AGE_DEDUCTION[filingStatus] * (filingStatus === FilingStatus.MarriedJoint ? 2 : 1) : 0);

  const qualifiedDividends = income.brokerageDividends * income.qualifiedDividendRatio;
  const ordinaryDividends = income.brokerageDividends * (1 - income.qualifiedDividendRatio);

  let estimatedTax = 0;
  let currentIteration = 0;
  const maxIterations = 15;
  let lastResult: StrategyResult | null = null;

  while (currentIteration < maxIterations) {
    const targetNet = nominalSpendingNeeded + estimatedTax;
    const currentAssets: Assets = { ...assets };
    const withdrawalPlan: WithdrawalSource[] = [];
    let grossCash = income.socialSecurity + income.pension + income.brokerageDividends;
    let ordIncomeForTax = income.pension + ordinaryDividends;
    let capGainsForTax = qualifiedDividends;

    // STEP A: Mandatory RMDs
    let rmdAmount = 0;
    if (age >= RMD_START_AGE && currentAssets.traditionalIRA > 0) {
      rmdAmount = currentAssets.traditionalIRA / (UNIFORM_LIFETIME_TABLE[age] || 15.0);
      const actualRMD = Math.min(rmdAmount, currentAssets.traditionalIRA);
      withdrawalPlan.push({
        source: 'Traditional IRA (RMD)',
        amount: actualRMD,
        taxableAmount: actualRMD,
        taxType: 'Ordinary',
        description: `Mandatory IRS distribution for age ${age}.`,
      });
      grossCash += actualRMD;
      ordIncomeForTax += actualRMD;
      currentAssets.traditionalIRA -= actualRMD;
    }

    // STEP B: Standard Deduction (0% Ordinary Bucket)
    let gap = targetNet - grossCash;
    if (gap > 0 && currentAssets.traditionalIRA > 0) {
      const taxableSS = calculateTaxableSocialSecurity(income.socialSecurity, ordIncomeForTax, filingStatus);
      const roomInStdDeduction = Math.max(0, standardDeduction - (ordIncomeForTax + taxableSS));
      if (roomInStdDeduction > 0) {
        const pull = Math.min(gap, roomInStdDeduction, currentAssets.traditionalIRA);
        withdrawalPlan.push({
          source: 'Traditional IRA (to Std. Ded.)',
          amount: pull,
          taxableAmount: pull,
          taxType: 'Ordinary',
          description: `Filling standard deduction ($${standardDeduction.toLocaleString()}) to pull funds tax-free.`,
        });
        grossCash += pull;
        ordIncomeForTax += pull;
        currentAssets.traditionalIRA -= pull;
        gap -= pull;
      }
    }

    // STEP C: Brokerage (0% Capital Gains Bracket)
    if (gap > 0 && currentAssets.brokerage > 0) {
      const taxableSS = calculateTaxableSocialSecurity(income.socialSecurity, ordIncomeForTax, filingStatus);
      const cgThreshold = CAP_GAINS_BRACKETS[filingStatus][0].limit;
      const currentOrdinaryTaxable = Math.max(0, ordIncomeForTax + taxableSS - standardDeduction);
      const roomInZeroCG = Math.max(0, cgThreshold - currentOrdinaryTaxable - capGainsForTax);
      if (roomInZeroCG > 0) {
        const gainFactor = 0.5;
        const pull = Math.min(gap, roomInZeroCG / gainFactor, currentAssets.brokerage);
        const taxablePart = pull * gainFactor;
        withdrawalPlan.push({
          source: 'Brokerage (0% CG)',
          amount: pull,
          taxableAmount: taxablePart,
          taxType: 'CapitalGains',
          description: `Selling brokerage assets. Gains are 0% because ordinary income is low.`,
        });
        grossCash += pull;
        capGainsForTax += taxablePart;
        currentAssets.brokerage -= pull;
        gap -= pull;
      }
    }

    // STEP D: Traditional IRA (Low Brackets - 10-12%)
    if (gap > 0 && currentAssets.traditionalIRA > 0) {
      const lowBracketLimit = TAX_BRACKETS[filingStatus][1].limit;
      const taxableSS = calculateTaxableSocialSecurity(income.socialSecurity, ordIncomeForTax, filingStatus);
      const currentOrdinaryTaxable = Math.max(0, ordIncomeForTax + taxableSS - standardDeduction);
      const roomInLowBrackets = Math.max(0, lowBracketLimit - currentOrdinaryTaxable);
      if (roomInLowBrackets > 0) {
        const pull = Math.min(gap, roomInLowBrackets, currentAssets.traditionalIRA);
        withdrawalPlan.push({
          source: 'Traditional IRA (12% Bracket)',
          amount: pull,
          taxableAmount: pull,
          taxType: 'Ordinary',
          description: `Withdrawing from IRA to fill the low (10-12%) tax brackets.`,
        });
        grossCash += pull;
        ordIncomeForTax += pull;
        currentAssets.traditionalIRA -= pull;
        gap -= pull;
      }
    }

    // STEP E: Roth IRA (Tax-Free Flexibility Lever - Preserved until needed)
    if (gap > 0 && currentAssets.rothIRA > 0) {
      const pull = Math.min(gap, currentAssets.rothIRA);
      withdrawalPlan.push({
        source: 'Roth IRA (Flexibility)',
        amount: pull,
        taxableAmount: 0,
        taxType: 'None',
        description: 'Using tax-free Roth funds to cover remaining needs and preserve low tax rates.',
      });
      grossCash += pull;
      currentAssets.rothIRA -= pull;
      gap -= pull;
    }

    // STEP F: Excess Needs (High Bracket IRA or Brokerage 15%)
    if (gap > 0 && (currentAssets.traditionalIRA > 0 || currentAssets.brokerage > 0)) {
      if (currentAssets.brokerage > 0) {
        const pull = Math.min(gap, currentAssets.brokerage);
        withdrawalPlan.push({
          source: 'Brokerage (Excess)',
          amount: pull,
          taxableAmount: pull * 0.5,
          taxType: 'CapitalGains',
          description: 'Remaining needs from brokerage assets.',
        });
        grossCash += pull;
        gap -= pull;
      } else {
        const pull = Math.min(gap, currentAssets.traditionalIRA);
        withdrawalPlan.push({
          source: 'Traditional IRA (High Bracket)',
          amount: pull,
          taxableAmount: pull,
          taxType: 'Ordinary',
          description: 'Remaining needs from Traditional IRA (High Bracket).',
        });
        grossCash += pull;
        gap -= pull;
      }
    }

    const finalTaxableSS = calculateTaxableSocialSecurity(income.socialSecurity, ordIncomeForTax, filingStatus);
    const iterationTax = calculateFederalTax(ordIncomeForTax + finalTaxableSS, capGainsForTax, filingStatus, standardDeduction);

    // Calculate Roth conversion optimization
    const rothConversionDetail = calculateRothConversionOptimization(profile, ordIncomeForTax, finalTaxableSS);

    lastResult = {
      totalWithdrawal: grossCash,
      gapFilled: gap <= 0,
      withdrawalPlan,
      rothConversionAmount: rothConversionDetail.recommendedAmount,
      rothConversionDetail,
      estimatedFederalTax: iterationTax,
      effectiveTaxRate: iterationTax / grossCash || 0,
      rmdAmount,
      taxableSocialSecurity: finalTaxableSS,
      provisionalIncome: ordIncomeForTax + (0.5 * income.socialSecurity),
      standardDeduction,
      notes: [],
      nominalSpendingNeeded
    };

    if (Math.abs(iterationTax - estimatedTax) < 1) break;
    estimatedTax = iterationTax;
    currentIteration++;
  }

  return lastResult || {
    totalWithdrawal: 0, gapFilled: false, withdrawalPlan: [], rothConversionAmount: 0,
    estimatedFederalTax: 0, effectiveTaxRate: 0, rmdAmount: 0, taxableSocialSecurity: 0,
    provisionalIncome: 0, standardDeduction: 0, notes: ["Calc failed"], nominalSpendingNeeded: 0
  };
};

export const calculateLongevity = (profile: UserProfile, strategy: StrategyResult): LongevityResult => {
  let currentAssets = profile.assets.brokerage + profile.assets.rothIRA + profile.assets.traditionalIRA + profile.assets.hsa;
  const fixedIncome = profile.income.socialSecurity + profile.income.pension + profile.income.brokerageDividends;
  const portfolioDraw = Math.max(0, strategy.totalWithdrawal - fixedIncome);
  const initialWithdrawalRate = currentAssets > 0 ? portfolioDraw / currentAssets : 0;

  const projection: YearProjection[] = [];
  let runningAssets = currentAssets;
  let currentDraw = portfolioDraw;
  let depletionAge: number | null = null;

  for (let i = 0; i <= 40; i++) {
    const age = profile.age + i;
    projection.push({ age, year: i, totalAssets: Math.max(0, runningAssets), withdrawal: currentDraw, isDepleted: runningAssets <= 0 });
    if (runningAssets <= 0 && !depletionAge) depletionAge = age;
    runningAssets = runningAssets * (1 + profile.assumptions.rateOfReturnInRetirement) - currentDraw;
    currentDraw *= (1 + profile.assumptions.inflationRateInRetirement);
  }

  return { projection, depletionAge, initialWithdrawalRate, sustainable: initialWithdrawalRate <= 0.05 };
};

// ============================================================================
// Roth Conversion Optimization - "Fill Strategy" Algorithm
// ============================================================================

/**
 * Determines the current Social Security Tax "Torpedo" multiplier.
 * Returns 1.0 (no torpedo), 1.5 (50% SS taxable zone), or 1.85 (85% SS taxable zone)
 */
const getSSTorpedoMultiplier = (
  combinedIncome: number,
  ssAmount: number,
  filingStatus: FilingStatus
): { multiplier: number; inZone: boolean; description: string } => {
  const thresholds = SS_TAX_THRESHOLDS[filingStatus];

  if (combinedIncome <= thresholds.base1) {
    return { multiplier: 1.0, inZone: false, description: 'Below SS taxation threshold' };
  }

  // Check if already maxed out (85% of SS is taxable)
  const maxTaxableSS = 0.85 * ssAmount;
  const actualTaxableSS = calculateTaxableSocialSecurity(ssAmount, combinedIncome - 0.5 * ssAmount, filingStatus);

  if (actualTaxableSS >= maxTaxableSS * 0.99) {
    return { multiplier: 1.0, inZone: false, description: 'SS already fully taxed (85%)' };
  }

  if (combinedIncome <= thresholds.base2) {
    return { multiplier: 1.5, inZone: true, description: 'In 50% SS taxation zone (1.5x multiplier)' };
  }

  return { multiplier: 1.85, inZone: true, description: 'In 85% SS taxation zone (1.85x "Torpedo" multiplier)' };
};

/**
 * Gets the current and next tax bracket information.
 */
const getBracketInfo = (
  taxableIncome: number,
  filingStatus: FilingStatus
): { currentRate: number; nextBracketAt: number; headroomToNext: number } => {
  const brackets = TAX_BRACKETS[filingStatus];
  let previousLimit = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.limit) {
      return {
        currentRate: bracket.rate,
        nextBracketAt: bracket.limit,
        headroomToNext: bracket.limit - taxableIncome,
      };
    }
    previousLimit = bracket.limit;
  }

  // Already in top bracket
  return { currentRate: 0.37, nextBracketAt: Infinity, headroomToNext: Infinity };
};

/**
 * Gets the current and next IRMAA tier information.
 */
const getIRMAATierInfo = (
  magi: number,
  filingStatus: FilingStatus
): { currentTier: number; nextCliffAt: number; headroom: number; annualSurcharge: number } => {
  const tiers = IRMAA_THRESHOLDS[filingStatus];

  for (let i = 0; i < tiers.length; i++) {
    if (magi <= tiers[i].limit) {
      const annualSurcharge = (tiers[i].monthlyPartB + tiers[i].monthlyPartD) * 12;
      const nextCliff = i < tiers.length - 1 ? tiers[i + 1]?.limit || Infinity : Infinity;
      return {
        currentTier: i,
        nextCliffAt: tiers[i].limit,
        headroom: Math.max(0, tiers[i].limit - magi - IRMAA_SAFETY_BUFFER),
        annualSurcharge,
      };
    }
  }

  return { currentTier: tiers.length - 1, nextCliffAt: Infinity, headroom: Infinity, annualSurcharge: 0 };
};

/**
 * Calculates the Senior Deduction amount after phase-out.
 */
const calculateSeniorDeduction = (
  age: number,
  magi: number,
  filingStatus: FilingStatus
): { deduction: number; headroomToPhaseout: number; inPhaseout: boolean } => {
  if (age < 65) {
    return { deduction: 0, headroomToPhaseout: Infinity, inPhaseout: false };
  }

  const baseDeduction = SENIOR_DEDUCTION[filingStatus];
  const phaseout = SENIOR_DEDUCTION_PHASEOUT[filingStatus];

  if (magi <= phaseout.start) {
    return {
      deduction: baseDeduction,
      headroomToPhaseout: phaseout.start - magi,
      inPhaseout: false
    };
  }

  if (magi >= phaseout.end) {
    return { deduction: 0, headroomToPhaseout: 0, inPhaseout: true };
  }

  // In phase-out zone: reduce by 6 cents per dollar over threshold
  const reduction = (magi - phaseout.start) * phaseout.rate;
  const remaining = Math.max(0, baseDeduction - reduction);

  return {
    deduction: remaining,
    headroomToPhaseout: 0,
    inPhaseout: true
  };
};

/**
 * Main Roth Conversion Optimization Function
 * Implements the "Fill Strategy" - filling low-cost tax buckets optimally
 */
export const calculateRothConversionOptimization = (
  profile: UserProfile,
  currentOrdinaryIncome: number,
  taxableSS: number
): RothConversionRecommendation => {
  const { age, filingStatus, assets, income } = profile;

  // No Traditional IRA = nothing to convert
  if (assets.traditionalIRA <= 0) {
    return {
      recommendedAmount: 0,
      effectiveMarginalRate: 0,
      constraints: [],
      bindingConstraint: null,
      reasoning: ['No Traditional IRA balance available for conversion.'],
      warnings: [],
      inTorpedoZone: false,
      torpedoMultiplier: 1.0,
    };
  }

  const constraints: ConversionConstraint[] = [];
  const reasoning: string[] = [];
  const warnings: string[] = [];

  // Calculate current MAGI (AGI for IRMAA purposes)
  const currentMAGI = currentOrdinaryIncome + taxableSS;

  // Standard deduction for base calculations
  const standardDeduction = STANDARD_DEDUCTION[filingStatus] +
    (age >= 65 ? AGE_DEDUCTION[filingStatus] * (filingStatus === FilingStatus.MarriedJoint ? 2 : 1) : 0);

  // Current taxable income
  const currentTaxableIncome = Math.max(0, currentOrdinaryIncome + taxableSS - standardDeduction);

  // Combined income for SS torpedo calculation
  const combinedIncome = currentOrdinaryIncome + (0.5 * income.socialSecurity);

  // ========================================
  // CONSTRAINT 1: Tax Bracket Headroom
  // ========================================
  const bracketInfo = getBracketInfo(currentTaxableIncome, filingStatus);
  constraints.push({
    type: 'bracket',
    headroom: bracketInfo.headroomToNext,
    description: `$${bracketInfo.headroomToNext.toLocaleString()} until ${Math.round(bracketInfo.currentRate * 100)}% → next bracket`,
    effectiveRate: bracketInfo.currentRate,
  });
  reasoning.push(`Current tax bracket: ${Math.round(bracketInfo.currentRate * 100)}%`);

  // ========================================
  // CONSTRAINT 2: IRMAA Cliff Avoidance
  // ========================================
  const irmaaInfo = getIRMAATierInfo(currentMAGI, filingStatus);
  if (irmaaInfo.headroom < Infinity) {
    constraints.push({
      type: 'irmaa',
      headroom: irmaaInfo.headroom,
      description: `$${irmaaInfo.headroom.toLocaleString()} until IRMAA Tier ${irmaaInfo.currentTier + 1} cliff`,
      annualCost: irmaaInfo.annualSurcharge,
    });

    if (irmaaInfo.headroom < 5000) {
      warnings.push(`⚠️ Close to IRMAA cliff! Crossing adds $${Math.round(irmaaInfo.annualSurcharge).toLocaleString()}/year to Medicare premiums.`);
    }
  }

  // ========================================
  // CONSTRAINT 3: Senior Deduction Phase-Out
  // ========================================
  const seniorInfo = calculateSeniorDeduction(age, currentMAGI, filingStatus);
  if (age >= 65 && seniorInfo.headroomToPhaseout < Infinity) {
    constraints.push({
      type: 'senior_phaseout',
      headroom: seniorInfo.headroomToPhaseout,
      description: `$${seniorInfo.headroomToPhaseout.toLocaleString()} until Senior Deduction phase-out begins`,
    });

    if (seniorInfo.inPhaseout) {
      const phantomRate = bracketInfo.currentRate * 0.06;
      warnings.push(`📉 In Senior Deduction phase-out zone. Effective rate increased by ~${(phantomRate * 100).toFixed(1)}%.`);
    }
  }

  // ========================================
  // CONSTRAINT 4: Social Security "Tax Torpedo"
  // ========================================
  const torpedoInfo = getSSTorpedoMultiplier(combinedIncome, income.socialSecurity, filingStatus);
  if (income.socialSecurity > 0) {
    const effectiveTorpedoRate = bracketInfo.currentRate * torpedoInfo.multiplier;

    if (torpedoInfo.inZone) {
      constraints.push({
        type: 'ss_torpedo',
        headroom: 0, // Not a ceiling-based constraint
        description: torpedoInfo.description,
        effectiveRate: effectiveTorpedoRate,
      });

      warnings.push(`🚀 SS Tax Torpedo active! Each $1 converted is taxed at ~${Math.round(effectiveTorpedoRate * 100)}% effective rate.`);
    }
  }

  // ========================================
  // DETERMINE OPTIMAL CONVERSION (Fill Strategy)
  // ========================================

  // Find the minimum headroom across all ceiling-based constraints
  const ceilingConstraints = constraints.filter(c => c.headroom > 0 && c.type !== 'ss_torpedo');
  let safeConversion = Math.min(
    ...ceilingConstraints.map(c => c.headroom),
    assets.traditionalIRA  // Can't convert more than you have
  );

  // Determine which constraint is binding
  let bindingConstraint: ConversionConstraintType | null = null;
  let minHeadroom = Infinity;
  for (const c of ceilingConstraints) {
    if (c.headroom < minHeadroom) {
      minHeadroom = c.headroom;
      bindingConstraint = c.type;
    }
  }

  // Cap by available Traditional IRA
  if (safeConversion >= assets.traditionalIRA) {
    safeConversion = assets.traditionalIRA;
    bindingConstraint = null;
    reasoning.push('Recommended converting entire Traditional IRA balance.');
  }

  // Calculate effective marginal rate (including torpedo if active)
  let effectiveMarginalRate = bracketInfo.currentRate;
  if (torpedoInfo.inZone) {
    effectiveMarginalRate = bracketInfo.currentRate * torpedoInfo.multiplier;
  }
  if (seniorInfo.inPhaseout) {
    effectiveMarginalRate += bracketInfo.currentRate * 0.06; // Phantom rate from phase-out
  }

  // Generate final reasoning
  if (safeConversion > 0) {
    reasoning.push(
      `Recommended conversion: $${Math.round(safeConversion).toLocaleString()} ` +
      `at ~${Math.round(effectiveMarginalRate * 100)}% effective rate.`
    );

    if (bindingConstraint === 'irmaa') {
      reasoning.push('Limited by IRMAA cliff – avoiding Medicare premium surcharge.');
    } else if (bindingConstraint === 'bracket') {
      reasoning.push('Filling current tax bracket before jumping to higher rate.');
    } else if (bindingConstraint === 'senior_phaseout') {
      reasoning.push('Limited to preserve Senior Deduction.');
    }
  }

  return {
    recommendedAmount: Math.round(safeConversion),
    effectiveMarginalRate,
    constraints,
    bindingConstraint,
    reasoning,
    warnings,
    inTorpedoZone: torpedoInfo.inZone,
    torpedoMultiplier: torpedoInfo.multiplier,
  };
};
