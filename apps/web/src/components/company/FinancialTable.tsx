"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { StatementLineItem } from "@portal-cvm/types";
import { formatCurrencyFull } from "@/lib/formatters";

interface FinancialTableProps {
  title: string;
  lineItems: StatementLineItem[];
  currencyScale: string;
}

export function FinancialTable({
  title,
  lineItems,
  currencyScale,
}: FinancialTableProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set()
  );

  const toggleAccount = (code: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Group items by level for tree rendering
  const topLevel = lineItems.filter((item) => item.level <= 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden border border-slate-800/90 bg-slate-900/60 rounded-xl"
    >
      <div className="p-3.5 sm:p-4 border-b border-slate-800/90 bg-slate-900/80 flex items-center justify-between gap-3">
        <h3 className="text-xs sm:text-sm font-bold text-white truncate">
          {title}
        </h3>
        {currencyScale && (
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 shrink-0">
            Escala: {currencyScale}
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-800/60 overflow-x-auto">
        {topLevel.map((item) => {
          const children = lineItems.filter(
            (child) =>
              child.accountCode.startsWith(item.accountCode + ".") &&
              child.level === item.level + 1
          );
          const hasChildren = children.length > 0;
          const isExpanded = expandedAccounts.has(item.accountCode);

          return (
            <div key={item.accountCode}>
              <button
                type="button"
                onClick={() => hasChildren && toggleAccount(item.accountCode)}
                className={`w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 text-left transition-colors ${
                  item.level === 1 ? "bg-slate-900/30" : ""
                } ${
                  hasChildren
                    ? "hover:bg-slate-800/50 cursor-pointer"
                    : "cursor-default"
                }`}
                style={{
                  paddingLeft: `max(14px, ${(item.level - 1) * 14 + 14}px)`,
                  paddingRight: "16px",
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-3 sm:mr-4">
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    )
                  ) : (
                    <span className="w-3.5 shrink-0" />
                  )}
                  <span
                    className={`text-xs sm:text-sm flex items-center gap-2 min-w-0 ${
                      item.level === 1
                        ? "font-bold text-white"
                        : "text-slate-300 font-medium"
                    }`}
                  >
                    <span className="text-slate-400 text-[11px] font-mono shrink-0">
                      {item.accountCode}
                    </span>
                    <span className="truncate" title={item.accountDescription}>
                      {item.accountDescription}
                    </span>
                  </span>
                </div>
                <span
                  className={`text-xs sm:text-sm font-mono tabular-nums whitespace-nowrap shrink-0 text-right ${
                    item.value < 0
                      ? "text-rose-400 font-semibold"
                      : item.level === 1
                        ? "text-white font-bold"
                        : "text-slate-200"
                  }`}
                >
                  {formatCurrencyFull(item.value, currencyScale)}
                </span>
              </button>

              {/* Children */}
              <AnimatePresence>
                {isExpanded && children.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden bg-slate-950/30"
                  >
                    {children.map((child) => (
                      <div
                        key={child.accountCode}
                        className="flex items-center justify-between px-3.5 sm:px-4 py-2 border-t border-slate-850"
                        style={{
                          paddingLeft: `max(24px, ${(child.level - 1) * 14 + 24}px)`,
                          paddingRight: "16px",
                        }}
                      >
                        <span className="text-[11px] text-slate-400 flex items-center gap-2 min-w-0 flex-1 mr-3 sm:mr-4">
                          <span className="font-mono text-[10px] text-slate-500 shrink-0">
                            {child.accountCode}
                          </span>
                          <span className="truncate" title={child.accountDescription}>
                            {child.accountDescription}
                          </span>
                        </span>
                        <span
                          className={`text-[11px] font-mono tabular-nums whitespace-nowrap shrink-0 text-right ${
                            child.value < 0
                              ? "text-rose-400"
                              : "text-slate-300"
                          }`}
                        >
                          {formatCurrencyFull(child.value, currencyScale)}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
