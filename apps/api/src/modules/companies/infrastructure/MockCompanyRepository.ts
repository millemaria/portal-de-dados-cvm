import type { CompanySummary, CompanySearchParams } from "@portal-cvm/types";
import type { CompanyRepository } from "../domain/CompanyRepository.js";

/**
 * Mock implementation of CompanyRepository for local development.
 * Returns realistic sample data without requiring Databricks connection.
 */
export class MockCompanyRepository implements CompanyRepository {
  private readonly companies: CompanySummary[] = [
    {
      cdCvm: "9512",
      cnpj: "33.000.167/0001-01",
      companyName: "PETROLEO BRASILEIRO S.A. - PETROBRAS",
      ticker: "PETR4",
      sector: "Petróleo, Gás e Biocombustíveis",
      subSector: "Exploração, Refino e Distribuição",
      segment: "Novo Mercado",
      status: "ATIVO",
      latestReferenceDate: "2024-12-31",
      totalAssets: 992847000,
      totalEquity: 348291000,
      netRevenue: 511847000,
      netIncome: 104761000,
      currencyScale: "MIL",
    },
    {
      cdCvm: "19615",
      cnpj: "00.000.000/0001-91",
      companyName: "VALE S.A.",
      ticker: "VALE3",
      sector: "Materiais Básicos",
      subSector: "Mineração",
      segment: "Novo Mercado",
      status: "ATIVO",
      latestReferenceDate: "2024-12-31",
      totalAssets: 540320000,
      totalEquity: 208413000,
      netRevenue: 213400000,
      netIncome: 40710000,
      currencyScale: "MIL",
    },
    {
      cdCvm: "2453",
      cnpj: "60.872.504/0001-23",
      companyName: "ITAU UNIBANCO HOLDING S.A.",
      ticker: "ITUB4",
      sector: "Financeiro",
      subSector: "Intermediários Financeiros",
      segment: "Nível 1",
      status: "ATIVO",
      latestReferenceDate: "2024-12-31",
      totalAssets: 2870145000,
      totalEquity: 194205000,
      netRevenue: 166432000,
      netIncome: 35616000,
      currencyScale: "MIL",
    },
    {
      cdCvm: "18112",
      cnpj: "02.558.157/0001-62",
      companyName: "MAGAZINE LUIZA S.A.",
      ticker: "MGLU3",
      sector: "Consumo Cíclico",
      subSector: "Comércio",
      segment: "Novo Mercado",
      status: "ATIVO",
      latestReferenceDate: "2024-12-31",
      totalAssets: 32156000,
      totalEquity: 5417000,
      netRevenue: 35240000,
      netIncome: -432000,
      currencyScale: "MIL",
    },
    {
      cdCvm: "20990",
      cnpj: "08.467.115/0001-00",
      companyName: "WEG S.A.",
      ticker: "WEGE3",
      sector: "Bens Industriais",
      subSector: "Máquinas e Equipamentos",
      segment: "Novo Mercado",
      status: "ATIVO",
      latestReferenceDate: "2024-12-31",
      totalAssets: 38743000,
      totalEquity: 22891000,
      netRevenue: 32583000,
      netIncome: 5614000,
      currencyScale: "MIL",
    },
    {
      cdCvm: "14311",
      cnpj: "47.960.950/0001-21",
      companyName: "AMBEV S.A.",
      ticker: "ABEV3",
      sector: "Consumo não Cíclico",
      subSector: "Bebidas",
      segment: "Novo Mercado",
      status: "ATIVO",
      latestReferenceDate: "2024-12-31",
      totalAssets: 120538000,
      totalEquity: 65421000,
      netRevenue: 79200000,
      netIncome: 15120000,
      currencyScale: "MIL",
    },
    {
      cdCvm: "906",
      cnpj: "00.360.305/0001-04",
      companyName: "BANCO BRADESCO S.A.",
      ticker: "BBDC4",
      sector: "Financeiro",
      subSector: "Intermediários Financeiros",
      segment: "Nível 1",
      status: "ATIVO",
      latestReferenceDate: "2024-12-31",
      totalAssets: 1845320000,
      totalEquity: 156710000,
      netRevenue: 120340000,
      netIncome: 19423000,
      currencyScale: "MIL",
    },
    {
      cdCvm: "1023",
      cnpj: "00.000.000/0001-91",
      companyName: "BANCO DO BRASIL S.A.",
      ticker: "BBAS3",
      sector: "Financeiro",
      subSector: "Intermediários Financeiros",
      segment: "Novo Mercado",
      status: "ATIVO",
      latestReferenceDate: "2024-12-31",
      totalAssets: 2145600000,
      totalEquity: 178340000,
      netRevenue: 139200000,
      netIncome: 33820000,
      currencyScale: "MIL",
    },
  ];

  async findAll(params: CompanySearchParams): Promise<{
    data: CompanySummary[];
    total: number;
  }> {
    let filtered = [...this.companies];

    if (params.search) {
      const searchUpper = params.search.toUpperCase();
      filtered = filtered.filter(
        (c) =>
          c.companyName.toUpperCase().includes(searchUpper) ||
          c.ticker.toUpperCase().includes(searchUpper)
      );
    }

    if (params.sector) {
      filtered = filtered.filter((c) => c.sector === params.sector);
    }

    if (params.status) {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    const total = filtered.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, total };
  }

  async findByTicker(ticker: string): Promise<CompanySummary | null> {
    return (
      this.companies.find(
        (c) => c.ticker.toUpperCase() === ticker.toUpperCase()
      ) ?? null
    );
  }
}
