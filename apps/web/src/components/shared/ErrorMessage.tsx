"use client";

import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = "Erro ao carregar dados",
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 text-center"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
        <AlertTriangle className="h-6 w-6 text-[var(--color-danger)]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-primary)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          Tentar novamente
        </button>
      )}
    </motion.div>
  );
}
