/**
 * Company domain types
 * Represents CVM-registered public companies (Companhias Abertas)
 */

/** Basic company identification from CVM registration */
export interface Company {
  /** CVM registration code */
  cdCvm: string;
  /** Company CNPJ */
  cnpj: string;
  /** Company legal name (Denominação Social) */
  companyName: string;
  /** Trading ticker symbol */
  ticker: string;
  /** Industry sector */
  sector?: string;
  /** Sub-sector */
  subSector?: string;
  /** Market segment */
  segment?: string;
  /** Company status (active/inactive) */
  status: "ATIVO" | "INATIVO";
}

/** Company summary for listing and overview (Gold layer) */
export interface CompanySummary extends Company {
  /** Latest available reference date */
  latestReferenceDate: string;
  /** Total assets (Ativo Total) in BRL */
  totalAssets?: number;
  /** Total equity (Patrimônio Líquido) in BRL */
  totalEquity?: number;
  /** Net revenue (Receita Líquida) in BRL */
  netRevenue?: number;
  /** Net income (Lucro Líquido) in BRL */
  netIncome?: number;
  /** Currency scale (e.g., "MIL" = thousands) */
  currencyScale: string;
}

/** Parameters for searching/filtering companies */
export interface CompanySearchParams {
  /** Search term for company name or ticker */
  search?: string;
  /** Filter by sector */
  sector?: string;
  /** Filter by status */
  status?: "ATIVO" | "INATIVO";
  /** Pagination: page number (1-based) */
  page?: number;
  /** Pagination: items per page */
  pageSize?: number;
}
