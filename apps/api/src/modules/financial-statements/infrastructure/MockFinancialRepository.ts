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

/**
 * Mock implementation of FinancialRepository for local development.
 */
export class MockFinancialRepository implements FinancialRepository {
  private readonly mockLineItems: StatementLineItem[] = [
    { accountCode: "1", accountDescription: "Ativo Total", value: 992847000, level: 1 },
    { accountCode: "1.01", accountDescription: "Ativo Circulante", value: 198213000, level: 2 },
    { accountCode: "1.01.01", accountDescription: "Caixa e Equivalentes", value: 53421000, level: 3 },
    { accountCode: "1.01.02", accountDescription: "Contas a Receber", value: 42810000, level: 3 },
    { accountCode: "1.01.03", accountDescription: "Estoques", value: 35129000, level: 3 },
    { accountCode: "1.02", accountDescription: "Ativo Não Circulante", value: 794634000, level: 2 },
    { accountCode: "1.02.01", accountDescription: "Investimentos", value: 124500000, level: 3 },
    { accountCode: "1.02.02", accountDescription: "Imobilizado", value: 521340000, level: 3 },
    { accountCode: "1.02.03", accountDescription: "Intangível", value: 148794000, level: 3 },
  ];

  private readonly mockLiabilities: StatementLineItem[] = [
    { accountCode: "2", accountDescription: "Passivo Total", value: 992847000, level: 1 },
    { accountCode: "2.01", accountDescription: "Passivo Circulante", value: 215420000, level: 2 },
    { accountCode: "2.01.01", accountDescription: "Fornecedores", value: 42130000, level: 3 },
    { accountCode: "2.01.02", accountDescription: "Empréstimos CP", value: 89210000, level: 3 },
    { accountCode: "2.02", accountDescription: "Passivo Não Circulante", value: 429136000, level: 2 },
    { accountCode: "2.02.01", accountDescription: "Empréstimos LP", value: 312450000, level: 3 },
    { accountCode: "2.03", accountDescription: "Patrimônio Líquido", value: 348291000, level: 2 },
    { accountCode: "2.03.01", accountDescription: "Capital Social", value: 205432000, level: 3 },
    { accountCode: "2.03.02", accountDescription: "Reservas de Lucro", value: 142859000, level: 3 },
  ];

  private readonly mockDRE: StatementLineItem[] = [
    { accountCode: "3.01", accountDescription: "Receita de Venda", value: 511847000, level: 1 },
    { accountCode: "3.02", accountDescription: "Custo dos Bens Vendidos", value: -287430000, level: 1 },
    { accountCode: "3.03", accountDescription: "Resultado Bruto", value: 224417000, level: 1 },
    { accountCode: "3.04", accountDescription: "Despesas Operacionais", value: -89210000, level: 1 },
    { accountCode: "3.04.01", accountDescription: "Despesas com Vendas", value: -32100000, level: 2 },
    { accountCode: "3.04.02", accountDescription: "Despesas Gerais e Administrativas", value: -45200000, level: 2 },
    { accountCode: "3.05", accountDescription: "EBITDA", value: 182340000, level: 1 },
    { accountCode: "3.06", accountDescription: "Resultado Antes dos Tributos", value: 135207000, level: 1 },
    { accountCode: "3.07", accountDescription: "IR e CSLL", value: -30446000, level: 1 },
    { accountCode: "3.08", accountDescription: "Lucro Líquido", value: 104761000, level: 1 },
  ];

  private readonly mockCashFlow: StatementLineItem[] = [
    { accountCode: "6.01", accountDescription: "Caixa Líquido Atividades Operacionais", value: 189320000, level: 1 },
    { accountCode: "6.01.01", accountDescription: "Lucro Líquido", value: 104761000, level: 2 },
    { accountCode: "6.01.02", accountDescription: "Depreciação e Amortização", value: 47120000, level: 2 },
    { accountCode: "6.02", accountDescription: "Caixa Líquido Atividades de Investimento", value: -72450000, level: 1 },
    { accountCode: "6.02.01", accountDescription: "Aquisição de Imobilizado", value: -65200000, level: 2 },
    { accountCode: "6.03", accountDescription: "Caixa Líquido Atividades de Financiamento", value: -98710000, level: 1 },
    { accountCode: "6.03.01", accountDescription: "Dividendos Pagos", value: -52100000, level: 2 },
    { accountCode: "6.04", accountDescription: "Variação de Caixa", value: 18160000, level: 1 },
  ];

