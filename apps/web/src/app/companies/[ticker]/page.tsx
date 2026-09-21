import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany, getIndicators, getFinancials } from "@/lib/api";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { IndicatorsGrid } from "@/components/company/IndicatorsGrid";
import { HistoryChart } from "@/components/company/HistoryChart";
import { FinancialStatementsSection } from "@/components/company/FinancialStatementsSection";
import { ArrowLeft } from "lucide-react";
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

  const balanceSheets = financials?.data?.balanceSheet ?? [];
  const incomeStatements = financials?.data?.incomeStatement ?? [];
  const cashFlows = financials?.data?.cashFlow ?? [];

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
        stmt.lineItems.find((li) => li.accountCode === "3.08" || li.accountCode === "3.11" || li.accountCode === "3.09")?.value ?? 0,
      currencyScale: stmt.currencyScale,
    })
  );

  return (
    <div className="w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para todas as empresas</span>
          </Link>
        </div>

        {/* Company Header */}
        <CompanyHeader company={company.data} />

        {/* Indicators */}
        {indicators?.data && indicators.data.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Indicadores Financeiros
            </h2>
            <IndicatorsGrid indicators={indicators.data} />
          </section>
        )}

        {/* Charts */}
        {revenueHistory.length > 1 && (
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Histórico Financeiro Anual
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <HistoryChart
                title="Receita Líquida (Histórico)"
                data={revenueHistory}
                dataKey="netRevenue"
                color="#06b6d4"
                gradientId="revenueGradient"
              />
              <HistoryChart
                title="Lucro Líquido (Histórico)"
                data={netIncomeHistory}
                dataKey="netIncome"
                color="#8b5cf6"
                gradientId="netIncomeGradient"
              />
            </div>
          </section>
        )}

        {/* Financial Statements with Interactive Year Selector */}
        <FinancialStatementsSection
          balanceSheets={balanceSheets}
          incomeStatements={incomeStatements}
          cashFlows={cashFlows}
        />
      </div>
    </div>
  );
}

