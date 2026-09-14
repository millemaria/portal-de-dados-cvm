"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";
import type { CompanySummary } from "@portal-cvm/types";
import { formatCurrencyWithSuffix } from "@/lib/formatters";

interface CompanyCardProps {
  company: CompanySummary;
  index: number;
}

export function CompanyCard({ company, index }: CompanyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/companies/${company.ticker}`}>
        <div className="glass-card group cursor-pointer p-5 transition-all duration-300 hover:translate-y-[-2px]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20">
                <Building2 className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                  {company.ticker}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                  {company.companyName}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-[var(--color-primary)]" />
          </div>

          {company.sector && (
            <span className="mb-3 inline-block rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs text-[var(--color-primary)]">
              {company.sector}
            </span>
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Receita Líq.</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {formatCurrencyWithSuffix(company.netRevenue, company.currencyScale)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Lucro Líq.</p>
              <p className={`text-sm font-medium ${(company.netIncome ?? 0) >= 0 ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"}`}>
                {formatCurrencyWithSuffix(company.netIncome, company.currencyScale)}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
