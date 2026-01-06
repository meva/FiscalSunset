import React from 'react';
import { WizardState } from '../types';
import { PlusCircle, Lock, Unlock, PieChart, AlertCircle } from 'lucide-react';

interface CheckProps {
    data: WizardState;
    update: (fields: Partial<WizardState>) => void;
}

const Step5Contributions: React.FC<CheckProps> = ({ data, update }) => {
    // Check if allocation exists, if not initialize it (could be done in parent, but safe here)
    const allocation = data.contributionAllocation || { taxDeferred: 50, taxable: 30, taxExempt: 20 };
    const { taxDeferred, taxable, taxExempt } = allocation;
    const total = taxDeferred + taxable + taxExempt;

    const handleAllocationChange = (field: keyof typeof allocation, val: number) => {
        update({
            contributionAllocation: {
                ...allocation,
                [field]: Math.max(0, Math.min(100, val))
            }
        });
    };

    const [displayValue, setDisplayValue] = React.useState(
        (data.totalAnnualContribution || 0).toLocaleString()
    );

    React.useEffect(() => {
        // Only update if the numeric value differs meaningful and not currently typing
        const num = data.totalAnnualContribution || 0;
        if (displayValue.replace(/,/g, '') !== num.toString()) {
            setDisplayValue(num.toLocaleString());
        }
    }, [data.totalAnnualContribution]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '');
        if (raw === '') {
            setDisplayValue('');
            update({ totalAnnualContribution: 0 });
            return;
        }
        if (!/^\d*$/.test(raw)) return;

        const val = parseInt(raw, 10);
        setDisplayValue(Number(raw).toLocaleString());
        update({ totalAnnualContribution: val });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="text-center space-y-2">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlusCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Annual Contributions</h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    How much are you saving each year, and where is it going?
                </p>
            </div>

            <div className="max-w-xl mx-auto space-y-6 pt-2">
                {/* Total Contribution Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-center">
                        Total Annual Savings
                    </label>
                    <div className="relative max-w-xs mx-auto">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                            type="text"
                            value={displayValue}
                            onChange={handleAmountChange}
                            className="w-full text-center text-2xl font-bold p-3 pl-8 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 my-4"></div>

                {/* Tax Deferred */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-orange-500" />
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Tax-Deferred</div>
                            <span className="text-xs text-slate-400">(401k/Traditional IRA)</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-indigo-600 text-lg">{taxDeferred}%</div>
                            <div className="text-xs text-slate-500 font-medium">
                                ${((data.totalAnnualContribution || 0) * (taxDeferred / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={taxDeferred}
                        onChange={(e) => handleAllocationChange('taxDeferred', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                {/* Taxable */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Unlock className="w-4 h-4 text-blue-500" />
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Taxable</div>
                            <span className="text-xs text-slate-400">(Brokerage)</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-indigo-600 text-lg">{taxable}%</div>
                            <div className="text-xs text-slate-500 font-medium">
                                ${((data.totalAnnualContribution || 0) * (taxable / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={taxable}
                        onChange={(e) => handleAllocationChange('taxable', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                {/* Tax Exempt */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-green-500" />
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Tax-Exempt</div>
                            <span className="text-xs text-slate-400">(Roth IRA/401k)</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-indigo-600 text-lg">{taxExempt}%</div>
                            <div className="text-xs text-slate-500 font-medium">
                                ${((data.totalAnnualContribution || 0) * (taxExempt / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={taxExempt}
                        onChange={(e) => handleAllocationChange('taxExempt', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                <div className={`p-3 rounded-lg flex items-center justify-between transition-colors ${total === 100 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                        {total !== 100 && <AlertCircle className="w-4 h-4" />}
                        <span>Total Allocation: {total}%</span>
                    </div>
                    {total !== 100 && <span className="text-xs font-medium">Must equal 100%</span>}
                </div>
            </div>
        </div>
    );
};

export default Step5Contributions;
