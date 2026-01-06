import { UserProfile, FilingStatus } from '../../types';
import { WizardState } from './types';

export const mapWizardStateToProfile = (wizardState: WizardState, currentProfile: UserProfile): UserProfile => {
    const { totalAssets, assetAllocation, currentAge, retirementAge, filingStatus, annualSpending } = wizardState;

    // Calculate asset values based on percentages
    const traditionalIRA = totalAssets * (assetAllocation.taxDeferred / 100);
    const brokerage = totalAssets * (assetAllocation.taxable / 100);
    const rothIRA = totalAssets * (assetAllocation.taxExempt / 100);

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
        // Resetting contributions to 0 as the wizard doesn't ask for them. 
        // This is safer than keeping old values if the user is starting fresh.
        contributions: {
            traditionalIRA: 0,
            rothIRA: 0,
            brokerage: 0,
            hsa: 0,
        },
        // Keeping existing income or resetting? 
        // Requirement says: "Income: Social Security and other income sources will default to 0 or estimated defaults"
        // Let's reset to 0 to be clean.
        income: {
            socialSecurity: 0,
            pension: 0,
            brokerageDividends: 0,
            qualifiedDividendRatio: 0.9,
        },
        // Build default assumptions if needed, or keep existing ones. 
        // Keeping existing assumptions is usually better as they are often global defaults.
    };
};
