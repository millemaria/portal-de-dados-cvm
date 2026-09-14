import type { FinancialIndicator, ApiResponse } from "@portal-cvm/types";
import type { IndicatorRepository } from "../domain/IndicatorRepository.js";
import type { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";

export class GetIndicatorsUseCase {
  constructor(
    private readonly repository: IndicatorRepository,
    private readonly cache: CacheService
  ) {}

  async execute(
    ticker: string,
    limit: number = 5
  ): Promise<ApiResponse<FinancialIndicator[]>> {
    const cacheKey = `indicators:${ticker}:${limit}`;
    const cached = this.cache.get<ApiResponse<FinancialIndicator[]>>(cacheKey);
    if (cached) return cached;

    const data = await this.repository.getByTicker(ticker, limit);
    const response: ApiResponse<FinancialIndicator[]> = {
      success: true,
      data,
    };

    this.cache.set(cacheKey, response);
    return response;
  }
}
