import React, { useState } from 'react';
import { WizardState } from './types';
import { FilingStatus, UserProfile } from '../../../types'; // Import UserProfile
import { mapWizardStateToProfile } from './wizardMapper';
import Step1Timeline from './Steps/Step1Timeline';
import Step2TaxProfile from './Steps/Step2TaxProfile';
import Step3FinancialBase from './Steps/Step3FinancialBase';
import Step4Diversification from './Steps/Step4Diversification';
import Step5Contributions from './Steps/Step5Contributions';
import Step6Income from './Steps/Step6Income';
import Step7Goals from './Steps/Step7Goals';
import Step8Results from './Steps/Step8Results';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (profile: UserProfile, destination?: 'accumulation' | 'withdrawal') => void;
    currentProfile: UserProfile; // Added to map onto existing profile
}

const INITIAL_WIZARD_STATE: WizardState = {
    currentAge: 55,
    retirementAge: 65,
    filingStatus: FilingStatus.Single,
    totalAssets: 500000,
    assetAllocation: { taxDeferred: 50, taxable: 30, taxExempt: 20 },
    annualSpending: 60000,
    totalAnnualContribution: 25000,
    contributionAllocation: { taxDeferred: 50, taxable: 30, taxExempt: 20 },
    futureIncome: { socialSecurity: 35000, socialSecurityStartAge: 67, pension: 0 }
};

const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose, onComplete, currentProfile }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<WizardState>(INITIAL_WIZARD_STATE);

    if (!isOpen) return null;

    const updateField = (fields: Partial<WizardState>) => {
        setData(prev => ({ ...prev, ...fields }));
    };

    const isRetired = data.currentAge >= data.retirementAge;

    const handleNext = () => {
        let nextStep = step + 1;
        // Skip Contributions (Step 5) if retired
        if (nextStep === 5 && isRetired) {
            nextStep = 6;
        }
        if (nextStep <= 8) setStep(nextStep);
    };

    const handleBack = () => {
        let prevStep = step - 1;
        // Skip Contributions (Step 5) if retired
        if (prevStep === 5 && isRetired) {
            prevStep = 4;
        }
        if (prevStep >= 1) setStep(prevStep);
    };

    const handleFinish = (finalProfile: UserProfile, destination: 'accumulation' | 'withdrawal' = 'accumulation') => {
        onComplete(finalProfile, destination);
    };

    const handleRestart = () => {
        setStep(1);
        setData(INITIAL_WIZARD_STATE);
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1Timeline data={data} update={updateField} />;
            case 2: return <Step2TaxProfile data={data} update={updateField} />;
            case 3: return <Step3FinancialBase data={data} update={updateField} />;
            case 4: return <Step4Diversification data={data} update={updateField} />;
            case 5: return <Step5Contributions data={data} update={updateField} />;
            case 6: return <Step6Income data={data} update={updateField} />;
            case 7: return <Step7Goals data={data} update={updateField} />;
            case 8: return <Step8Results data={data} onComplete={handleFinish} onRestart={handleRestart} />;
            default: return null;
        }
    };

    // Calculate total steps (7 normally, 6 if retired)
    // Actually simplicity: Let's keep logic simple. Max step is 8.
    // If we skip step 5, we still have 8 logic steps, just one is jumped.
    const effectiveTotalSteps = isRetired ? 7 : 8;
    const effectiveCurrentStep = (isRetired && step > 5) ? step - 1 : step;

    const progress = (effectiveCurrentStep / effectiveTotalSteps) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Onboarding Wizard</span>
                        {step < 8 && <span className="text-sm font-medium text-slate-500">Step {effectiveCurrentStep} of {effectiveTotalSteps}</span>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    {renderStep()}
                </div>

                {/* Footer Navigation (Hidden on Step 8) */}
                {step < 8 && (
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all font-medium"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                        ) : (
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-medium px-4">Skip Setup</button>
                        )}

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
                        >
                            Continue
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WizardModal;
