import type {
  BalanceSheet,
  IncomeStatement,
  CashFlow,
  StatementLineItem,
  RevenueHistoryEntry,
  NetIncomeHistoryEntry,
} from "@portal-cvm/types";
import type { FinancialRepository } from "../domain/FinancialRepository.js";
import type { FinancialQueryInput } from "@portal-cvm/validation";
import type { DatabricksClient } from "../../../shared/infrastructure/databricks/DatabricksClient.js";
import type { DatabricksRow } from "../../../shared/infrastructure/databricks/types.js";
import { MockFinancialRepository } from "./MockFinancialRepository.js";

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

export class DatabricksFinancialRepository implements FinancialRepository {
  private readonly fallback = new MockFinancialRepository();

  constructor(private readonly client: DatabricksClient) {}

  async getBalanceSheet(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<BalanceSheet[]> {
    try {
      const cleanTicker = ticker.trim();
      const sql = `
        ${TARGET_CTE}
        SELECT 
          b.dt_refer,
          b.tipo_demonstracao,
          b.ind_individual_consolidado,
          b.cd_conta,
          b.ds_conta,
          b.valor_normalizado
        FROM vw_balanco_patrimonial_latest b
        JOIN target_cia t ON b.cnpj_cia = t.cnpj_cia
        WHERE b.ind_individual_consolidado = 'CON'
        ORDER BY b.dt_refer DESC, b.cd_conta ASC
      `;

      const rows = await this.client.executeStatement(sql, [
        { name: "ticker", value: cleanTicker, type: "STRING" },
      ]);

      if (rows.length === 0) {
        // Tenta individual se consolidado não tiver dados
        const sqlInd = `
          ${TARGET_CTE}
          SELECT 
            b.dt_refer,
            b.tipo_demonstracao,
            b.ind_individual_consolidado,
            b.cd_conta,
            b.ds_conta,
            b.valor_normalizado
          FROM vw_balanco_patrimonial_latest b
          JOIN target_cia t ON b.cnpj_cia = t.cnpj_cia
          ORDER BY b.dt_refer DESC, b.cd_conta ASC
        `;
        const indRows = await this.client.executeStatement(sqlInd, [
          { name: "ticker", value: cleanTicker, type: "STRING" },
        ]);
        if (indRows.length > 0) {
          return this.groupBalanceSheetRows(indRows);
        }
        return this.fallback.getBalanceSheet(ticker, params);
      }

      return this.groupBalanceSheetRows(rows);
    } catch (error) {
      console.warn(
        `⚠️ [DatabricksFinancialRepository] Falha ao consultar balanço patrimonial para ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      return this.fallback.getBalanceSheet(ticker, params);
    }
  }

  async getIncomeStatement(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<IncomeStatement[]> {
    try {
      const cleanTicker = ticker.trim();
      const sql = `
        ${TARGET_CTE}
        SELECT 
          r.dt_refer,
          COALESCE(r.dt_ini_exerc, r.dt_refer) as dt_ini_exerc,
          COALESCE(r.dt_fim_exerc, r.dt_refer) as dt_fim_exerc,
          r.ind_individual_consolidado,
          r.cd_conta,
          r.ds_conta,
          r.valor_normalizado
        FROM vw_resultado_latest r
        JOIN target_cia t ON r.cnpj_cia = t.cnpj_cia
        WHERE r.ind_individual_consolidado = 'CON'
        ORDER BY r.dt_refer DESC, r.cd_conta ASC
      `;

      const rows = await this.client.executeStatement(sql, [
        { name: "ticker", value: cleanTicker, type: "STRING" },
      ]);

      if (rows.length === 0) {
        return this.fallback.getIncomeStatement(ticker, params);
      }

      return this.groupIncomeStatementRows(rows);
    } catch (error) {
      console.warn(
        `⚠️ [DatabricksFinancialRepository] Falha ao consultar DRE para ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      return this.fallback.getIncomeStatement(ticker, params);
    }
  }

  async getCashFlow(
    ticker: string,
    params: FinancialQueryInput
  ): Promise<CashFlow[]> {
    try {
      const cleanTicker = ticker.trim();
      const sql = `
        ${TARGET_CTE}
        SELECT 
          f.dt_refer,
          COALESCE(f.dt_ini_exerc, f.dt_refer) as dt_ini_exerc,
          COALESCE(f.dt_fim_exerc, f.dt_refer) as dt_fim_exerc,
          f.ind_individual_consolidado,
          f.cd_conta,
          f.ds_conta,
          f.valor_normalizado
        FROM vw_fluxo_caixa_latest f
        JOIN target_cia t ON f.cnpj_cia = t.cnpj_cia
        WHERE f.ind_individual_consolidado = 'CON'
        ORDER BY f.dt_refer DESC, f.cd_conta ASC
      `;

      const rows = await this.client.executeStatement(sql, [
        { name: "ticker", value: cleanTicker, type: "STRING" },
      ]);

      if (rows.length === 0) {
        return this.fallback.getCashFlow(ticker, params);
      }

      return this.groupCashFlowRows(rows);
    } catch (error) {
      console.warn(
        `⚠️ [DatabricksFinancialRepository] Falha ao consultar fluxo de caixa para ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      return this.fallback.getCashFlow(ticker, params);
    }
  }

  async getRevenueHistory(
    ticker: string,
    limit: number
  ): Promise<RevenueHistoryEntry[]> {
    try {
      const cleanTicker = ticker.trim();
      const sql = `
        ${TARGET_CTE}
        SELECT 
          r.dt_refer as reference_date,
          MAX(r.valor_normalizado) as net_revenue
        FROM vw_resultado_latest r
        JOIN target_cia t ON r.cnpj_cia = t.cnpj_cia
        WHERE r.cd_conta = '3.01'
        GROUP BY r.dt_refer
        ORDER BY r.dt_refer ASC
        LIMIT ${Math.max(1, limit || 5)}
      `;

      const rows = await this.client.executeStatement(sql, [
        { name: "ticker", value: cleanTicker, type: "STRING" },
      ]);

      if (rows.length === 0) {
        return this.fallback.getRevenueHistory(ticker, limit);
      }

      return rows.map((r) => ({
        referenceDate: r.reference_date ?? "",
        netRevenue: r.net_revenue ? parseFloat(r.net_revenue) : 0,
        currencyScale: "UNITARIO",
      }));
    } catch (error) {
      console.warn(
        `⚠️ [DatabricksFinancialRepository] Falha ao consultar histórico de receita para ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      return this.fallback.getRevenueHistory(ticker, limit);
    }
  }

  async getNetIncomeHistory(
    ticker: string,
    limit: number
  ): Promise<NetIncomeHistoryEntry[]> {
    try {
      const cleanTicker = ticker.trim();
      const sql = `
        ${TARGET_CTE}
        SELECT 
          r.dt_refer as reference_date,
          MAX(r.valor_normalizado) as net_income
        FROM vw_resultado_latest r
        JOIN target_cia t ON r.cnpj_cia = t.cnpj_cia
        WHERE r.cd_conta IN ('3.11', '3.09', '3.08')
        GROUP BY r.dt_refer
        ORDER BY r.dt_refer ASC
        LIMIT ${Math.max(1, limit || 5)}
      `;

      const rows = await this.client.executeStatement(sql, [
        { name: "ticker", value: cleanTicker, type: "STRING" },
      ]);

      if (rows.length === 0) {
        return this.fallback.getNetIncomeHistory(ticker, limit);
      }

      return rows.map((r) => ({
        referenceDate: r.reference_date ?? "",
        netIncome: r.net_income ? parseFloat(r.net_income) : 0,
        currencyScale: "UNITARIO",
      }));
    } catch (error) {
      console.warn(
        `⚠️ [DatabricksFinancialRepository] Falha ao consultar histórico de lucro líquido para ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      return this.fallback.getNetIncomeHistory(ticker, limit);
    }
  }

  private groupBalanceSheetRows(rows: DatabricksRow[]): BalanceSheet[] {
    const grouped = new Map<string, { assets: StatementLineItem[]; liabilities: StatementLineItem[] }>();

    for (const r of rows) {
      const date = r.dt_refer ?? "2024-12-31";
      if (!grouped.has(date)) {
        grouped.set(date, { assets: [], liabilities: [] });
      }
      const entry = grouped.get(date)!;
      const code = r.cd_conta ?? "";
      const desc = r.ds_conta ?? "";
      const val = r.valor_normalizado ? parseFloat(r.valor_normalizado) : 0;
      const level = Math.min(3, code.split(".").length);

      const item: StatementLineItem = {
        accountCode: code,
        accountDescription: desc,
        value: val,
        level,
      };

      if (code.startsWith("1") || r.tipo_demonstracao === "BPA") {
        entry.assets.push(item);
      } else if (code.startsWith("2") || r.tipo_demonstracao === "BPP") {
        entry.liabilities.push(item);
      }
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      referenceDate: date,
      consolidationType: "CON" as const,
      currencyScale: "UNITARIO",
      assets: data.assets,
      liabilities: data.liabilities,
    }));
  }

  private groupIncomeStatementRows(rows: DatabricksRow[]): IncomeStatement[] {
    const grouped = new Map<string, { start: string; end: string; lineItems: StatementLineItem[] }>();

    for (const r of rows) {
      const date = r.dt_refer ?? "2024-12-31";
      if (!grouped.has(date)) {
        grouped.set(date, {
          start: r.dt_ini_exerc ?? date,
          end: r.dt_fim_exerc ?? date,
          lineItems: [],
        });
      }
      const entry = grouped.get(date)!;
      const code = r.cd_conta ?? "";
      const desc = r.ds_conta ?? "";
      const val = r.valor_normalizado ? parseFloat(r.valor_normalizado) : 0;
      const level = Math.min(3, code.split(".").length);

      entry.lineItems.push({
        accountCode: code,
        accountDescription: desc,
        value: val,
        level,
      });
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      referenceDate: date,
      periodStart: data.start,
      periodEnd: data.end,
      consolidationType: "CON" as const,
      currencyScale: "UNITARIO",
      lineItems: data.lineItems,
    }));
  }

  private groupCashFlowRows(rows: DatabricksRow[]): CashFlow[] {
    const grouped = new Map<string, { start: string; end: string; lineItems: StatementLineItem[] }>();

    for (const r of rows) {
      const date = r.dt_refer ?? "2024-12-31";
      if (!grouped.has(date)) {
        grouped.set(date, {
          start: r.dt_ini_exerc ?? date,
          end: r.dt_fim_exerc ?? date,
          lineItems: [],
        });
      }
      const entry = grouped.get(date)!;
      const code = r.cd_conta ?? "";
      const desc = r.ds_conta ?? "";
      const val = r.valor_normalizado ? parseFloat(r.valor_normalizado) : 0;
      const level = Math.min(3, code.split(".").length);

      entry.lineItems.push({
        accountCode: code,
        accountDescription: desc,
        value: val,
        level,
      });
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      referenceDate: date,
      periodStart: data.start,
      periodEnd: data.end,
      consolidationType: "CON" as const,
      currencyScale: "UNITARIO",
      method: "MI" as const,
      lineItems: data.lineItems,
    }));
  }
}
