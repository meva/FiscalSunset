import React from 'react';
import { TAX_BRACKETS, CAP_GAINS_BRACKETS, STANDARD_DEDUCTION, AGE_DEDUCTION } from '../constants';
import { FilingStatus } from '../types';
import { Table, Info } from 'lucide-react';

const TaxReference: React.FC = () => {
  const cardClass = "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors";
  const headerClass = "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4";
  const subHeaderClass = "text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2";
  const tableHeadClass = "text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-800";
  const tableCellClass = "px-6 py-4";
  const tableRowClass = "bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors";
  const boxClass = "bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors";

  return (
    <div className="space-y-6">
        <div className={cardClass}>
            <h2 className={headerClass}>
                <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                2025 Tax Brackets (Estimated)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                These are the federal tax figures used by the application to calculate your withdrawal strategy.
            </p>

            <div className="space-y-8">
                {/* Standard Deductions */}
                <div>
                    <h3 className={subHeaderClass}>Standard Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={boxClass}>
                            <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">Single</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">${STANDARD_DEDUCTION[FilingStatus.Single].toLocaleString()}</span>
                            <span className="block text-xs text-green-700 dark:text-green-400 mt-1">+ ${AGE_DEDUCTION[FilingStatus.Single].toLocaleString()} if Age 65+</span>
                        </div>
                        <div className={boxClass}>
                            <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">Married Filing Jointly</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">${STANDARD_DEDUCTION[FilingStatus.MarriedJoint].toLocaleString()}</span>
                            <span className="block text-xs text-green-700 dark:text-green-400 mt-1">+ ${AGE_DEDUCTION[FilingStatus.MarriedJoint].toLocaleString()} per person Age 65+</span>
                        </div>
                    </div>
                </div>

                {/* Ordinary Income Brackets */}
                <div>
                    <h3 className={subHeaderClass}>Ordinary Income Tax Brackets</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                            <thead className={tableHeadClass}>
                                <tr>
                                    <th className="px-6 py-3 rounded-l-lg">Tax Rate</th>
                                    <th className="px-6 py-3">Single Taxable Income</th>
                                    <th className="px-6 py-3 rounded-r-lg">Married Joint Taxable Income</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TAX_BRACKETS[FilingStatus.Single].map((singleBracket, index) => {
                                    const marriedBracket = TAX_BRACKETS[FilingStatus.MarriedJoint][index];
                                    const prevSingle = index === 0 ? 0 : TAX_BRACKETS[FilingStatus.Single][index - 1].limit;
                                    const prevMarried = index === 0 ? 0 : TAX_BRACKETS[FilingStatus.MarriedJoint][index - 1].limit;
                                    
                                    const formatRange = (prev: number, limit: number) => {
                                        if (limit === Infinity) return `Over $${prev.toLocaleString()}`;
                                        return `$${(prev + 1).toLocaleString()} - $${limit.toLocaleString()}`;
                                    };

                                    return (
                                        <tr key={index} className={tableRowClass}>
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{(singleBracket.rate * 100)}%</td>
                                            <td className={tableCellClass}>{formatRange(prevSingle, singleBracket.limit)}</td>
                                            <td className={tableCellClass}>{formatRange(prevMarried, marriedBracket.limit)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Capital Gains Brackets */}
                 <div>
                    <h3 className={subHeaderClass}>Long-Term Capital Gains Tax Brackets</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                            <thead className={tableHeadClass}>
                                <tr>
                                    <th className="px-6 py-3 rounded-l-lg">Tax Rate</th>
                                    <th className="px-6 py-3">Single Taxable Income</th>
                                    <th className="px-6 py-3 rounded-r-lg">Married Joint Taxable Income</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CAP_GAINS_BRACKETS[FilingStatus.Single].map((singleBracket, index) => {
                                    const marriedBracket = CAP_GAINS_BRACKETS[FilingStatus.MarriedJoint][index];
                                    const prevSingle = index === 0 ? 0 : CAP_GAINS_BRACKETS[FilingStatus.Single][index - 1].limit;
                                    const prevMarried = index === 0 ? 0 : CAP_GAINS_BRACKETS[FilingStatus.MarriedJoint][index - 1].limit;
                                    
                                    const formatRange = (prev: number, limit: number) => {
                                        // Special case for 0 bracket usually starts at 0
                                        const start = index === 0 ? 0 : prev + 1;
                                        if (limit === Infinity) return `Over $${prev.toLocaleString()}`;
                                        return `$${start.toLocaleString()} - $${limit.toLocaleString()}`;
                                    };

                                    return (
                                        <tr key={index} className={tableRowClass}>
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{(singleBracket.rate * 100)}%</td>
                                            <td className={tableCellClass}>{formatRange(prevSingle, singleBracket.limit)}</td>
                                            <td className={tableCellClass}>{formatRange(prevMarried, marriedBracket.limit)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm transition-colors">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                    <strong>Note on Taxable Income:</strong> Capital gains sit "on top" of ordinary income. 
                    This means your ordinary income (Wages, IRA withdrawals, RMDs) fills up the lower brackets first. 
                    Capital gains are then taxed at the rate corresponding to the total income level.
                    <br/><br/>
                    The app uses these brackets automatically. They are currently read-only to ensure calculation accuracy.
                </p>
            </div>

        </div>
    </div>
  );
};

export default TaxReference;