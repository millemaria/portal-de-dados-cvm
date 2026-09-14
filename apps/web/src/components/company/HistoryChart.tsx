"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueHistoryEntry, NetIncomeHistoryEntry } from "@portal-cvm/types";
import { extractYear, formatCurrencyWithSuffix } from "@/lib/formatters";

interface HistoryChartProps {
  title: string;
  data: Array<RevenueHistoryEntry | NetIncomeHistoryEntry>;
  dataKey: "netRevenue" | "netIncome";
  color: string;
  gradientId: string;
}

export function HistoryChart({
  title,
  data,
  dataKey,
  color,
  gradientId,
}: HistoryChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = [...data]
    .reverse()
    .map((entry) => ({
      year: extractYear(entry.referenceDate),
      value: dataKey === "netRevenue"
        ? (entry as RevenueHistoryEntry).netRevenue
        : (entry as NetIncomeHistoryEntry).netIncome,
      scale: entry.currencyScale,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-3.5 sm:p-5 min-w-0"
    >
      <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] mb-3 sm:mb-4">
        {title}
      </h3>

      <div className="h-48 sm:h-56 lg:h-60 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis
              dataKey="year"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                formatCurrencyWithSuffix(v, "MIL")
              }
              width={65}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(17, 24, 39, 0.95)",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "12px",
              }}
              formatter={(value: number) => [
                formatCurrencyWithSuffix(value, "MIL"),
                title,
              ]}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{ fill: color, r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 4.5, stroke: color, strokeWidth: 2, fill: "#111827" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        ) : (
          <div className="h-full w-full skeleton rounded-lg" />
        )}
      </div>
    </motion.div>
  );
}
