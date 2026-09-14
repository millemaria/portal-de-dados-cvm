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
      className="glass-card p-5 sm:p-8 text-center"
    >
      <div className="mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-danger)]" />
      </div>
      <h3 className="mb-1.5 sm:mb-2 text-base sm:text-lg font-semibold text-[var(--color-text-primary)]">
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
