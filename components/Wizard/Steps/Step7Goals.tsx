import React, { useState, useEffect } from 'react';
import { WizardState } from '../types';
import { Target, TrendingUp } from 'lucide-react';

interface CheckProps {
    data: WizardState;
    update: (fields: Partial<WizardState>) => void;
}

const Step7Goals: React.FC<CheckProps> = ({ data, update }) => {
    const [displayValue, setDisplayValue] = useState(data.annualSpending.toLocaleString());

    // Sync only when data.annualSpending changes externally AND differs from display (to avoid cursor jumps)
    useEffect(() => {
        // If the number value matches what we have in display (ignoring format), don't overwrite
        // This is simple sync.
        if (data.annualSpending.toLocaleString() !== displayValue && displayValue !== '') {
            setDisplayValue(data.annualSpending.toLocaleString());
        }
    }, [data.annualSpending]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '');

        if (raw === '') {
            setDisplayValue('');
            update({ annualSpending: 0 });
            return;
        }

        if (!/^\d*$/.test(raw)) return;

        setDisplayValue(Number(raw).toLocaleString());
        update({ annualSpending: Number(raw) });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="text-center space-y-2">
                <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">What is your target annual spending?</h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    In today's dollars. We will adjust for inflation automatically.
                </p>
            </div>

            <div className="max-w-md mx-auto pt-6">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-2xl">$</span>
                    <input
                        type="text"
                        value={displayValue}
                        onChange={handleChange}
                        className="w-full text-center text-4xl font-bold p-6 pl-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                        placeholder="0"
                    />
                </div>

                <div className="mt-8 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-slate-400 mt-1" />
                        <div className="text-sm text-slate-600 dark:text-slate-400 text-left">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Rule of Thumb:</span> Most retirees spend about 70-80% of their pre-retirement income, but active retirements (travel, hobbies) may require 100% or more.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step7Goals;
