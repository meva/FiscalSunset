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

  const rothBasisAvailable = Math.min(assets.rothBasis || 0, assets.rothIRA);

  // ========================================
  // PHASE 1: FIRE / Early Retirement (Age < 59.5)
  // Prioritizes penalty-free access
  // ========================================
  if (age < 59.5) {
    // 1. 72(t) SEPP - Substantially Equal Periodic Payments (Mandatory if active)
    // This must happen first to fill the gap before discretionary sources
    if (age < 55) {
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
    }

    // 2. Taxable Brokerage (Capital Gains) - Always accessible
    order.push({ source: 'Taxable Brokerage', limit: assets.brokerage, taxType: 'CapitalGains', penalty: false });

    // 3. Roth Contributions (Basis) - Always tax/penalty free
    order.push({ source: 'Roth IRA (Basis)', limit: rothBasisAvailable, taxType: 'None', penalty: false });

    // 4. Rule of 55 - If age >= 55 and separated from employer
    if (age >= 55) {
      order.push({
        source: 'Traditional IRA (Rule of 55)',
        limit: assets.traditionalIRA,
        taxType: 'Ordinary',
        penalty: false
      });
    }

    // 4. Traditional IRA (Penalty) - Last resort
    order.push({
      source: 'Traditional IRA (Penalty)',
      limit: assets.traditionalIRA,
      taxType: 'Ordinary',
      penalty: true
    });

    // 5. Roth Earnings (Penalty + Tax) - Absolute last resort
    const rothEarnings = Math.max(0, assets.rothIRA - rothBasisAvailable);
    if (rothEarnings > 0) {
      order.push({
        source: 'Roth IRA Earnings (Penalty)',
        limit: rothEarnings,
        taxType: 'Ordinary',
        penalty: true
      });
    }
  }
  // ========================================
  // PHASE 2: Standard Retirement (Age >= 59.5)
  // Prioritizes tax bracket optimization (Two-Layer Cake)
  // ========================================
  else {
    // Calculate bracket-filling limit for Traditional IRA
    // Goal: Fill ordinary income up through the 12% bracket for optimal tax efficiency
    const brackets = TAX_BRACKETS[filingStatus];
    const top12Bracket = brackets.find(b => b.rate === 0.12)?.limit || 50400;

    // Optimal Traditional IRA withdrawal = fill up to top of 12% bracket
    // This creates "room" for capital gains to sit in the 0% bracket
    const optimalTradWithdrawal = Math.min(
      assets.traditionalIRA,
      stdDeductionNeed + top12Bracket // Fill deduction + 10%/12% brackets
    );

    // 1. Traditional IRA - Fill standard deduction & low brackets FIRST
    // This is the key optimization: use ordinary income to fill low brackets
    if (assets.traditionalIRA > 0) {
      order.push({
        source: 'Traditional IRA Fill standard deduction & low brackets',
        limit: optimalTradWithdrawal,
        taxType: 'Ordinary',
        penalty: false
      });
    }

    // 2. Taxable Brokerage (Capital Gains) - Sits on top at 0%/15% rates
    // After ordinary income fills lower brackets, cap gains get favorable rates
    if (assets.brokerage > 0) {
      order.push({
        source: 'Taxable Brokerage',
        limit: assets.brokerage,
        taxType: 'CapitalGains',
        penalty: false
      });
    }

    // 3. Additional Traditional IRA - If more needed beyond bracket optimization
    if (assets.traditionalIRA > optimalTradWithdrawal) {
      order.push({
        source: 'Traditional IRA (Additional)',
        limit: assets.traditionalIRA - optimalTradWithdrawal,
        taxType: 'Ordinary',
        penalty: false
      });
    }

    // 4. Roth IRA - Tax-free, preserve for last (maximize tax-free growth)
    // After 59.5 with 5-year rule met, all Roth is tax-free - no need to split basis/earnings
    if (assets.rothIRA > 0) {
      order.push({
        source: 'Roth IRA',
        limit: assets.rothIRA,
        taxType: 'None',
        penalty: false
      });
    }
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
      // If gap is filled AND it's not a SEPP requirement, we can stop
      if (gap <= 0.5 && !step.isSEPP) continue;

      // Determine available amount in this bucket based on currentAssets state
      let availableInBucket = 0;
      if (step.source.includes('Brokerage')) availableInBucket = currentAssets.brokerage;
      else if (step.source.includes('Roth IRA (Basis)')) availableInBucket = Math.min(currentRothBasis, currentAssets.rothIRA);
      else if (step.source.includes('Traditional IRA')) availableInBucket = currentAssets.traditionalIRA;
      else if (step.source.includes('Roth IRA')) availableInBucket = currentAssets.rothIRA; // Earnings/Flexibility

      // Apply step limit (e.g. SEPP limit)
      let limit = step.limit;

      // SEPP REQUIREMENT: Must take the FULL amount even if not needed to avoid "busting" the calculation
      const pull = step.isSEPP ? Math.min(availableInBucket, limit) : Math.min(Math.max(0, gap), availableInBucket, limit);

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
            step.isSEPP ? '72(t) SEPP withdrawal (Fixed requirement).' : 'Standard withdrawal.',
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
  const totalAssets = assets.brokerage + assets.traditionalIRA + assets.rothIRA + assets.hsa;
  const currentWithdrawalRate = totalAssets > 0 ? ((lastResult?.totalWithdrawal || 0) / totalAssets) * 100 : 0;

  const rothDetail = calculateRothConversionOptimization(profile,
    lastResult?.provisionalIncome || 0, // Approx
    lastResult?.taxableSocialSecurity || 0,
    undefined, // activeSocialSecurityAmount (not used here)
    currentWithdrawalRate,
    lastResult?.liquidityGapWarning
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

  // 72(t) SEPP: Calculate FIXED payment at retirement start
  // IRS Rule: Must maintain same payment for 5 years OR until age 59.5 (whichever is LONGER)
  const seppStartAge = profile.age;
  const seppEndAge = Math.max(seppStartAge + 5, 59.5); // 5 years OR age 59.5
  const fixedSeppPayment = profile.age < 59.5
    ? calculateSEPPPayment(profile.assets.traditionalIRA, profile.age)
    : 0;

  // Calculate up to age 100
  const maxSimulationAge = 100;
  const yearsToSimulate = Math.max(40, maxSimulationAge - profile.age);

  for (let i = 0; i <= yearsToSimulate; i++) {
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

    // 2. Calculate RMD for ages 73+ (IRS Required Minimum Distribution)
    let rmdAmount = 0;
    if (age >= RMD_START_AGE && currentTrad > 0) {
      const divisor = UNIFORM_LIFETIME_TABLE[age] || 15.0; // Fallback for very old ages
      rmdAmount = currentTrad / divisor;
    }

    // 3. Determine Portfolio Draw Requirement
    const requiredDraw = Math.max(0, currentProjectedGrossNeed - totalFixedIncome);

    // 4. Subtract Draw from Assets using age-appropriate priority order
    // FIRE phase (age < 59.5): Brokerage → Trad → Roth → HSA
    // Standard phase (age >= 59.5): Trad → Brokerage → Roth → HSA
    // For age 73+: RMD is mandatory minimum from Traditional IRA

    let remainingDraw = requiredDraw;
    let fromBrokerage = 0;
    let fromTrad = 0;
    let fromRoth = 0;
    let fromHSA = 0;
    let fromTradSEPP = 0;
    let fromTradPenalty = 0;
    let penaltyAmount = 0;

    if (age < 59.5) {
      // FIRE Phase Priority: SEPP first (mandatory) -> Brokerage -> Roth -> HSA

      // 72(t) SEPP: Use FIXED payment amount calculated at retirement start
      // SEPP is available only during the required period (5 years OR until 59.5)
      const isSeppActive = age >= seppStartAge && age < seppEndAge;
      const seppLimit = isSeppActive ? fixedSeppPayment : 0;

      // SEPP REQUIREMENT: Must take the FULL amount even if not needed to avoid "busting" the calculation
      // We withdraw the full seppLimit (capped by actual account balance)
      fromTradSEPP = Math.min(seppLimit, currentTrad);
      currentTrad -= fromTradSEPP;
      remainingDraw -= fromTradSEPP;

      // Brokerage next (penalty-free access)
      if (remainingDraw > 0) {
        fromBrokerage = Math.min(currentBrokerage, remainingDraw);
        currentBrokerage -= fromBrokerage;
        remainingDraw -= fromBrokerage;
      }

      // Additional Traditional IRA beyond SEPP incurs 10% early withdrawal penalty
      if (remainingDraw > 0) {
        fromTradPenalty = Math.min(currentTrad, remainingDraw);
        currentTrad -= fromTradPenalty;
        remainingDraw -= fromTradPenalty;
        penaltyAmount = fromTradPenalty * 0.10;
      }

      // Total Traditional = SEPP + Penalty
      fromTrad = fromTradSEPP + fromTradPenalty;

      if (remainingDraw > 0) {
        fromRoth = Math.min(currentRoth, remainingDraw);
        currentRoth -= fromRoth;
        remainingDraw -= fromRoth;
      }

      if (remainingDraw > 0) {
        fromHSA = Math.min(currentHSA, remainingDraw);
        currentHSA -= fromHSA;
        remainingDraw -= fromHSA;
      }

      // If we over-withdrew (due to mandatory SEPP), reinvest the excess to Brokerage
      if (remainingDraw < 0) {
        currentBrokerage += Math.abs(remainingDraw);
        remainingDraw = 0;
      }
    } else {
      // Standard Phase: Traditional IRA first (fill low tax brackets)
      // For age 73+: Must withdraw at least the RMD amount
      const minTradWithdrawal = Math.max(rmdAmount, 0);
      fromTrad = Math.max(minTradWithdrawal, Math.min(currentTrad, Math.max(0, remainingDraw)));
      fromTrad = Math.min(fromTrad, currentTrad); // Can't withdraw more than available
      currentTrad -= fromTrad;
      remainingDraw -= fromTrad;

      if (remainingDraw > 0) {
        fromBrokerage = Math.min(currentBrokerage, remainingDraw);
        currentBrokerage -= fromBrokerage;
        remainingDraw -= fromBrokerage;
      }

      if (remainingDraw > 0) {
        fromRoth = Math.min(currentRoth, remainingDraw);
        currentRoth -= fromRoth;
        remainingDraw -= fromRoth;
      }

      if (remainingDraw > 0) {
        fromHSA = Math.min(currentHSA, remainingDraw);
        currentHSA -= fromHSA;
        remainingDraw -= fromHSA;
      }

      // If we over-withdrew (due to mandatory RMD), reinvest the excess to Brokerage
      if (remainingDraw < 0) {
        currentBrokerage += Math.abs(remainingDraw);
        remainingDraw = 0;
      }
    }

    const totalAssets = currentBrokerage + currentTrad + currentRoth + currentHSA;

    // 4b. Calculate Estimated Tax for this Year
    const ordIncome = basePension + fromTrad; // Trad Withdrawals are ordinary income
    const qDivRatio = profile.income.qualifiedDividendRatio || 0.9;
    const ordDividends = currentDividends * (1 - qDivRatio);
    const qualDividends = currentDividends * qDivRatio;

    // Brokerage Withdrawals: Simplified assumption (50% is gain).
    // In a real app, we'd track basis depletion.
    const brokerageGain = fromBrokerage * 0.5;

    const totalOrdinaryForTax = ordIncome + ordDividends;
    const totalCapGainsForTax = qualDividends + brokerageGain;

    const taxableSS = calculateTaxableSocialSecurity(currentSS, totalOrdinaryForTax, profile.filingStatus);
    const stdDeduction = STANDARD_DEDUCTION[profile.filingStatus] +
      (age >= 65 ? AGE_DEDUCTION[profile.filingStatus] * (profile.filingStatus === FilingStatus.MarriedJoint ? 2 : 1) : 0);

    const estimatedTax = calculateFederalTax(totalOrdinaryForTax + taxableSS, totalCapGainsForTax, profile.filingStatus, stdDeduction);
    const totalCashFlow = fromBrokerage + fromTrad + fromRoth + fromHSA + totalFixedIncome;
    const effectiveTaxRate = totalCashFlow > 0 ? estimatedTax / totalCashFlow : 0;


    projection.push({
      age,
      year: i,
      totalAssets: Math.max(0, totalAssets),
      brokerage: currentBrokerage,
      traditionalIRA: currentTrad,
      rothIRA: currentRoth,
      hsa: currentHSA,
      withdrawal: fromBrokerage + fromTrad + fromRoth + fromHSA,
      // Breakdown of withdrawals
      withdrawalBrokerage: fromBrokerage,
      withdrawalTrad: fromTrad,
      withdrawalRoth: fromRoth,
      withdrawalHSA: fromHSA,
      // Income Sources
      socialSecurityIncome: currentSS,
      pensionIncome: basePension,
      dividendIncome: currentDividends,
      // RMD (age 73+)
      rmdAmount,
      // Early withdrawal tracking (age < 59.5)
      withdrawalTradSEPP: fromTradSEPP,
      withdrawalTradPenalty: fromTradPenalty,
      earlyWithdrawalPenalty: penaltyAmount,
      isDepleted: totalAssets <= 0,
      estimatedTax,
      effectiveTaxRate
    });

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
  activeSocialSecurityAmount?: number, // Optional override for the effective SS amount
  withdrawalRate?: number, // New: Safety check
  liquidityGapWarning?: boolean // New: Safety check
): RothConversionRecommendation => {
  const { age, filingStatus, assets, income } = profile;

  // Use the passed active SS amount or default to profile (logic should prefer the passed active amount)
  // If activeSocialSecurityAmount is defined, use it. Otherwise rely on profile check.
  const ssAmount = activeSocialSecurityAmount !== undefined ? activeSocialSecurityAmount : income.socialSecurity;

  // ========================================
  // SUSTAINABILITY OVERRIDE (Fiduciary Safety Check)
  // ========================================
  // If the user's withdrawal rate is dangerous (> 8%) or they are already facing liquidity gaps,
  // do NOT recommend paying more taxes via conversion. Cash preservation is priority.
  if ((withdrawalRate && withdrawalRate > 8.0) || liquidityGapWarning) {
    return {
      recommendedAmount: 0,
      effectiveMarginalRate: 0,
      constraints: [],
      bindingConstraint: null,
      reasoning: [
        `SUSTAINABILITY OVERRIDE: Roth conversion not recommended.`,
        liquidityGapWarning
          ? `You have an immediate liquidity gap ensuring early withdrawal penalties. Preserving cash is critical.`
          : `Current withdrawal rate (${withdrawalRate?.toFixed(1)}%) is critically high (>8%). Paying taxes now may make things worse.`
      ],
      warnings: ['Sustainability Risk: Portfolio depletion is imminent. Tax optimization is secondary to solvency.'],
      inTorpedoZone: false,
      torpedoMultiplier: 1.0,
    };
  }

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
