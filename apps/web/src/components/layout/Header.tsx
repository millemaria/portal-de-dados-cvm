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
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-blue-400 group-hover:border-slate-700 transition-colors">
              <Activity className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Portal de Dados</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">CVM</span>
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
                  className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-900"
                >
                  Início
                </Link>

                {/* Badge do Administrador */}
                <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>{adminUser?.name || "Administrador"}</span>
                </div>

                {/* Botão de Logout */}
                <button
                  type="button"
                  onClick={() => logoutAdmin()}
                  title="Encerrar sessão administrativa"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors px-2.5 py-1.5 rounded-md hover:bg-rose-500/10 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
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
