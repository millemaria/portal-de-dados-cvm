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
      className="glass-card p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        {/* Icon */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-lg">
          <Building2 className="h-8 w-8 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
              {company.ticker}
            </h1>
            <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${
              company.status === "ATIVO"
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
            }`}>
              {company.status}
            </span>
          </div>

          <p className="text-base text-[var(--color-text-secondary)] mb-4">
            {company.companyName}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
            {company.sector && (
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                {company.sector}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Ref.: {formatDate(company.latestReferenceDate)}
            </span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
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
    <div className="text-right sm:text-left">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p
        className={`text-sm font-semibold ${
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
