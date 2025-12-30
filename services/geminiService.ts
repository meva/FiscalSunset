import { GoogleGenAI } from "@google/genai";
import { UserProfile, StrategyResult } from '../types';

export const getGeminiAdvice = async (profile: UserProfile, result: StrategyResult): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return "Please configure the Gemini API Key to receive personalized AI insights.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const totalAssets = profile.assets.brokerage + profile.assets.rothIRA + profile.assets.traditionalIRA + profile.assets.hsa;
    const withdrawalNeeded = Math.max(0, (profile.spendingNeed + result.estimatedFederalTax) - (profile.income.socialSecurity + profile.income.pension + profile.income.brokerageDividends));
    const withdrawalRate = totalAssets > 0 ? (withdrawalNeeded / totalAssets * 100).toFixed(1) : "0";

    const prompt = `
      Act as a world-class fiduciary financial advisor specializing in retirement tax strategies.
      Analyze the following user scenario.
      
      User Profile:
      Age: ${profile.age}
      Filing: ${profile.filingStatus}
      Assets: Trad IRA $${profile.assets.traditionalIRA}, Roth IRA $${profile.assets.rothIRA}, Brokerage $${profile.assets.brokerage}, HSA $${profile.assets.hsa}
      Social Security: $${profile.income.socialSecurity}
      Spending Need (Net): $${profile.spendingNeed}
      
      Calculated Strategy Result:
      RMD: $${result.rmdAmount}
      Estimated Tax: $${result.estimatedFederalTax}
      
      Longevity Context:
      Total Portfolio: $${totalAssets}
      Portfolio Draw Needed: $${withdrawalNeeded}
      Current Withdrawal Rate: ${withdrawalRate}% (Benchmark is 4-5%)
      
      Withdrawal Plan:
      ${result.withdrawalPlan.map(w => `- ${w.source}: $${w.amount} (${w.description})`).join('\n')}
      
      Provide a concise summary (max 3 paragraphs) covering:
      1. Why this tax strategy (specific account order) saves them money (Reference "Two-Layer Cake" - Ordinary income bottom, CG top).
      2. A brief comment on their withdrawal rate (${withdrawalRate}%) relative to the 4-5% rule of thumb. Are they safe, at risk, or in shortfall?
      
      Use bullet points and bolding for clarity.
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
