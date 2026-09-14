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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-4 sm:p-6 min-w-0 border border-slate-800/90 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-bold text-white truncate">
          {title}
        </h3>
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      <div className="h-56 sm:h-64 lg:h-72 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  formatCurrencyWithSuffix(v, "MIL")
                }
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(51, 65, 85, 0.8)",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  color: "#f8fafc",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                formatter={(value: number) => [
                  formatCurrencyWithSuffix(value, "MIL"),
                  title,
                ]}
                labelStyle={{ color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ fill: color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: "#0f172a" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full skeleton rounded-xl" />
        )}
      </div>
    </motion.div>
  );
}
