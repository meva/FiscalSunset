/**
 * Monte Carlo Simulation Engine
 * 
 * Calculates expected portfolio returns and runs a Monte Carlo simulation
 * to generate a distribution of possible future outcomes.
 */

// ============================================================================
// Constants & Asset Definitions
// ============================================================================

export type AssetType = 'VTI' | 'VXUS' | 'BND' | 'BNDX';

export interface PortfolioAllocation {
    VTI: number;  // US Stocks
    VXUS: number; // International Stocks
    BND: number;  // US Bonds
    BNDX: number; // International Bonds
}

interface AssetMetrics {
    meanReturn: number; // Geometric Mean (approx) or Arithmetic Mean
    volatility: number; // Standard Deviation
}

export const ASSET_METRICS: Record<AssetType, AssetMetrics> = {
    VTI: { meanReturn: 0.105, volatility: 0.155 },
    VXUS: { meanReturn: 0.085, volatility: 0.180 },
    BND: { meanReturn: 0.045, volatility: 0.050 },
    BNDX: { meanReturn: 0.040, volatility: 0.045 },
};

// Simple Correlation Matrix (Approximation)
// Order: VTI, VXUS, BND, BNDX
// 1.0 for self
// 0.7 for Stock/Stock
// 0.1 for Stock/Bond
// 0.5 for Bond/Bond
const CORRELATIONS: Record<AssetType, Record<AssetType, number>> = {
    VTI: { VTI: 1.0, VXUS: 0.7, BND: 0.1, BNDX: 0.1 },
    VXUS: { VTI: 0.7, VXUS: 1.0, BND: 0.1, BNDX: 0.1 },
    BND: { VTI: 0.1, VXUS: 0.1, BND: 1.0, BNDX: 0.5 },
    BNDX: { VTI: 0.1, VXUS: 0.1, BND: 0.5, BNDX: 1.0 },
};

export interface SimulationResult {
    p10: number; // 10th percentile (Bad Case)
    p50: number; // 50th percentile (Likely Case)
    p90: number; // 90th percentile (Great Case)
    bellCurveData: { returnFreq: number; frequency: number }[]; // For visualization
}

// ============================================================================
// Math Helpers
// ============================================================================

/**
 * Generates a random number with a standard normal distribution (mean=0, std=1)
 * utilizing the Box-Muller transform.
 */
function randn_bm(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Calculates portfolio expected return (weighted average).
 */
function calculatePortfolioReturn(allocation: PortfolioAllocation): number {
    let weightedReturn = 0;
    const totalWeight = allocation.VTI + allocation.VXUS + allocation.BND + allocation.BNDX;

    if (totalWeight === 0) return 0;

    (Object.keys(allocation) as AssetType[]).forEach(asset => {
        const weight = allocation[asset] / 100; // Assuming allocation inputs are 0-100
        weightedReturn += weight * ASSET_METRICS[asset].meanReturn;
    });

    return weightedReturn;
}

/**
 * Calculates portfolio volatility (standard deviation) using the covariance matrix.
 * Sigma_p = sqrt(w^T * Sigma * w)
 */
function calculatePortfolioVolatility(allocation: PortfolioAllocation): number {
    const assets: AssetType[] = ['VTI', 'VXUS', 'BND', 'BNDX'];
    let variance = 0;

    // Double loop sum: w_i * w_j * sigma_i * sigma_j * rho_ij
    for (const i of assets) {
        for (const j of assets) {
            const w_i = allocation[i] / 100;
            const w_j = allocation[j] / 100;
            const sigma_i = ASSET_METRICS[i].volatility;
            const sigma_j = ASSET_METRICS[j].volatility;
            const correlation = CORRELATIONS[i][j];

            variance += w_i * w_j * sigma_i * sigma_j * correlation;
        }
    }

    return Math.sqrt(variance);
}

// ============================================================================
// Core Simulation Logic
// ============================================================================

/**
 * Runs the Monte Carlo simulation.
 * @param allocation Portfolio weights (must sum to 100)
 * @param years Duration of simulation (default 30, but uses user timeline)
 * @returns SimulationResult with p10, p50, p90 and chart data
 */
export const runMonteCarloSimulation = (
    allocation: PortfolioAllocation,
    years: number = 30
): SimulationResult => {
    const iterations = 10000;
    const mu = calculatePortfolioReturn(allocation);      // Expected Arithmetic Return
    const sigma = calculatePortfolioVolatility(allocation); // Expected Volatility

    // Ensure reasonable duration (at least 30 years for stats, or user horizon)
    const T = Math.max(30, years);

    const finalCAGRs: number[] = [];

    // Simulate price paths using Geometric Brownian Motion
    // S_t = S_0 * exp((mu - 0.5*sigma^2)*t + sigma*W_t)
    // We want the CAGR: (S_T / S_0)^(1/T) - 1
    // This simplifies to: exp((mu - 0.5*sigma^2) + sigma * (W_T / T)) - 1 ??
    // Actually, easier: Simulate year-by-year or just final distribution directly since log-returns are normal?
    // User requested "path" logic typically, but for CAGR distribution of terminal wealth we can use the direct formula property.
    // Ln(S_T/S_0) ~ Normal((mu - 0.5*sigma^2)*T, sigma^2 * T)

    // Let's do the loop version to be explicit and allow for future annual logic if needed.
    // Actually, direct sampling is faster and equivalent for standard GBM.

    const drift = mu - 0.5 * Math.pow(sigma, 2);
    const rootT = Math.sqrt(T);

    for (let i = 0; i < iterations; i++) {
        const Z = randn_bm(); // Standard Normal Random Variable implies W_T = Z * sqrt(T)

        // Log Return over T years
        const logReturnTotal = drift * T + sigma * Z * rootT;

        // Convert to CAGR: (exp(total_log_return))^(1/T) - 1
        // = exp(total_log_return / T) - 1
        const cagr = Math.exp(logReturnTotal / T) - 1;

        finalCAGRs.push(cagr);
    }

    // Sort results
    finalCAGRs.sort((a, b) => a - b);

    const p10Index = Math.floor(iterations * 0.1);
    const p50Index = Math.floor(iterations * 0.5);
    const p90Index = Math.floor(iterations * 0.9);

    // Generate Frequency Data for Bell Curve
    // Create histogram buckets
    const bucketCount = 40;
    const minVal = finalCAGRs[0];
    const maxVal = finalCAGRs[finalCAGRs.length - 1];
    const range = maxVal - minVal;
    const bucketSize = range / bucketCount;

    const bellCurveData = new Array(bucketCount).fill(0).map((_, i) => {
        const bucketStart = minVal + i * bucketSize;
        const bucketEnd = bucketStart + bucketSize;
        const count = finalCAGRs.filter(v => v >= bucketStart && v < bucketEnd).length;
        return {
            returnFreq: parseFloat(((bucketStart + bucketSize / 2) * 100).toFixed(1)), // Midpoint as x-axis label (%)
            frequency: count
        };
    });

    return {
        p10: finalCAGRs[p10Index],
        p50: finalCAGRs[p50Index],
        p90: finalCAGRs[p90Index],
        bellCurveData
    };
};
