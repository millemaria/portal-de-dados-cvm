"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  variant?: "hero" | "compact";
  defaultValue?: string;
}

export function SearchBar({ variant = "hero", defaultValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const isHero = variant === "hero";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 30px rgba(6, 182, 212, 0.3)"
            : isHero
              ? "0 10px 30px -10px rgba(0, 0, 0, 0.5)"
              : "none",
        }}
        className={cn(
          "relative flex items-center transition-all duration-300 w-full min-w-0",
          isHero
            ? "h-14 sm:h-16 rounded-2xl border-2 border-slate-700/80 bg-slate-900/95 backdrop-blur-2xl px-2 sm:px-3 hover:border-cyan-500/60"
            : "h-9 sm:h-10 rounded-xl border border-slate-800 bg-slate-900/90 px-2 hover:border-slate-700",
          isFocused && (isHero ? "border-cyan-400/90 ring-2 ring-cyan-400/20" : "border-cyan-500/60")
        )}
      >
        <Search
          className={cn(
            "shrink-0 transition-colors",
            isHero
              ? "ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 text-cyan-400"
              : "ml-1.5 sm:ml-2 h-4 w-4 text-slate-400",
            isFocused && "text-cyan-400"
          )}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            isHero
              ? "Buscar por empresa ou ticker (ex: PETR4, VALE3, Itaú)..."
              : "Buscar empresa ou ticker..."
          }
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none text-white font-medium placeholder:text-slate-500",
            isHero ? "px-3 sm:px-4 text-sm sm:text-base" : "px-2.5 text-xs sm:text-sm"
          )}
          id={isHero ? "search-input-hero" : "search-input-compact"}
        />
        {isHero && (
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-950 hover:text-white transition-all shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-95 cursor-pointer"
          >
            Buscar
          </button>
        )}
      </motion.div>
    </form>
  );
}
