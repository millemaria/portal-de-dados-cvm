"use client";

import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] transition-transform group-hover:scale-105">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] hidden min-[380px]:inline-block">
              Portal <span className="gradient-text">CVM</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg min-w-0">
            <SearchBar variant="compact" />
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--color-surface)]"
            >
              Início
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
