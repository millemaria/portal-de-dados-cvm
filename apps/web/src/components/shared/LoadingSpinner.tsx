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
    <div className="glass-card p-6 space-y-4">
      <div className="skeleton h-6 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="flex gap-4 mt-4">
        <div className="skeleton h-10 w-24" />
        <div className="skeleton h-10 w-24" />
        <div className="skeleton h-10 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="glass-card p-6 space-y-3">
      <div className="skeleton h-6 w-1/3 mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton h-4 w-2/5" />
          <div className="skeleton h-4 w-1/5" />
          <div className="skeleton h-4 w-1/5" />
        </div>
      ))}
    </div>
  );
}
