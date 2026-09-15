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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-8 sm:p-14 flex flex-col items-center justify-center text-center mx-auto border border-slate-800/90 rounded-2xl max-w-xl"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
        <SearchX className="h-7 w-7 text-cyan-400" />
      </div>
      <h3 className="mb-2 text-lg sm:text-xl font-bold text-white tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-slate-400 max-w-md leading-relaxed">{message}</p>
    </motion.div>
  );
}
