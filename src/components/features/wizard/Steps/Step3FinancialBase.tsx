import React, { useState, useEffect } from 'react';
import { WizardState } from '../types';
import { DollarSign, PieChart } from 'lucide-react';

interface CheckProps {
    data: WizardState;
    update: (fields: Partial<WizardState>) => void;
}

const Step3FinancialBase: React.FC<CheckProps> = ({ data, update }) => {
    // Local state for formatted input
    const [displayValue, setDisplayValue] = useState(data.totalAssets.toLocaleString());

    useEffect(() => {
        setDisplayValue(data.totalAssets.toLocaleString());
    }, [data.totalAssets]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '');
        if (!/^\d*$/.test(raw)) return;

        setDisplayValue(Number(raw).toLocaleString());
        update({ totalAssets: Number(raw) });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="text-center space-y-2">
                <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">What is your total investable household portfolio?</h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Include all retirement accounts (IRAs, 401ks) and taxable brokerage accounts. Do not include your primary home value.
                </p>
            </div>

            <div className="max-w-md mx-auto pt-6">
                <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-8 h-8" />
                    <input
                        type="text"
                        value={displayValue}
                        onChange={handleChange}
                        className="w-full text-center text-4xl font-bold p-6 pl-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
                        placeholder="0"
                    />
                </div>
                <div className="text-center mt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 inline-block px-3 py-1 rounded-full">
                        We'll split this up in the next step.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Step3FinancialBase;
