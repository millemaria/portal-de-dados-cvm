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
      className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 lg:p-7 shadow-sm"
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Info Left */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
            <Building2 className="h-6 w-6 stroke-[2]" />
          </div>

          {/* Info Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                {company.ticker}
              </h1>
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-mono font-semibold shrink-0 ${
                  company.status === "ATIVO"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                }`}
              >
                {company.status}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
                CVM: {company.cdCvm}
              </span>
            </div>

            <p className="text-sm text-slate-300 mb-2.5 font-medium break-words">
              {company.companyName}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {company.sector && (
                <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800 text-[11px]">
                  <Hash className="h-3 w-3 text-slate-500" />
                  <span className="truncate max-w-[240px] sm:max-w-none">{company.sector}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800 text-[11px] font-mono">
                <Calendar className="h-3 w-3 text-slate-500" />
                Data-base: {formatDate(company.latestReferenceDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-800/80">
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
    <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80 min-w-0 text-left">
      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 truncate mb-1">
        {label}
      </p>
      <p
        className={`text-sm sm:text-base font-bold truncate tabular-nums font-mono ${
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
