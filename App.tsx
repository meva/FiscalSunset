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
import WizardModal from './components/Wizard/WizardModal';
import { projectAssets } from './services/projection';

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
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Computed Retirement Profile
  // If the user is currently 55 but retiring at 65, we must project their assets
  // to age 65 before running the withdrawal strategy.
  const retirementProfile = React.useMemo(() => {
    // If already retired (or valid check skipped), use current profile
    if (profile.age <= profile.baseAge) {
      return profile;
    }

    // Project assets to retirement age
    // Project assets to retirement age
    // Calculate inflated spending need if user provided "Today's Dollars"
    let projectedSpendingNeed = profile.spendingNeed;
    if (profile.isSpendingReal && profile.age > profile.baseAge) {
      projectedSpendingNeed = profile.spendingNeed * Math.pow(1 + profile.assumptions.inflationRate, profile.age - profile.baseAge);
    }

    const projectedAssets = projectAssets(
      profile.assets,
      // Total Annual Contribution
      (profile.contributions.traditionalIRA + profile.contributions.rothIRA + profile.contributions.brokerage + profile.contributions.hsa),
      // Virtual Allocation based on contribution proportions
      {
        taxDeferred: ((profile.contributions.traditionalIRA) / (profile.contributions.traditionalIRA + profile.contributions.rothIRA + profile.contributions.brokerage + profile.contributions.hsa || 1)) * 100,
        taxable: ((profile.contributions.brokerage) / (profile.contributions.traditionalIRA + profile.contributions.rothIRA + profile.contributions.brokerage + profile.contributions.hsa || 1)) * 100,
        taxExempt: ((profile.contributions.rothIRA + profile.contributions.hsa) / (profile.contributions.traditionalIRA + profile.contributions.rothIRA + profile.contributions.brokerage + profile.contributions.hsa || 1)) * 100,
      },
      profile.baseAge,
      profile.age,
      profile.assumptions
    );

    return {
      ...profile,
      baseAge: profile.age, // The "Current Age" for the withdrawal calculator is the Retirement Age
      assets: projectedAssets,
      spendingNeed: projectedSpendingNeed,
      isSpendingReal: false, // Converted to nominal at retirement start
      // Zero out contributions for retirement phase
      contributions: { ...INITIAL_PROFILE.contributions, traditionalIRA: 0, rothIRA: 0, brokerage: 0, hsa: 0 }
    };

  }, [profile]);


  useEffect(() => {
    // Run strategy on the computed RETIREMENT profile
    const sResult = calculateStrategy(retirementProfile);
    const lResult = calculateLongevity(retirementProfile, sResult);
    setStrategyResult(sResult);
    setLongevityResult(lResult);
  }, [retirementProfile]); // Depend on retirementProfile instead of profile

  useEffect(() => {
    // Check if wizard has been completed in this session or previously
    const wizardCompleted = localStorage.getItem('wizard_completed_v1');
    if (!wizardCompleted) {
      setIsWizardOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleWizardComplete = (newProfile: UserProfile, destination: 'accumulation' | 'withdrawal' = 'accumulation') => {
    setProfile(newProfile);
    setIsWizardOpen(false);
    localStorage.setItem('wizard_completed_v1', 'true');
    setActiveTab(destination);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    // Optionally mark as viewed even if skipped, or let it reappear next time. 
    // Let's mark it as viewed to avoid annoyance.
    localStorage.setItem('wizard_completed_v1', 'true');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <WizardModal
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
        currentProfile={profile}
      />
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
            <InputSection
              profile={profile}
              setProfile={setProfile}
              onRestartWizard={() => setIsWizardOpen(true)}
            />
          </div>

          <div className="lg:col-span-8">
            {/* Tab Navigation with mobile scroll indicator */}
            <div className="relative mb-6">
              <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-full overflow-x-auto scrollbar-hide">
                {[
                  { id: 'accumulation', icon: PiggyBank, label: 'Accumulation' },
                  { id: 'withdrawal', icon: Calculator, label: 'Withdrawal' },
                  { id: 'longevity', icon: TrendingUp, label: 'Longevity' },
                  { id: 'reference', icon: BookOpen, label: 'Reference' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap min-w-[100px] ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-xs">{tab.label}</span>
                  </button>
                ))}
              </div>
              {/* Scroll fade indicator for mobile */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-200 dark:from-slate-800 to-transparent pointer-events-none rounded-r-xl md:hidden" />
            </div>

            {strategyResult && longevityResult ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={activeTab === 'withdrawal' ? 'block' : 'hidden'}>
                  <StrategyResults result={strategyResult} profile={retirementProfile} isDarkMode={isDarkMode} />
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
                  <LongevityAnalysis longevity={longevityResult} profile={retirementProfile} isDarkMode={isDarkMode} />
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