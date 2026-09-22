"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Building2 } from "lucide-react";
import type { CompanySummary } from "@portal-cvm/types";
import { formatCurrencyWithSuffix } from "@/lib/formatters";

interface CompanyCardProps {
  company: CompanySummary;
  index: number;
}

export function CompanyCard({ company, index }: CompanyCardProps) {
  const isPositiveIncome = (company.netIncome ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="h-full flex flex-col"
    >
      <Link href={`/companies/${company.ticker}`} className="block h-full group">
        <div className="p-5 sm:p-6 min-h-[250px] h-full flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 hover:bg-slate-900/95 hover:border-slate-700 transition-all duration-200">
          <div className="space-y-3">
            {/* Top Header: Icon + Ticker + Arrow */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  <Building2 className="h-5 w-5 text-slate-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-blue-400 transition-colors tracking-tight font-mono">
                      {company.ticker}
                    </h3>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                      B3
                    </span>
                  </div>
                  <p
                    className="text-xs text-slate-400 truncate mt-0.5 font-normal leading-normal"
                    title={company.companyName}
                  >
                    {company.companyName}
                  </p>
                </div>
              </div>
              <div className="p-1.5 rounded-md text-slate-500 group-hover:text-slate-300 transition-colors">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>

            {/* Sector Chip */}
            {company.sector && (
              <div className="pt-0.5">
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-950/70 text-slate-400 text-[11px] font-medium border border-slate-800 max-w-full truncate">
                  {company.sector}
                </span>
              </div>
            )}
          </div>

          {/* Metric Boxes */}
          <div className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-slate-800/70 mt-3.5">
            <div className="bg-slate-950/60 rounded-lg p-2.5 sm:p-3 border border-slate-800/70 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 truncate mb-1">
                Receita Líq.
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate tabular-nums font-mono">
                {formatCurrencyWithSuffix(company.netRevenue, company.currencyScale)}
              </p>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-2.5 sm:p-3 border border-slate-800/70 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 truncate mb-1">
                Lucro Líq.
              </p>
              <p
                className={`text-xs sm:text-sm font-semibold truncate tabular-nums font-mono ${
                  isPositiveIncome ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrencyWithSuffix(company.netIncome, company.currencyScale)}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
