import type { CompanySummary, PaginatedResponse } from "@portal-cvm/types";
import type { CompanyRepository } from "../domain/CompanyRepository.js";
import type { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";
import type { CompanySearchInput } from "@portal-cvm/validation";

export class GetCompaniesUseCase {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly cache: CacheService
  ) {}

  async execute(
    params: CompanySearchInput
  ): Promise<PaginatedResponse<CompanySummary>> {
    const cacheKey = `companies:${JSON.stringify(params)}`;
    const cached = this.cache.get<PaginatedResponse<CompanySummary>>(cacheKey);
    if (cached) return cached;

    const { data, total } = await this.repository.findAll({
      search: params.search,
      sector: params.sector,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    });

    const totalPages = Math.ceil(total / params.pageSize);

    const response: PaginatedResponse<CompanySummary> = {
      success: true,
      data,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPreviousPage: params.page > 1,
      },
    };

    this.cache.set(cacheKey, response);
    return response;
  }
}
