import type { CompanySummary, ApiResponse } from "@portal-cvm/types";
import type { CompanyRepository } from "../domain/CompanyRepository.js";
import type { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";

export class GetCompanyByTickerUseCase {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly cache: CacheService
  ) {}

  async execute(ticker: string): Promise<ApiResponse<CompanySummary> | null> {
    const cacheKey = `company:${ticker}`;
    const cached = this.cache.get<ApiResponse<CompanySummary>>(cacheKey);
    if (cached) return cached;

    const company = await this.repository.findByTicker(ticker);
    if (!company) return null;

    const response: ApiResponse<CompanySummary> = {
      success: true,
      data: company,
    };

    this.cache.set(cacheKey, response);
    return response;
  }
}
