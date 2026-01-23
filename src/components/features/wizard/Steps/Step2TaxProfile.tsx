import React from 'react';
import { WizardState } from '../types';
import { FilingStatus } from '../../../../types';
import { Users, User, Heart } from 'lucide-react';

interface CheckProps {
    data: WizardState;
    update: (fields: Partial<WizardState>) => void;
}

const Step2TaxProfile: React.FC<CheckProps> = ({ data, update }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="text-center space-y-2">
                <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">How do you file your taxes?</h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    This determines your standard deduction and tax brackets, which are critical for an efficient plan.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                <button
                    onClick={() => update({ filingStatus: FilingStatus.Single })}
                    className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${data.filingStatus === FilingStatus.Single
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md transform scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 bg-white dark:bg-slate-800'
                        }`}
                >
                    <User className={`w-12 h-12 mb-3 ${data.filingStatus === FilingStatus.Single ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-lg text-slate-800 dark:text-white">Single</span>
                    <span className="text-xs text-slate-500 mt-1">Individual Filer</span>
                </button>

                <button
                    onClick={() => update({ filingStatus: FilingStatus.MarriedJoint })}
                    className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${data.filingStatus === FilingStatus.MarriedJoint
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md transform scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 bg-white dark:bg-slate-800'
                        }`}
                >
                    <Users className={`w-12 h-12 mb-3 ${data.filingStatus === FilingStatus.MarriedJoint ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-lg text-slate-800 dark:text-white">Married Filing Jointly</span>
                    <span className="text-xs text-slate-500 mt-1">Joint Return</span>
                </button>
            </div>
        </div>
    );
};

export default Step2TaxProfile;
