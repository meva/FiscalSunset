import { FireInputs, FireMilestone } from '../types/fire';

export const calculateFireMilestones = (inputs: FireInputs): FireMilestone[] => {
    const {
        annualSpending,
        totalAssets,
        annualSavings,
        rateOfReturn,
        inflationRate,
        currentAge,
        consultingIncome = 25000 // Default to 25k if not provided
    } = inputs;

    // Real rate of return for projection
    // Using Fisher equation: (1 + nominal) / (1 + inflation) - 1
    const realRate = (1 + rateOfReturn) / (1 + inflationRate) - 1;

    // 1. Calculate Targets in Today's Dollars
    // Note: We use today's dollars for targets to keep comparison simple against real-growth assets.

    const leanTarget = (annualSpending * 0.7) * 25;
    const standardTarget = annualSpending * 25;
    const fatTarget = (annualSpending * 1.5) * 33;

    // Barista FIRE: (Expenses - consultingIncome supplemental) / 0.04
    // If expenses < consultingIncome, this number is 0 or negative, implying instant barista FIRE.
    const baristaTarget = Math.max(0, (annualSpending - consultingIncome) / 0.04);

    // Coast FIRE target is dynamic based on age, but usually it means "Have enough now so that without contributing more, you hit Standard FIRE at retirement age".
    // The user prompt formula: StandardFIRE/(1+realRate)^yearsToRetirement
    // This varies by *when* you retire. Usually Coast FIRE implies a standard retirement age, e.g., 65 or 67.
    // If inputs.retirementAge is provided, we use it, otherwise default to 65 for Coast Calc.
    const coastRetirementAge = inputs.retirementAge || 65;
    const yearsToCoastRetirement = Math.max(0, coastRetirementAge - currentAge);
    const coastTarget = standardTarget / Math.pow(1 + realRate, yearsToCoastRetirement);

    const milestones: FireMilestone[] = [
        {
            type: 'Lean',
            targetAmount: leanTarget,
            description: 'Expenses reduced by 30%, 4% withdrawal rate',
            ageReached: null,
            yearReached: null,
            percentageProgress: 0,
        },
        {
            type: 'Barista',
            targetAmount: baristaTarget,
            description: `Expenses covered by 4% withdrawal + $${(consultingIncome / 1000).toLocaleString()}k part-time income`,
            ageReached: null,
            yearReached: null,
            percentageProgress: 0,
        },
        {
            type: 'Coast',
            targetAmount: coastTarget,
            description: `Invested assets grow to standard FIRE by age ${coastRetirementAge} without further contributions`,
            ageReached: null,
            yearReached: null,
            percentageProgress: 0,
        },
        {
            type: 'Standard',
            targetAmount: standardTarget,
            description: 'Full current expenses coverage at 4% withdrawal rate',
            ageReached: null,
            yearReached: null,
            percentageProgress: 0,
        },
        {
            type: 'Fat',
            targetAmount: fatTarget,
            description: 'Expenses increased by 50%, 3% conservative withdrawal rate',
            ageReached: null,
            yearReached: null,
            percentageProgress: 0,
        },
    ];

    // 2. Project Assets to find Age Reached
    // We project until age 100 to find when we cross thresholds.

    // Optimization: Sort milestones by target amount to check them in order? 
    // Not strictly necessary since we want to find the specific year for each.

    let currentSimAssets = totalAssets;
    let age = currentAge;
    const maxAge = 100;

    // We need to track which milestones are met
    const metMilestones = new Set<string>();

    // Check initial state
    milestones.forEach(m => {
        m.percentageProgress = Math.min(100, Math.round((currentSimAssets / m.targetAmount) * 100));
        if (currentSimAssets >= m.targetAmount) {
            m.ageReached = age;
            m.yearReached = new Date().getFullYear();
            metMilestones.add(m.type);
        }
    });

    const currentYear = new Date().getFullYear();

    while (age < maxAge && metMilestones.size < milestones.length) {
        age++;
        const year = currentYear + (age - currentAge);

        // Apply Growth + Contributions
        // Assuming contributions happen at end of year or spread out; typical approximation.
        currentSimAssets = currentSimAssets * (1 + realRate) + annualSavings;

        milestones.forEach(m => {
            if (!metMilestones.has(m.type)) {
                if (currentSimAssets >= m.targetAmount) {
                    m.ageReached = age;
                    m.yearReached = year;
                    metMilestones.add(m.type);
                }
            }
        });
    }

    // Sort by target amount for display logic usually, but keep specific order if desired.
    // The user prompt asked for specific types. Let's return them in the order of "easier to harder" usually? 
    // Or just defined order.
    // Let's sort by Target Amount ascending so the timeline makes sense visually.
    return milestones.sort((a, b) => a.targetAmount - b.targetAmount);
};
