"use client";

import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 group-hover:scale-105">
              <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
              Portal <span className="gradient-text font-black">CVM</span>
            </span>
          </Link>

          {/* Search in Header - Desktop/Tablet */}
          <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg min-w-0 mx-2 hidden sm:block">
            <SearchBar variant="compact" />
          </div>

          {/* Right Navigation */}
          <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              Início
            </Link>
          </nav>
        </div>

        {/* Mobile search bar */}
        <div className="pb-3 sm:hidden w-full">
          <SearchBar variant="compact" />
        </div>
      </div>
    </motion.header>
  );
}
