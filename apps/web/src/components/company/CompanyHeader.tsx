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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Info Left */}
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          {/* Icon */}
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-lg mt-0.5">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>

          {/* Info Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text tracking-tight">
                {company.ticker}
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-medium shrink-0 ${
                company.status === "ATIVO"
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
              }`}>
                {company.status}
              </span>
            </div>

            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-3 font-medium break-words">
              {company.companyName}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[var(--color-text-muted)]">
              {company.sector && (
                <span className="flex items-center gap-1 bg-[var(--color-surface)] px-2.5 py-1 rounded-md border border-[var(--color-border)]/40">
                  <Hash className="h-3 w-3 text-[var(--color-primary)]" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{company.sector}</span>
                </span>
              )}
              <span className="flex items-center gap-1 bg-[var(--color-surface)] px-2.5 py-1 rounded-md border border-[var(--color-border)]/40">
                <Calendar className="h-3 w-3 text-[var(--color-secondary)]" />
                Ref.: {formatDate(company.latestReferenceDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 shrink-0 lg:max-w-xl xl:max-w-none w-full lg:w-auto">
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
    <div className="bg-[var(--color-surface)]/70 rounded-xl p-3 border border-[var(--color-border)]/50 min-w-0 text-left">
      <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] truncate mb-0.5">{label}</p>
      <p
        className={`text-xs sm:text-sm font-semibold truncate ${
          positive === undefined
            ? "text-[var(--color-text-primary)]"
            : positive
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-danger)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
