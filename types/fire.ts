export interface FireInputs {
    currentAge: number;
    annualSpending: number;
    totalAssets: number;
    annualSavings: number; // Total contributions
    rateOfReturn: number;
    inflationRate: number;
    retirementAge?: number; // Optional target age for comparison
}

export type FireMilestoneType = 'Lean' | 'Standard' | 'Fat' | 'Coast' | 'Barista';

export interface FireMilestone {
    type: FireMilestoneType;
    targetAmount: number;
    ageReached: number | null; // null if never reached within reasonable timeframe (e.g., 100)
    yearReached: number | null;
    description: string;
    percentageProgress: number; // 0 to 100
}
