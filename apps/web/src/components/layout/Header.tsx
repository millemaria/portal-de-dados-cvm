"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  LogOut,
  Menu,
  ChevronDown,
  User,
  Users,
  ChevronRight,
} from "lucide-react";
import type { AdminUser } from "@portal-cvm/types";
import { canManageAdmins, getAdminLevelLabel } from "@portal-cvm/types";
import { formatCPF, formatShortName } from "@/lib/formatters";
import { getStoredAdminUser, logoutAdmin } from "@/lib/authClient";

export function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoginPage) {
      setAdminUser(getStoredAdminUser());
    }
  }, [isLoginPage]);

  // Fecha o dropdown ao navegar
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 200);
  };

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

  const isMaster = canManageAdmins(adminUser?.level);

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

                  {/* Menu do Usuário com Dropdown no Hover/Click */}
                  <div
                    ref={userMenuRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((prev) => !prev)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isUserMenuOpen
                          ? "bg-slate-900 border-cyan-500/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900"
                      }`}
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="true"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white tracking-tight">
                        {formatShortName(adminUser?.name)}
                      </span>
                      <span
                        className={`hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold border ${getLevelBadgeClasses(
                          adminUser?.level
                        )}`}
                      >
                        {getAdminLevelLabel(adminUser?.level).replace(
                          "Administrador ",
                          ""
                        )}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isUserMenuOpen ? "rotate-180 text-cyan-400" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu Posicionado Abaixo do Nome */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl p-3 divide-y divide-slate-800/80"
                        >
                          {/* Header do Perfil */}
                          <div className="pb-3 px-1">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-300 font-bold shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div
                                  className="text-xs font-bold text-white truncate"
                                  title={adminUser?.name}
                                >
                                  {adminUser?.name || "Administrador"}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  CPF: {formatCPF(adminUser?.cpf)}
                                </div>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getLevelBadgeClasses(
                                      adminUser?.level
                                    )}`}
                                  >
                                    {getAdminLevelLabel(adminUser?.level)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Ações e Navegação */}
                          <div className="py-2 space-y-1">
                            {isMaster && (
                              <Link
                                href="/admin/users"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                                    <Users className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Pré-cadastro de Administradores</span>
                                </div>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Master
                                </span>
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                setIsSidebarOpen(true);
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors group cursor-pointer text-left"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-1 rounded-md bg-slate-900 text-slate-400 group-hover:text-cyan-400">
                                  <Menu className="w-3.5 h-3.5" />
                                </div>
                                <span>Abrir Menu do Sistema</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                            </button>
                          </div>

                          {/* Botão de Encerrar Sessão / Logout */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => logoutAdmin()}
                              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 hover:border-rose-500/40 transition-all text-xs font-semibold cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <LogOut className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                                <span>Sair da Conta</span>
                              </div>
                              <span className="text-[10px] text-rose-400/80 font-mono">
                                Encerrar
                              </span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
