import type { FinancialIndicator } from "@portal-cvm/types";

/**
 * Indicator repository interface (Port).
 */
export interface IndicatorRepository {
  getByTicker(ticker: string, limit?: number): Promise<FinancialIndicator[]>;
}
