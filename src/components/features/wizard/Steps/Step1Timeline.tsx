import React from 'react';
import { WizardState } from '../types';
import { Calendar, AlertTriangle } from 'lucide-react';

interface CheckProps {
    data: WizardState;
    update: (fields: Partial<WizardState>) => void;
}

const Step1Timeline: React.FC<CheckProps> = ({ data, update }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="text-center space-y-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Let's start not with money, but with time.</h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Knowing your timeline helps us calculate how long your money needs to last and how much it can grow.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto pt-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Current Age
                    </label>
                    <input
                        type="number"
                        value={data.currentAge || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                // @ts-ignore - temporary allow empty string for UX
                                update({ currentAge: '' });
                            } else {
                                update({ currentAge: parseInt(val) });
                            }
                        }}
                        className="w-full text-center text-3xl font-bold p-4 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Age When You Want to Retire
                    </label>
                    <input
                        type="number"
                        value={data.retirementAge || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                // @ts-ignore - temporary allow empty string for UX
                                update({ retirementAge: '' });
                            } else {
                                update({ retirementAge: parseInt(val) });
                            }
                        }}
                        className={`w-full text-center text-3xl font-bold p-4 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 outline-none transition-all ${data.retirementAge < data.currentAge ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
                            }`}
                        placeholder="0"
                    />
                </div>
            </div>

            {data.retirementAge < data.currentAge && (
                <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-medium animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Retirement age cannot be less than current age</span>
                </div>
            )}
        </div>
    );
};

export default Step1Timeline;
