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
          "relative flex items-center transition-all duration-300 w-full min-w-0",
          isHero
            ? "h-14 sm:h-16 rounded-2xl border-2 border-slate-700/80 bg-slate-900/90 backdrop-blur-xl px-2 sm:px-3 shadow-lg shadow-black/40 hover:border-cyan-500/50"
            : "h-9 sm:h-10 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 hover:border-slate-700",
          isFocused &&
            (isHero
              ? "border-cyan-400 ring-4 ring-cyan-500/15 shadow-[0_0_25px_rgba(6,182,212,0.25)]"
              : "border-cyan-500/80 ring-2 ring-cyan-500/20")
        )}
      >
        <Search
          className={cn(
            "shrink-0 transition-colors",
            isHero
              ? "ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 text-cyan-400"
              : "h-4 w-4 text-slate-400",
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
            "flex-1 min-w-0 bg-transparent outline-none text-white font-medium placeholder:text-slate-500 border-none shadow-none focus:outline-none focus:ring-0",
            isHero ? "px-3 sm:px-4 text-sm sm:text-base" : "px-2.5 text-xs sm:text-sm"
          )}
          id={isHero ? "search-input-hero" : "search-input-compact"}
        />
        {isHero && (
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-950 hover:text-white transition-all shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-95 cursor-pointer ml-1 sm:ml-2"
          >
            Buscar
          </button>
        )}
      </div>
    </form>
  );
}
