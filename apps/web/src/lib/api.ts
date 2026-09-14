const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetchApi<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(
      errorBody?.error?.message ?? `API error: ${res.status}`,
      res.status,
      errorBody?.error?.code
    );
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- Company endpoints ---

import type {
  CompanySummary,
  FinancialIndicator,
  BalanceSheet,
  IncomeStatement,
  CashFlow,
  RevenueHistoryEntry,
  NetIncomeHistoryEntry,
} from "@portal-cvm/types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getCompanies(
  search?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<CompanySummary>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return fetchApi<PaginatedResponse<CompanySummary>>(
    `/api/companies?${params.toString()}`
  );
}

export async function getCompany(
  ticker: string
): Promise<ApiResponse<CompanySummary>> {
  return fetchApi<ApiResponse<CompanySummary>>(`/api/companies/${ticker}`);
}

export async function getIndicators(
  ticker: string
): Promise<ApiResponse<FinancialIndicator[]>> {
  return fetchApi<ApiResponse<FinancialIndicator[]>>(
    `/api/companies/${ticker}/indicators`
  );
}

export async function getBalanceSheet(
  ticker: string
): Promise<ApiResponse<BalanceSheet[]>> {
  return fetchApi<ApiResponse<BalanceSheet[]>>(
    `/api/companies/${ticker}/balance-sheet`
  );
}

export async function getIncomeStatement(
  ticker: string
): Promise<ApiResponse<IncomeStatement[]>> {
  return fetchApi<ApiResponse<IncomeStatement[]>>(
    `/api/companies/${ticker}/income-statement`
  );
}

export async function getCashFlow(
  ticker: string
): Promise<ApiResponse<CashFlow[]>> {
  return fetchApi<ApiResponse<CashFlow[]>>(
    `/api/companies/${ticker}/cash-flow`
  );
}

export async function getFinancials(ticker: string): Promise<
  ApiResponse<{
    balanceSheet: BalanceSheet[];
    incomeStatement: IncomeStatement[];
    cashFlow: CashFlow[];
  }>
> {
  return fetchApi(`/api/companies/${ticker}/financials`);
}
