import React from 'react';
import { WizardState } from '../types';
import { FilingStatus } from '../../../../types';
import { Activity, DollarSign, Users } from 'lucide-react';

interface CheckProps {
    data: WizardState;
    update: (fields: Partial<WizardState>) => void;
}

const Step6Income: React.FC<CheckProps> = ({ data, update }) => {
    // Ensure futureIncome object exists
    const income = data.futureIncome || { socialSecurity: 0, socialSecurityStartAge: 62, pension: 0, spouseSocialSecurity: 0, spouseSocialSecurityStartAge: 67 };

    // Local state for formatted inputs
    // Initialize monthly SS display by dividing annual amount by 12
    const [ssDisplay, setSsDisplay] = React.useState(
        income.socialSecurity ? Math.round(income.socialSecurity / 12).toLocaleString() : '0'
    );
    // Defaults to 62 if not set
    const [ssStartAgeDisplay, setSsStartAgeDisplay] = React.useState((income.socialSecurityStartAge || 62).toString());
    const [pensionDisplay, setPensionDisplay] = React.useState((income.pension || 0).toLocaleString());

    // Spouse SS display states
    const [spouseSSDisplay, setSpouseSSDisplay] = React.useState(
        income.spouseSocialSecurity ? Math.round((income.spouseSocialSecurity || 0) / 12).toLocaleString() : '0'
    );
    const [spouseSSStartAgeDisplay, setSpouseSSStartAgeDisplay] = React.useState(
        (income.spouseSocialSecurityStartAge || 67).toString()
    );

    const isMFJ = data.filingStatus === FilingStatus.MarriedJoint;

    const handleDisplayChange = (
        field: keyof typeof income,
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const raw = value.replace(/,/g, '');

        if (raw === '') {
            setter('');
            update({
                futureIncome: {
                    ...income,
                    [field]: 0
                }
            });
            return;
        }

        if (!/^\d*$/.test(raw)) return;

        setter(Number(raw).toLocaleString());

        // If updating Social Security (primary or spouse), convert monthly input to annual
        const valueToSave = (field === 'socialSecurity' || field === 'spouseSocialSecurity')
            ? Number(raw) * 12 : Number(raw);

        update({
            futureIncome: {
                ...income,
                [field]: valueToSave
            }
        });
    };

    const inputClass = "w-full text-lg font-bold p-4 pl-8 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all";

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="text-center space-y-2">
                <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Future Income Sources</h2>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Do you expect any guaranteed income in retirement?
                </p>
            </div>

            <div className="max-w-md mx-auto space-y-6 pt-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {isMFJ ? 'Your Estimated Monthly Social Security' : 'Estimated Monthly Social Security'}
                    </label>
                    <div className="relative mb-2">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                            type="text"
                            value={ssDisplay}
                            onChange={(e) => handleDisplayChange('socialSecurity', e.target.value, setSsDisplay)}
                            className={inputClass}
                            placeholder="0"
                        />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Need an estimate? Visit <a href="https://www.ssa.gov/prepare/get-benefits-estimate" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline">ssa.gov/prepare/get-benefits-estimate</a>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {isMFJ ? 'Your SS Start Age (e.g. 62, 67, 70)' : 'Start Age (e.g. 62, 67, 70)'}
                    </label>
                    <div className="relative mb-2">
                        <input
                            type="text"
                            value={ssStartAgeDisplay}
                            onChange={(e) => handleDisplayChange('socialSecurityStartAge', e.target.value, setSsStartAgeDisplay)}
                            className="w-full text-lg font-bold p-4 pl-4 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            placeholder="62"
                        />
                    </div>
                </div>

                {/* Partner SS fields — visible only for MFJ */}
                {isMFJ && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            <p className="text-sm font-bold text-purple-600 dark:text-purple-400">Partner's Social Security</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Partner's Monthly Social Security
                            </label>
                            <div className="relative mb-2">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="text"
                                    value={spouseSSDisplay}
                                    onChange={(e) => handleDisplayChange('spouseSocialSecurity', e.target.value, setSpouseSSDisplay)}
                                    className={inputClass}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Partner's SS Start Age (e.g. 62, 67, 70)
                            </label>
                            <div className="relative mb-2">
                                <input
                                    type="text"
                                    value={spouseSSStartAgeDisplay}
                                    onChange={(e) => handleDisplayChange('spouseSocialSecurityStartAge', e.target.value, setSpouseSSStartAgeDisplay)}
                                    className="w-full text-lg font-bold p-4 pl-4 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    placeholder="67"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Annual Pension / Annuity
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                            type="text"
                            value={pensionDisplay}
                            onChange={(e) => handleDisplayChange('pension', e.target.value, setPensionDisplay)}
                            className={inputClass}
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step6Income;
