"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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
      <div
        className={cn(
          "flex items-center w-full transition-all duration-200",
          isHero
            ? "h-14 sm:h-16 px-3.5 sm:px-5 gap-3 rounded-2xl border-2 border-slate-700/80 bg-slate-900/90 shadow-lg shadow-black/40"
            : "h-10 px-3 gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90",
          isFocused &&
            (isHero
              ? "border-cyan-400 ring-4 ring-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.2)]"
              : "border-cyan-500 ring-2 ring-cyan-500/20")
        )}
      >
        <Search
          className={cn(
            "shrink-0 transition-colors pointer-events-none",
            isHero ? "h-5 w-5 sm:h-6 sm:w-6" : "h-4 w-4",
            isFocused ? "text-cyan-400" : "text-slate-400"
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
              ? "Buscar por empresa ou ticker (ex: PETR4, VALE3)..."
              : "Buscar empresa ou ticker..."
          }
          className={cn(
            "flex-1 min-w-0 bg-transparent text-white placeholder:text-slate-500 font-medium focus:outline-none border-none shadow-none focus:ring-0",
            isHero ? "text-sm sm:text-base" : "text-xs sm:text-sm"
          )}
          id={isHero ? "search-input-hero" : "search-input-compact"}
        />
        {isHero && (
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:text-white transition-all shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Buscar
          </button>
        )}
      </div>
    </form>
  );
}
