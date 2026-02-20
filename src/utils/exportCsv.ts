import { YearProjection } from '../types';

export const exportLongevityToCsv = (projection: YearProjection[]) => {
    if (!projection || projection.length === 0) return;

    const headers = [
        'Age',
        'Year',
        'Total Assets',
        'Brokerage Balance',
        'Trad IRA Balance',
        'Roth IRA Balance',
        'HSA Balance',
        'Total Withdrawal',
        'Brokerage Withdrawal',
        'Trad IRA Withdrawal',
        'Roth IRA Withdrawal',
        'HSA Withdrawal',
        'Early Withdrawal Penalty',
        'RMD Amount',
        'Social Security Income',
        'Pension Income',
        'Dividend Income',
        'Estimated Tax',
        'Effective Tax Rate (%)'
    ];

    const rows = projection.map(data => {
        // Math.round to match the displayed values which are generally rounded for ease of reading
        return [
            data.age,
            data.year,
            Math.round(data.totalAssets),
            Math.round(data.brokerage),
            Math.round(data.traditionalIRA),
            Math.round(data.rothIRA),
            Math.round(data.hsa),
            Math.round(data.withdrawal),
            Math.round(data.withdrawalBrokerage),
            Math.round(data.withdrawalTrad),
            Math.round(data.withdrawalRoth),
            Math.round(data.withdrawalHSA),
            Math.round(data.earlyWithdrawalPenalty || 0),
            Math.round(data.rmdAmount || 0),
            Math.round(data.socialSecurityIncome || 0),
            Math.round(data.pensionIncome || 0),
            Math.round(data.dividendIncome || 0),
            Math.round(data.estimatedTax || 0),
            data.effectiveTaxRate ? (data.effectiveTaxRate * 100).toFixed(2) : '0.00'
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fiscal_sunset_longevity_projection.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
