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
      className="glass-card p-6 sm:p-10 text-center border border-rose-500/30 bg-slate-900/90 rounded-2xl max-w-xl mx-auto"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
        <AlertTriangle className="h-6 w-6 text-rose-400" />
      </div>
      <h3 className="mb-2 text-lg sm:text-xl font-bold text-white tracking-tight">
        {title}
      </h3>
      <p className="mb-5 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-cyan-400 hover:text-cyan-300 active:scale-95 cursor-pointer"
        >
          Tentar novamente
        </button>
      )}
    </motion.div>
  );
}
