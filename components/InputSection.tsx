import React, { useState, useEffect } from 'react';
import { UserProfile, FilingStatus } from '../types';
import { HelpCircle, DollarSign, Briefcase, Activity, TrendingUp, PiggyBank, RotateCcw, PlusCircle } from 'lucide-react';

interface InputSectionProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const FormattedNumberInput = ({ value, onChange, className }: { value: number; onChange: (val: number) => void; className?: string; }) => {
  const [displayValue, setDisplayValue] = useState(value.toLocaleString());
  useEffect(() => {
    const rawClean = displayValue.replace(/,/g, '');
    const currentParsed = rawClean === '' ? 0 : parseFloat(rawClean);
    if (Math.abs(currentParsed - value) > 0.001) {
      setDisplayValue(value.toLocaleString());
    }
  }, [value]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!/^[\d,.]*$/.test(raw)) return;
    setDisplayValue(raw);
    const clean = raw.replace(/,/g, '');
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) onChange(parsed); else if (clean === '') onChange(0);
  };
  const handleBlur = () => {
    const clean = displayValue.replace(/,/g, '');
    const parsed = parseFloat(clean);
    setDisplayValue(!isNaN(parsed) ? parsed.toLocaleString() : value.toLocaleString());
  };
  return <input type="text" value={displayValue} onChange={handleChange} onBlur={handleBlur} className={className} />;
};

// Handles percentage inputs (stored as decimal, displayed as percentage)
const PercentageInput = ({ value, onChange, className, step = 0.1 }: { value: number; onChange: (val: number) => void; className?: string; step?: number; }) => {
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

  return <input type="number" step={step} value={displayValue} onChange={handleChange} onBlur={handleBlur} className={className} />;
};

const InputSection: React.FC<InputSectionProps> = ({ profile, setProfile }) => {
  const handleChange = (field: keyof UserProfile, value: any) => setProfile({ ...profile, [field]: value });
  const handleAssetChange = (field: keyof UserProfile['assets'], value: number) => setProfile({ ...profile, assets: { ...profile.assets, [field]: value } });
  const handleContributionChange = (field: keyof UserProfile['contributions'], value: number) => setProfile({ ...profile, contributions: { ...profile.contributions, [field]: value } });
  const handleIncomeChange = (field: keyof UserProfile['income'], value: number) => setProfile({ ...profile, income: { ...profile.income, [field]: value } });
  const handleAssumptionChange = (field: keyof UserProfile['assumptions'], value: number) => setProfile({ ...profile, assumptions: { ...profile.assumptions, [field]: value } });

  const resetToToday = () => {
    setProfile({
      ...profile,
      age: Number(profile.baseAge), // Force it to be a number on reset
    });
  };

  const inputClass = "w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1";
  const iconClass = "absolute left-3 top-2 text-slate-400 dark:text-slate-500";
  const containerClass = "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-8 transition-colors";
  const headerClass = "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4";

  const isFutureScenario = (Number(profile.age) || 0) !== profile.baseAge;

  return (
    <div className={containerClass}>
      {/* Personal Details */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Personal Details
          </h2>
          {isFutureScenario && (
            <button
              onClick={resetToToday}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Age {profile.baseAge}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Current Age</label>
            <input
              type="number"
              // The '??' ensures that if age is null/undefined, it defaults to empty string
              value={profile.age}
              onChange={(e) => {
                const rawValue = e.target.value;
                // If the input is empty, set it to an empty string. 
                // Otherwise, convert the string to a number.
                const updatedValue = rawValue === '' ? '' : parseInt(rawValue, 10);
                handleChange('age', updatedValue);
              }}
              onBlur={() => {
                if (profile.age === '') {
                  handleChange('age', profile.baseAge || 0);
                }
              }}
              className={inputClass}
              placeholder="Enter age"
            />
          </div>
          <div>
            <label className={labelClass}>Filing Status</label>
            <select
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
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Annual Spending Need</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                <button
                  onClick={() => handleChange('isSpendingReal', true)}
                  className={`px-2 py-0.5 rounded ${profile.isSpendingReal ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500'}`}
                >Today's $</button>
                <button
                  onClick={() => handleChange('isSpendingReal', false)}
                  className={`px-2 py-0.5 rounded ${!profile.isSpendingReal ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500'}`}
                >Future $</button>
              </div>
            </div>
            <div className="relative">
              <span className={iconClass}>$</span>
              <FormattedNumberInput
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
          Current Assets (Portfolio)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Traditional IRA / 401k', key: 'traditionalIRA' as const },
            { label: 'Roth IRA / 401k', key: 'rothIRA' as const },
            { label: 'Taxable Brokerage', key: 'brokerage' as const },
            { label: 'HSA', key: 'hsa' as const },
          ].map((item) => (
            <div key={item.key}>
              <label className={labelClass}>{item.label}</label>
              <div className="relative">
                <span className={iconClass}>$</span>
                <FormattedNumberInput
                  value={profile.assets[item.key]}
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
              <label className={labelClass}>{item.label}</label>
              <div className="relative">
                <span className={iconClass}>$</span>
                <FormattedNumberInput
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
          Income Sources (Annual)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Social Security Benefit</label>
            <div className="relative">
              <span className={iconClass}>$</span>
              <FormattedNumberInput
                value={profile.income.socialSecurity}
                onChange={(val) => handleIncomeChange('socialSecurity', val)}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Pension / Annuity</label>
            <div className="relative">
              <span className={iconClass}>$</span>
              <FormattedNumberInput
                value={profile.income.pension}
                onChange={(val) => handleIncomeChange('pension', val)}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Brokerage Dividends</label>
            <div className="relative">
              <span className={iconClass}>$</span>
              <FormattedNumberInput
                value={profile.income.brokerageDividends}
                onChange={(val) => handleIncomeChange('brokerageDividends', val)}
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Qualified Div. Ratio (%)</label>
            <PercentageInput
              value={profile.income.qualifiedDividendRatio}
              onChange={(val) => handleIncomeChange('qualifiedDividendRatio', val)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Market Assumptions */}
      <div>
        <h2 className={headerClass}>
          <TrendingUp className="w-5 h-5 text-orange-600" />
          Market Assumptions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Annual Return (%)</label>
            <PercentageInput
              value={profile.assumptions.rateOfReturn}
              onChange={(val) => handleAssumptionChange('rateOfReturn', val)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Inflation (%)</label>
            <PercentageInput
              value={profile.assumptions.inflationRate}
              onChange={(val) => handleAssumptionChange('inflationRate', val)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputSection;