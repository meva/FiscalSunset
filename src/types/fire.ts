export interface FireInputs {
    currentAge: number;
    annualSpending: number;
    totalAssets: number;
    annualSavings: number; // Total contributions
    rateOfReturn: number;
    inflationRate: number;
    retirementAge?: number; // Optional target age for comparison
    consultingIncome?: number; // Optional consulting/side income for Barista FIRE
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
