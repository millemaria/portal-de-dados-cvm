"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, LogOut, Menu } from "lucide-react";
import type { AdminUser } from "@portal-cvm/types";
import { getAdminLevelLabel } from "@portal-cvm/types";
import { formatShortName } from "@/lib/formatters";
import { getStoredAdminUser, logoutAdmin } from "@/lib/authClient";

export function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoginPage) {
      setAdminUser(getStoredAdminUser());
    }
  }, [isLoginPage]);

  const getLevelBadgeClasses = (level?: string) => {
    switch (level) {
      case "ADMIN_MASTER":
        return "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";
      case "ADMIN_GESTOR":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
      case "ADMIN_ANALISTA":
        return "bg-amber-500/15 border-amber-500/30 text-amber-300";
      default:
        return "bg-blue-500/15 border-blue-500/30 text-blue-300";
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl"
      >
        <div className="page-container w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 sm:gap-6">
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
                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">
                  CVM
                </span>
              </span>
            </Link>

            {/* Search in Header (Oculta na tela de login) */}
            {!isLoginPage && (
              <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg min-w-0 hidden sm:block">
                <SearchBar variant="compact" />
              </div>
            )}

            {/* Right Navigation */}
            <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
              {!isLoginPage ? (
                <>
                  <Link
                    href="/"
                    className={`text-xs sm:text-sm font-medium transition-colors px-2.5 py-1.5 rounded-md ${
                      pathname === "/"
                        ? "bg-slate-900 text-white font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    Início
                  </Link>

                  {/* Badge do Administrador com Nome Reduzido (Primeiro e Último Nome) */}
                  <div
                    className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono"
                    title={adminUser?.name || "Administrador"}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-semibold text-white">
                      {formatShortName(adminUser?.name)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold border ${getLevelBadgeClasses(
                        adminUser?.level
                      )}`}
                    >
                      {getAdminLevelLabel(adminUser?.level).replace(
                        "Administrador ",
                        ""
                      )}
                    </span>
                  </div>

                  {/* Botão para Abrir o Sidebar Lateral */}
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    title="Menu de navegação e administração"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors px-2.5 py-1.5 rounded-lg cursor-pointer"
                  >
                    <Menu className="w-4 h-4 text-cyan-400" />
                    <span className="hidden md:inline">Menu</span>
                  </button>

                  {/* Botão de Logout */}
                  <button
                    type="button"
                    onClick={() => logoutAdmin()}
                    title="Encerrar sessão administrativa"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors px-2 py-1.5 rounded-md hover:bg-rose-500/10 cursor-pointer"
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

      {/* Drawer / Sidebar Lateral */}
      {!isLoginPage && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          adminUser={adminUser}
        />
      )}
    </>
  );
}

