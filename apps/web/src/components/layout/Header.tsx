"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, LogOut } from "lucide-react";
import type { AdminUser } from "@portal-cvm/types";
import { getStoredAdminUser, logoutAdmin } from "@/lib/authClient";

export function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!isLoginPage) {
      setAdminUser(getStoredAdminUser());
    }
  }, [isLoginPage]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl"
    >
      <div className="page-container w-full max-w-[1440px] mx-auto px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href={isLoginPage ? "/login" : "/"}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 group-hover:scale-105">
              <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
              Portal <span className="gradient-text font-black">CVM</span>
            </span>
          </Link>

          {/* Search in Header (Oculta na tela de login) */}
          {!isLoginPage && (
            <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg min-w-0 hidden sm:block">
              <SearchBar variant="compact" />
            </div>
          )}

          {/* Right Navigation */}
          <nav className="flex items-center gap-3 shrink-0">
            {!isLoginPage ? (
              <>
                <Link
                  href="/"
                  className="text-xs sm:text-sm font-bold text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800"
                >
                  Início
                </Link>

                {/* Badge do Administrador */}
                <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{adminUser?.name || "Administrador"}</span>
                </div>

                {/* Botão de Logout */}
                <button
                  type="button"
                  onClick={() => logoutAdmin()}
                  title="Encerrar sessão administrativa"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-400 hover:text-rose-300 transition-colors px-3 py-1.5 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ambiente Seguro</span>
              </div>
            )}
          </nav>
        </div>

        {/* Mobile search bar (Oculta na tela de login) */}
        {!isLoginPage && (
          <div className="pb-3 pt-1 sm:hidden w-full">
            <SearchBar variant="compact" />
          </div>
        )}
      </div>
    </motion.header>
  );
}
