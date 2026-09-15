"use client";

import { motion } from "framer-motion";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-2", lg: "h-12 w-12 border-3" };

  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        className={`${sizeMap[size]} rounded-full border-slate-800 border-t-cyan-400`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-4 border border-slate-800/90 bg-slate-900/50 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="skeleton h-11 w-11 shrink-0 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-3 w-36 rounded" />
        </div>
      </div>
      <div className="skeleton h-6 w-32 rounded-lg" />
      <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800/80">
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="skeleton h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="glass-card p-5 space-y-3.5 border border-slate-800/90 rounded-2xl">
      <div className="skeleton h-6 w-1/3 mb-4 rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center gap-3">
          <div className="skeleton h-4 w-2/5 rounded" />
          <div className="skeleton h-4 w-1/4 rounded" />
        </div>
      ))}
    </div>
  );
}
