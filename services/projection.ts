import { Assets, ContributionAllocation, MarketAssumptions } from '../types';

/**
 * Projects assets from current age to retirement age using compound interest and annual contributions.
 * Returns the projected assets in NOMINAL dollars at the time of retirement.
 */
export const projectAssets = (
    currentAssets: Assets,
    annualContribution: number,
    allocation: ContributionAllocation,
    currentAge: number,
    retirementAge: number,
    assumptions: MarketAssumptions
): Assets => {
    const yearsToInvest = Math.max(0, retirementAge - currentAge);

    // If already retired or no time to invest, return current assets
    if (yearsToInvest <= 0) {
        return { ...currentAssets };
    }

    let balTrad = currentAssets.traditionalIRA;
    let balRoth = currentAssets.rothIRA;
    let balBrok = currentAssets.brokerage;
    let balHSA = currentAssets.hsa;

    // Calculate annual contribution amounts based on allocation percentages
    const contribTrad = annualContribution * (allocation.taxDeferred / 100);
    const contribRoth = annualContribution * (allocation.taxExempt / 100);
    const contribBrok = annualContribution * (allocation.taxable / 100);
    // Assuming 0% allocated to HSA by default in the simplified Wizard flow, 
    // unless we mapped it. The Wizard currently only has 3 buckets (Def, Taxable, Exempt).
    // "Exempt" maps to Roth in Wizard usually, but let's check mapping. 
    // Users can't explicitly allocate to HSA in the Wizard slider currently.

    for (let i = 1; i <= yearsToInvest; i++) {
        // Apply Growth
        balTrad = balTrad * (1 + assumptions.rateOfReturn) + contribTrad;
        balRoth = balRoth * (1 + assumptions.rateOfReturn) + contribRoth;
        balBrok = balBrok * (1 + assumptions.rateOfReturn) + contribBrok;
        balHSA = balHSA * (1 + assumptions.rateOfReturn); // No new HSA contribs in simplified wizard
    }

    return {
        traditionalIRA: balTrad,
        rothIRA: balRoth,
        brokerage: balBrok,
        hsa: balHSA
    };
};
