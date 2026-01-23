import { GoogleGenAI } from "@google/genai";
import { UserProfile, StrategyResult } from '../types';

export const getGeminiAdvice = async (profile: UserProfile, result: StrategyResult, apiKey: string): Promise<string> => {
  try {
    if (!apiKey) {
      return "Please configure the Gemini API Key in Settings to receive personalized AI insights.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const currentDividends = profile.assets.brokerage * profile.income.brokerageDividendYield;
    const totalAssets = profile.assets.brokerage + profile.assets.rothIRA + profile.assets.traditionalIRA + profile.assets.hsa;

    // Fix: Only subtract SS if age >= start age (default 62)
    const ssIncome = (profile.age >= (profile.income.socialSecurityStartAge || 62)) ? profile.income.socialSecurity : 0;

    const withdrawalNeeded = Math.max(0, (profile.spendingNeed + result.estimatedFederalTax) - (ssIncome + profile.income.pension + currentDividends));
    const withdrawalRate = totalAssets > 0 ? (withdrawalNeeded / totalAssets * 100).toFixed(1) : "0";

    // Extract Roth Conversion optimization details
    const rothDetail = result.rothConversionDetail;
    const rothSection = rothDetail ? `
      Roth Conversion Analysis:
      - Recommended Conversion: $${rothDetail.recommendedAmount.toLocaleString()}
      - Effective Marginal Rate: ${(rothDetail.effectiveMarginalRate * 100).toFixed(1)}%
      - Binding Constraint: ${rothDetail.bindingConstraint || 'None (can convert entire balance)'}
      - In SS Tax Torpedo Zone: ${rothDetail.inTorpedoZone ? `YES (${rothDetail.torpedoMultiplier}x multiplier)` : 'No'}
      - Warnings: ${rothDetail.warnings.length > 0 ? rothDetail.warnings.join('; ') : 'None'}
      - Reasoning: ${rothDetail.reasoning.join(' ')}
    ` : '';

    // Build constraint details if available
    const constraintDetails = rothDetail?.constraints?.length ? `
      Tax Optimization Constraints Analyzed:
      ${rothDetail.constraints.map(c => `- ${c.type.toUpperCase()}: ${c.description}${c.effectiveRate ? ` (${(c.effectiveRate * 100).toFixed(1)}% effective)` : ''}${c.annualCost ? ` (Annual cost if exceeded: $${c.annualCost.toLocaleString()})` : ''}`).join('\n      ')}
    ` : '';

    const prompt = `
      Act as a world-class fiduciary financial advisor specializing in retirement tax strategies.
      You have access to sophisticated tax optimization calculations. Analyze this scenario thoroughly.
      
      === USER PROFILE ===
      Current Age: ${profile.baseAge}
      Retirement Age (Target): ${profile.age} ${profile.age >= 73 ? '(Subject to RMDs)' : profile.age >= 65 ? '(Eligible for Senior Deduction)' : ''}
      Filing Status: ${profile.filingStatus}
      
      Economic Assumptions:
      - Inflation: ${(profile.assumptions.inflationRate * 100).toFixed(2)}% (Pre-Retirement), ${(profile.assumptions.inflationRateInRetirement * 100).toFixed(2)}% (in Retirement)
      - Investment Return: ${(profile.assumptions.rateOfReturn * 100).toFixed(2)}% (Pre-Retirement), ${(profile.assumptions.rateOfReturnInRetirement * 100).toFixed(2)}% (in Retirement)

      Current Assets:
      - Traditional IRA/401(k): $${profile.assets.traditionalIRA.toLocaleString()}
      - Roth IRA: $${profile.assets.rothIRA.toLocaleString()} (Basis: $${(profile.assets.rothBasis || 0).toLocaleString()})
      - Taxable Brokerage: $${profile.assets.brokerage.toLocaleString()}
      - HSA: $${profile.assets.hsa.toLocaleString()}
      - Total Portfolio: $${totalAssets.toLocaleString()}

      Annual Contributions (until Retirement Age ${profile.age}):
      ${profile.baseAge < profile.age ? `
      - Traditional (Tax-Deferred): $${profile.contributions.traditionalIRA.toLocaleString()}
      - Roth (Post-Tax): $${profile.contributions.rothIRA.toLocaleString()}
      - Brokerage (Taxable): $${profile.contributions.brokerage.toLocaleString()}
      - HSA: $${profile.contributions.hsa.toLocaleString()}
      ` : '- None (Already Retired)'}
      
      Income Sources:
      - Social Security: $${profile.income.socialSecurity.toLocaleString()}/year (Starting Age: ${profile.income.socialSecurityStartAge || 62})
      - Pension: $${profile.income.pension.toLocaleString()}/year
      - Brokerage Dividends: $${currentDividends.toLocaleString()}/year (${(profile.income.qualifiedDividendRatio * 100).toFixed(0)}% qualified)
      
      Annual Spending Need: $${profile.spendingNeed.toLocaleString()} (${profile.isSpendingReal ? 'inflation-adjusted real dollars' : 'nominal dollars'})
      
      === TAX CALCULATION RESULTS ===
      Two-Layer Cake Method Applied:
      - Standard Deduction: $${result.standardDeduction.toLocaleString()}
      - Taxable Social Security: $${result.taxableSocialSecurity.toLocaleString()} of $${profile.income.socialSecurity.toLocaleString()} (${profile.income.socialSecurity > 0 ? ((result.taxableSocialSecurity / profile.income.socialSecurity) * 100).toFixed(0) : 0}%)
      - Provisional Income: $${result.provisionalIncome.toLocaleString()}
      - RMD Required: $${result.rmdAmount.toLocaleString()}
      - Estimated Federal Tax: $${result.estimatedFederalTax.toLocaleString()}
      - Effective Tax Rate: ${(result.effectiveTaxRate * 100).toFixed(2)}%
      
      === WITHDRAWAL STRATEGY (Optimized Order) ===
      ${result.withdrawalPlan.map(w => `- ${w.source}: $${w.amount.toLocaleString()} → Taxable: $${w.taxableAmount.toLocaleString()} (${w.taxType}) - ${w.description}`).join('\n      ')}
      
      Total Withdrawal: $${result.totalWithdrawal.toLocaleString()}
      Gap Filled: ${result.gapFilled ? 'Yes' : 'No - Spending need exceeds available assets'}
      ${result.liquidityGapWarning ? 'WARNING: Early withdrawal penalties incurred due to liquidity gap.' : ''}
      ${result.notes.length > 0 ? `Notes: ${result.notes.join(' ')}` : ''}
      ${rothSection}
      ${constraintDetails}
      === LONGEVITY ANALYSIS ===
      Portfolio Draw Needed: $${withdrawalNeeded.toLocaleString()}/year
      Current Withdrawal Rate: ${withdrawalRate}% (Benchmark: 4% conservative, 5% moderate)
      
      === YOUR ANALYSIS ===
      Provide a personalized, actionable summary (3-4 paragraphs) covering:
      
      1. **Tax Efficiency Analysis**: Explain why this specific withdrawal order (Two-Layer Cake method) optimizes their taxes. Reference the ordinary income "layer" being taxed first, then capital gains stacked on top at preferential rates.
      
      2. **Critical Warnings**: Address ANY of these if detected:
         - Social Security "Tax Torpedo" (50-85% SS taxation zones causing 1.5x-1.85x effective rates)
         - IRMAA Medicare premium cliffs (income thresholds that trigger surcharges)
         - Senior Deduction phase-outs (OBBBA $6K/$12K deduction reduction at high income)
         - High withdrawal rates (>5%)
         - Liquidity Gaps or Early Withdrawal Penalties (if triggered)
      
      3. **Roth Conversion Strategy**: If a Roth conversion is recommended, explain:
         - Why the recommended amount was chosen
         - What constraint limited further conversion (bracket, IRMAA cliff, SS torpedo, etc.)
         - The long-term benefit of paying taxes now vs. later
      
      4. **Action Items**: Provide 2-3 specific next steps they should consider.
      
      Use **bold** for emphasis and bullet points for clarity. Be specific with dollar amounts and percentages.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate advice at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The financial advisor AI is currently unavailable. Please try again later.";
  }
};
