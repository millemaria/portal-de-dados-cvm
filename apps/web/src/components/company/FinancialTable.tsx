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
      <div className="p-5 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
      </div>

      <div className="divide-y divide-[var(--color-border)]/50">
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
                className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                  hasChildren
                    ? "hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    : "cursor-default"
                }`}
                style={{ paddingLeft: `${(item.level - 1) * 16 + 20}px` }}
              >
                <div className="flex items-center gap-2">
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    )
                  ) : (
                    <span className="w-3.5" />
                  )}
                  <span
                    className={`text-sm ${
                      item.level === 1
                        ? "font-semibold text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <span className="text-[var(--color-text-muted)] mr-2 text-xs font-mono">
                      {item.accountCode}
                    </span>
                    {item.accountDescription}
                  </span>
                </div>
                <span
                  className={`text-sm font-mono tabular-nums ${
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
                        className="flex items-center justify-between px-5 py-2.5 bg-[var(--color-surface)]/50"
                        style={{
                          paddingLeft: `${(child.level - 1) * 16 + 20 + 22}px`,
                        }}
                      >
                        <span className="text-xs text-[var(--color-text-muted)]">
                          <span className="font-mono mr-2">
                            {child.accountCode}
                          </span>
                          {child.accountDescription}
                        </span>
                        <span
                          className={`text-xs font-mono tabular-nums ${
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
