import { UserProfile, FilingStatus } from '../../types';
import { WizardState } from './types';

export const mapWizardStateToProfile = (wizardState: WizardState, currentProfile: UserProfile): UserProfile => {
    const {
        totalAssets, assetAllocation, currentAge, retirementAge, filingStatus, annualSpending,
        totalAnnualContribution, contributionAllocation, futureIncome
    } = wizardState;

    // Calculate asset values based on percentages
    const traditionalIRA = totalAssets * (assetAllocation.taxDeferred / 100);
    const brokerage = totalAssets * (assetAllocation.taxable / 100);
    const rothIRA = totalAssets * (assetAllocation.taxExempt / 100);

    // Calculate contribution values based on percentages
    const contribTraditional = totalAnnualContribution * (contributionAllocation.taxDeferred / 100);
    const contribBrokerage = totalAnnualContribution * (contributionAllocation.taxable / 100);
    const contribRoth = totalAnnualContribution * (contributionAllocation.taxExempt / 100);

    return {
        ...currentProfile,
        age: retirementAge,
        baseAge: currentAge,
        filingStatus: filingStatus,
        spendingNeed: annualSpending,
        isSpendingReal: true, // Defaulting to today's dollars as per requirements
        assets: {
            ...currentProfile.assets,
            traditionalIRA,
            rothIRA,
            brokerage,
            hsa: 0, // Defaulting HSA to 0 as it's not asked in the wizard
        },
        // Map contributions
        contributions: {
            traditionalIRA: contribTraditional,
            rothIRA: contribRoth,
            brokerage: contribBrokerage,
            hsa: 0,
        },
        // Map income
        income: {
            socialSecurity: futureIncome.socialSecurity,
            pension: futureIncome.pension,
            brokerageDividends: 0, // Keeping this 0 as it's harder to estimate simple %
            qualifiedDividendRatio: 0.9,
        },
        // Build default assumptions if needed, or keep existing ones. 
        // Keeping existing assumptions is usually better as they are often global defaults.
    };
};
