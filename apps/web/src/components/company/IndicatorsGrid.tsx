"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Percent,
  DollarSign,
  BarChart3,
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
      label: "ROE",
      value: formatPercent(latest.roe),
      raw: latest.roe,
      prev: previous?.roe,
      icon: Percent,
      color: "primary",
    },
    {
      label: "ROA",
      value: formatPercent(latest.roa),
      raw: latest.roa,
      prev: previous?.roa,
      icon: Percent,
      color: "secondary",
    },
    {
      label: "Margem Líquida",
      value: formatPercent(latest.netMargin),
      raw: latest.netMargin,
      prev: previous?.netMargin,
      icon: BarChart3,
      color: "accent",
    },
    {
      label: "Margem Bruta",
      value: formatPercent(latest.grossMargin),
      raw: latest.grossMargin,
      prev: previous?.grossMargin,
      icon: BarChart3,
      color: "primary",
    },
    {
      label: "Margem EBITDA",
      value: formatPercent(latest.ebitdaMargin),
      raw: latest.ebitdaMargin,
      prev: previous?.ebitdaMargin,
      icon: TrendingUp,
      color: "secondary",
    },
    {
      label: "Liquidez Corrente",
      value: formatRatio(latest.currentRatio),
      raw: latest.currentRatio,
      prev: previous?.currentRatio,
      icon: DollarSign,
      color: "accent",
    },
    {
      label: "Dívida/PL",
      value: formatRatio(latest.debtToEquity),
      raw: latest.debtToEquity,
      prev: previous?.debtToEquity,
      icon: BarChart3,
      color: "warning",
      invertTrend: true,
    },
    {
      label: "EBITDA",
      value: formatCurrencyWithSuffix(latest.ebitda, latest.currencyScale),
      raw: latest.ebitda,
      prev: previous?.ebitda,
      icon: DollarSign,
      color: "primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const trend = getTrend(card.raw, card.prev, card.invertTrend);
        const colorVar = `var(--color-${card.color})`;

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="glass-card p-4 group"
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon
                className="h-4 w-4"
                style={{ color: colorVar }}
              />
              {trend && (
                <span
                  className={`flex items-center text-xs ${
                    trend === "up"
                      ? "text-[var(--color-accent)]"
                      : trend === "down"
                        ? "text-[var(--color-danger)]"
                        : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : trend === "down" ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">
              {card.label}
            </p>
            <p className="text-base font-semibold text-[var(--color-text-primary)]">
              {card.value}
            </p>
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
