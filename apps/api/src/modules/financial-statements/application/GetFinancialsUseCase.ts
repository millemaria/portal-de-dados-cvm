import type {
  BalanceSheet,
  IncomeStatement,
  CashFlow,
  ApiResponse,
  RevenueHistoryEntry,
  NetIncomeHistoryEntry,
} from "@portal-cvm/types";
import type { FinancialRepository } from "../domain/FinancialRepository.js";
import type { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";
import type { FinancialQueryInput } from "@portal-cvm/validation";

export class GetFinancialsUseCase {
  constructor(
    private readonly repository: FinancialRepository,
    private readonly cache: CacheService
  ) {}

  async getBalanceSheet(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<ApiResponse<BalanceSheet[]>> {
    const cacheKey = `balance-sheet:${ticker}:${JSON.stringify(params)}`;
    const cached = this.cache.get<ApiResponse<BalanceSheet[]>>(cacheKey);
    if (cached) return cached;

    const data = await this.repository.getBalanceSheet(ticker, params);
    const response: ApiResponse<BalanceSheet[]> = { success: true, data };
    this.cache.set(cacheKey, response);
    return response;
  }

  async getIncomeStatement(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<ApiResponse<IncomeStatement[]>> {
    const cacheKey = `income-statement:${ticker}:${JSON.stringify(params)}`;
    const cached = this.cache.get<ApiResponse<IncomeStatement[]>>(cacheKey);
    if (cached) return cached;

    const data = await this.repository.getIncomeStatement(ticker, params);
    const response: ApiResponse<IncomeStatement[]> = { success: true, data };
    this.cache.set(cacheKey, response);
    return response;
  }

  async getCashFlow(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<ApiResponse<CashFlow[]>> {
    const cacheKey = `cash-flow:${ticker}:${JSON.stringify(params)}`;
    const cached = this.cache.get<ApiResponse<CashFlow[]>>(cacheKey);
    if (cached) return cached;

    const data = await this.repository.getCashFlow(ticker, params);
    const response: ApiResponse<CashFlow[]> = { success: true, data };
    this.cache.set(cacheKey, response);
    return response;
  }

  async getRevenueHistory(
    ticker: string,
    limit: number = 10
  ): Promise<ApiResponse<RevenueHistoryEntry[]>> {
    const cacheKey = `revenue-history:${ticker}:${limit}`;
    const cached = this.cache.get<ApiResponse<RevenueHistoryEntry[]>>(cacheKey);
    if (cached) return cached;

    const data = await this.repository.getRevenueHistory(ticker, limit);
    const response: ApiResponse<RevenueHistoryEntry[]> = {
      success: true,
      data,
    };
    this.cache.set(cacheKey, response);
    return response;
  }

  async getNetIncomeHistory(
    ticker: string,
    limit: number = 10
  ): Promise<ApiResponse<NetIncomeHistoryEntry[]>> {
    const cacheKey = `net-income-history:${ticker}:${limit}`;
    const cached =
      this.cache.get<ApiResponse<NetIncomeHistoryEntry[]>>(cacheKey);
    if (cached) return cached;

    const data = await this.repository.getNetIncomeHistory(ticker, limit);
    const response: ApiResponse<NetIncomeHistoryEntry[]> = {
      success: true,
      data,
    };
    this.cache.set(cacheKey, response);
    return response;
  }
}
