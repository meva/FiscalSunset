import React, { useState } from 'react';
import { WizardState } from './types';
import { FilingStatus, UserProfile } from '../../types'; // Import UserProfile
import { mapWizardStateToProfile } from './wizardMapper';
import Step1Timeline from './Steps/Step1Timeline';
import Step2TaxProfile from './Steps/Step2TaxProfile';
import Step3FinancialBase from './Steps/Step3FinancialBase';
import Step4Diversification from './Steps/Step4Diversification';
import Step5Goals from './Steps/Step5Goals';
import Step6Results from './Steps/Step6Results';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (profile: UserProfile) => void;
    currentProfile: UserProfile; // Added to map onto existing profile
}

const INITIAL_WIZARD_STATE: WizardState = {
    currentAge: 55,
    retirementAge: 65,
    filingStatus: FilingStatus.Single,
    totalAssets: 500000,
    assetAllocation: { taxDeferred: 50, taxable: 30, taxExempt: 20 },
    annualSpending: 60000
};

const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose, onComplete, currentProfile }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<WizardState>(INITIAL_WIZARD_STATE);

    if (!isOpen) return null;

    const updateField = (fields: Partial<WizardState>) => {
        setData(prev => ({ ...prev, ...fields }));
    };

    const handleNext = () => {
        if (step < 6) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleFinish = () => {
        const newProfile = mapWizardStateToProfile(data, currentProfile);
        onComplete(newProfile);
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1Timeline data={data} update={updateField} />;
            case 2: return <Step2TaxProfile data={data} update={updateField} />;
            case 3: return <Step3FinancialBase data={data} update={updateField} />;
            case 4: return <Step4Diversification data={data} update={updateField} />;
            case 5: return <Step5Goals data={data} update={updateField} />;
            case 6: return <Step6Results data={data} onComplete={handleFinish} />;
            default: return null;
        }
    };

    const progress = (step / 6) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Onboarding Wizard</span>
                        <span className="text-sm font-medium text-slate-500">Step {step} of 6</span>
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

                {/* Footer Navigation (Hidden on Step 6) */}
                {step < 6 && (
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
