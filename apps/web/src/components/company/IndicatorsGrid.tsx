"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Percent,
  DollarSign,
  BarChart3,
  Scale,
  ShieldCheck,
} from "lucide-react";
import type { FinancialIndicator } from "@portal-cvm/types";
import { formatPercent, formatRatio, formatCurrencyWithSuffix } from "@/lib/formatters";

interface IndicatorsGridProps {
  indicators: FinancialIndicator[];
}

export function IndicatorsGrid({ indicators }: IndicatorsGridProps) {
  if (!indicators.length) return null;

  const latest = indicators[0];
  const previous = indicators.length > 1 ? indicators[1] : null;

  const cards = [
    {
      label: "ROE (Retorno s/ PL)",
      value: formatPercent(latest.roe),
      raw: latest.roe,
      prev: previous?.roe,
      icon: Percent,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "ROA (Retorno s/ Ativo)",
      value: formatPercent(latest.roa),
      raw: latest.roa,
      prev: previous?.roa,
      icon: Percent,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Margem Líquida",
      value: formatPercent(latest.netMargin),
      raw: latest.netMargin,
      prev: previous?.netMargin,
      icon: BarChart3,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Margem Bruta",
      value: formatPercent(latest.grossMargin),
      raw: latest.grossMargin,
      prev: previous?.grossMargin,
      icon: BarChart3,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "Margem EBITDA",
      value: formatPercent(latest.ebitdaMargin),
      raw: latest.ebitdaMargin,
      prev: previous?.ebitdaMargin,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Liquidez Corrente",
      value: formatRatio(latest.currentRatio),
      raw: latest.currentRatio,
      prev: previous?.currentRatio,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Dívida Líquida / PL",
      value: formatRatio(latest.debtToEquity),
      raw: latest.debtToEquity,
      prev: previous?.debtToEquity,
      icon: Scale,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      invertTrend: true,
    },
    {
      label: "EBITDA Anual",
      value: formatCurrencyWithSuffix(latest.ebitda, latest.currencyScale),
      raw: latest.ebitda,
      prev: previous?.ebitda,
      icon: DollarSign,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {cards.map((card, i) => {
        const trend = getTrend(card.raw, card.prev, card.invertTrend);

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            className="glass-card p-4 sm:p-5 group min-w-0 flex flex-col justify-between border border-slate-800/90 bg-slate-900/80 hover:bg-slate-900 hover:border-cyan-500/50 transition-all rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl border ${card.bg}`}>
                <card.icon className={`h-4 w-4 shrink-0 ${card.color}`} />
              </div>
              {trend && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    trend === "up"
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25"
                      : trend === "down"
                        ? "text-rose-400 bg-rose-500/10 border border-rose-500/25"
                        : "text-slate-400 bg-slate-800 border border-slate-700"
                  }`}
                >
                  {trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : trend === "down" ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  <span>{trend === "up" ? "Alta" : trend === "down" ? "Queda" : "Estável"}</span>
                </span>
              )}
            </div>
            <div>
              <p
                className="text-xs text-slate-400 font-medium mb-1 truncate"
                title={card.label}
              >
                {card.label}
              </p>
              <p
                className="text-lg sm:text-xl font-black text-white tracking-tight truncate tabular-nums"
                title={card.value}
              >
                {card.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function getTrend(
  current?: number | null,
  previous?: number | null,
  invert?: boolean
): "up" | "down" | "neutral" | null {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.001) return "neutral";
  const isUp = diff > 0;
  if (invert) return isUp ? "down" : "up";
  return isUp ? "up" : "down";
}
