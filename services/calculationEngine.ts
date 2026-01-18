import { UserProfile, StrategyResult, WithdrawalSource, FilingStatus, LongevityResult, YearProjection, Assets, RothConversionRecommendation, ConversionConstraint, ConversionConstraintType } from '../types';
import {
  STANDARD_DEDUCTION, AGE_DEDUCTION, TAX_BRACKETS, CAP_GAINS_BRACKETS, UNIFORM_LIFETIME_TABLE, RMD_START_AGE,
  SENIOR_DEDUCTION, SENIOR_DEDUCTION_PHASEOUT, SS_TAX_THRESHOLDS, IRMAA_THRESHOLDS, IRMAA_SAFETY_BUFFER,
  FED_MIDTERM_RATE_120, SINGLE_LIFE_EXPECTANCY_TABLE // Imported
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

export const calculateSEPPPayment = (balance: number, age: number): number => {
  if (balance <= 0) return 0;
  const lifeExpectancy = SINGLE_LIFE_EXPECTANCY_TABLE[age] || 20.0; // Fallback
  const rate = FED_MIDTERM_RATE_120;
  // Amortization Formula: A = P * [r(1+r)^n] / [(1+r)^n - 1]
  const n = lifeExpectancy;
  const numerator = rate * Math.pow(1 + rate, n);
  const denominator = Math.pow(1 + rate, n) - 1;
  return balance * (numerator / denominator);
};

export const getWithdrawalOrder = (
  age: number,
  assets: Assets,
  stdDeductionNeed: number,
  filingStatus: FilingStatus
): { source: string; limit: number; taxType: 'Ordinary' | 'CapitalGains' | 'None'; penalty: boolean; isSEPP?: boolean }[] => {
  const order: { source: string; limit: number; taxType: 'Ordinary' | 'CapitalGains' | 'None'; penalty: boolean; isSEPP?: boolean }[] = [];

  // LEVEL 1: Taxable Brokerage (Capital Gains) - Always accessible, efficient caps
  order.push({ source: 'Taxable Brokerage', limit: assets.brokerage, taxType: 'CapitalGains', penalty: false });

  // LEVEL 2: Roth Contributions (Basis) - Always tax/penalty free
  // Note: We use assets.rothBasis. If undefined, we assume 0 or handle externally.
  // We treat Basis as a sub-segment of Roth IRA.
  const rothBasisAvailable = Math.min(assets.rothBasis || 0, assets.rothIRA);
  order.push({ source: 'Roth IRA (Basis)', limit: rothBasisAvailable, taxType: 'None', penalty: false });

  // LEVEL 3: Early Access (Conditional)
  // Rule of 55 (Simulation): If Age >= 55, Trad IRA is accessible penalty-free (assuming separation)
  // Real world: Only from current 401k. We simplify for the tool.
  if (age >= 55 && age < 59.5) {
    order.push({
      source: 'Traditional IRA (Rule of 55)',
      limit: assets.traditionalIRA,
      taxType: 'Ordinary',
      penalty: false
    });
  } else if (age < 59.5) {
    // 72(t) SEPP - If not 55+, use SEPP
    // Calculate Max SEPP payment based on current Trad Balance
    const maxSEPP = calculateSEPPPayment(assets.traditionalIRA, age);
    if (maxSEPP > 0) {
      order.push({
        source: 'Traditional IRA (72t/SEPP)',
        limit: maxSEPP,
        taxType: 'Ordinary',
        penalty: false,
        isSEPP: true
      });
    }

    // Roth Conversion Ladder (Ladder logic complex, skipping for simplifed priority)
    // Could add "Roth Earnings (Accessible)" if 5-year rules met, but usually covered by Basis logic order
  }

  // LEVEL 4: Standard / Penalty Access
  // If > 59.5, Standard Access
  if (age >= 59.5) {
    order.push({
      source: 'Traditional IRA',
      limit: assets.traditionalIRA, // Remaining after Rule of 55 check if that was separate, but here we just add bucket
      taxType: 'Ordinary',
      penalty: false
    });
    // Remaining Roth (Earnings)
    const rothEarnings = Math.max(0, assets.rothIRA - rothBasisAvailable);
    order.push({
      source: 'Roth IRA (Earnings)',
      limit: rothEarnings,
      taxType: 'None', // Tax free if > 59.5 and 5 year rule (assumed met)
      penalty: false
    });
  } else {
    // Age < 59.5 and Levels 1-3 exhausted
    // Traditional IRA (Penalty)
    // Note: If SEPP was added, this is the "Excess" above SEPP
    // We can't double count the SEPP limit. Logic in calculation loop handles actual deduction.
    // But distinct bucket helps. We set limit to Infinity (bounded by asset balance in loop)
    order.push({
      source: 'Traditional IRA (Penalty)',
      limit: assets.traditionalIRA, // Loop will subtract what was used in SEPP
      taxType: 'Ordinary',
      penalty: true
    });

    // Roth Earnings (Penalty + Tax)
    const rothEarnings = Math.max(0, assets.rothIRA - rothBasisAvailable);
    order.push({
      source: 'Roth IRA Earnings (Penalty)',
      limit: rothEarnings,
      taxType: 'Ordinary', // Earnings taxable if non-qualified
      penalty: true
    });
  }

  return order;
};

export const calculateStrategy = (profile: UserProfile): StrategyResult => {
  // Refactored calculateStrategy to use Withdrawal Priority Engine
  const { age, baseAge, filingStatus, spendingNeed, isSpendingReal, assets, income, assumptions } = profile;

  const isSSActive = age >= (income.socialSecurityStartAge || 62);
  const annualSS = isSSActive ? income.socialSecurity : 0;

  // Calculate annual dividends based on yield (Static for Strategy, Logic handles depletion in Longevity)
  // For the 'Year 1' strategy snapshot, we use the full balance.
  const brokerageDividends = assets.brokerage * income.brokerageDividendYield;

  let nominalSpendingNeeded = spendingNeed;
  if (isSpendingReal && age > baseAge) {
    nominalSpendingNeeded = spendingNeed * Math.pow(1 + assumptions.inflationRate, age - baseAge);
  }

  const standardDeduction = STANDARD_DEDUCTION[filingStatus] +
    (age >= 65 ? AGE_DEDUCTION[filingStatus] * (filingStatus === FilingStatus.MarriedJoint ? 2 : 1) : 0);

  const qualifiedDividends = brokerageDividends * income.qualifiedDividendRatio;
  const ordinaryDividends = brokerageDividends * (1 - income.qualifiedDividendRatio);

  let estimatedTax = 0;
  let penaltyTax = 0;
  let currentIteration = 0;
  const maxIterations = 15;
  let lastResult: StrategyResult | null = null;
  let liquidityGapWarning = false;

  while (currentIteration < maxIterations) {
    const targetNet = nominalSpendingNeeded + estimatedTax + penaltyTax; // Add penalty to need
    const currentAssets: Assets = { ...assets };

    // We track rothBasis separately to ensure we don't double dip or lose track vs total Roth
    let currentRothBasis = assets.rothBasis || 0;

    const withdrawalPlan: WithdrawalSource[] = [];
    let grossCash = annualSS + income.pension + brokerageDividends;
    let ordIncomeForTax = income.pension + ordinaryDividends;
    let capGainsForTax = qualifiedDividends;
    let currentPenalty = 0;

    // 0. RMDs (Always First)
    let rmdAmount = 0;
    if (age >= RMD_START_AGE && currentAssets.traditionalIRA > 0) {
      rmdAmount = currentAssets.traditionalIRA / (UNIFORM_LIFETIME_TABLE[age] || 15.0);
      const actualRMD = Math.min(rmdAmount, currentAssets.traditionalIRA);
      withdrawalPlan.push({
        source: 'Traditional IRA (RMD)',
        amount: actualRMD,
        taxableAmount: actualRMD,
        taxType: 'Ordinary',
        description: `Mandatory IRS distribution.`,
      });
      grossCash += actualRMD;
      ordIncomeForTax += actualRMD;
      currentAssets.traditionalIRA -= actualRMD;
    }

    // 1. Get Priority Order
    // We pass initial assets, but we must respect the dynamic 'currentAssets' in the loop
    // so strictly speaking the order definition uses static rules, boundaries use currentAssets.
    const priorityOrder = getWithdrawalOrder(age, assets, standardDeduction, filingStatus);

    let gap = targetNet - grossCash;

    for (const step of priorityOrder) {
      if (gap <= 0.5) break; // Gap filled

      // Determine available amount in this bucket based on currentAssets state
      let availableInBucket = 0;
      if (step.source.includes('Brokerage')) availableInBucket = currentAssets.brokerage;
      else if (step.source.includes('Roth IRA (Basis)')) availableInBucket = Math.min(currentRothBasis, currentAssets.rothIRA);
      else if (step.source.includes('Traditional IRA')) availableInBucket = currentAssets.traditionalIRA;
      else if (step.source.includes('Roth IRA')) availableInBucket = currentAssets.rothIRA; // Earnings/Flexibility

      // Apply step limit (e.g. SEPP limit)
      let limit = step.limit;
      // Special Handling: If we already used some TradIRA for RMD, reduce available? 
      // RMD comes out of TradIRA, so currentAssets.traditionalIRA is already reduced.
      // However, SEPP limit is calculated on distinct balance. 
      // For simplicity, we just take min(available, limit).

      const pull = Math.min(gap, availableInBucket, limit);

      if (pull > 0) {
        // Adjust Assets
        if (step.source.includes('Brokerage')) currentAssets.brokerage -= pull;
        else if (step.source.includes('Traditional')) currentAssets.traditionalIRA -= pull;
        else if (step.source.includes('Roth')) {
          currentAssets.rothIRA -= pull;
          if (step.source.includes('Basis')) currentRothBasis -= pull;
        }

        // Add to Plan
        const taxableAmt = (step.taxType === 'None') ? 0 :
          (step.taxType === 'CapitalGains' ? pull * 0.5 : pull); // Simplifed 50% gain ratio

        withdrawalPlan.push({
          source: step.source,
          amount: pull,
          taxableAmount: taxableAmt,
          taxType: step.taxType,
          description: step.penalty ? 'WARN: Early withdrawal penalty applies.' :
            step.isSEPP ? '72(t) SEPP withdrawal.' : 'Standard withdrawal.',
        });

        // Add to Cash / Tax / Penalty
        grossCash += pull;
        if (step.taxType === 'Ordinary') ordIncomeForTax += taxableAmt;
        if (step.taxType === 'CapitalGains') capGainsForTax += taxableAmt;

        if (step.penalty) {
          currentPenalty += pull * 0.10;
        }

        gap -= pull;
      }
    }

    // Check if we failed to fill gap even with penalties, OR if we triggered penalties
    liquidityGapWarning = gap > 1 || currentPenalty > 0;

    const finalTaxableSS = calculateTaxableSocialSecurity(annualSS, ordIncomeForTax, filingStatus);
    const iterationTax = calculateFederalTax(ordIncomeForTax + finalTaxableSS, capGainsForTax, filingStatus, standardDeduction);

    lastResult = {
      totalWithdrawal: grossCash,
      gapFilled: gap <= 1,
      liquidityGapWarning,
      withdrawalPlan,
      rothConversionAmount: 0, // Recalculated below
      estimatedFederalTax: iterationTax,
      effectiveTaxRate: iterationTax / (grossCash || 1),
      rmdAmount,
      taxableSocialSecurity: finalTaxableSS,
      currentYearSocialSecurity: annualSS,
      provisionalIncome: ordIncomeForTax + (0.5 * annualSS),
      standardDeduction,
      notes: currentPenalty > 0 ? [`Includes $${currentPenalty.toFixed(0)} early withdrawal penalty.`] : [],
      nominalSpendingNeeded
    };

    if (Math.abs(iterationTax - estimatedTax) < 5 && Math.abs(currentPenalty - penaltyTax) < 5) break;
    estimatedTax = iterationTax;
    penaltyTax = currentPenalty;
    currentIteration++;
  }

  // Optimization Step (re-run outside loop to avoid circular logic or simpler: run once on result)
  const rothDetail = calculateRothConversionOptimization(profile,
    lastResult?.provisionalIncome || 0, // Approx
    lastResult?.taxableSocialSecurity || 0
  );

  return {
    ...lastResult!,
    rothConversionAmount: rothDetail.recommendedAmount,
    rothConversionDetail: rothDetail
  };
};

export const calculateLongevity = (profile: UserProfile, strategy: StrategyResult): LongevityResult => {
  // Track separate buckets to correctly calculate declining dividends and order of depletion
  let currentBrokerage = profile.assets.brokerage;
  let currentTrad = profile.assets.traditionalIRA;
  let currentRoth = profile.assets.rothIRA;
  let currentHSA = profile.assets.hsa;

  const projection: YearProjection[] = [];
  let depletionAge: number | null = null;
  const rateInRetirement = profile.assumptions.rateOfReturnInRetirement;

  // Base fixed income excluding SS and Dividends (Pension only)
  const basePension = profile.income.pension;
  const divYield = profile.income.brokerageDividendYield;

  // Initial Total Assets for Rate Calculation
  const initialTotalAssets = currentBrokerage + currentTrad + currentRoth + currentHSA;

  // We determine the "Gross Spending Need" (Expenses + Taxes) from the strategy result
  // and inflate it. This simulates maintaining lifestyle + paying relative taxes.
  let currentProjectedGrossNeed = strategy.totalWithdrawal;

  for (let i = 0; i <= 40; i++) {
    const age = profile.age + i;

    // 1. Calculate Inflows (SS + Pension + Dynamic Dividends)
    const ssStartAge = profile.income.socialSecurityStartAge || 62;
    let currentSS = 0;
    if (age >= ssStartAge) {
      const yearsSinceStart = age - ssStartAge;
      currentSS = profile.income.socialSecurity * Math.pow(1 + profile.assumptions.inflationRateInRetirement, yearsSinceStart);
    }

    // Dynamic Dividend calculation based on START of year brokerage balance
    const currentDividends = currentBrokerage * divYield;

    const totalFixedIncome = currentSS + basePension + currentDividends;

    // 2. Determine Portfolio Draw Requirement
    const requiredDraw = Math.max(0, currentProjectedGrossNeed - totalFixedIncome);

    // 3. Subtract Draw from Assets (Simplified Order: Brokerage -> Trad -> Roth -> HSA)
    // In reality, strategy mixes them for tax efficiency, but for longevity "burn down", 
    // sequential buckets is a decent approximation if precise tax-filling isn't re-simulated every year.
    // Given we want to see Dividends drop, we prioritize Brokerage usage?
    // Actually, strategy usually prioritizes Brokerage first (to avoid RMD/high tax later) or fills low brackets.
    // Let's stick to the Strategy's implicit order: Brokerage is usually first liquid source.

    let remainingDraw = requiredDraw;

    // Withdraw from Brokerage first
    const fromBrokerage = Math.min(currentBrokerage, remainingDraw);
    currentBrokerage -= fromBrokerage;
    remainingDraw -= fromBrokerage;

    // Withdraw from Trad (Subject to RMDs nominally, but here just bulk checking longevity)
    const fromTrad = Math.min(currentTrad, remainingDraw);
    currentTrad -= fromTrad;
    remainingDraw -= fromTrad;

    // Withdraw from Roth
    const fromRoth = Math.min(currentRoth, remainingDraw);
    currentRoth -= fromRoth;
    remainingDraw -= fromRoth;

    // Withdraw from HSA
    const fromHSA = Math.min(currentHSA, remainingDraw);
    currentHSA -= fromHSA;
    remainingDraw -= fromHSA;

    const totalAssets = currentBrokerage + currentTrad + currentRoth + currentHSA;

    projection.push({ age, year: i, totalAssets: Math.max(0, totalAssets), withdrawal: requiredDraw, isDepleted: totalAssets <= 0 });

    if (totalAssets <= 0 && !depletionAge) depletionAge = age;

    // 4. Apply Growth to Remaining Balances
    currentBrokerage *= (1 + rateInRetirement);
    currentTrad *= (1 + rateInRetirement);
    currentRoth *= (1 + rateInRetirement);
    currentHSA *= (1 + rateInRetirement);

    // 5. Inflate Need for Next Year
    currentProjectedGrossNeed *= (1 + profile.assumptions.inflationRateInRetirement);
  }

  const initialPortfolioDraw = Math.max(0, strategy.totalWithdrawal - (profile.income.pension + (profile.assets.brokerage * divYield) + (profile.age >= (profile.income.socialSecurityStartAge || 62) ? profile.income.socialSecurity : 0)));
  const initialWithdrawalRate = initialTotalAssets > 0 ? initialPortfolioDraw / initialTotalAssets : 0;

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
  taxableSS: number,
  activeSocialSecurityAmount?: number // Optional override for the effective SS amount 
): RothConversionRecommendation => {
  const { age, filingStatus, assets, income } = profile;

  // Use the passed active SS amount or default to profile (logic should prefer the passed active amount)
  // If activeSocialSecurityAmount is defined, use it. Otherwise rely on profile check.
  const ssAmount = activeSocialSecurityAmount !== undefined ? activeSocialSecurityAmount : income.socialSecurity;

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
  const combinedIncome = currentOrdinaryIncome + (0.5 * ssAmount);

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
  const torpedoInfo = getSSTorpedoMultiplier(combinedIncome, ssAmount, filingStatus);
  if (ssAmount > 0) {
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
