"use client";

import { motion } from "framer-motion";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        className={`${sizeMap[size]} rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-3 w-32" />
        </div>
      </div>
      <div className="skeleton h-5 w-24 rounded-full" />
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)]/40">
        <div className="skeleton h-8 w-full" />
        <div className="skeleton h-8 w-full" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="glass-card p-4 sm:p-6 space-y-3">
      <div className="skeleton h-5 w-1/3 mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center gap-3">
          <div className="skeleton h-4 w-2/5" />
          <div className="skeleton h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
