import type { CompanySummary, CompanySearchParams } from "@portal-cvm/types";
import type { CompanyRepository } from "../domain/CompanyRepository.js";
import type { DatabricksClient } from "../../../shared/infrastructure/databricks/DatabricksClient.js";
import type { DatabricksRow } from "../../../shared/infrastructure/databricks/types.js";
import { MockCompanyRepository } from "./MockCompanyRepository.js";

const KNOWN_TICKER_CASE = `
  CASE 
    WHEN c.cnpj_cia LIKE '%33000167%' OR d.cd_cvm = '009512' THEN 'PETR4'
    WHEN c.cnpj_cia LIKE '%33592510%' OR d.cd_cvm = '004170' THEN 'VALE3'
    WHEN c.cnpj_cia LIKE '%60872504%' OR d.cd_cvm = '019348' THEN 'ITUB4'
    WHEN c.cnpj_cia LIKE '%00000000000191%' OR d.cd_cvm = '001023' THEN 'BBAS3'
    WHEN c.cnpj_cia LIKE '%60746948%' OR d.cd_cvm = '000906' THEN 'BBDC4'
    WHEN c.cnpj_cia LIKE '%84429695%' OR d.cd_cvm = '005410' THEN 'WEGE3'
    WHEN c.cnpj_cia LIKE '%56228344%' OR d.cd_cvm = '023264' THEN 'ABEV3'
    WHEN c.cnpj_cia LIKE '%16694922%' OR d.cd_cvm = '016314' THEN 'RENT3'
    WHEN c.cnpj_cia LIKE '%47960950%' OR d.cd_cvm = '022470' THEN 'MGLU3'
    WHEN c.cnpj_cia LIKE '%92754738%' OR d.cd_cvm = '019852' THEN 'LREN3'
    WHEN c.cnpj_cia LIKE '%16404287%' OR d.cd_cvm = '020435' THEN 'SUZB3'
    WHEN c.cnpj_cia LIKE '%02916265%' OR d.cd_cvm = '020575' THEN 'JBSS3'
    WHEN c.cnpj_cia LIKE '%07689002%' OR d.cd_cvm = '018325' THEN 'EMBR3'
    WHEN c.cnpj_cia LIKE '%09346601%' OR d.cd_cvm = '021610' THEN 'B3SA3'
    WHEN c.cnpj_cia LIKE '%33042730%' OR d.cd_cvm = '004030' THEN 'CSNA3'
    WHEN c.cnpj_cia LIKE '%92690783%' OR d.cd_cvm = '004073' THEN 'GGBR4'
    WHEN c.cnpj_cia LIKE '%01917255%' OR d.cd_cvm = '019240' THEN 'EQTL3'
    WHEN c.cnpj_cia LIKE '%02429144%' OR d.cd_cvm = '018660' THEN 'CPFE3'
    WHEN c.cnpj_cia LIKE '%02502844%' OR d.cd_cvm = '017930' THEN 'RAIL3'
    WHEN c.cnpj_cia LIKE '%06057223%' OR d.cd_cvm = '020010' THEN 'RADL3'
    WHEN c.cnpj_cia LIKE '%08402943%' OR d.cd_cvm = '004669' THEN 'GUAR3'
    ELSE COALESCE(NULLIF(d.cd_cvm, ''), c.cnpj_cia)
  END
`;

/**
 * Databricks implementation of CompanyRepository.
 * Queries Silver layer tables/views directly via Databricks SQL Statement API.
 */
const VIEW_CTE = `
  WITH base_cia AS (
    SELECT 
      cnpj_cia,
      MAX(denominacao_cia) as company_name,
      MAX(situacao) as situacao,
      MAX(segmento) as segmento,
      MAX(data_registro) as data_registro
    FROM vw_companhia_atual
    GROUP BY cnpj_cia
  ),
  company_view AS (
    SELECT 
      c.cnpj_cia as cnpj,
      c.company_name,
      COALESCE(d.cd_cvm, '') as cd_cvm,
      ${KNOWN_TICKER_CASE} as ticker,
      COALESCE(c.segmento, 'Geral') as sector,
      NULL as sub_sector,
      c.segmento as segment,
      COALESCE(c.situacao, 'ATIVO') as status,
      CAST(COALESCE(c.data_registro, '2025-01-01') AS STRING) as latest_reference_date,
      b_ativo.valor_normalizado as total_assets,
      b_pl.valor_normalizado as total_equity,
      r_rec.valor_normalizado as net_revenue,
      r_lucro.valor_normalizado as net_income,
      'UNITARIO' as currency_scale
    FROM base_cia c
    LEFT JOIN (
      SELECT cnpj_cia, MAX(cd_cvm) as cd_cvm 
      FROM fato_documento_cvm 
      GROUP BY cnpj_cia
    ) d ON c.cnpj_cia = d.cnpj_cia
    LEFT JOIN (
      SELECT cnpj_cia, FIRST(valor_normalizado) as valor_normalizado 
      FROM vw_balanco_patrimonial_latest 
      WHERE cd_conta = '1' 
      GROUP BY cnpj_cia
    ) b_ativo ON c.cnpj_cia = b_ativo.cnpj_cia
    LEFT JOIN (
      SELECT cnpj_cia, FIRST(valor_normalizado) as valor_normalizado 
      FROM vw_balanco_patrimonial_latest 
      WHERE cd_conta IN ('2.03', '2.05') 
      GROUP BY cnpj_cia
    ) b_pl ON c.cnpj_cia = b_pl.cnpj_cia
    LEFT JOIN (
      SELECT cnpj_cia, FIRST(valor_normalizado) as valor_normalizado 
      FROM vw_resultado_latest 
      WHERE cd_conta = '3.01' 
      GROUP BY cnpj_cia
    ) r_rec ON c.cnpj_cia = r_rec.cnpj_cia
    LEFT JOIN (
      SELECT cnpj_cia, FIRST(valor_normalizado) as valor_normalizado 
      FROM vw_resultado_latest 
      WHERE cd_conta IN ('3.11', '3.09') 
      GROUP BY cnpj_cia
    ) r_lucro ON c.cnpj_cia = r_lucro.cnpj_cia
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
          "(UPPER(company_name) LIKE UPPER(CONCAT('%', :search, '%')) OR UPPER(ticker) LIKE UPPER(CONCAT('%', :search, '%')) OR cnpj LIKE CONCAT('%', :search, '%') OR cd_cvm LIKE CONCAT('%', :search, '%'))"
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
        data: rows.map((r) => this.mapRowToCompanySummary(r)),
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
      const cleanTerm = ticker.trim();
      const sql = `
        ${VIEW_CTE}
        SELECT * FROM company_view 
        WHERE UPPER(ticker) = UPPER(:ticker) 
           OR cd_cvm = :ticker 
           OR cnpj = :ticker 
           OR UPPER(company_name) LIKE UPPER(CONCAT('%', :ticker, '%'))
        LIMIT 1
      `;
      const rows = await this.client.executeStatement(sql, [
        { name: "ticker", value: cleanTerm, type: "STRING" },
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
      currencyScale: (row.currency_scale as "MIL" | "MILHAO" | "UNITARIO") ?? "UNITARIO",
    };
  }
}

