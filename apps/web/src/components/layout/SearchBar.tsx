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
            ? "0 0 20px rgba(6, 182, 212, 0.2)"
            : "none",
        }}
        className={cn(
          "relative flex items-center rounded-xl border transition-all duration-300",
          isHero
            ? "h-14 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
            : "h-10 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]",
          isFocused && "border-[var(--color-primary)]/50"
        )}
      >
        <Search
          className={cn(
            "shrink-0 text-[var(--color-text-muted)] transition-colors",
            isHero ? "ml-4 h-5 w-5" : "ml-3 h-4 w-4",
            isFocused && "text-[var(--color-primary)]"
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
              ? "Busque por empresa ou ticker (ex: PETR4, VALE, Itaú)"
              : "Buscar empresa..."
          }
          className={cn(
            "w-full bg-transparent outline-none placeholder:text-[var(--color-text-muted)]",
            isHero ? "px-3 text-base" : "px-2 text-sm"
          )}
          id="search-input"
        />
        {isHero && (
          <button
            type="submit"
            className="mr-2 shrink-0 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
          >
            Buscar
          </button>
        )}
      </motion.div>
    </form>
  );
}
