import React, { useState, useMemo } from 'react';
import { UserProfile } from '../../types';
import { calculateFireMilestones } from '../../services/fireCalculations';
import { FireInputs } from '../../types/fire';
import { Flame, TrendingUp, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import Tooltip from '../common/Tooltip';

interface FireAnalysisProps {
    profile: UserProfile;
    isDarkMode: boolean;
}

const FireAnalysis: React.FC<FireAnalysisProps> = ({ profile, isDarkMode }) => {
    // 1. Shadow State Initialization
    // We initialize ONLY the overrides. Assets and Contributions imply the base reality, 
    // though we could allow overriding them too if requested. 
    // User asked for: Annual Spend, Investment Return, Retirement Age.

    const [spendingNeed, setSpendingNeed] = useState(profile.spendingNeed);
    const [rateOfReturn, setRateOfReturn] = useState(profile.assumptions.rateOfReturn);
    const [targetRetirementAge, setTargetRetirementAge] = useState(profile.age);
    const [consultingIncome, setConsultingIncome] = useState(25000);

    // Derived Values from Profile (Base Reality)
    const totalAssets = useMemo(() => {
        return profile.assets.traditionalIRA +
            profile.assets.rothIRA +
            profile.assets.brokerage +
            profile.assets.hsa;
    }, [profile.assets]);

    const annualSavings = useMemo(() => {
        return profile.contributions.traditionalIRA +
            profile.contributions.rothIRA +
            profile.contributions.brokerage +
            profile.contributions.hsa;
    }, [profile.contributions]);

    // 2. Calculation Engine Hook
    const milestones = useMemo(() => {
        const inputs: FireInputs = {
            currentAge: profile.baseAge,
            annualSpending: spendingNeed,
            totalAssets: totalAssets,
            annualSavings: annualSavings,
            rateOfReturn: rateOfReturn,
            inflationRate: profile.assumptions.inflationRate,
            retirementAge: targetRetirementAge,
            consultingIncome: consultingIncome,
        };
        return calculateFireMilestones(inputs);
    }, [profile.baseAge, spendingNeed, totalAssets, annualSavings, rateOfReturn, profile.assumptions.inflationRate, targetRetirementAge, consultingIncome]);

    const standardFireMilestone = milestones.find(m => m.type === 'Standard');
    const fiAge = standardFireMilestone?.ageReached;
    const fiYear = standardFireMilestone?.yearReached;

    const handleReset = () => {
        setSpendingNeed(profile.spendingNeed);
        setRateOfReturn(profile.assumptions.rateOfReturn);
        setTargetRetirementAge(profile.age);
        setConsultingIncome(25000);
    };

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        return `$${(val / 1000).toFixed(0)}k`;
    };

    // Explanatory Banner Component
    const FireExplanationBanner = () => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors mb-6">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-amber-500"><Flame className="w-5 h-5" /></span>
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
                        <p>FIRE (Financial Independence, Retire Early) milestones are calculated based on your annual spending needs and standard safe withdrawal rates.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Lean FIRE</h4>
                                <p className="mb-2">Goal: Minimalist living expenses covered.</p>
                                <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400">(Annual Spending × 0.70) × 25</code>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Standard FIRE</h4>
                                <p className="mb-2">Goal: Current lifestyle technically "independent".</p>
                                <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400">Annual Spending × 25</code>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Fat FIRE</h4>
                                <p className="mb-2">Goal: Luxury lifestyle with buffer.</p>
                                <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400">(Annual Spending × 1.5) × 33</code>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Coast FIRE</h4>
                                <p className="mb-2">Goal: Saved enough to stop contributing today.</p>
                                <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400">Standard Target ÷ (1 + r)^YearsToRetire</code>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-indigo-800 dark:text-indigo-300 flex gap-2">
                                <DollarSign className="w-5 h-5 shrink-0" />
                                <p className="text-xs">
                                    <strong>Barista FIRE:</strong> Assumes you work part-time to earn ${formatCurrency(consultingIncome)}/year to supplement withdrawals. The target is the remaining gap ÷ 4%.
                                </p>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-indigo-800 dark:text-indigo-300 flex gap-2">
                                <RefreshCw className="w-5 h-5 shrink-0" />
                                <p className="text-xs">
                                    <strong>Savings Rate:</strong> Annual Savings ÷ (Annual Savings + Annual Spending). This represents the percentage of your total available income that is being saved.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <FireExplanationBanner />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Controls */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-indigo-500" />
                                What-If Analysis
                            </h3>
                            <button
                                onClick={handleReset}
                                className="text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                            >
                                Reset to Actual
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Annual Spending Slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Annual Spending</label>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        ${spendingNeed.toLocaleString()}
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={20000}
                                    max={200000}
                                    step={1000}
                                    value={spendingNeed}
                                    onChange={(e) => setSpendingNeed(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <p className="text-xs text-slate-400">Impacts FIRE Number directly.</p>
                            </div>

                            {/* Return Rate Slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Inv. Return Rate</label>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {(rateOfReturn * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={0.01}
                                    max={0.12}
                                    step={0.001}
                                    value={rateOfReturn}
                                    onChange={(e) => setRateOfReturn(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                />
                                <p className="text-xs text-slate-400">Higher returns accelerate timeline.</p>
                            </div>

                            {/* Retirement Age Slider (For Coast Calculation) */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Target Ret. Age</label>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {targetRetirementAge}
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={profile.baseAge + 1}
                                    max={80}
                                    step={1}
                                    value={targetRetirementAge}
                                    onChange={(e) => setTargetRetirementAge(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <p className="text-xs text-slate-400">Affects Coast FIRE target.</p>
                            </div>

                            {/* Consulting Income Slider (For Barista Calculation) */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Part-time Income</label>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {formatCurrency(consultingIncome)}/yr
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100000}
                                    step={1000}
                                    value={consultingIncome}
                                    onChange={(e) => setConsultingIncome(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <p className="text-xs text-slate-400">Side income for Barista FIRE.</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                                <DollarSign className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium uppercase">Current Savings Rate</p>
                                    <p className="text-lg font-bold text-indigo-900 dark:text-white">
                                        {((annualSavings / (annualSavings + spendingNeed)) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main View */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                                        <Flame className="w-8 h-8 text-orange-500" />
                                        Financial Independence
                                    </h2>
                                    <p className="text-slate-400 max-w-lg">
                                        At your current pace, you will reach Financial Independence (Standard FIRE) at age:
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">
                                        {fiAge ? fiAge : 'N/A'}
                                    </div>
                                    <div className="text-sm text-slate-400 font-medium">
                                        {fiYear ? `Year ${fiYear}` : 'Not projected (< 100)'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <span className="block text-xs text-slate-300 uppercase tracking-wider mb-1">Standard Target</span>
                                    <span className="text-xl font-bold text-white">{formatCurrency(standardFireMilestone?.targetAmount || 0)}</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <span className="block text-xs text-slate-300 uppercase tracking-wider mb-1">Current Assets</span>
                                    <span className="text-xl font-bold text-white">{formatCurrency(totalAssets)}</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <span className="block text-xs text-slate-300 uppercase tracking-wider mb-1">Remaining Gap</span>
                                    <span className="text-xl font-bold text-orange-200">
                                        {standardFireMilestone && Math.max(0, standardFireMilestone.targetAmount - totalAssets) === 0
                                            ? 'Reached!'
                                            : formatCurrency(Math.max(0, (standardFireMilestone?.targetAmount || 0) - totalAssets))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Milestone Timeline */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                FIRE Milestones Timeline
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {milestones.map((milestone) => (
                                <div key={milestone.type} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Icon & Progress */}
                                        <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                                            {/* Circular Progress (Simple SVG or just styled) */}
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                                                <circle
                                                    cx="32" cy="32" r="28"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    strokeDasharray={175.9}
                                                    strokeDashoffset={175.9 - (175.9 * (milestone.percentageProgress / 100))}
                                                    className={`${milestone.percentageProgress >= 100 ? 'text-emerald-500' : 'text-blue-500'} transition-all duration-1000 ease-out`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {milestone.percentageProgress >= 100 ? '100%' : `${milestone.percentageProgress}%`}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {milestone.type} FIRE
                                                    {milestone.type === 'Lean' && <Tooltip content="Goal: Minimalist living expenses covered." className="ml-1" />}
                                                    {milestone.type === 'Standard' && <Tooltip content="Goal: Current lifestyle technically 'independent'." className="ml-1" />}
                                                    {milestone.type === 'Fat' && <Tooltip content="Goal: Luxury lifestyle with buffer." className="ml-1" />}
                                                    {milestone.type === 'Coast' && <Tooltip content="Goal: Saved enough to stop contributing today." className="ml-1" />}
                                                    {milestone.type === 'Barista' && <Tooltip content="Assumes you work part-time to earn supplemental income." className="ml-1" />}
                                                    {milestone.percentageProgress >= 100 && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                                                            Achieved
                                                        </span>
                                                    )}
                                                </h4>
                                                <div className="text-right">
                                                    <span className="block text-sm font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(milestone.targetAmount)}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                                {milestone.description}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                <div className={`flex items-center gap-1 ${milestone.ageReached ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {milestone.ageReached
                                                        ? `Age ${milestone.ageReached} (${milestone.yearReached})`
                                                        : 'Not projected in horizon'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FireAnalysis;
