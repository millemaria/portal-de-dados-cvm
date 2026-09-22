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
          "flex items-center w-full transition-colors duration-200",
          isHero
            ? "h-13 sm:h-14 px-4 gap-3 rounded-lg border border-slate-800 bg-slate-900/95 shadow-sm hover:border-slate-700"
            : "h-9.5 px-3 gap-2.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:border-slate-700",
          isFocused && "border-blue-500 ring-1 ring-blue-500/30"
        )}
      >
        <Search
          className={cn(
            "shrink-0 transition-colors pointer-events-none",
            isHero ? "h-5 w-5" : "h-4 w-4",
            isFocused ? "text-blue-400" : "text-slate-400"
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
            className="shrink-0 rounded-md bg-blue-600 hover:bg-blue-500 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white transition-colors active:scale-98 cursor-pointer whitespace-nowrap"
          >
            Buscar
          </button>
        )}
      </div>
    </form>
  );
}
