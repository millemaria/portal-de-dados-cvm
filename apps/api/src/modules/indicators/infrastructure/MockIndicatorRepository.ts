import type { FinancialIndicator } from "@portal-cvm/types";
import type { IndicatorRepository } from "../domain/IndicatorRepository.js";

/**
 * Mock implementation of IndicatorRepository for local development.
 */
export class MockIndicatorRepository implements IndicatorRepository {
  private readonly mockIndicators: Record<string, FinancialIndicator[]> = {
    PETR4: [
      {
        cdCvm: "9512",
        ticker: "PETR4",
        referenceDate: "2024-12-31",
        roe: 0.3008,
        roa: 0.1055,
        netMargin: 0.2047,
        grossMargin: 0.4384,
        ebitdaMargin: 0.3562,
        currentRatio: 0.9201,
        debtToEquity: 1.8511,
        totalAssets: 992847000,
        totalEquity: 348291000,
        netRevenue: 511847000,
        netIncome: 104761000,
        ebitda: 182340000,
        currencyScale: "MIL",
      },
      {
        cdCvm: "9512",
        ticker: "PETR4",
        referenceDate: "2023-12-31",
        roe: 0.2845,
        roa: 0.0987,
        netMargin: 0.1923,
        grossMargin: 0.4210,
        ebitdaMargin: 0.3412,
        currentRatio: 0.8910,
        debtToEquity: 1.9210,
        totalAssets: 945210000,
        totalEquity: 331200000,
        netRevenue: 486320000,
        netIncome: 93510000,
        ebitda: 165980000,
        currencyScale: "MIL",
      },
    ],
    VALE3: [
      {
        cdCvm: "19615",
        ticker: "VALE3",
        referenceDate: "2024-12-31",
        roe: 0.1953,
        roa: 0.0753,
        netMargin: 0.1907,
        grossMargin: 0.4120,
        ebitdaMargin: 0.3890,
        currentRatio: 1.2310,
        debtToEquity: 1.5920,
        totalAssets: 540320000,
        totalEquity: 208413000,
        netRevenue: 213400000,
        netIncome: 40710000,
        ebitda: 83012000,
        currencyScale: "MIL",
      },
    ],
  };

  async getByTicker(
    ticker: string,
    limit: number = 5
  ): Promise<FinancialIndicator[]> {
    const indicators = this.mockIndicators[ticker.toUpperCase()] ?? [];
    return indicators.slice(0, limit);
  }
}
