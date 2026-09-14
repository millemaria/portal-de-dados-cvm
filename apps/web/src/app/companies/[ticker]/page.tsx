import { notFound } from "next/navigation";
import { getCompany, getIndicators, getFinancials } from "@/lib/api";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { IndicatorsGrid } from "@/components/company/IndicatorsGrid";
import { HistoryChart } from "@/components/company/HistoryChart";
import { FinancialTable } from "@/components/company/FinancialTable";
import type { Metadata } from "next";

interface CompanyPageProps {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { ticker } = await params;
  return {
    title: `${ticker.toUpperCase()} | Portal de Dados CVM`,
    description: `Dados financeiros de ${ticker.toUpperCase()} — demonstrações, indicadores e histórico.`,
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { ticker } = await params;

  let company, indicators, financials;

  try {
    [company, indicators, financials] = await Promise.all([
      getCompany(ticker),
      getIndicators(ticker),
      getFinancials(ticker),
    ]);
  } catch {
    notFound();
  }

  if (!company?.data) {
    notFound();
  }

  const balanceSheet = financials?.data?.balanceSheet?.[0];
  const incomeStatement = financials?.data?.incomeStatement?.[0];
  const cashFlow = financials?.data?.cashFlow?.[0];

  // Build history from income statements
  const revenueHistory = (financials?.data?.incomeStatement ?? []).map(
    (stmt) => ({
      referenceDate: stmt.referenceDate,
      netRevenue:
        stmt.lineItems.find((li) => li.accountCode === "3.01")?.value ?? 0,
      currencyScale: stmt.currencyScale,
    })
  );

  const netIncomeHistory = (financials?.data?.incomeStatement ?? []).map(
    (stmt) => ({
      referenceDate: stmt.referenceDate,
      netIncome:
        stmt.lineItems.find((li) => li.accountCode === "3.08")?.value ?? 0,
      currencyScale: stmt.currencyScale,
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
      {/* Company Header */}
      <CompanyHeader company={company.data} />

      {/* Indicators */}
      {indicators?.data && indicators.data.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-2.5 sm:mb-3">
            Indicadores Financeiros
          </h2>
          <IndicatorsGrid indicators={indicators.data} />
        </section>
      )}

      {/* Charts */}
      {revenueHistory.length > 1 && (
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-2.5 sm:mb-3">
            Histórico
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <HistoryChart
              title="Receita Líquida"
              data={revenueHistory}
              dataKey="netRevenue"
              color="#06b6d4"
              gradientId="revenueGradient"
            />
            <HistoryChart
              title="Lucro Líquido"
              data={netIncomeHistory}
              dataKey="netIncome"
              color="#8b5cf6"
              gradientId="netIncomeGradient"
            />
          </div>
        </section>
      )}

      {/* Financial Statements */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-2.5 sm:mb-3">
          Demonstrações Financeiras
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {balanceSheet && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
              <FinancialTable
                title="Balanço Patrimonial — Ativo"
                lineItems={balanceSheet.assets}
                currencyScale={balanceSheet.currencyScale}
              />
              <FinancialTable
                title="Balanço Patrimonial — Passivo"
                lineItems={balanceSheet.liabilities}
                currencyScale={balanceSheet.currencyScale}
              />
            </div>
          )}

          {incomeStatement && (
            <FinancialTable
              title="Demonstração de Resultado (DRE)"
              lineItems={incomeStatement.lineItems}
              currencyScale={incomeStatement.currencyScale}
            />
          )}

          {cashFlow && (
            <FinancialTable
              title="Fluxo de Caixa"
              lineItems={cashFlow.lineItems}
              currencyScale={cashFlow.currencyScale}
            />
          )}
        </div>
      </section>
    </div>
  );
}
