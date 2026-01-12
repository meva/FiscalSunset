import React from 'react';
import { WizardState } from '../types';
import { calculateStrategy, calculateLongevity } from '../../../services/calculationEngine';
import { mapWizardStateToProfile } from '../wizardMapper';
import { UserProfile, FilingStatus } from '../../../types';
import { RotateCcw } from 'lucide-react';
import { projectAssets } from '../../../services/projection';

interface CheckProps {
    data: WizardState;
    onComplete: (finalProfile: UserProfile, destination: 'accumulation' | 'withdrawal') => void;
    onRestart: () => void;
}

const DUMMY_PROFILE: UserProfile = {
    age: 65, baseAge: 55, filingStatus: FilingStatus.Single,
    spendingNeed: 0, isSpendingReal: true,
    assets: { traditionalIRA: 0, rothIRA: 0, brokerage: 0, hsa: 0 },
    contributions: { traditionalIRA: 0, rothIRA: 0, brokerage: 0, hsa: 0 },
    income: { socialSecurity: 0, pension: 0, brokerageDividends: 0, qualifiedDividendRatio: 0 },
    assumptions: {
        inflationRate: 0.03,
        rateOfReturn: 0.07,
        inflationRateInRetirement: 0.03,
        rateOfReturnInRetirement: 0.05
    }
};

const Step8Results: React.FC<CheckProps> = ({ data, onComplete, onRestart }) => {
    // 1. Map Wizard State to Base Profile
    const baseProfile = mapWizardStateToProfile(data, DUMMY_PROFILE);

    // 2. Project Assets to Retirement Age (Future Value)
    // The Wizard collects "Current" assets, but we need to know what they will be
    // at the start of retirement to run the withdrawal strategy correctly.
    const projectedAssets = projectAssets(
        baseProfile.assets,
        baseProfile.contributions.traditionalIRA + baseProfile.contributions.rothIRA + baseProfile.contributions.brokerage, // Total annual contrib
        data.contributionAllocation || { taxDeferred: 50, taxable: 30, taxExempt: 20 }, // Allocation %
        baseProfile.baseAge, // Current Age
        baseProfile.age,     // Retirement Age
        baseProfile.assumptions
    );

    // 4. Run Strategy on Projected Profile for PREVIEW
    // We create a temporary retirement profile just for the wizard result screen
    // so the user sees "Success" or "Failure" based on the future projection.
    const retirementProfile = {
        ...baseProfile,
        baseAge: baseProfile.age, // Fast-forward "Current Age" -> "Retirement Age"
        assets: projectedAssets,  // Use Projected Future Value
        contributions: {          // Zero out contributions as we are now "Retired"
            traditionalIRA: 0,
            rothIRA: 0,
            brokerage: 0,
            hsa: 0
        }
    };

    const strategy = calculateStrategy(retirementProfile);
    const longevity = calculateLongevity(retirementProfile, strategy);
    const [confirmRestart, setConfirmRestart] = React.useState(false);

    // 5. Determine Success
    // If depletionAge is null (never runs out) or >= 95, we consider it a success for the wizard.
    const isSuccess = !longevity.depletionAge || longevity.depletionAge >= 95;

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 text-center">
            <div className="space-y-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                    <span className="text-4xl">{isSuccess ? '🎉' : '⚠️'}</span>
                </div>

                {data.retirementAge > data.currentAge && (
                    <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg max-w-sm mx-auto">
                        Projection includes <strong>{data.retirementAge - data.currentAge} years</strong> of growth
                        on your current ${data.totalAssets.toLocaleString()} portfolio.
                    </p>
                )}

                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {isSuccess ? 'You look on track!' : 'Adjustments needed.'}
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                    Based on your inputs, your assets are projected to last until age <span className={`font-bold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                        {longevity.depletionAge || '95+'}
                    </span>.
                </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-600 dark:text-slate-400">Projected Monthly Spend</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        ${Math.round(strategy.totalWithdrawal / 12).toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-600 dark:text-slate-400">Money Last Until</span>
                    <span className={`text-2xl font-bold ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
                        Age {longevity.depletionAge || '95+'}
                    </span>
                </div>
                <div className="text-xs text-center text-slate-400 mt-4">
                    *Estimates based on {data.currentAge === data.retirementAge ? 'immediate retirement' : `retiring at ${data.retirementAge}`}.
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 max-w-md mx-auto">
                {/* Primary Actions */}
                <button
                    onClick={() => onComplete(baseProfile, 'withdrawal')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                    Review Withdrawal Strategy
                </button>

                <button
                    onClick={() => onComplete(baseProfile, 'accumulation')}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-6 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                    Review Accumulation Plan
                </button>

                {/* Restart Option */}
                <div className="mt-2 text-center">
                    {confirmRestart ? (
                        <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 py-2">
                            <span className="text-sm text-slate-500 font-medium">Reset wizard?</span>
                            <button
                                onClick={onRestart}
                                className="text-red-600 text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold transition-colors"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setConfirmRestart(false)}
                                className="text-slate-600 text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmRestart(true)}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 text-sm font-medium flex items-center justify-center gap-2 px-4 py-2 transition-colors mx-auto"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Restart Wizard
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Step8Results;
