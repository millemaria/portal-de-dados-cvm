import type { CompanySummary, CompanySearchParams } from "@portal-cvm/types";
import type { CompanyRepository } from "../domain/CompanyRepository.js";
import type { DatabricksClient } from "../../../shared/infrastructure/databricks/DatabricksClient.js";
import type { DatabricksRow } from "../../../shared/infrastructure/databricks/types.js";

/**
 * Databricks implementation of CompanyRepository.
 * Queries Gold layer tables via Databricks SQL Statement API.
 */
export class DatabricksCompanyRepository implements CompanyRepository {
  constructor(private readonly client: DatabricksClient) {}

  async findAll(params: CompanySearchParams): Promise<{
    data: CompanySummary[];
    total: number;
  }> {
    const conditions: string[] = [];
    const parameters: Array<{ name: string; value: string; type?: string }> = [];

    if (params.search) {
      conditions.push(
        "(UPPER(company_name) LIKE UPPER(CONCAT('%', :search, '%')) OR UPPER(ticker) LIKE UPPER(CONCAT('%', :search, '%')))"
      );
      parameters.push({ name: "search", value: params.search, type: "STRING" });
    }

    if (params.sector) {
      conditions.push("sector = :sector");
      parameters.push({ name: "sector", value: params.sector, type: "STRING" });
    }

    if (params.status) {
      conditions.push("status = :status");
      parameters.push({ name: "status", value: params.status, type: "STRING" });
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM company_summary ${whereClause}`;
    const countResult = await this.client.executeStatement(countSql, parameters);
    const total = parseInt(countResult[0]?.total ?? "0", 10);

    // Data query with pagination
    const offset = ((params.page ?? 1) - 1) * (params.pageSize ?? 20);
    const limit = params.pageSize ?? 20;

    const dataSql = `
      SELECT * FROM company_summary
      ${whereClause}
      ORDER BY company_name
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await this.client.executeStatement(dataSql, parameters);

    return {
      data: rows.map(this.mapRowToCompanySummary),
      total,
    };
  }

  async findByTicker(ticker: string): Promise<CompanySummary | null> {
    const sql = `SELECT * FROM company_summary WHERE UPPER(ticker) = UPPER(:ticker) LIMIT 1`;
    const rows = await this.client.executeStatement(sql, [
      { name: "ticker", value: ticker, type: "STRING" },
    ]);

    if (rows.length === 0) return null;
    return this.mapRowToCompanySummary(rows[0]);
  }

  private mapRowToCompanySummary(row: DatabricksRow): CompanySummary {
    return {
      cdCvm: row.cd_cvm ?? "",
      cnpj: row.cnpj ?? "",
      companyName: row.company_name ?? "",
      ticker: row.ticker ?? "",
      sector: row.sector ?? undefined,
      subSector: row.sub_sector ?? undefined,
      segment: row.segment ?? undefined,
      status: (row.status as "ATIVO" | "INATIVO") ?? "ATIVO",
      latestReferenceDate: row.latest_reference_date ?? "",
      totalAssets: row.total_assets ? parseFloat(row.total_assets) : undefined,
      totalEquity: row.total_equity ? parseFloat(row.total_equity) : undefined,
      netRevenue: row.net_revenue ? parseFloat(row.net_revenue) : undefined,
      netIncome: row.net_income ? parseFloat(row.net_income) : undefined,
      currencyScale: row.currency_scale ?? "MIL",
    };
  }
}
