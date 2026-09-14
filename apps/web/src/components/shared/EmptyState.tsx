"use client";

import { SearchX } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = "Nenhum resultado encontrado",
  message = "Tente buscar por outro termo ou ticker.",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 sm:p-12 flex flex-col items-center justify-center text-center mx-auto"
    >
      <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-slate-800/80 border border-slate-700/60 shadow-inner">
        <SearchX className="h-6 w-6 sm:h-7 sm:w-7 text-slate-400" />
      </div>
      <h3 className="mb-1.5 sm:mb-2 text-base sm:text-lg font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    </motion.div>
  );
}
