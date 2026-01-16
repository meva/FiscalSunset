import React from 'react';
import { LongevityResult, UserProfile } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface LongevityAnalysisProps {
  longevity: LongevityResult;
  profile: UserProfile;
  isDarkMode: boolean;
}

const LongevityAnalysis: React.FC<LongevityAnalysisProps> = ({ longevity, profile, isDarkMode }) => {
  const { projection, depletionAge, initialWithdrawalRate, sustainable } = longevity;

  // Chart styling colors
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipText = isDarkMode ? '#f1f5f9' : '#0f172a';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border shadow-sm transition-colors ${sustainable
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
          : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900'
          }`}>
          <h3 className={`text-sm font-medium uppercase ${sustainable ? 'text-green-800 dark:text-green-400' : 'text-orange-800 dark:text-orange-400'}`}>
            Initial Withdrawal Rate
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{(initialWithdrawalRate * 100).toFixed(1)}%</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">of portfolio</span>
          </div>
          <p className="text-xs mt-2 text-slate-700 dark:text-slate-300">
            Fidelity suggests a <strong>4-5%</strong> withdrawal rate is sustainable for a 25+ year retirement.
            {initialWithdrawalRate > 0.05 && " Your rate is higher than recommended."}
          </p>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm transition-colors ${!depletionAge
          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
          }`}>
          <h3 className="text-sm font-medium uppercase text-slate-600 dark:text-slate-400">
            Projected Outcome
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {depletionAge ? (
              <>
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
                <div>
                  <span className="text-xl font-bold text-red-900 dark:text-red-200">Depleted at Age {depletionAge}</span>
                  <p className="text-xs text-red-700 dark:text-red-300">Money runs out in {depletionAge - profile.age} years.</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                <div>
                  <span className="text-xl font-bold text-blue-900 dark:text-blue-200">Sustainable</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Portfolio lasts beyond 40 years.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px] transition-colors">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Portfolio Balance Projection</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={projection}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="age"
                label={{ value: 'Age', position: 'insideBottom', offset: -10, fill: axisColor, fontSize: 12 }}
                stroke={axisColor}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(val) => `$${val / 1000}k`}
                width={80}
                stroke={axisColor}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ backgroundColor: tooltipBg, borderColor: gridColor, color: tooltipText }} className="p-2 sm:p-3 border rounded-lg shadow-lg text-[10px] sm:text-xs max-w-[200px]">
                        <p className="font-bold mb-1">Age {label}</p>
                        <div className="space-y-0.5">
                          <p style={{ color: '#3b82f6' }}>
                            Balance: <span className="font-bold">${Math.round(payload[0].value as number).toLocaleString()}</span>
                          </p>
                          <p style={{ color: isDarkMode ? '#fca5a5' : '#ef4444' }}>
                            Withdrawal: <span className="font-bold">${Math.round(payload[0].payload.withdrawal).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="totalAssets"
                stroke="#2563eb"
                fillOpacity={1}
                fill="url(#colorAssets)"
                name="Portfolio Balance"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
          <strong>Assumptions:</strong> {(profile.assumptions.rateOfReturnInRetirement * 100).toFixed(1)}% Annual Investment Return, {(profile.assumptions.inflationRateInRetirement * 100).toFixed(1)}% Inflation on expenses.
          <br />
          This projection assumes spending needs increase with inflation while fixed income (Social Security) stays flat or grows slower (simplified model).
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-500 mt-1" />
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white">How to improve longevity?</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc pl-4">
              <li><strong>Reduce Spending:</strong> Lowering your initial withdrawal rate below 4% significantly increases success rates.</li>
              <li><strong>Asset Allocation:</strong> Ensure your portfolio mix (Stocks/Bonds) can support a {(profile.assumptions.rateOfReturn * 100).toFixed(1)}% return.</li>
              <li><strong>Tax Efficiency:</strong> Using the "FiscalSunset" strategy (previous tab) reduces the tax drag on your withdrawals, keeping more money invested.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LongevityAnalysis;