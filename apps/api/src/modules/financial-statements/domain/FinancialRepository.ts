import type {
  BalanceSheet,
  IncomeStatement,
  CashFlow,
  RevenueHistoryEntry,
  NetIncomeHistoryEntry,
} from "@portal-cvm/types";
import type { FinancialQueryInput } from "@portal-cvm/validation";

/**
 * Financial repository interface (Port).
 * Defines the contract for accessing financial statement data.
 */
export interface FinancialRepository {
  getBalanceSheet(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<BalanceSheet[]>;

  getIncomeStatement(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<IncomeStatement[]>;

  getCashFlow(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<CashFlow[]>;

  getRevenueHistory(
    ticker: string,
    limit: number
  ): Promise<RevenueHistoryEntry[]>;

  getNetIncomeHistory(
    ticker: string,
    limit: number
  ): Promise<NetIncomeHistoryEntry[]>;
}
