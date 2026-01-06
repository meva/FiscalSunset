import React, { useEffect } from 'react';
import { WizardState } from '../types';
import { PieChart, Lock, Unlock, AlertCircle } from 'lucide-react';

interface CheckProps {
    data: WizardState;
    update: (fields: Partial<WizardState>) => void;
}

const Step4Diversification: React.FC<CheckProps> = ({ data, update }) => {
    const { taxDeferred, taxable, taxExempt } = data.assetAllocation;
    const total = taxDeferred + taxable + taxExempt;

    // Helper to update one field and try to balance others (simple version: just update, warn if != 100)
    // For a 60-second wizard, inputs with validation are often faster than fighting with 3 interconnected sliders.
    const handleChange = (field: keyof typeof data.assetAllocation, val: number) => {
        update({
            assetAllocation: {
                ...data.assetAllocation,
                [field]: Math.max(0, Math.min(100, val))
            }
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="text-center space-y-2">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PieChart className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">How is your portfolio diversified?</h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Different account types have different tax rules. Give us a rough estimate.
                </p>
            </div>

            <div className="max-w-xl mx-auto space-y-4 pt-2">
                {/* Tax Deferred */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-orange-500" />
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Tax-Deferred</div>
                            <span className="text-xs text-slate-400">(Traditional IRA/401k)</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-indigo-600 text-lg">{taxDeferred}%</div>
                            <div className="text-xs text-slate-500 font-medium">
                                ${(data.totalAssets * (taxDeferred / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={taxDeferred}
                        onChange={(e) => handleChange('taxDeferred', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                {/* Taxable */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Unlock className="w-4 h-4 text-blue-500" />
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Taxable</div>
                            <span className="text-xs text-slate-400">(Brokerage, Joint)</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-indigo-600 text-lg">{taxable}%</div>
                            <div className="text-xs text-slate-500 font-medium">
                                ${(data.totalAssets * (taxable / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={taxable}
                        onChange={(e) => handleChange('taxable', parseInt(e.target.value))}
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
                                ${(data.totalAssets * (taxExempt / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={taxExempt}
                        onChange={(e) => handleChange('taxExempt', parseInt(e.target.value))}
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

export default Step4Diversification;
