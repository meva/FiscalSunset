export const projectAssets = (
    currentAssets: Assets,
    annualContributions: Contributions,
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
    let balRothBasis = currentAssets.rothBasis;

    for (let i = 1; i <= yearsToInvest; i++) {
        // Apply Growth
        balTrad = balTrad * (1 + assumptions.rateOfReturn) + annualContributions.traditionalIRA;
        balRoth = balRoth * (1 + assumptions.rateOfReturn) + annualContributions.rothIRA;
        balBrok = balBrok * (1 + assumptions.rateOfReturn) + annualContributions.brokerage;
        balHSA = balHSA * (1 + assumptions.rateOfReturn) + annualContributions.hsa;

        // Roth Basis accumulates contributions (tax-free checks typically look at basis)
        balRothBasis = balRothBasis + annualContributions.rothIRA;
    }

    return {
        traditionalIRA: balTrad,
        rothIRA: balRoth,
        rothBasis: balRothBasis,
        brokerage: balBrok,
        hsa: balHSA
    };
};
