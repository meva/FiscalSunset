import React, { useState } from 'react';
import { TAX_BRACKETS, CAP_GAINS_BRACKETS, STANDARD_DEDUCTION, AGE_DEDUCTION, SENIOR_DEDUCTION, SENIOR_DEDUCTION_PHASEOUT, SS_TAX_THRESHOLDS, IRMAA_THRESHOLDS, RMD_START_AGE, UNIFORM_LIFETIME_TABLE } from '../constants';
import { FilingStatus } from '../types';
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    Lightbulb,
    Calculator,
    Table,
    AlertTriangle,
    Info,
    Layers,
    Target,
    TrendingUp,
    Shield,
    DollarSign,
    Clock,
    ArrowRight,
    ArrowDown,
    Zap,
    CheckCircle2,
    XCircle,
    User,
    Linkedin,
    Mail,
    Heart,
    Sparkles
} from 'lucide-react';

interface AccordionSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    accentColor?: string;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
    title,
    icon,
    children,
    defaultOpen = false,
    accentColor = 'blue'
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-emerald-600 dark:text-emerald-400',
        purple: 'text-purple-600 dark:text-purple-400',
        amber: 'text-amber-600 dark:text-amber-400',
        rose: 'text-rose-600 dark:text-rose-400',
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className={colorClasses[accentColor]}>{icon}</span>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
                </div>
                {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

const TaxReference: React.FC = () => {
    const cardClass = "bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors";
    const subHeaderClass = "text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2";
    const tableHeadClass = "text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-800";
    const tableCellClass = "px-4 py-3";
    const tableRowClass = "bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors";
    const stepClass = "flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700";
    const stepNumberClass = "w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-6 h-6" />
                    <h1 className="text-2xl font-bold">Reference Guide</h1>
                </div>
                <p className="text-blue-100 text-sm">
                    Learn how RetireSmart works, understand the tax optimization strategies, and reference the 2026 tax rules used in all calculations.
                </p>
            </div>

            {/* Getting Started */}
            <AccordionSection
                title="Getting Started"
                icon={<Lightbulb className="w-5 h-5" />}
                accentColor="green"
                defaultOpen={true}
            >
                <div className="space-y-6">
                    <p className="text-slate-600 dark:text-slate-400">
                        RetireSmart helps you plan for a tax-efficient retirement. Follow this workflow to get the most out of the application:
                    </p>

                    <div className="space-y-3">
                        <div className={stepClass}>
                            <span className={stepNumberClass}>1</span>
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white">Enter Your Details</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Use the left panel to input your current age, retirement age, spending needs in retirement, filing status, current assets, annual contributions, income sources while in retirement, and market assumptions.
                                </p>
                            </div>
                        </div>

                        <div className={stepClass}>
                            <span className={stepNumberClass}>2</span>
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white">Accumulation Phase</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Set your target retirement age and see how your portfolio grows with annual contributions. Adjust the "Years to Invest" slider to visualize different scenarios.
                                </p>
                            </div>
                        </div>

                        <div className={stepClass}>
                            <span className={stepNumberClass}>3</span>
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white">Withdrawal Strategy</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Once you transition to retirement, see the optimal withdrawal order from your accounts to minimize taxes. View Roth conversion recommendations and tax warnings.
                                </p>
                            </div>
                        </div>

                        <div className={stepClass}>
                            <span className={stepNumberClass}>4</span>
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white">Longevity Analysis</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    See how long your assets will last and visualize depletion over time. The projection accounts for inflation and withdrawals from each account type, remember to change your Annual Return % assumptions to match your expected returns while in retirement.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p><strong>Pro Tips:</strong></p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>
                                    <strong>Real vs. Nominal:</strong> Toggle between "Today's $" and "Adj. Inflation $" in the Accumulation tab to see values in real vs. nominal dollars.
                                </li>
                                <li>
                                    <strong>Return Rates:</strong> Remember to adjust your Annual Return % assumptions to match your expected returns during retirement, e.i. set at 10% while looking at numbers in the accumulation tab, and 5% while looking at numbers in the withdrawal tab.
                                </li>
                                <li>
                                    <strong>Inflation Impact:</strong> Use the annual spending needs toggle (today's $ vs. adjusted $) to clearly see your spending needs adjusted for inflation or today's dollars.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </AccordionSection>

            {/* Smart Tax Strategies */}
            <AccordionSection
                title="Smart Tax Optimization Strategies"
                icon={<Zap className="w-5 h-5" />}
                accentColor="purple"
            >
                <div className="space-y-6">
                    <p className="text-slate-600 dark:text-slate-400">
                        RetireSmart uses sophisticated algorithms to optimize your tax situation. Here's how each strategy works:
                    </p>

                    {/* Two-Layer Cake */}
                    <div className={cardClass}>
                        <div className="flex items-center gap-2 mb-3">
                            <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <h4 className="font-bold text-slate-800 dark:text-white">Two-Layer Cake Method</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Federal taxes use a "stacking" approach where different income types are taxed in layers:
                        </p>
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded p-3 text-center">
                                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                            <ArrowDown className="w-4 h-4 inline mr-1" />
                                            Layer 1: Ordinary Income
                                        </span>
                                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                            Social Security, Pensions, IRA/401k Withdrawals, RMDs
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-full bg-emerald-100 dark:bg-emerald-900/50 rounded p-3 text-center">
                                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                                            <ArrowDown className="w-4 h-4 inline mr-1" />
                                            Layer 2: Capital Gains & Qualified Dividends
                                        </span>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">
                                            Taxed at preferential 0%, 15%, or 20% rates based on total income
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                            The app calculates ordinary income tax first, then determines capital gains taxes based on where total income lands in the brackets.
                        </p>
                    </div>

                    {/* Social Security Torpedo */}
                    <div className={cardClass}>
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            <h4 className="font-bold text-slate-800 dark:text-white">Social Security "Torpedo" Detection</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Social Security taxation creates hidden "torpedo zones" where each additional dollar of income can trigger up to $1.85 in taxable income:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className={tableHeadClass}>
                                    <tr>
                                        <th className="px-4 py-2 rounded-l-lg">Zone</th>
                                        <th className="px-4 py-2">Combined Income (Single)</th>
                                        <th className="px-4 py-2">Combined Income (MFJ)</th>
                                        <th className="px-4 py-2 rounded-r-lg">Effect</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className={tableRowClass}>
                                        <td className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-400">0% SS Taxable</td>
                                        <td className={tableCellClass}>Below ${SS_TAX_THRESHOLDS[FilingStatus.Single].base1.toLocaleString()}</td>
                                        <td className={tableCellClass}>Below ${SS_TAX_THRESHOLDS[FilingStatus.MarriedJoint].base1.toLocaleString()}</td>
                                        <td className={tableCellClass}>No SS taxation</td>
                                    </tr>
                                    <tr className={tableRowClass}>
                                        <td className="px-4 py-3 font-medium text-amber-700 dark:text-amber-400">50% SS Taxable</td>
                                        <td className={tableCellClass}>${SS_TAX_THRESHOLDS[FilingStatus.Single].base1.toLocaleString()} - ${SS_TAX_THRESHOLDS[FilingStatus.Single].base2.toLocaleString()}</td>
                                        <td className={tableCellClass}>${SS_TAX_THRESHOLDS[FilingStatus.MarriedJoint].base1.toLocaleString()} - ${SS_TAX_THRESHOLDS[FilingStatus.MarriedJoint].base2.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-amber-700 dark:text-amber-400">$1.50 tax per $1 added</td>
                                    </tr>
                                    <tr className={tableRowClass}>
                                        <td className="px-4 py-3 font-medium text-rose-700 dark:text-rose-400">85% SS Taxable</td>
                                        <td className={tableCellClass}>Above ${SS_TAX_THRESHOLDS[FilingStatus.Single].base2.toLocaleString()}</td>
                                        <td className={tableCellClass}>Above ${SS_TAX_THRESHOLDS[FilingStatus.MarriedJoint].base2.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-rose-700 dark:text-rose-400">$1.85 tax per $1 added</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                            "Combined Income" = AGI (excluding SS) + Tax-Exempt Interest + 50% of Social Security Benefits. The app warns you when in these zones.
                        </p>
                    </div>

                    {/* IRMAA Cliffs */}
                    <div className={cardClass}>
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <h4 className="font-bold text-slate-800 dark:text-white">IRMAA Cliff Awareness</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Medicare premiums jump at specific income thresholds (MAGI). Exceeding a threshold by just $1 triggers the full annual surcharge:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className={tableHeadClass}>
                                    <tr>
                                        <th className="px-4 py-2 rounded-l-lg">MAGI Threshold (Single)</th>
                                        <th className="px-4 py-2">MAGI Threshold (MFJ)</th>
                                        <th className="px-4 py-2 rounded-r-lg">Annual Surcharge (Per Person)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {IRMAA_THRESHOLDS[FilingStatus.Single].slice(1).map((tier, index) => (
                                        <tr key={index} className={tableRowClass}>
                                            <td className={tableCellClass}>${IRMAA_THRESHOLDS[FilingStatus.Single][index].limit.toLocaleString()}</td>
                                            <td className={tableCellClass}>${IRMAA_THRESHOLDS[FilingStatus.MarriedJoint][index].limit.toLocaleString()}</td>
                                            <td className={`${tableCellClass} font-medium text-amber-700 dark:text-amber-400`}>
                                                ${Math.round((tier.monthlyPartB + tier.monthlyPartD) * 12).toLocaleString()}/year
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                            Note: MAGI from 2 years prior determines your current year's premiums. The app includes a $1,000 safety buffer in recommendations.
                        </p>
                    </div>

                    {/* Roth Conversion Fill Strategy */}
                    <div className={cardClass}>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h4 className="font-bold text-slate-800 dark:text-white">Roth Conversion "Fill Strategy"</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            The app recommends converting Traditional IRA funds to Roth by "filling" low-cost tax buckets optimally:
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Fill remaining space in current tax bracket (bracket headroom)</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Stop before triggering Social Security torpedo zones</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Avoid IRMAA Medicare premium cliffs</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Preserve Senior Deduction (if eligible, avoid phase-out)</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                            The algorithm calculates the minimum constraint and recommends converting up to that amount for maximum tax efficiency.
                        </p>
                    </div>
                </div>
            </AccordionSection>

            {/* How Calculations Work */}
            <AccordionSection
                title="How Calculations Work"
                icon={<Calculator className="w-5 h-5" />}
                accentColor="blue"
            >
                <div className="space-y-6">
                    {/* Withdrawal Order */}
                    <div className={cardClass}>
                        <div className="flex items-center gap-2 mb-3">
                            <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h4 className="font-bold text-slate-800 dark:text-white">Optimal Withdrawal Order</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            The app follows a tax-efficient withdrawal sequence:
                        </p>
                        <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                                <span><strong>Social Security & Pensions</strong> — Guaranteed income used first</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                                <span><strong>HSA (if 65+)</strong> — Tax-free for qualified medical expenses</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                                <span><strong>Required Minimum Distributions (RMDs)</strong> — Mandatory if 73+</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
                                <span><strong>Traditional IRA/401k</strong> — Fills lower tax brackets</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400">5.</span>
                                <span><strong>Taxable Brokerage</strong> — Capital gains at preferential rates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400">6.</span>
                                <span><strong>Roth IRA</strong> — Last resort, tax-free growth preserved</span>
                            </li>
                        </ol>
                    </div>

                    {/* RMD Calculation */}
                    <div className={cardClass}>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h4 className="font-bold text-slate-800 dark:text-white">RMD Calculation (Age {RMD_START_AGE}+)</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            Required Minimum Distributions are calculated using the IRS Uniform Lifetime Table:
                        </p>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center mb-4">
                            <p className="text-lg font-mono text-slate-800 dark:text-white">
                                RMD = <span className="text-blue-600 dark:text-blue-400">Account Balance</span> ÷ <span className="text-emerald-600 dark:text-emerald-400">Distribution Period</span>
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className={tableHeadClass}>
                                    <tr>
                                        <th className="px-4 py-2 rounded-l-lg">Age</th>
                                        <th className="px-4 py-2 rounded-r-lg">Distribution Period (Years)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(UNIFORM_LIFETIME_TABLE).slice(0, 6).map(([age, factor]) => (
                                        <tr key={age} className={tableRowClass}>
                                            <td className={tableCellClass}>{age}</td>
                                            <td className={tableCellClass}>{factor}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                            Example: $500,000 Traditional IRA at age 73 → RMD = $500,000 ÷ 26.5 = $18,868
                        </p>
                    </div>

                    {/* Inflation Adjustment */}
                    <div className={cardClass}>
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h4 className="font-bold text-slate-800 dark:text-white">Inflation Adjustment</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            All projections account for inflation to show purchasing power:
                        </p>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                <strong>Nominal Dollars:</strong> The actual dollar amount you'll see in your accounts
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                <strong>Today's Dollars (Real):</strong> Adjusted for purchasing power using: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">value ÷ (1 + inflation)^years</code>
                            </p>
                        </div>
                    </div>
                </div>
            </AccordionSection>

            {/* 2026 Tax Rules */}
            <AccordionSection
                title="2026 Tax Brackets & Rules"
                icon={<Table className="w-5 h-5" />}
                accentColor="amber"
            >
                <div className="space-y-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        These are the federal tax figures used by the application to calculate your withdrawal strategy.
                    </p>

                    {/* Standard Deductions */}
                    <div>
                        <h3 className={subHeaderClass}>Standard Deductions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={cardClass}>
                                <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">Single</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">${STANDARD_DEDUCTION[FilingStatus.Single].toLocaleString()}</span>
                                <span className="block text-xs text-green-700 dark:text-green-400 mt-1">+ ${AGE_DEDUCTION[FilingStatus.Single].toLocaleString()} if Age 65+</span>
                                <span className="block text-xs text-purple-700 dark:text-purple-400 mt-1">+ ${SENIOR_DEDUCTION[FilingStatus.Single].toLocaleString()} Senior Deduction (65+, income dependent)</span>
                            </div>
                            <div className={cardClass}>
                                <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">Married Filing Jointly</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">${STANDARD_DEDUCTION[FilingStatus.MarriedJoint].toLocaleString()}</span>
                                <span className="block text-xs text-green-700 dark:text-green-400 mt-1">+ ${AGE_DEDUCTION[FilingStatus.MarriedJoint].toLocaleString()} per person Age 65+</span>
                                <span className="block text-xs text-purple-700 dark:text-purple-400 mt-1">+ ${SENIOR_DEDUCTION[FilingStatus.MarriedJoint].toLocaleString()} Senior Deduction (both 65+, income dependent)</span>
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
                                        <th className="px-4 py-3 rounded-l-lg">Tax Rate</th>
                                        <th className="px-4 py-3">Single Taxable Income</th>
                                        <th className="px-4 py-3 rounded-r-lg">Married Joint Taxable Income</th>
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
                                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{(singleBracket.rate * 100)}%</td>
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
                                        <th className="px-4 py-3 rounded-l-lg">Tax Rate</th>
                                        <th className="px-4 py-3">Single Taxable Income</th>
                                        <th className="px-4 py-3 rounded-r-lg">Married Joint Taxable Income</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {CAP_GAINS_BRACKETS[FilingStatus.Single].map((singleBracket, index) => {
                                        const marriedBracket = CAP_GAINS_BRACKETS[FilingStatus.MarriedJoint][index];
                                        const prevSingle = index === 0 ? 0 : CAP_GAINS_BRACKETS[FilingStatus.Single][index - 1].limit;
                                        const prevMarried = index === 0 ? 0 : CAP_GAINS_BRACKETS[FilingStatus.MarriedJoint][index - 1].limit;

                                        const formatRange = (prev: number, limit: number) => {
                                            const start = index === 0 ? 0 : prev + 1;
                                            if (limit === Infinity) return `Over $${prev.toLocaleString()}`;
                                            return `$${start.toLocaleString()} - $${limit.toLocaleString()}`;
                                        };

                                        return (
                                            <tr key={index} className={tableRowClass}>
                                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{(singleBracket.rate * 100)}%</td>
                                                <td className={tableCellClass}>{formatRange(prevSingle, singleBracket.limit)}</td>
                                                <td className={tableCellClass}>{formatRange(prevMarried, marriedBracket.limit)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm">
                        <Info className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>
                            <strong>Note on Taxable Income:</strong> Capital gains sit "on top" of ordinary income.
                            This means your ordinary income (Wages, IRA withdrawals, RMDs) fills up the lower brackets first.
                            Capital gains are then taxed at the rate corresponding to the total income level.
                        </p>
                    </div>
                </div>
            </AccordionSection>

            {/* Important Disclaimers */}
            <AccordionSection
                title="Important Disclaimers"
                icon={<AlertTriangle className="w-5 h-5" />}
                accentColor="rose"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 rounded-lg">
                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm space-y-2">
                            <p><strong>This is an educational tool only.</strong></p>
                            <p>RetireSmart is designed to help you understand tax-efficient withdrawal strategies and is not intended to provide professional financial, tax, or legal advice.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={cardClass}>
                            <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Limitations</h4>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <li>• State taxes are not included</li>
                                <li>• Net Investment Income Tax (NIIT) not modeled</li>
                                <li>• Tax brackets are estimates and may change</li>
                                <li>• Does not account for itemized deductions</li>
                                <li>• Social Security COLA adjustments assumed 0%</li>
                            </ul>
                        </div>
                        <div className={cardClass}>
                            <h4 className="font-semibold text-slate-800 dark:text-white mb-2">When to Consult a Professional</h4>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <li>• Complex tax situations</li>
                                <li>• Large Roth conversions</li>
                                <li>• Estate planning considerations</li>
                                <li>• Business income or rental properties</li>
                                <li>• Major life changes (marriage, divorce, etc.)</li>
                            </ul>
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center pt-2">
                        Always verify calculations with a qualified tax professional or financial advisor before making major financial decisions.
                    </p>
                </div>
            </AccordionSection>

            {/* About the Creator */}
            <AccordionSection
                title="About the Creator"
                icon={<User className="w-5 h-5" />}
                accentColor="blue"
            >
                <div className="space-y-6">
                    {/* Creator Header */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            MV
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Miguel Velasco</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">IT Manager & AI Enthusiast</p>
                        </div>
                    </div>

                    {/* Origin Story */}
                    <div className={cardClass}>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <h4 className="font-bold text-slate-800 dark:text-white">The Story Behind RetireSmart</h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            RetireSmart was born from a conversation I had with a coworker about the need for a tool to help plan retirement withdrawals efficiently.
                            Having previously worked in the Financial Services industry, I saw firsthand how complex and confusing tax-efficient retirement planning can be for everyday people.
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
                            This entire application was created with the help of AI — a testament to how powerful these tools have become for building real-world solutions.
                            As an AI enthusiast, I wanted to demonstrate what's possible when you combine domain knowledge with modern AI capabilities.
                        </p>
                    </div>

                    {/* Free & Passion Project */}
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-lg">
                        <Heart className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Free to Use</p>
                            <p className="mt-1">
                                RetireSmart is currently free to use. I'm personally covering the infrastructure and AI costs because I believe in making financial planning tools accessible to everyone.
                            </p>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className={cardClass}>
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4">Get in Touch</h4>
                        <div className="space-y-3">
                            <a
                                href="https://www.linkedin.com/in/miguelvelasco/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <Linkedin className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Connect on LinkedIn</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">linkedin.com/in/miguelvelasco</p>
                                </div>
                            </a>
                            <a
                                href="mailto:financepro@me.com"
                                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Send an Email</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">financepro@me.com</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
                        Made with <Heart className="w-4 h-4 inline text-rose-500" /> and AI in 2026
                    </p>
                </div>
            </AccordionSection>
        </div>
    );
};

export default TaxReference;