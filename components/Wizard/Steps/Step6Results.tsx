import React, { useMemo } from 'react';
import { WizardState } from '../types';
import { calculateStrategy, calculateLongevity } from '../../../services/calculationEngine';
import { mapWizardStateToProfile } from '../wizardMapper';
import { UserProfile, FilingStatus } from '../../../types'; // Import necessary types
import { CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

interface CheckProps {
    data: WizardState;
    onComplete: () => void;
}

// Dummy profile for mapping context
const DUMMY_PROFILE: UserProfile = {
    age: 65, baseAge: 55, filingStatus: FilingStatus.Single,
    spendingNeed: 0, isSpendingReal: true,
    assets: { traditionalIRA: 0, rothIRA: 0, brokerage: 0, hsa: 0 },
    contributions: { traditionalIRA: 0, rothIRA: 0, brokerage: 0, hsa: 0 },
    income: { socialSecurity: 0, pension: 0, brokerageDividends: 0, qualifiedDividendRatio: 0 },
    assumptions: { inflationRate: 0.03, rateOfReturn: 0.07 }
};

const Step6Results: React.FC<CheckProps> = ({ data, onComplete }) => {
    const result = useMemo(() => {
        try {
            const profile = mapWizardStateToProfile(data, DUMMY_PROFILE);
            const strategy = calculateStrategy(profile);
            const longevity = calculateLongevity(profile, strategy);
            return { longevity, profile };
        } catch (e) {
            console.error(e);
            return null;
        }
    }, [data]);

    if (!result) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>;

    const { longevity, profile } = result;
    const depletionAge = longevity.depletionAge;
    const isSustainable = longevity.sustainable;
    const lastAge = longevity.projection[longevity.projection.length - 1].age;
    const finalAge = depletionAge || lastAge;

    const isHealthy = finalAge >= 90;

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 text-center">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Analysis Complete</h2>
                <p className="text-slate-600 dark:text-slate-300">
                    Based on your inputs, here is your projected financial runway.
                </p>
            </div>

            <div className={`mx-auto w-64 h-64 rounded-full flex flex-col items-center justify-center border-8 shadow-xl transition-all ${isHealthy
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                }`}>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Assets Last Until</div>
                <div className={`text-6xl font-black ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {isSustainable ? '95+' : finalAge}
                </div>
                <div className="text-sm font-medium text-slate-400 mt-1">Years Old</div>
            </div>

            <div className="max-w-md mx-auto">
                <div className={`p-4 rounded-xl border ${isHealthy
                        ? 'bg-green-100 border-green-200 text-green-800'
                        : 'bg-amber-100 border-amber-200 text-amber-800'
                    } flex items-start gap-3 text-left`}>
                    {isHealthy ? <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />}
                    <div className="text-sm">
                        {isHealthy
                            ? "You are on track! Your portfolio is projected to last well into your 90s."
                            : "Caution advised. Your portfolio may deplete prematurely. You may need to adjust your spending or retirement age in the main app."}
                    </div>
                </div>
            </div>

            <button
                onClick={onComplete}
                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto text-lg"
            >
                See Detailed Plan
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Step6Results;
