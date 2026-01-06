import React, { useState, useEffect } from 'react';
import { UserProfile, FilingStatus, StrategyResult, LongevityResult } from './types';
import InputSection from './components/InputSection';
import StrategyResults from './components/StrategyResults';
import LongevityAnalysis from './components/LongevityAnalysis';
import AccumulationStrategy from './components/AccumulationStrategy';
import TaxReference from './components/TaxReference';
import { calculateStrategy, calculateLongevity } from './services/calculationEngine';
import { TrendingUp, Calculator, AlertTriangle, BookOpen, Sun, Moon, PiggyBank } from 'lucide-react';
import Footer from './components/Footer';

const INITIAL_PROFILE: UserProfile = {
  age: 65, // Retirement Start Age
  baseAge: 55, // Current Age
  filingStatus: FilingStatus.Single,
  spendingNeed: 60000,
  isSpendingReal: true,
  assets: { traditionalIRA: 250000, rothIRA: 100000, brokerage: 150000, hsa: 25000 },
  contributions: { traditionalIRA: 7000, rothIRA: 0, brokerage: 12000, hsa: 3500 },
  income: { socialSecurity: 30000, pension: 0, brokerageDividends: 5000, qualifiedDividendRatio: 0.9 },
  assumptions: { inflationRate: 0.03, rateOfReturn: 0.07 }
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
  const [longevityResult, setLongevityResult] = useState<LongevityResult | null>(null);
  const [activeTab, setActiveTab] = useState<'withdrawal' | 'accumulation' | 'longevity' | 'reference'>('accumulation');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const sResult = calculateStrategy(profile);
    const lResult = calculateLongevity(profile, sResult);
    setStrategyResult(sResult);
    setLongevityResult(lResult);
  }, [profile]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[10px] md:text-xs font-medium text-amber-900 dark:text-amber-200 text-center uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Educational purposes only. No professional financial or tax advice intended.
        </div>
      </div>

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1">RetireSmart<span className="text-blue-600">.</span></h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Tax-Efficient Planner</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <InputSection profile={profile} setProfile={setProfile} />
          </div>

          <div className="lg:col-span-8">
            <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-6 w-full overflow-x-auto">
              {[
                { id: 'accumulation', icon: PiggyBank, label: 'Accumulation' },
                { id: 'withdrawal', icon: Calculator, label: 'Withdrawal' },
                { id: 'longevity', icon: TrendingUp, label: 'Longevity' },
                { id: 'reference', icon: BookOpen, label: 'Reference' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {strategyResult && longevityResult ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={activeTab === 'withdrawal' ? 'block' : 'hidden'}>
                  <StrategyResults result={strategyResult} profile={profile} isDarkMode={isDarkMode} />
                </div>
                <div className={activeTab === 'accumulation' ? 'block' : 'hidden'}>
                  <AccumulationStrategy
                    profile={profile}
                    setProfile={setProfile}
                    isDarkMode={isDarkMode}
                    onRetire={() => setActiveTab('withdrawal')}
                  />
                </div>
                <div className={activeTab === 'longevity' ? 'block' : 'hidden'}>
                  <LongevityAnalysis longevity={longevityResult} profile={profile} isDarkMode={isDarkMode} />
                </div>
                <div className={activeTab === 'reference' ? 'block' : 'hidden'}>
                  <TaxReference />
                </div>
              </div>
            ) : <div className="h-96 flex items-center justify-center text-slate-400">Loading strategy...</div>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;