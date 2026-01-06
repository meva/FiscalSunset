import { FilingStatus } from '../../types';

export interface WizardState {
    currentAge: number;
    retirementAge: number;
    filingStatus: FilingStatus;
    totalAssets: number;
    assetAllocation: {
        taxDeferred: number; // 0-100
        taxable: number;     // 0-100
        taxExempt: number;   // 0-100
    };
    annualSpending: number;
}
