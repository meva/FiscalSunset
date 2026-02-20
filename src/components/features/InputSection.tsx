import React, { useState, useEffect } from 'react';
import { UserProfile, FilingStatus } from '../../types';
import { HelpCircle, DollarSign, Briefcase, Activity, TrendingUp, PiggyBank, RotateCcw, PlusCircle, AlertTriangle, Calculator } from 'lucide-react';
import PortfolioSelectorModal from '../modals/PortfolioSelectorModal';
import Tooltip from '../common/Tooltip';

interface InputSectionProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onRestartWizard: () => void;
}

const FormattedNumberInput = ({ value, onChange, className, id }: { value: number; onChange: (val: number) => void; className?: string; id?: string }) => {
  const [displayValue, setDisplayValue] = useState(value.toLocaleString());
  const lastExternalValue = React.useRef(value);

  // Sync with external updates (only when the external value actually changes)
  useEffect(() => {
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
    lastExternalValue.current = newVal; // Mark this as an internal change
    onChange(newVal);
  };

  return <input id={id} type="text" value={displayValue} onChange={handleChange} className={className} />;
};

// Handles percentage inputs (stored as decimal, displayed as percentage)
const PercentageInput = ({ value, onChange, className, step = 0.1, id }: { value: number; onChange: (val: number) => void; className?: string; step?: number; id?: string }) => {
  const [displayValue, setDisplayValue] = useState((value * 100).toFixed(1));

  useEffect(() => {
    // Only update display if the external value changed significantly
    const currentParsed = displayValue === '' ? 0 : parseFloat(displayValue);
    if (Math.abs(currentParsed - value * 100) > 0.01) {
      setDisplayValue((value * 100).toFixed(1));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow empty string, digits, decimal point, and minus sign
    if (!/^-?[\d.]*$/.test(raw)) return;
    setDisplayValue(raw);

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed / 100);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(displayValue);
    if (isNaN(parsed) || displayValue === '') {
      // Restore the previous valid value
      setDisplayValue((value * 100).toFixed(1));
    } else {
      // Format the value nicely
      setDisplayValue(parsed.toFixed(1));
    }
  };

  return <input id={id} type="number" step={step} value={displayValue} onChange={handleChange} onBlur={handleBlur} className={className} />;
};

const InputSection: React.FC<InputSectionProps> = ({ profile, setProfile, onRestartWizard }) => {
  const handleChange = (field: keyof UserProfile, value: any) => setProfile({ ...profile, [field]: value });
  const handleAssetChange = (field: keyof UserProfile['assets'], value: number) => setProfile({ ...profile, assets: { ...profile.assets, [field]: value } });
  const handleContributionChange = (field: keyof UserProfile['contributions'], value: number) => setProfile({ ...profile, contributions: { ...profile.contributions, [field]: value } });
  const handleIncomeChange = (field: keyof UserProfile['income'], value: number) => setProfile({ ...profile, income: { ...profile.income, [field]: value } });
  const handleAssumptionChange = (field: keyof UserProfile['assumptions'], value: number) => setProfile({ ...profile, assumptions: { ...profile.assumptions, [field]: value } });

  // Reset logic removed as we now have explicit inputs
  // const resetToToday = () => { ... }

  const inputClass = "w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 transition-colors";
  const labelClass = "flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 mb-1";
  const iconClass = "absolute left-3 top-2 text-slate-400 dark:text-slate-500";
  const containerClass = "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-8 transition-colors";
  const headerClass = "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4";

  // const isFutureScenario = (Number(profile.age) || 0) !== profile.baseAge;
  const [activeModal, setActiveModal] = useState<'accumulation' | 'retirement' | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const accumulationYears = Math.max(5, (profile.age || 65) - (profile.baseAge || 30)); // Min 5 years to show meaningful data
  const retirementLongevityYears = Math.max(30, 95 - (profile.age || 65)); // Plan for at least 30 years or until age 95

  return (
    <div className={containerClass}>
      {/* Personal Details */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              About You
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!showRestartConfirm ? (
              <button
                onClick={() => setShowRestartConfirm(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg transition-colors min-h-[36px] border border-blue-100 dark:border-blue-800"
              >
                Restart Guided Wizard
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 p-1.5 rounded-lg border border-red-100 dark:border-red-800">
                <span className="text-xs text-red-600 dark:text-red-400 font-bold ml-1">Are you sure?</span>
                <button onClick={onRestartWizard} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors font-medium">Yes</button>
                <button onClick={() => setShowRestartConfirm(false)} className="text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded transition-colors font-medium">No</button>
              </div>
            )}
            {profile.age < profile.baseAge && (
              <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1.5 rounded-md border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-3 h-3" />
                Retirement Age must be &ge; Current Age
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="currentAge" className={labelClass}>Current Age</label>
            <input
              id="currentAge"
              type="number"
              value={profile.baseAge}
              onChange={(e) => {
                const rawValue = e.target.value;
                const updatedValue = rawValue === '' ? '' : parseInt(rawValue, 10);
                // @ts-ignore - handling string temporarily for input
                handleChange('baseAge', updatedValue);
              }}
              className={inputClass}
              placeholder="Age Now"
            />
          </div>
          <div>
            <label htmlFor="retirementAge" className={labelClass}>Retirement Age</label>
            <input
              id="retirementAge"
              type="number"
              value={profile.age}
              onChange={(e) => {
                const rawValue = e.target.value;
                const updatedValue = rawValue === '' ? '' : parseInt(rawValue, 10);
                // @ts-ignore - handling string temporarily for input
                handleChange('age', updatedValue);
              }}
              className={inputClass}
              placeholder="Target Age"
            />
          </div>
          <div>
            <label htmlFor="filingStatus" className={labelClass}>Filing Status</label>
            <select
              id="filingStatus"
              value={profile.filingStatus}
              onChange={(e) => handleChange('filingStatus', e.target.value)}
              className={inputClass}
            >
              <option value={FilingStatus.Single}>Single</option>
              <option value={FilingStatus.MarriedJoint}>Married Filing Jointly</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="spendingNeed" className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                Annual Spending Need
                <Tooltip content="Annual Spending Need in Retirement. This is your target annual budget (net of taxes) once retired." />
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  onClick={() => handleChange('isSpendingReal', true)}
                  className={`px-3 py-1.5 rounded-md min-h-[32px] transition-colors ${profile.isSpendingReal ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Today's $</button>
                <button
                  onClick={() => handleChange('isSpendingReal', false)}
                  className={`px-3 py-1.5 rounded-md min-h-[32px] transition-colors ${!profile.isSpendingReal ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Future $</button>
                <div className="flex items-center pr-1 pl-1">
                  <Tooltip content="Today's $ represents values in current purchasing power. Future $ shows nominal amounts inflated at your target rate." />
                </div>
              </div>
            </div>
            <div className="relative">
              <span className={iconClass}>$</span>
              <FormattedNumberInput
                // @ts-ignore explicit id handling needs component update, ignoring for now or adding prop
                id="spendingNeed"
                value={profile.spendingNeed}
                onChange={(val) => handleChange('spendingNeed', val)}
                className={`${inputClass} pl-8 font-semibold text-lg`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assets */}
      <div>
        <h2 className={headerClass}>
          <DollarSign className="w-5 h-5 text-green-600" />
          Assets (Portfolio)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Traditional IRA / 401k', key: 'traditionalIRA' as const },
            { label: 'Roth IRA / 401k', key: 'rothIRA' as const },
            { label: 'Roth Carry/Basis', key: 'rothBasis' as const, tooltip: "The total amount of after-tax principal you've contributed to your Roth accounts. This portion can always be withdrawn tax-free and penalty-free." },
            { label: 'Taxable Brokerage', key: 'brokerage' as const },
            { label: 'HSA', key: 'hsa' as const, tooltip: "Health Savings Account. A triple-tax-advantaged account where contributions are tax-deductible, growth is tax-free, and withdrawals for medical expenses are tax-free." },
          ].map((item) => (
            <div key={item.key}>
              <label htmlFor={`asset-${item.key}`} className={labelClass}>
                {item.label}
                {item.tooltip && <Tooltip content={item.tooltip} className="ml-1" />}
              </label>
              <div className="relative">
                <span className={iconClass}>$</span>
                <FormattedNumberInput
                  id={`asset-${item.key}`}
                  value={profile.assets[item.key] || 0}
                  onChange={(val) => handleAssetChange(item.key, val)}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Annual Contributions */}
      <div>
        <h2 className={headerClass}>
          <PlusCircle className="w-5 h-5 text-indigo-600" />
          Annual Contributions
        </h2>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider font-bold">For accumulation phase</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Traditional IRA / 401k', key: 'traditionalIRA' as const },
            { label: 'Roth IRA / Roth 401k', key: 'rothIRA' as const },
            { label: 'To Brokerage', key: 'brokerage' as const },
            { label: 'To HSA', key: 'hsa' as const },
          ].map((item) => (
            <div key={item.key}>
              <label htmlFor={`contribution-${item.key}`} className={labelClass}>{item.label}</label>
              <div className="relative">
                <span className={iconClass}>$</span>
                <FormattedNumberInput
                  id={`contribution-${item.key}`}
                  value={profile.contributions[item.key]}
                  onChange={(val) => handleContributionChange(item.key, val)}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Sources */}
      <div>
        <h2 className={headerClass}>
          <Activity className="w-5 h-5 text-purple-600" />
          Income (Annual) While in Retirement
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="socialSecurity" className={labelClass}>Social Security Benefit</label>
            <div className="relative">
              <span className={iconClass}>$</span>
              <FormattedNumberInput
                id="socialSecurity"
                value={profile.income.socialSecurity}
                onChange={(val) => handleIncomeChange('socialSecurity', val)}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="ssStartAge" className={labelClass}>SS Start Age</label>
            <div className="relative">
              <input
                id="ssStartAge"
                type="number"
                value={profile.income.socialSecurityStartAge || 62}
                onChange={(e) => handleIncomeChange('socialSecurityStartAge', parseInt(e.target.value) || 62)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="pension" className={labelClass}>Pension / Annuity</label>
            <div className="relative">
              <span className={iconClass}>$</span>
              <FormattedNumberInput
                id="pension"
                value={profile.income.pension}
                onChange={(val) => handleIncomeChange('pension', val)}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="brokerageYield" className={labelClass}>Brokerage Yield (%)</label>
            <PercentageInput
              id="brokerageYield"
              value={profile.income.brokerageDividendYield}
              onChange={(val) => handleIncomeChange('brokerageDividendYield', val)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="qualifiedRatio" className={labelClass}>Qualified Ratio (%)</label>
            <PercentageInput
              id="qualifiedRatio"
              value={profile.income.qualifiedDividendRatio}
              onChange={(val) => handleIncomeChange('qualifiedDividendRatio', val)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Market Assumptions (Accumulation) */}
      <div>
        <h2 className={headerClass}>
          <TrendingUp className="w-5 h-5 text-orange-600" />
          Market Assumptions (Accumulation)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label htmlFor="rateOfReturn" className={labelClass}>Annual Return (%)</label>
            <PercentageInput
              id="rateOfReturn"
              value={profile.assumptions.rateOfReturn}
              onChange={(val) => handleAssumptionChange('rateOfReturn', val)}
              className={inputClass}
            />
            <button
              onClick={() => setActiveModal('accumulation')}
              className="absolute right-2 top-[2.4rem] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-1 rounded-md transition-colors"
              title="Calculate using Portfolio Simulator"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label htmlFor="inflationRate" className={labelClass}>Inflation (%)</label>
            <PercentageInput
              id="inflationRate"
              value={profile.assumptions.inflationRate}
              onChange={(val) => handleAssumptionChange('inflationRate', val)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Market Assumptions (Retirement) */}
      <div>
        <h2 className={headerClass}>
          <TrendingUp className="w-5 h-5 text-teal-600" />
          Market Assumptions (Retirement)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label htmlFor="rateOfReturnRetirement" className={labelClass}>Annual Return (%)</label>
            <PercentageInput
              id="rateOfReturnRetirement"
              value={profile.assumptions.rateOfReturnInRetirement}
              onChange={(val) => handleAssumptionChange('rateOfReturnInRetirement', val)}
              className={inputClass}
            />
            <button
              onClick={() => setActiveModal('retirement')}
              className="absolute right-2 top-[2.4rem] text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-1 rounded-md transition-colors"
              title="Calculate using Portfolio Simulator"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label htmlFor="inflationRateRetirement" className={labelClass}>Inflation (%)</label>
            <PercentageInput
              id="inflationRateRetirement"
              value={profile.assumptions.inflationRateInRetirement}
              onChange={(val) => handleAssumptionChange('inflationRateInRetirement', val)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
      {activeModal && (
        <PortfolioSelectorModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          onConfirm={(rate) => {
            if (activeModal === 'accumulation') {
              handleAssumptionChange('rateOfReturn', rate);
            } else {
              handleAssumptionChange('rateOfReturnInRetirement', rate);
            }
            setActiveModal(null);
          }}
          simulationDurationYears={
            activeModal === 'accumulation'
              ? accumulationYears
              : retirementLongevityYears
          }
          scenario={activeModal}
        />
      )}
    </div>
  );
};

export default InputSection;