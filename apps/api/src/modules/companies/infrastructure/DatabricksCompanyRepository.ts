import type { CompanySummary, CompanySearchParams } from "@portal-cvm/types";
import type { CompanyRepository } from "../domain/CompanyRepository.js";
import type { DatabricksClient } from "../../../shared/infrastructure/databricks/DatabricksClient.js";
import type { DatabricksRow } from "../../../shared/infrastructure/databricks/types.js";
import { MockCompanyRepository } from "./MockCompanyRepository.js";

/**
 * Databricks implementation of CompanyRepository.
 * Queries Gold layer tables via Databricks SQL Statement API.
 */
const VIEW_CTE = `
  WITH company_view AS (
    SELECT 
      CAST(r.CODIGO_CVM AS STRING) as cd_cvm,
      r.CNPJ_CIA as cnpj,
      r.NOME_EMPRESA as company_name,
      CAST(r.CODIGO_CVM AS STRING) as ticker,
      COALESCE(s.SETOR_CLASSIFICADO, 'Outros') as sector,
      NULL as sub_sector,
      NULL as segment,
      'ATIVO' as status,
      CAST(r.DATA_REFERENCIA AS STRING) as latest_reference_date,
      CAST(r.ATIVO_TOTAL AS STRING) as total_assets,
      CAST(r.PATRIMONIO_LIQUIDO AS STRING) as total_equity,
      CAST(r.RECEITA_LIQUIDA AS STRING) as net_revenue,
      CAST(r.LUCRO_LIQUIDO AS STRING) as net_income,
      'MIL' as currency_scale
    FROM gold_resumo_financeiro r
    LEFT JOIN gold_empresas_setor s ON r.CODIGO_CVM = s.CD_CVM
  )
`;

export class DatabricksCompanyRepository implements CompanyRepository {
  private readonly fallback = new MockCompanyRepository();

  constructor(private readonly client: DatabricksClient) {}

  async findAll(params: CompanySearchParams): Promise<{
    data: CompanySummary[];
    total: number;
  }> {
    try {
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
      const countSql = `${VIEW_CTE} SELECT COUNT(*) as total FROM company_view ${whereClause}`;
      const countResult = await this.client.executeStatement(countSql, parameters);
      const total = parseInt(countResult[0]?.total ?? "0", 10);

      // Data query with pagination
      const offset = ((params.page ?? 1) - 1) * (params.pageSize ?? 20);
      const limit = params.pageSize ?? 20;

      const dataSql = `
        ${VIEW_CTE}
        SELECT * FROM company_view
        ${whereClause}
        ORDER BY company_name
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rows = await this.client.executeStatement(dataSql, parameters);

      return {
        data: rows.map(this.mapRowToCompanySummary),
        total,
      };
    } catch (error) {
      console.warn(
        "⚠️ [DatabricksCompanyRepository] Falha ao consultar Databricks. Utilizando repositório de contingência local:",
        error instanceof Error ? error.message : error
      );
      return this.fallback.findAll(params);
    }
  }

  async findByTicker(ticker: string): Promise<CompanySummary | null> {
    try {
      const sql = `
        ${VIEW_CTE}
        SELECT * FROM company_view 
        WHERE UPPER(ticker) = UPPER(:ticker) OR UPPER(company_name) LIKE UPPER(CONCAT('%', :ticker, '%'))
        LIMIT 1
      `;
      const rows = await this.client.executeStatement(sql, [
        { name: "ticker", value: ticker, type: "STRING" },
      ]);

      if (rows.length === 0) return null;
      return this.mapRowToCompanySummary(rows[0]);
    } catch (error) {
      console.warn(
        `⚠️ [DatabricksCompanyRepository] Falha ao consultar ticker ${ticker} no Databricks. Utilizando repositório de contingência local:`,
        error instanceof Error ? error.message : error
      );
      return this.fallback.findByTicker(ticker);
    }
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
