import type { CompanySummary, CompanySearchParams } from "@portal-cvm/types";

/**
 * Company repository interface (Port).
 * Defines the contract for accessing company data.
 * Implementations: DatabricksCompanyRepository, MockCompanyRepository
 */
export interface CompanyRepository {
  /** Find companies with optional search/filter and pagination */
  findAll(params: CompanySearchParams): Promise<{
    data: CompanySummary[];
    total: number;
  }>;

  /** Find a single company by ticker */
  findByTicker(ticker: string): Promise<CompanySummary | null>;
}
