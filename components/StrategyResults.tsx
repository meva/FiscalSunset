import React, { useState, useEffect } from 'react';
import { StrategyResult, UserProfile } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';
import { AlertCircle, CheckCircle, TrendingUp, Sparkles, MessageSquare, RefreshCw, ShieldAlert, Lock, Wallet, Info, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { getGeminiAdvice } from '../services/geminiService';

interface StrategyResultsProps {
  result: StrategyResult;
  profile: UserProfile;
  isDarkMode: boolean;
  apiKey: string;
  onOpenSettings: () => void;
}

const MAX_DAILY_REQUESTS = 5;
const STORAGE_KEY = 'fiscalsunset_ai_usage';

// Helper function to format currency values consistently (rounds to whole dollars)
const formatCurrency = (value: number): string => `$${Math.round(value).toLocaleString()}`;


const StrategyResults: React.FC<StrategyResultsProps> = ({ result, profile, isDarkMode, apiKey, onOpenSettings }) => {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [requestsUsed, setRequestsUsed] = useState(0);

  useEffect(() => {
    setAiAdvice(null);
  }, [result]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) setRequestsUsed(parsed.count);
        else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
          setRequestsUsed(0);
        }
      } catch (e) { setRequestsUsed(0); }
    }
  }, []);

  const incrementUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const newCount = requestsUsed + 1;
    setRequestsUsed(newCount);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  const chartData = result.withdrawalPlan.map(w => ({
    name: w.source,
    value: w.amount,
  }));

  if (result.currentYearSocialSecurity > 0) chartData.push({ name: 'Social Security', value: result.currentYearSocialSecurity });
  if (profile.income.pension > 0) chartData.push({ name: 'Pension', value: profile.income.pension });
  const annualDividends = profile.assets.brokerage * profile.income.brokerageDividendYield;
  if (annualDividends > 0) chartData.push({ name: 'Dividends', value: annualDividends });

  const handleAskAI = async () => {
    if (!apiKey) {
      onOpenSettings();
      return;
    }
    if (requestsUsed >= MAX_DAILY_REQUESTS) return;
    setLoadingAi(true);
    const advice = await getGeminiAdvice(profile, result, apiKey);
    setAiAdvice(advice);
    incrementUsage();
    setLoadingAi(false);
  };

  const requestsLeft = MAX_DAILY_REQUESTS - requestsUsed;
  const isLimitReached = requestsLeft <= 0;
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipText = isDarkMode ? '#f1f5f9' : '#0f172a';

  // Feasibility Logic
  const totalPortfolio = profile.assets.brokerage + profile.assets.rothIRA + profile.assets.traditionalIRA + profile.assets.hsa;
  const portfolioDraw = result.withdrawalPlan.reduce((acc, curr) => acc + curr.amount, 0);
  const withdrawalRate = totalPortfolio > 0 ? portfolioDraw / totalPortfolio : 0;

  let feasibility: 'Safe' | 'Risk' | 'Shortfall' = 'Safe';
  if (!result.gapFilled) feasibility = 'Shortfall';
  else if (withdrawalRate > 0.05) feasibility = 'Risk';

  const feasibilityStyles = {
    Safe: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400',
    Risk: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400',
    Shortfall: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400',
  };

  return (
    <div className="space-y-6">

      {/* Liquidity Gap Warning */}
      {result.liquidityGapWarning && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Liquidity Gap Warning: Early Withdrawal Penalty Triggered</h3>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              Your strategy requires accessing Traditional IRA/401(k) funds before age 59½ beyond safe harbor limits (like 72(t) SEPP).
              A 10% early withdrawal penalty consumes part of your portfolio turnover.
              <strong>Recommendation: Increase Taxable Brokerage or Roth Contribution savings to bridge this gap.</strong>
            </p>
          </div>
        </div>
      )}

      {/* Starting Retirement Balances Summary */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-600" />
          Starting Retirement Balances <span className="text-xs font-normal text-slate-500">(Projected at Age {profile.baseAge})</span>
        </h3>
        {/* Nominal Values Disclaimer */}
        <div className="flex items-start gap-2 p-3 mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            All figures shown are in nominal (future) dollars at retirement. Values reflect expected future amounts and are not adjusted for inflation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Traditional IRA/401k</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(profile.assets.traditionalIRA)}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Roth IRA/401k</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(profile.assets.rothIRA)}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Brokerage</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(profile.assets.brokerage)}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">HSA</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(profile.assets.hsa)}</span>
          </div>
        </div>
      </div>

      {/* High Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Spending (Net)</h3>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(result.nominalSpendingNeeded)}</p>
          <div className="flex items-center mt-1 text-[10px] text-slate-500">Required net cash flow</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors border-l-4 border-l-red-500">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Est. Fed Tax</h3>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(result.estimatedFederalTax)}</p>
          <div className="flex items-center mt-1 text-[10px] text-slate-500">Effective Rate: {(result.effectiveTaxRate * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors border-l-4 border-l-blue-500">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Gross Withdrawal</h3>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(result.totalWithdrawal)}</p>
          <p className="text-[10px] text-slate-500 mt-1">Portfolio + Benefits Needed</p>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm transition-colors ${feasibilityStyles[feasibility]}`}>
          <h3 className="text-xs font-bold uppercase">Feasibility</h3>
          <div className="flex items-center gap-2 mt-1">
            {feasibility === 'Safe' && <CheckCircle className="w-5 h-5" />}
            {feasibility === 'Risk' && <AlertTriangle className="w-5 h-5" />}
            {feasibility === 'Shortfall' && <AlertCircle className="w-5 h-5" />}
            <span className="text-lg font-bold">
              {feasibility}
            </span>
          </div>
        </div>
      </div>

      {/* Tax Engine Explanation */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-bold">Tax Calculation Breakdown</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <span className="text-slate-500">Standard Deduction</span>
            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(result.standardDeduction)}</p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <span className="text-slate-500">Taxable Soc. Security</span>
            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(result.taxableSocialSecurity)}</p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <span className="text-slate-500">Provisional Income</span>
            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(result.provisionalIncome)}</p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <span className="text-slate-500">Mandatory RMD</span>
            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(result.rmdAmount)}</p>
          </div>
        </div>
      </div>

      {/* Roth Conversion Opportunity - OBBBA Optimizer */}
      {result.rothConversionDetail && (
        <div className={`bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm transition-colors ${result.rothConversionAmount > 0
          ? 'border-l-4 border-l-purple-500 border-purple-200 dark:border-purple-900'
          : 'border-slate-200 dark:border-slate-800'
          }`}>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-4 h-4 text-purple-500" />
            <h4 className="text-sm font-bold">Roth Conversion Opportunity</h4>
            {result.rothConversionDetail.inTorpedoZone && (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                SS Torpedo Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
              <span className="text-slate-500 text-[10px]">Recommended Conversion</span>
              <p className={`font-bold ${result.rothConversionAmount > 0 ? 'text-purple-700 dark:text-purple-400' : 'text-slate-400'}`}>
                {formatCurrency(result.rothConversionAmount)}
              </p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
              <span className="text-slate-500 text-[10px]">Effective Marginal Rate</span>
              <p className={`font-bold ${result.rothConversionDetail.effectiveMarginalRate > 0.30
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-white'
                }`}>
                {(result.rothConversionDetail.effectiveMarginalRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
              <span className="text-slate-500 text-[10px]">Binding Constraint</span>
              <p className="font-bold text-slate-900 dark:text-white capitalize">
                {result.rothConversionDetail.bindingConstraint?.replace('_', ' ') || 'None'}
              </p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
              <span className="text-slate-500 text-[10px]">Traditional IRA Balance</span>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(profile.assets.traditionalIRA)}
              </p>
            </div>
          </div>

          {/* Reasoning */}
          {result.rothConversionDetail.reasoning.length > 0 && (
            <div className="mb-3">
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {result.rothConversionDetail.reasoning.map((r, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-purple-500 mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {result.rothConversionDetail.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 mt-3">
              <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                {result.rothConversionDetail.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Constraints Detail (Collapsible) */}
          {result.rothConversionDetail.constraints.length > 0 && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                View Constraint Analysis ({result.rothConversionDetail.constraints.length} constraints)
              </summary>
              <div className="mt-2 space-y-2">
                {result.rothConversionDetail.constraints.map((c, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{c.type.replace('_', ' ')}</span>
                      <p className="text-slate-500 text-[10px]">{c.description}</p>
                    </div>
                    <div className="text-right">
                      {c.headroom > 0 && <span className="text-slate-600 dark:text-slate-400">Headroom: {formatCurrency(c.headroom)}</span>}
                      {c.annualCost && c.annualCost > 0 && (
                        <p className="text-red-500 text-[10px]">IRMAA: {formatCurrency(c.annualCost)}/yr if crossed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[350px] flex flex-col transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            Gross Income Composition
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" tickFormatter={(val) => `$${val / 1000}k`} stroke={axisColor} tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 10 }}
                  stroke={axisColor}
                  tickFormatter={(value) => value.length > 15 ? value.substring(0, 12) + '...' : value}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridColor, color: tooltipText, fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Optimal Withdrawal Path
          </h3>
          <p className="text-xs text-slate-500 mb-4 italic">Prioritizes 0% brackets to minimize current tax bill and preserve portfolio longevity.</p>
          <div className="space-y-3">
            {result.withdrawalPlan.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {step.source}
                      {step.taxType === 'CapitalGains' && (
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-2">(Long Term Capital Gains)</span>
                      )}
                    </span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{formatCurrency(step.amount)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
            {result.withdrawalPlan.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-sm italic">No portfolio withdrawals needed.</p>}
          </div>
        </div>
      </div>

      {/* AI Advisor */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            AI Strategy Review
          </h3>
          {!aiAdvice && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">{isLimitReached ? "Daily limit reached" : `${requestsLeft} left`}</span>
              <button onClick={handleAskAI} disabled={loadingAi || (isLimitReached && !!apiKey)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${loadingAi || (isLimitReached && !!apiKey) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'}`}>
                {loadingAi ? "Analyzing..." : !apiKey ? "Configure API Key" : "Review My Plan"}
              </button>
            </div>
          )}
          {aiAdvice && (
            <button onClick={handleAskAI} disabled={loadingAi || isLimitReached} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors">
              <RefreshCw className={`w-3 h-3 ${loadingAi ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>
        {loadingAi && <div className="animate-pulse space-y-4 py-1"><div className="h-4 bg-slate-600 rounded w-3/4"></div><div className="h-4 bg-slate-600 rounded"></div></div>}
        {aiAdvice && <div className="prose prose-invert max-w-none"><div className="whitespace-pre-line text-slate-200 text-sm leading-relaxed">{aiAdvice}</div></div>}
      </div>

      {/* Strategy Algorithm Notes - positioned below AI Strategy Review */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Strategy Algorithm Notes</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">Two-Layer Cake Method:</strong> Optimal stacking of ordinary income and capital gains for tax efficiency.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">0% Capital Gains Priority:</strong> Maximizes use of the 0% long-term capital gains bracket when possible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">Social Security Torpedo Detection:</strong> Identifies and avoids the 50-85% benefit taxation zones.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">IRMAA Cliff Awareness:</strong> Prevents Medicare premium surcharges by monitoring income thresholds.</span>
                </li>
              </ul>
              <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">FIRE Priority Engine:</strong> Prioritizes Penalty-Free access (Brokerage, Roth Basis, Rule of 55) before Standard withdrawals.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">72(t) SEPP Integration:</strong> Automatically calculates penalty-free IRS amortization payments for early retirees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">Roth Conversion Optimizer:</strong> "Fill Strategy" algorithm calculates optimal conversions.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default StrategyResults;
