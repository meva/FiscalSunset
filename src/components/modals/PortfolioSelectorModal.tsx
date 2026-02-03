import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, Play, CheckCircle, TrendingUp, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { runMonteCarloSimulation, PortfolioAllocation, SimulationResult } from '../../services/MonteCarloEngine';

interface PortfolioSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (annualReturn: number) => void;
    simulationDurationYears: number;
    scenario: 'accumulation' | 'retirement';
}

const PRESETS = {
    accumulation: {
        Conservative: { VTI: 20, VXUS: 10, BND: 50, BNDX: 20 },
        Moderate: { VTI: 45, VXUS: 15, BND: 25, BNDX: 15 },
        Aggressive: { VTI: 60, VXUS: 30, BND: 7, BNDX: 3 },
    },
    retirement: {
        Conservative: { VTI: 15, VXUS: 5, BND: 60, BNDX: 20 }, // 20/80 - Capital Preservation
        Moderate: { VTI: 30, VXUS: 10, BND: 45, BNDX: 15 },    // 40/60 - Balanced Income
        Aggressive: { VTI: 45, VXUS: 15, BND: 30, BNDX: 10 },  // 60/40 - Growth
    }
};

const PortfolioSelectorModal: React.FC<PortfolioSelectorModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    simulationDurationYears,
    scenario
}) => {
    const [mode, setMode] = useState<'preset' | 'custom'>('preset');
    const [allocation, setAllocation] = useState<PortfolioAllocation>(PRESETS[scenario].Moderate);
    const [isLocked, setIsLocked] = useState(true); // Locks total to 100% (simple validation mode)
    const [simResult, setSimResult] = useState<SimulationResult | null>(null);
    const [selectedPercentile, setSelectedPercentile] = useState<'p10' | 'p50' | 'p90'>('p50');

    useEffect(() => {
        if (isOpen) {
            setAllocation(PRESETS[scenario].Moderate);
            setMode('preset');
            setSimResult(null);
        }
    }, [isOpen, scenario]);

    const handlePresetSelect = (presetName: keyof typeof PRESETS['accumulation']) => {
        setAllocation(PRESETS[scenario][presetName]);
        setMode('preset');
        setSimResult(null); // Clear previous result to force standard flow
    };

    const handleSliderChange = (asset: keyof PortfolioAllocation, value: number) => {
        setMode('custom');
        setSimResult(null);

        // Simple logic: If locked, we can't easily auto-balance 4 sliders without complex logic.
        // For this MVP, we will allow free sliding and show a warning if != 100%.
        const newAllocation = { ...allocation, [asset]: value };
        setAllocation(newAllocation);
    };

    const totalAllocation = (Object.values(allocation) as number[]).reduce((sum, val) => sum + val, 0);
    const isValid = Math.abs(totalAllocation - 100) < 0.1;

    const handleRunSimulation = () => {
        if (!isValid) return;
        const result = runMonteCarloSimulation(allocation, simulationDurationYears);
        setSimResult(result);
        setSelectedPercentile('p50'); // Default to Median
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            Portfolio Modeler & Monte Carlo Simulator
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Simulating {simulationDurationYears} years of random market paths based on volatility & correlation.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Inputs */}
                    <div className="lg:col-span-5 space-y-8">

                        {/* Presets */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">1. Select Strategy ({scenario})</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(PRESETS[scenario]) as Array<keyof typeof PRESETS['accumulation']>).map((name) => {
                                    const isSelected = mode === 'preset' && JSON.stringify(allocation) === JSON.stringify(PRESETS[scenario][name]);
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => handlePresetSelect(name)}
                                            className={`py-2 px-1 rounded-lg text-sm font-semibold transition-all border ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sliders */}
                        <div className={`space-y-4 p-4 rounded-xl border-2 transition-colors ${isValid ? 'border-slate-100 dark:border-slate-800' : 'border-red-100 bg-red-50 dark:bg-red-900/20'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Asset Allocation</label>
                                <span className={`text-xs font-bold ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                                    Total: {totalAllocation.toFixed(0)}%
                                </span>
                            </div>

                            {Object.keys(allocation).map((key) => (
                                <div key={key}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{key}</span>
                                        <span className="text-slate-500">{allocation[key as keyof PortfolioAllocation]}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={allocation[key as keyof PortfolioAllocation]}
                                        onChange={(e) => handleSliderChange(key as keyof PortfolioAllocation, parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="text-[10px] text-slate-400 mt-1">
                                        {key === 'VTI' && 'US Total Stock Market'}
                                        {key === 'VXUS' && 'Total International Stock'}
                                        {key === 'BND' && 'US Total Bond Market'}
                                        {key === 'BNDX' && 'Total International Bond'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleRunSimulation}
                            disabled={!isValid}
                            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${isValid
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/30'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <Play className="w-4 h-4" />
                            Run Simulation
                        </button>

                    </div>

                    {/* RIGHT COLUMN: Results */}
                    <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col">

                        {!simResult ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8 opacity-60">
                                <TrendingUp className="w-16 h-16 mb-4 stroke-1" />
                                <p>Select an allocation and run the simulation to see probable outcomes.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500">

                                {/* Stats Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'p10', label: 'Unlucky (10%)', val: simResult.p10, color: 'text-orange-500' },
                                        { id: 'p50', label: 'Median (50%)', val: simResult.p50, color: 'text-blue-600' },
                                        { id: 'p90', label: 'Lucky (90%)', val: simResult.p90, color: 'text-green-500' },
                                    ].map((stat) => (
                                        <button
                                            key={stat.id}
                                            onClick={() => setSelectedPercentile(stat.id as any)}
                                            className={`relative p-3 rounded-lg border-2 text-left transition-all ${selectedPercentile === stat.id
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-white dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                                                }`}
                                        >
                                            {selectedPercentile === stat.id && (
                                                <div className="absolute top-2 right-2 text-blue-600"><CheckCircle className="w-4 h-4" /></div>
                                            )}
                                            <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                                            <div className={`text-xl font-bold ${stat.color}`}>{(stat.val * 100).toFixed(2)}%</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Chart */}
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={simResult.bellCurveData}>
                                            <defs>
                                                <linearGradient id="colorFrequency" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="returnFreq"
                                                stroke="#94a3b8"
                                                fontSize={12}
                                                tickFormatter={(val) => `${val}%`}
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(val: number) => [val, 'Occurrences']}
                                                labelFormatter={(label) => `CAGR: ${label}%`}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="frequency"
                                                stroke="#4f46e5"
                                                fillOpacity={1}
                                                fill="url(#colorFrequency)"
                                            />
                                            {/* Reference line for selected */}
                                            <ReferenceLine
                                                x={((simResult[selectedPercentile] as number) * 100).toFixed(1)}
                                                stroke="#ef4444"
                                                strokeDasharray="3 3"
                                                label={{ position: 'top', value: 'Selected', fill: '#ef4444', fontSize: 10 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Explanation */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 flex gap-3">
                                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p>
                                        Based on 10,000 Monte Carlo simulations over {simulationDurationYears} years.
                                        The <strong>Median</strong> result indicates that 50% of simulated market paths performed better than this, and 50% performed worse.
                                    </p>
                                </div>

                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!simResult}
                        onClick={() => simResult && onConfirm(simResult[selectedPercentile])}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Use Expected Return {(simResult ? ((simResult[selectedPercentile] as number) * 100).toFixed(2) : '--')}%
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PortfolioSelectorModal;