  private getMultiplier(ticker: string): number {
    let hash = 0;
    const clean = ticker.toUpperCase().trim();
    for (let i = 0; i < clean.length; i++) {
      hash = (hash << 5) - hash + clean.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash % 100) / 100; // 0.00 to 0.99
    return 0.1 + normalized * 0.9; // 0.1 to 1.0 multiplier
  }

  async getBalanceSheet(
    ticker: string,
    _params: FinancialQueryInput
  ): Promise<BalanceSheet[]> {
    const mult = this.getMultiplier(ticker);
    const years = ["2024-12-31", "2023-12-31", "2022-12-31"];
    return years.map((date, i) => ({
      referenceDate: date,
      consolidationType: "CON" as const,
      currencyScale: "MIL",
      assets: this.mockLineItems.map((item) => ({
        ...item,
        value: Math.round(item.value * mult * (1 - i * 0.05)),
      })),
      liabilities: this.mockLiabilities.map((item) => ({
        ...item,
        value: Math.round(item.value * mult * (1 - i * 0.05)),
      })),
    }));
  }

  async getIncomeStatement(
    ticker: string,
    _params: FinancialQueryInput
  ): Promise<IncomeStatement[]> {
    const mult = this.getMultiplier(ticker);
    const periods = [
      { ref: "2024-12-31", start: "2024-01-01", end: "2024-12-31" },
      { ref: "2023-12-31", start: "2023-01-01", end: "2023-12-31" },
      { ref: "2022-12-31", start: "2022-01-01", end: "2022-12-31" },
    ];
    return periods.map((p, i) => ({
      referenceDate: p.ref,
      periodStart: p.start,
      periodEnd: p.end,
      consolidationType: "CON" as const,
      currencyScale: "MIL",
      lineItems: this.mockDRE.map((item) => ({
        ...item,
        value: Math.round(item.value * mult * (1 - i * 0.08)),
      })),
    }));
  }

  async getCashFlow(
    ticker: string,
    _params: FinancialQueryInput
  ): Promise<CashFlow[]> {
    const mult = this.getMultiplier(ticker);
    const periods = [
      { ref: "2024-12-31", start: "2024-01-01", end: "2024-12-31" },
      { ref: "2023-12-31", start: "2023-01-01", end: "2023-12-31" },
    ];
    return periods.map((p, i) => ({
      referenceDate: p.ref,
      periodStart: p.start,
      periodEnd: p.end,
      consolidationType: "CON" as const,
      currencyScale: "MIL",
      method: "MI" as const,
      lineItems: this.mockCashFlow.map((item) => ({
        ...item,
        value: Math.round(item.value * mult * (1 - i * 0.1)),
      })),
    }));
  }

  async getRevenueHistory(
    ticker: string,
    limit: number
  ): Promise<RevenueHistoryEntry[]> {
    const mult = this.getMultiplier(ticker);
    const base = 511847000 * mult;
    const entries: RevenueHistoryEntry[] = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const year = 2024 - i;
      entries.push({
        referenceDate: `${year}-12-31`,
        netRevenue: Math.round(base * (1 - i * 0.06)),
        currencyScale: "MIL",
      });
    }
    return entries;
  }

  async getNetIncomeHistory(
    ticker: string,
    limit: number
  ): Promise<NetIncomeHistoryEntry[]> {
    const mult = this.getMultiplier(ticker);
    const base = 104761000 * mult;
    const entries: NetIncomeHistoryEntry[] = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const year = 2024 - i;
      entries.push({
        referenceDate: `${year}-12-31`,
        netIncome: Math.round(base * (1 - i * 0.1)),
        currencyScale: "MIL",
      });
    }
    return entries;
  }
}
