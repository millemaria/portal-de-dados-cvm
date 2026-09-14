"use client";

import { motion } from "framer-motion";
import { Building2, Calendar, Hash } from "lucide-react";
import type { CompanySummary } from "@portal-cvm/types";
import { formatDate, formatCurrencyWithSuffix } from "@/lib/formatters";

interface CompanyHeaderProps {
  company: CompanySummary;
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-5 sm:p-7 lg:p-8"
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Info Left */}
        <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
          {/* Icon */}
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-slate-950 stroke-[2.2]" />
          </div>

          {/* Info Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {company.ticker}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${
                  company.status === "ATIVO"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {company.status}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                CVM: {company.cdCvm}
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-300 mb-3 font-semibold break-words">
              {company.companyName}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
              {company.sector && (
                <span className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
                  <Hash className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="truncate max-w-[240px] sm:max-w-none">{company.sector}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                Ref.: {formatDate(company.latestReferenceDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 shrink-0 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-800">
          <MetricBox
            label="Ativo Total"
            value={formatCurrencyWithSuffix(company.totalAssets, company.currencyScale)}
          />
          <MetricBox
            label="Patrimônio Líq."
            value={formatCurrencyWithSuffix(company.totalEquity, company.currencyScale)}
          />
          <MetricBox
            label="Receita Líq."
            value={formatCurrencyWithSuffix(company.netRevenue, company.currencyScale)}
          />
          <MetricBox
            label="Lucro Líq."
            value={formatCurrencyWithSuffix(company.netIncome, company.currencyScale)}
            positive={(company.netIncome ?? 0) >= 0}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MetricBox({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-slate-950/80 rounded-xl p-3 sm:p-4 border border-slate-800/90 min-w-0 text-left">
      <p className="text-[10px] sm:text-[11px] uppercase font-semibold tracking-wider text-slate-400 truncate mb-1">
        {label}
      </p>
      <p
        className={`text-sm sm:text-base font-extrabold truncate tabular-nums ${
          positive === undefined
            ? "text-white"
            : positive
              ? "text-emerald-400"
              : "text-rose-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
