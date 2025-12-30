import { UserProfile, StrategyResult, WithdrawalSource, FilingStatus, LongevityResult, YearProjection, Assets } from '../types';
import { STANDARD_DEDUCTION, AGE_DEDUCTION, TAX_BRACKETS, CAP_GAINS_BRACKETS, UNIFORM_LIFETIME_TABLE, RMD_START_AGE } from '../constants';

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

    lastResult = {
        totalWithdrawal: grossCash,
        gapFilled: gap <= 0,
        withdrawalPlan,
        rothConversionAmount: 0, 
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
    runningAssets = runningAssets * (1 + profile.assumptions.rateOfReturn) - currentDraw;
    currentDraw *= (1 + profile.assumptions.inflationRate);
  }

  return { projection, depletionAge, initialWithdrawalRate, sustainable: initialWithdrawalRate <= 0.05 };
};
