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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-3.5 sm:p-5 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {title}
        </h3>
        {currencyScale && (
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)]/40 shrink-0">
            Escala: {currencyScale}
          </span>
        )}
      </div>

      <div className="divide-y divide-[var(--color-border)]/50 overflow-x-auto">
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
                onClick={() => hasChildren && toggleAccount(item.accountCode)}
                className={`w-full flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 text-left transition-colors ${
                  hasChildren
                    ? "hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    : "cursor-default"
                }`}
                style={{
                  paddingLeft: `max(12px, ${(item.level - 1) * 12 + 12}px)`,
                  paddingRight: "12px",
                }}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-2 sm:mr-4">
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                    )
                  ) : (
                    <span className="w-3.5 shrink-0" />
                  )}
                  <span
                    className={`text-xs sm:text-sm flex items-center gap-1.5 min-w-0 ${
                      item.level === 1
                        ? "font-semibold text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <span className="text-[var(--color-text-muted)] text-[10px] sm:text-xs font-mono shrink-0">
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
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-text-primary)]"
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
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {children.map((child) => (
                      <div
                        key={child.accountCode}
                        className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 bg-[var(--color-surface)]/50"
                        style={{
                          paddingLeft: `max(20px, ${(child.level - 1) * 12 + 20}px)`,
                          paddingRight: "12px",
                        }}
                      >
                        <span className="text-[11px] sm:text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 min-w-0 flex-1 mr-2 sm:mr-4">
                          <span className="font-mono text-[10px] sm:text-xs shrink-0">
                            {child.accountCode}
                          </span>
                          <span className="truncate" title={child.accountDescription}>
                            {child.accountDescription}
                          </span>
                        </span>
                        <span
                          className={`text-[11px] sm:text-xs font-mono tabular-nums whitespace-nowrap shrink-0 text-right ${
                            child.value < 0
                              ? "text-[var(--color-danger)]"
                              : "text-[var(--color-text-secondary)]"
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
