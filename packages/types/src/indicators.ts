/**
 * Financial indicator types (Gold layer)
 * Pre-computed indicators from Databricks Gold tables
 */

/** Financial indicators for a company at a given date */
export interface FinancialIndicator {
  /** CVM company code */
  cdCvm: string;
  /** Trading ticker */
  ticker: string;
  /** Reference date */
  referenceDate: string;

  // Profitability
  /** Return on Equity (ROE) = Net Income / Total Equity */
  roe?: number;
  /** Return on Assets (ROA) = Net Income / Total Assets */
  roa?: number;
  /** Net Margin = Net Income / Net Revenue */
  netMargin?: number;
  /** Gross Margin = Gross Profit / Net Revenue */
  grossMargin?: number;
  /** EBITDA Margin = EBITDA / Net Revenue */
  ebitdaMargin?: number;

  // Liquidity
  /** Current Ratio = Current Assets / Current Liabilities */
  currentRatio?: number;

  // Structure
  /** Debt to Equity = Total Debt / Total Equity */
  debtToEquity?: number;

  // Size
  /** Total assets in BRL */
  totalAssets?: number;
  /** Total equity in BRL */
  totalEquity?: number;
  /** Net revenue in BRL */
  netRevenue?: number;
  /** Net income in BRL */
  netIncome?: number;
  /** EBITDA in BRL */
  ebitda?: number;

  /** Currency scale */
  currencyScale: string;
}

/** Simplified indicator for display cards */
export interface IndicatorCard {
  label: string;
  value: number | null;
  format: "percent" | "currency" | "ratio";
  trend?: "up" | "down" | "neutral";
  previousValue?: number | null;
}
