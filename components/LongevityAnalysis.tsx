import React from 'react';
import { LongevityResult, UserProfile } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
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
                  <p className="text-xs text-blue-700 dark:text-blue-300">Portfolio lasts to age 100+.</p>
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
                tickFormatter={(val) => {
                  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                  return `$${val}`;
                }}
                width={80}
                stroke={axisColor}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ backgroundColor: tooltipBg, borderColor: gridColor, color: tooltipText }} className="p-3 border rounded-lg shadow-lg text-xs min-w-[180px]">
                        <p className="font-bold mb-2 text-sm border-b pb-1 border-slate-200 dark:border-slate-700">Age {label}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                            <span>Brokerage:</span>
                            <span className="font-mono font-bold">${Math.round(data.brokerage).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-500 dark:text-amber-400">
                            <span>Traditional:</span>
                            <span className="font-mono font-bold">${Math.round(data.traditionalIRA).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span>Roth:</span>
                            <span className="font-mono font-bold">${Math.round(data.rothIRA).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-violet-600 dark:text-violet-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span>HSA:</span>
                            <span className="font-mono font-bold">${Math.round(data.hsa).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                            <span>Total:</span>
                            <span className="font-mono">${Math.round(data.totalAssets).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="rothIRA"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Roth IRA"
              />
              <Area
                type="monotone"
                dataKey="traditionalIRA"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
                name="Traditional IRA"
              />
              <Area
                type="monotone"
                dataKey="brokerage"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Taxable Brokerage"
              />
              <Area
                type="monotone"
                dataKey="hsa"
                stackId="1"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
                name="HSA"
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

      {/* Annual Income Composition Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px] transition-colors">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Annual Income Composition (Real Purchasing Power)</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          This detailed view shows <strong>"Where your paycheck comes from"</strong> each year. Notice how the portfolio withdrawals (colored bars) decrease once Social Security (Gray) kicks in.
        </p>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={projection}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="age"
                label={{ value: 'Age', position: 'insideBottom', offset: -10, fill: axisColor, fontSize: 12 }}
                stroke={axisColor}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(val) => {
                  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                  return `$${val}`;
                }}
                width={80}
                stroke={axisColor}
              />
              <Tooltip
                cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9', opacity: 0.5 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const totalIncome = (data.socialSecurityIncome || 0) + (data.pensionIncome || 0) + (data.dividendIncome || 0) + (data.withdrawal || 0);

                    return (
                      <div style={{ backgroundColor: tooltipBg, borderColor: gridColor, color: tooltipText }} className="p-3 border rounded-lg shadow-lg text-xs min-w-[200px]">
                        <p className="font-bold mb-2 text-sm border-b pb-1 border-slate-200 dark:border-slate-700">Age {label}</p>

                        <div className="space-y-3">
                          {/* Fixed Income Section */}
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Guaranteed Income</p>
                            <div className="space-y-1 pl-2 border-l-2 border-slate-300 dark:border-slate-600">
                              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                <span>Social Security:</span>
                                <span className="font-mono font-bold">${Math.round(data.socialSecurityIncome).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                <span>Pension:</span>
                                <span className="font-mono font-bold">${Math.round(data.pensionIncome).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-blue-400 dark:text-blue-300">
                                <span>Dividends:</span>
                                <span className="font-mono font-bold">${Math.round(data.dividendIncome).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Portfolio Draw Section */}
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Portfolio Withdrawals</p>
                            <div className="space-y-1 pl-2 border-l-2 border-blue-500">
                              <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                                <span>Brokerage:</span>
                                <span className="font-mono font-bold">${Math.round(data.withdrawalBrokerage).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-amber-500 dark:text-amber-400">
                                <span>Trad IRA:</span>
                                <span className="font-mono font-bold">${Math.round(data.withdrawalTrad).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                <span>Roth IRA:</span>
                                <span className="font-mono font-bold">${Math.round(data.withdrawalRoth).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-violet-600 dark:text-violet-400">
                                <span>HSA:</span>
                                <span className="font-mono font-bold">${Math.round(data.withdrawalHSA).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                            <span>Total Annual Income:</span>
                            <span className="font-mono">${Math.round(totalIncome).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />

              <Bar dataKey="socialSecurityIncome" name="Social Security" stackId="a" fill="#64748b" />
              <Bar dataKey="pensionIncome" name="Pension" stackId="a" fill="#94a3b8" />
              <Bar dataKey="dividendIncome" name="Dividends" stackId="a" fill="#60a5fa" />

              <Bar dataKey="withdrawalTrad" name="Traditional IRA" stackId="a" fill="#f59e0b" />
              <Bar dataKey="withdrawalRoth" name="Roth IRA" stackId="a" fill="#10b981" />
              <Bar dataKey="withdrawalBrokerage" name="Brokerage" stackId="a" fill="#3b82f6" />
              <Bar dataKey="withdrawalHSA" name="HSA" stackId="a" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LongevityAnalysis;