import type { FinancialIndicator } from "@portal-cvm/types";
import type { IndicatorRepository } from "../domain/IndicatorRepository.js";
import type { DatabricksClient } from "../../../shared/infrastructure/databricks/DatabricksClient.js";
import { MockIndicatorRepository } from "./MockIndicatorRepository.js";

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

const TARGET_CTE = `
  WITH target_cia AS (
    SELECT c.cnpj_cia, c.denominacao_cia, d.cd_cvm,
    ${KNOWN_TICKER_CASE} as ticker
    FROM vw_companhia_atual c
    LEFT JOIN (SELECT cnpj_cia, MAX(cd_cvm) as cd_cvm FROM fato_documento_cvm GROUP BY cnpj_cia) d 
      ON c.cnpj_cia = d.cnpj_cia
    WHERE UPPER(
      ${KNOWN_TICKER_CASE}
    ) = UPPER(:ticker) 
       OR c.cnpj_cia = :ticker 
       OR d.cd_cvm = :ticker 
       OR UPPER(c.denominacao_cia) LIKE UPPER(CONCAT('%', :ticker, '%'))
    LIMIT 1
  )
`;

export class DatabricksIndicatorRepository implements IndicatorRepository {
  private readonly fallback = new MockIndicatorRepository();

  constructor(private readonly client: DatabricksClient) {}

  async getByTicker(
    ticker: string,
    limit: number = 5
  ): Promise<FinancialIndicator[]> {
    try {
      const cleanTicker = ticker.trim();
      const sql = `
        ${TARGET_CTE}
        SELECT 
          COALESCE(t.cd_cvm, '') as cd_cvm,
          t.ticker,
          b.dt_refer as reference_date,
          MAX(CASE WHEN b.cd_conta = '1' THEN b.valor_normalizado END) as total_assets,
          MAX(CASE WHEN b.cd_conta IN ('2.03', '2.05') THEN b.valor_normalizado END) as total_equity,
          MAX(CASE WHEN b.cd_conta = '1.01' THEN b.valor_normalizado END) as current_assets,
          MAX(CASE WHEN b.cd_conta = '2.01' THEN b.valor_normalizado END) as current_liabilities,
          MAX(CASE WHEN r.cd_conta = '3.01' THEN r.valor_normalizado END) as net_revenue,
          MAX(CASE WHEN r.cd_conta = '3.03' THEN r.valor_normalizado END) as gross_profit,
          MAX(CASE WHEN r.cd_conta = '3.05' THEN r.valor_normalizado END) as ebitda,
          MAX(CASE WHEN r.cd_conta IN ('3.11', '3.09', '3.08') THEN r.valor_normalizado END) as net_income
        FROM target_cia t
        LEFT JOIN vw_balanco_patrimonial_latest b ON t.cnpj_cia = b.cnpj_cia AND b.ind_individual_consolidado = 'CON'
        LEFT JOIN vw_resultado_latest r ON t.cnpj_cia = r.cnpj_cia AND b.dt_refer = r.dt_refer AND r.ind_individual_consolidado = 'CON'
        GROUP BY t.cd_cvm, t.ticker, b.dt_refer
        ORDER BY b.dt_refer DESC
        LIMIT ${Math.max(1, limit || 5)}
      `;

      const rows = await this.client.executeStatement(sql, [
        { name: "ticker", value: cleanTicker, type: "STRING" },
      ]);

      if (rows.length === 0) {
        return this.fallback.getByTicker(ticker, limit);
      }

      return rows.map((row) => {
        const totalAssets = row.total_assets ? parseFloat(row.total_assets) : 0;
        const totalEquity = row.total_equity ? parseFloat(row.total_equity) : 0;
        const netRevenue = row.net_revenue ? parseFloat(row.net_revenue) : 0;
        const netIncome = row.net_income ? parseFloat(row.net_income) : 0;
        const currentAssets = row.current_assets ? parseFloat(row.current_assets) : 0;
        const currentLiabilities = row.current_liabilities ? parseFloat(row.current_liabilities) : 0;
        const grossProfit = row.gross_profit ? parseFloat(row.gross_profit) : 0;
        const ebitda = row.ebitda ? parseFloat(row.ebitda) : 0;

        const roe = totalEquity > 0 ? netIncome / totalEquity : undefined;
        const roa = totalAssets > 0 ? netIncome / totalAssets : undefined;
        const netMargin = netRevenue > 0 ? netIncome / netRevenue : undefined;
        const grossMargin = netRevenue > 0 ? grossProfit / netRevenue : undefined;
        const ebitdaMargin = netRevenue > 0 && ebitda > 0 ? ebitda / netRevenue : undefined;
        const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : undefined;
        const debtToEquity = totalEquity > 0 ? currentLiabilities / totalEquity : undefined;

        return {
          cdCvm: row.cd_cvm ?? "",
          ticker: row.ticker ?? cleanTicker,
          referenceDate: row.reference_date ?? "",
          roe,
          roa,
          netMargin,
          grossMargin,
          ebitdaMargin,
          currentRatio,
          debtToEquity,
          totalAssets: totalAssets || undefined,
          totalEquity: totalEquity || undefined,
          netRevenue: netRevenue || undefined,
          netIncome: netIncome || undefined,
          ebitda: ebitda || undefined,
          currencyScale: "UNITARIO",
        };
      });
    } catch (error) {
      console.warn(
        `⚠️ [DatabricksIndicatorRepository] Falha ao consultar indicadores para ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      return this.fallback.getByTicker(ticker, limit);
    }
  }
}
