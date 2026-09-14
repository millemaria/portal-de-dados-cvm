/**
 * Financial statement types
 * Represents DFP (Demonstrações Financeiras Padronizadas) data from CVM
 */

/** Types of financial statements available */
export type StatementType =
  | "BPA"     // Balanço Patrimonial Ativo
  | "BPP"     // Balanço Patrimonial Passivo
  | "DRE"     // Demonstração de Resultado
  | "DFC_MI"  // Demonstração de Fluxo de Caixa - Método Indireto
  | "DFC_MD"  // Demonstração de Fluxo de Caixa - Método Direto
  | "DMPL"    // Demonstração das Mutações do Patrimônio Líquido
  | "DVA"     // Demonstração de Valor Adicionado
  | "DRA";    // Demonstração de Resultado Abrangente

/** Consolidation type */
export type ConsolidationType = "CON" | "IND";

/** A single line item in a financial statement */
export interface StatementLineItem {
  /** Account code (e.g., "1", "1.01", "1.01.01") */
  accountCode: string;
  /** Account description (e.g., "Ativo Total") */
  accountDescription: string;
  /** Monetary value in BRL */
  value: number;
  /** Account hierarchy level (derived from accountCode depth) */
  level: number;
}

/** A complete financial statement for a given period */
export interface FinancialStatement {
  /** CVM company code */
  cdCvm: string;
  /** Company name */
  companyName: string;
  /** Statement type */
  statementType: StatementType;
  /** Reference date (e.g., "2023-12-31") */
  referenceDate: string;
  /** Period start date */
  periodStart: string;
  /** Period end date */
  periodEnd: string;
  /** Statement version */
  version: string;
  /** Consolidation type */
  consolidationType: ConsolidationType;
  /** Currency */
  currency: string;
  /** Currency scale (e.g., "MIL" = thousands, "UNIDADE" = units) */
  currencyScale: string;
  /** Exercise order (e.g., "ÚLTIMO" or "PENÚLTIMO") */
  exerciseOrder: string;
  /** Line items */
  lineItems: StatementLineItem[];
}

/** Balance sheet combining BPA and BPP */
export interface BalanceSheet {
  referenceDate: string;
  consolidationType: ConsolidationType;
  currencyScale: string;
  assets: StatementLineItem[];
  liabilities: StatementLineItem[];
}

/** Income statement (DRE) */
export interface IncomeStatement {
  referenceDate: string;
  periodStart: string;
  periodEnd: string;
  consolidationType: ConsolidationType;
  currencyScale: string;
  lineItems: StatementLineItem[];
}

/** Cash flow statement (DFC) */
export interface CashFlow {
  referenceDate: string;
  periodStart: string;
  periodEnd: string;
  consolidationType: ConsolidationType;
  currencyScale: string;
  method: "MI" | "MD";
  lineItems: StatementLineItem[];
}

/** Revenue history entry (Gold layer) */
export interface RevenueHistoryEntry {
  referenceDate: string;
  netRevenue: number;
  currencyScale: string;
}

/** Net income history entry (Gold layer) */
export interface NetIncomeHistoryEntry {
  referenceDate: string;
  netIncome: number;
  currencyScale: string;
}
