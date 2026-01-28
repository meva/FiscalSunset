import React, { useState, useMemo } from 'react';
import { UserProfile, Contributions, FilingStatus } from '../../types';
import { projectAssets } from '../../services/projection';
import { calculateStrategy, calculateLongevity } from '../../services/calculationEngine';
import { TrendingUp, DollarSign, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, CartesianGrid, ComposedChart, Line } from 'recharts';

interface WhatIfAnalysisProps {
    profile: UserProfile;
    isDarkMode: boolean;
}

// --- Reusable Input Component (Matching InputSection.tsx) ---
const FormattedNumberInput = ({ value, onChange, className, id }: { value: number; onChange: (val: number) => void; className?: string; id?: string }) => {
    const [displayValue, setDisplayValue] = useState(value.toLocaleString());
    const lastExternalValue = React.useRef(value);

    React.useEffect(() => {
        if (value !== lastExternalValue.current) {
            setDisplayValue(value.toLocaleString());
            lastExternalValue.current = value;
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '');
        if (!/^\d*$/.test(raw)) return;

        const newVal = raw === '' ? 0 : Number(raw);
        setDisplayValue(newVal.toLocaleString());
        lastExternalValue.current = newVal;
        onChange(newVal);
    };

    return <input id={id} type="text" value={displayValue} onChange={handleChange} className={className} />;
};



const WhatIfAnalysis: React.FC<WhatIfAnalysisProps> = ({ profile, isDarkMode }) => {
    // Scenario State
    const [scenarioContributions, setScenarioContributions] = useState<Contributions>({ ...profile.contributions });

    // Styles matching InputSection
    const inputClass = "w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 transition-colors";
    const iconClass = "absolute left-3 top-2 text-slate-400 dark:text-slate-500";

    // --- Run Simulations ---
    const runSimulation = (contributions: Contributions) => {
        // 1. Project assets to retirement
        const retirementProfile = { ...profile };

        // If we have time to invest, project forward
        if (profile.age > profile.baseAge) {
            // Apply Spending Inflation if needed (MATCHING APP.TSX LOGIC)
            let projectedSpendingNeed = profile.spendingNeed;
            if (profile.isSpendingReal) {
                projectedSpendingNeed = profile.spendingNeed * Math.pow(1 + profile.assumptions.inflationRate, profile.age - profile.baseAge);
            }
            retirementProfile.spendingNeed = projectedSpendingNeed;
            retirementProfile.isSpendingReal = false; // Converted to nominal

            const projectedRothBasis = profile.assets.rothBasis + (contributions.rothIRA * (profile.age - profile.baseAge));
            const projectedAssets = projectAssets(
                profile.assets,
                contributions,
                profile.baseAge,
                profile.age,
                profile.assumptions
            );

            retirementProfile.assets = { ...projectedAssets, rothBasis: projectedRothBasis };
            retirementProfile.baseAge = profile.age; // Shift base to retirement start
            // Use retirement assumptions
            retirementProfile.assumptions = {
                ...profile.assumptions,
                inflationRate: profile.assumptions.inflationRateInRetirement,
                rateOfReturn: profile.assumptions.rateOfReturnInRetirement
            };
        }

        // 2. Calculate Strategy (Year 1)
        const strategy = calculateStrategy(retirementProfile);

        // 3. Calculate Longevity (Lifetime)
        const longevity = calculateLongevity(retirementProfile, strategy);

        // 4. Aggregate Metrics
        const totalTaxPaid = longevity.projection.reduce((sum, year) => sum + (year.estimatedTax || 0), 0);

        // Find Ending Balance SPECIFICALLY at Age 100
        const age100Entry = longevity.projection.find(p => p.age === 100);
        const endingBalance = age100Entry ? age100Entry.totalAssets : 0;

        const depletionAge = longevity.depletionAge;

        // Discount Factors for Present Value
        const yearsToAge100 = 100 - profile.baseAge;
        const finalDiscountFactor = Math.pow(1 + profile.assumptions.inflationRate, yearsToAge100);
        const endingBalancePV = endingBalance / finalDiscountFactor;

        // Diagnostic Assets
        const projectionStartAssets = retirementProfile.assets.traditionalIRA + retirementProfile.assets.rothIRA + retirementProfile.assets.brokerage + retirementProfile.assets.hsa;

        return {
            totalTaxPaid,
            endingBalance,
            endingBalancePV,
            depletionAge,
            projectionStartAssets,
            projection: longevity.projection
        };
    };

    const currentResult = useMemo(() => runSimulation(profile.contributions), [profile]);
    const scenarioResult = useMemo(() => runSimulation(scenarioContributions), [profile, scenarioContributions]);

    // --- Comparison Data ---
    const mergedProjection = useMemo(() => {
        const currentData = currentResult.projection || [];
        const scenarioData = scenarioResult.projection || [];

        // Find common age range
        const ages = Array.from(new Set([
            ...currentData.map(p => p.age),
            ...scenarioData.map(p => p.age)
        ])).sort((a, b) => a - b);

        return ages.map(age => {
            const currentYear = currentData.find(p => p.age === age);
            const scenarioYear = scenarioData.find(p => p.age === age);
            return {
                age,
                currentTax: currentYear?.estimatedTax || 0,
                scenarioTax: scenarioYear?.estimatedTax || 0,
                currentAssets: currentYear?.totalAssets || 0,
                scenarioAssets: scenarioYear?.totalAssets || 0
            };
        });
    }, [currentResult.projection, scenarioResult.projection]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    // --- Input Handlers ---
    const handleContributionChange = (key: keyof Contributions, val: number) => {
        setScenarioContributions(prev => ({ ...prev, [key]: val }));
    };

    const handleReset = () => {
        setScenarioContributions({ ...profile.contributions });
    };

    const ScenarioExplanationBanner = () => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors mb-6">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-indigo-500"><RefreshCw className="w-5 h-5" /></span>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">How is this calculated?</h2>
                    </div>
                    {isOpen ? (
                        <TrendingUp className="w-5 h-5 text-slate-400 transform rotate-180" />
                    ) : (
                        <TrendingUp className="w-5 h-5 text-slate-400" />
                    )}
                </button>
                {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p>This tool projects your portfolio growth and withdrawal strategies to compare the long-term impact of different accumulation choices.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Total Tax Paid</h4>
                                <p className="mb-2">The sum of all estimated federal taxes paid during retirement.</p>
                                <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                                    <li>Traditional Withdrawals: Taxed as Ordinary Income</li>
                                    <li>Brokerage Withdrawals: Taxed as Capital Gains (assumes 50% gain, long-term rates)</li>
                                    <li>Roth/HSA Withdrawals: Tax-Free</li>
                                </ul>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Ending Balance (Age 100)</h4>
                                <p className="mb-2">The projected total portfolio value specifically at Age 100.</p>
                                <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                                    <li>If portfolio depletes before 100, this is $0.</li>
                                    <li>Adjusted for inflation to show "Present Value" (Today's buying power) for realistic comparison.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <ScenarioExplanationBanner />

            {/* Header / Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-indigo-600" />
                        What-If Scenarios
                    </h2>
                    <button
                        onClick={handleReset}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                    >
                        Reset to Actual
                    </button>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Adjust your savings strategy to see how prioritizing different accounts affects your **Total Lifetime Taxes** and **Ending Wealth**.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Comparison Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tax Paid</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white mb-2">{formatCurrency(currentResult.totalTaxPaid)}</div>

                            <div className="flex items-center gap-2 text-sm">
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                                <span className={`font-bold ${scenarioResult.totalTaxPaid < currentResult.totalTaxPaid ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(scenarioResult.totalTaxPaid)}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {scenarioResult.totalTaxPaid < currentResult.totalTaxPaid
                                    ? `Save ${formatCurrency(currentResult.totalTaxPaid - scenarioResult.totalTaxPaid)}`
                                    : `Pay ${formatCurrency(scenarioResult.totalTaxPaid - currentResult.totalTaxPaid)} more`}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 uppercase tracking-tighter">
                                Ret. Start Assets: {formatCurrency(currentResult.projectionStartAssets)}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ending Balance (Age 100)</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white mb-2">{formatCurrency(currentResult.endingBalance)}</div>
                            <div className="text-[10px] text-slate-400 mb-3 font-medium">
                                ≈ {formatCurrency(currentResult.endingBalancePV)} (Today's Value)
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                                <span className={`font-bold ${scenarioResult.endingBalance > currentResult.endingBalance ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(scenarioResult.endingBalance)}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {scenarioResult.endingBalance > currentResult.endingBalance
                                    ? `Gain ${formatCurrency(scenarioResult.endingBalance - currentResult.endingBalance)}`
                                    : `Lose ${formatCurrency(currentResult.endingBalance - scenarioResult.endingBalance)}`}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 uppercase tracking-tighter">
                                Ret. Start Assets: {formatCurrency(scenarioResult.projectionStartAssets)}
                            </div>
                        </div>
                    </div>

                    {/* Chart: Annual Tax & Balance Comparison */}
                    <div className="h-64 flex flex-col">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-center gap-6">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Current Tax</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-slate-400"></span> Current Assets</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> What-If Tax</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-indigo-500"></span> What-If Assets</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={mergedProjection} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                                <XAxis
                                    dataKey="age"
                                    tick={{ fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                />
                                {/* Left Y-Axis: Taxes */}
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                    tick={{ fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />
                                {/* Right Y-Axis: Assets */}
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(val) => {
                                        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                                        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                                        return `$${val}`;
                                    }}
                                    tick={{ fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={45}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                        const formatted = formatCurrency(value);
                                        if (name.includes('Assets')) return [formatted, name];
                                        return [formatted, name];
                                    }}
                                    contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                                    itemStyle={{ padding: '0' }}
                                />
                                <Bar yAxisId="left" dataKey="currentTax" fill={isDarkMode ? '#475569' : '#94a3b8'} name="Current Tax" radius={[2, 2, 0, 0]} opacity={0.6} />
                                <Bar yAxisId="left" dataKey="scenarioTax" fill="#6366f1" name="What-If Tax" radius={[2, 2, 0, 0]} opacity={0.6} />

                                <Line yAxisId="right" type="monotone" dataKey="currentAssets" stroke={isDarkMode ? '#94a3b8' : '#475569'} strokeWidth={2} dot={false} name="Current Assets" />
                                <Line yAxisId="right" type="monotone" dataKey="scenarioAssets" stroke="#6366f1" strokeWidth={2} dot={false} name="What-If Assets" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Adjust Scenario Contributions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Traditional IRA/401k</label>
                        <div className="relative">
                            <span className={iconClass}>$</span>
                            <FormattedNumberInput
                                value={scenarioContributions.traditionalIRA}
                                onChange={(val) => handleContributionChange('traditionalIRA', val)}
                                className={`${inputClass} pl-8`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Roth IRA/401k</label>
                        <div className="relative">
                            <span className={iconClass}>$</span>
                            <FormattedNumberInput
                                value={scenarioContributions.rothIRA}
                                onChange={(val) => handleContributionChange('rothIRA', val)}
                                className={`${inputClass} pl-8`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Taxable Brokerage</label>
                        <div className="relative">
                            <span className={iconClass}>$</span>
                            <FormattedNumberInput
                                value={scenarioContributions.brokerage}
                                onChange={(val) => handleContributionChange('brokerage', val)}
                                className={`${inputClass} pl-8`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">HSA</label>
                        <div className="relative">
                            <span className={iconClass}>$</span>
                            <FormattedNumberInput
                                value={scenarioContributions.hsa}
                                onChange={(val) => handleContributionChange('hsa', val)}
                                className={`${inputClass} pl-8`}
                            />
                        </div>
                    </div>
                </div>

                {/* Total Annual Savings Check */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center text-sm">
                    <span className="text-blue-800 dark:text-blue-300 font-medium">Total Annual Savings:</span>
                    <span className="font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(scenarioContributions.traditionalIRA + scenarioContributions.rothIRA + scenarioContributions.brokerage + scenarioContributions.hsa)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WhatIfAnalysis;
