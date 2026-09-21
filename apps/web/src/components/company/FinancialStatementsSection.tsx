"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Layers, FileText, TrendingUp } from "lucide-react";
import type { BalanceSheet, IncomeStatement, CashFlow } from "@portal-cvm/types";
import { FinancialTable } from "./FinancialTable";

interface FinancialStatementsSectionProps {
  balanceSheets?: BalanceSheet[];
  incomeStatements?: IncomeStatement[];
  cashFlows?: CashFlow[];
}

export function FinancialStatementsSection({
  balanceSheets = [],
  incomeStatements = [],
  cashFlows = [],
}: FinancialStatementsSectionProps) {
  // Extract all available unique years from all statements
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();

    balanceSheets.forEach((b) => {
      if (b.referenceDate) yearsSet.add(b.referenceDate.substring(0, 4));
    });
    incomeStatements.forEach((i) => {
      if (i.referenceDate) yearsSet.add(i.referenceDate.substring(0, 4));
    });
    cashFlows.forEach((c) => {
      if (c.referenceDate) yearsSet.add(c.referenceDate.substring(0, 4));
    });

    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [balanceSheets, incomeStatements, cashFlows]);

  // Selected year state (default to the newest year or empty)
  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears[0] ?? "2024"
  );

  // Active statements for the selected year
  const activeBalanceSheet = useMemo(() => {
    return (
      balanceSheets.find((b) => b.referenceDate.startsWith(selectedYear)) ??
      balanceSheets[0]
    );
  }, [balanceSheets, selectedYear]);

  const activeIncomeStatement = useMemo(() => {
    return (
      incomeStatements.find((i) => i.referenceDate.startsWith(selectedYear)) ??
      incomeStatements[0]
    );
  }, [incomeStatements, selectedYear]);

  const activeCashFlow = useMemo(() => {
    return (
      cashFlows.find((c) => c.referenceDate.startsWith(selectedYear)) ??
      cashFlows[0]
    );
  }, [cashFlows, selectedYear]);

  if (availableYears.length === 0 && !activeBalanceSheet && !activeIncomeStatement) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* Header and Year Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Demonstrações Financeiras Oficiais
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              <Layers className="w-3 h-3" />
              <span>DFP / CVM</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Selecione o exercício contábil para consultar o Balanço, DRE e Fluxo de Caixa daquele período.
          </p>
        </div>

        {/* Year Selector Control */}
        {availableYears.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Ano do Balanço:</span>
            </div>
            <div className="inline-flex p-1 rounded-xl bg-slate-950/80 border border-slate-800/90 gap-1">
              {availableYears.map((year, index) => {
                const isSelected = selectedYear === year;
                const isLatest = index === 0;

                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={`relative px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-md shadow-cyan-500/25"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{year}</span>
                    {isLatest && !isSelected && (
                      <span className="ml-1 text-[10px] text-cyan-400 font-medium font-mono">
                        (Recente)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Statements Container with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedYear}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Reference Date Banner */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>
              Exercício Social: <strong className="text-white font-sans">{selectedYear}</strong> (DFP Consolidada)
            </span>
            <span>
              Data-base: {activeBalanceSheet?.referenceDate || `${selectedYear}-12-31`}
            </span>
          </div>

          {/* Balance Sheet: Assets & Liabilities */}
          {activeBalanceSheet && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
              <FinancialTable
                title={`Balanço Patrimonial — Ativo (${selectedYear})`}
                lineItems={activeBalanceSheet.assets}
                currencyScale={activeBalanceSheet.currencyScale}
              />
              <FinancialTable
                title={`Balanço Patrimonial — Passivo (${selectedYear})`}
                lineItems={activeBalanceSheet.liabilities}
                currencyScale={activeBalanceSheet.currencyScale}
              />
            </div>
          )}

          {/* Income Statement (DRE) */}
          {activeIncomeStatement && (
            <FinancialTable
              title={`Demonstração do Resultado do Exercício — DRE (${selectedYear})`}
              lineItems={activeIncomeStatement.lineItems}
              currencyScale={activeIncomeStatement.currencyScale}
            />
          )}

          {/* Cash Flow (DFC) */}
          {activeCashFlow && (
            <FinancialTable
              title={`Demonstração do Fluxo de Caixa — DFC (${selectedYear})`}
              lineItems={activeCashFlow.lineItems}
              currencyScale={activeCashFlow.currencyScale}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
