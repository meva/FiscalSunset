import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, Wallet, TrendingUp, Table as TableIcon, Info, Rocket, ArrowRight, PieChart as PieIcon } from 'lucide-react';

interface AccumulationStrategyProps {
    profile: UserProfile;
    setProfile: (p: UserProfile) => void;
    isDarkMode: boolean;
    onRetire: () => void;
}

const AccumulationStrategy: React.FC<AccumulationStrategyProps> = ({ profile, setProfile, isDarkMode, onRetire }) => {
    const [investmentLength, setInvestmentLength] = useState(10);
    const [isInflationAdjusted, setIsInflationAdjusted] = useState(true);

    const { assets, contributions, assumptions } = profile;

    const projectionData = useMemo(() => {
        let balTrad = assets.traditionalIRA;
        let balRoth = assets.rothIRA;
        let balBrok = assets.brokerage;
        let balHSA = assets.hsa;

        const startingPrincipalNominal = balTrad + balRoth + balBrok + balHSA;
        let totalInvestedNominal = startingPrincipalNominal;

        const data = [{
            year: 0,
            age: profile.baseAge,
            balance: Math.round(startingPrincipalNominal),
            invested: Math.round(totalInvestedNominal),
            principal: Math.round(startingPrincipalNominal),
            newMoney: 0,
            interest: 0,
            trad: Math.round(balTrad),
            roth: Math.round(balRoth),
            brokerage: Math.round(balBrok),
            hsa: Math.round(balHSA),
            rawTrad: balTrad,
            rawRoth: balRoth,
            rawBrok: balBrok,
            rawHSA: balHSA
        }];

        const annualContrib = contributions.traditionalIRA + contributions.rothIRA + contributions.brokerage + contributions.hsa;

        for (let i = 1; i <= investmentLength; i++) {
            balTrad = balTrad * (1 + assumptions.rateOfReturn) + contributions.traditionalIRA;
            balRoth = balRoth * (1 + assumptions.rateOfReturn) + contributions.rothIRA;
            balBrok = balBrok * (1 + assumptions.rateOfReturn) + contributions.brokerage;
            balHSA = balHSA * (1 + assumptions.rateOfReturn) + contributions.hsa;

            const currentBalanceNominal = balTrad + balRoth + balBrok + balHSA;
            totalInvestedNominal += annualContrib;

            const factor = isInflationAdjusted ? Math.pow(1 + assumptions.inflationRate, i) : 1;

            data.push({
                year: i,
                age: profile.baseAge + i,
                balance: Math.round(currentBalanceNominal / factor),
                invested: Math.round(totalInvestedNominal / factor),
                principal: Math.round(startingPrincipalNominal / factor),
                newMoney: Math.round((annualContrib * i) / factor),
                interest: Math.round((currentBalanceNominal - totalInvestedNominal) / factor),
                trad: Math.round(balTrad / factor),
                roth: Math.round(balRoth / factor),
                brokerage: Math.round(balBrok / factor),
                hsa: Math.round(balHSA / factor),
                rawTrad: balTrad,
                rawRoth: balRoth,
                rawBrok: balBrok,
                rawHSA: balHSA
            });
        }
        return data;
    }, [profile, investmentLength, assets, contributions, assumptions, isInflationAdjusted]);

    const finalResult = projectionData[projectionData.length - 1];

    // Power of Compounding Data
    const compoundingData = [
        { name: 'Initial Portfolio', value: finalResult.principal, color: '#3b82f6' },
        { name: 'Total New Deposits', value: finalResult.newMoney, color: '#10b981' },
        { name: 'Market Growth', value: finalResult.interest, color: '#f59e0b' },
    ];

    const transitionToRetirement = () => {
        const p = projectionData[projectionData.length - 1];
        setProfile({
            ...profile,
            age: p.age,
            assets: {
                traditionalIRA: Math.round(p.rawTrad),
                rothIRA: Math.round(p.rawRoth),
                brokerage: Math.round(p.rawBrok),
                hsa: Math.round(p.rawHSA),
            }
        });
        onRetire();
    };

    const ACCOUNT_COLORS = { trad: '#f59e0b', roth: '#10b981', brokerage: '#3b82f6', hsa: '#8b5cf6' };
    const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
    const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
    const tooltipText = isDarkMode ? '#f1f5f9' : '#0f172a';

    return (
        <div className="space-y-8">
            {/* Phase Controls */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Accumulation Phase
                    </h3>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setIsInflationAdjusted(false)} className={`px-3 py-1 text-xs font-bold rounded ${!isInflationAdjusted ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Nominal</button>
                        <button onClick={() => setIsInflationAdjusted(true)} className={`px-3 py-1 text-xs font-bold rounded ${isInflationAdjusted ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Adj Inflation's $</button>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="w-full sm:w-1/2">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Years to Invest: <span className="font-bold text-slate-900 dark:text-white text-lg">{investmentLength}</span></label>
                        <input type="range" min="1" max="40" value={investmentLength} onChange={(e) => setInvestmentLength(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <div className="w-full sm:w-1/2 flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <div><span className="block text-xs text-slate-500">Target Age</span><span className="text-xl font-bold">{profile.baseAge + investmentLength}</span></div>
                        <div><span className="block text-xs text-slate-500">Growth</span><span className="text-xl font-bold text-green-600">+${finalResult.interest.toLocaleString()}</span></div>
                        <div><span className="block text-xs text-slate-500">Total Portfolio</span><span className="text-xl font-bold text-blue-600">${finalResult.balance.toLocaleString()}</span></div>
                    </div>
                </div>
            </div>

            {/* Bridge CTA - Moved to top of graph */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                        <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold leading-tight">Ready to switch to spending?</h3>
                        <p className="text-blue-100 mt-1 max-w-sm">Apply your projected <strong>Age {profile.baseAge + investmentLength}</strong> balances to the withdrawal calculator.</p>
                    </div>
                </div>
                <button
                    onClick={transitionToRetirement}
                    className="bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-2xl shrink-0 group hover:scale-105 active:scale-95"
                >
                    Confirm & Transition to Retirement <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Portfolio Path Chart (Full Width) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Portfolio Growth Journey ({isInflationAdjusted ? "Today's Dollars" : "Future Nominal Dollars"})
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorTrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={ACCOUNT_COLORS.trad} stopOpacity={0.1} />
                                    <stop offset="95%" stopColor={ACCOUNT_COLORS.trad} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="year"
                                stroke={axisColor}
                                tick={{ fontSize: 12 }}
                                label={{ value: 'Years from Now', position: 'insideBottom', offset: -10, fill: axisColor, fontSize: 12 }}
                            />
                            <YAxis
                                tickFormatter={(v) => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k'}`}
                                stroke={axisColor}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, color: tooltipText, borderRadius: '8px', fontSize: '12px' }}
                                formatter={(value: number) => `$${value.toLocaleString()}`}
                            />
                            <Area type="monotone" dataKey="trad" stackId="1" stroke={ACCOUNT_COLORS.trad} fill={ACCOUNT_COLORS.trad} fillOpacity={0.6} name="Trad IRA/401k" />
                            <Area type="monotone" dataKey="roth" stackId="1" stroke={ACCOUNT_COLORS.roth} fill={ACCOUNT_COLORS.roth} fillOpacity={0.6} name="Roth IRA/401k" />
                            <Area type="monotone" dataKey="brokerage" stackId="1" stroke={ACCOUNT_COLORS.brokerage} fill={ACCOUNT_COLORS.brokerage} fillOpacity={0.6} name="Brokerage" />
                            <Area type="monotone" dataKey="hsa" stackId="1" stroke={ACCOUNT_COLORS.hsa} fill={ACCOUNT_COLORS.hsa} fillOpacity={0.6} name="HSA" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Compounding Breakdown (Power of Compounding) */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors text-center relative">
                <div className="absolute top-4 right-6 hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    {isInflationAdjusted ? "Adjusted for Inflation" : "Nominal Values"}
                </div>

                <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                    <PieIcon className="w-5 h-5 text-emerald-500" />
                    The Power of Compounding
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                    See how your wealth is built. Over time, <strong>Market Growth</strong> often becomes the largest portion of your portfolio.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16">
                    <div className="h-[280px] w-full md:w-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={compoundingData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {compoundingData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-left">
                        {compoundingData.map((item) => (
                            <div key={item.name} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{item.name}</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">${item.value.toLocaleString()}</span>
                                    <span className="block text-[10px] text-slate-400">
                                        {((item.value / finalResult.balance) * 100).toFixed(1)}% of total
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile View Disclaimer */}
                <div className="md:hidden mt-6 text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" />
                    {isInflationAdjusted ? "Adjusted for Inflation" : "Nominal Values"}
                </div>
            </div>

            {/* Detailed Schedule (Full Width Bottom) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <TableIcon className="w-5 h-5 text-slate-500" />
                        Year-by-Year Growth Schedule
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {isInflationAdjusted ? "Adjusted for Inflation" : "Nominal Values"}
                    </span>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-semibold text-slate-600 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Year</th>
                                <th className="px-6 py-4">Age</th>
                                <th className="px-6 py-4 text-right">Principal</th>
                                <th className="px-6 py-4 text-right">New Deposits</th>
                                <th className="px-6 py-4 text-right">Market Growth</th>
                                <th className="px-6 py-4 text-right">Total Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {projectionData.map((row) => (
                                <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-500">{row.year === 0 ? 'Now' : `Year ${row.year}`}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{row.age}</td>
                                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">${row.principal.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">${row.newMoney.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-medium">+${row.interest.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400 text-lg">${row.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AccumulationStrategy;