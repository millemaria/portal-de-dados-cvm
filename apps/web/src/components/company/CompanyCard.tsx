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
        <div className="glass-card p-6 sm:p-7 min-h-[260px] h-full flex flex-col justify-between border border-slate-800/90 bg-slate-900/80 hover:bg-slate-900 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 rounded-2xl">
          <div className="space-y-3.5">
            {/* Top Header: Icon + Ticker + Arrow */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/30 group-hover:scale-105 group-hover:border-cyan-400/50 transition-all duration-200">
                  <Building2 className="h-5.5 w-5.5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-white group-hover:text-cyan-400 transition-colors tracking-tight">
                      {company.ticker}
                    </h3>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      B3
                    </span>
                  </div>
                  <p
                    className="text-xs text-slate-400 truncate mt-1 font-medium leading-normal"
                    title={company.companyName}
                  >
                    {company.companyName}
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/15 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                <ArrowUpRight className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Sector Chip */}
            {company.sector && (
              <div className="pt-0.5">
                <span className="inline-block px-3 py-1 rounded-md bg-slate-800/80 text-cyan-300 text-[11px] font-medium border border-slate-700/60 max-w-full truncate">
                  {company.sector}
                </span>
              </div>
            )}
          </div>

          {/* Metric Boxes */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80 mt-4">
            <div className="bg-slate-950/70 rounded-xl p-3 sm:p-3.5 border border-slate-800/90 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 truncate mb-1.5">
                Receita Líq.
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-100 truncate tabular-nums">
                {formatCurrencyWithSuffix(company.netRevenue, company.currencyScale)}
              </p>
            </div>
            <div className="bg-slate-950/70 rounded-xl p-3 sm:p-3.5 border border-slate-800/90 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 truncate mb-1.5">
                Lucro Líq.
              </p>
              <p
                className={`text-xs sm:text-sm font-bold truncate tabular-nums ${
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
