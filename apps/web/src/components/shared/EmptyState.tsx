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
      className="glass-card p-12 text-center"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-hover)]">
        <SearchX className="h-7 w-7 text-[var(--color-text-muted)]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    </motion.div>
  );
}
