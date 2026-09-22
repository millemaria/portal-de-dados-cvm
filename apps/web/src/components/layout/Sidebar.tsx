"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Activity,
  Home,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Database,
  Lock,
} from "lucide-react";
import type { AdminUser } from "@portal-cvm/types";
import { canManageAdmins, getAdminLevelLabel } from "@portal-cvm/types";
import { formatShortName } from "@/lib/formatters";
import { logoutAdmin } from "@/lib/authClient";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: AdminUser | null;
}

export function Sidebar({ isOpen, onClose, adminUser }: SidebarProps) {
  const pathname = usePathname();
  const isMaster = canManageAdmins(adminUser?.level);

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Escuro com Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Lateral / Sidebar */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-sm sm:max-w-md bg-slate-950 border-l border-slate-800/90 shadow-2xl flex flex-col justify-between overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de Navegação Lateral"
          >
            {/* Topo do Sidebar */}
            <div>
              {/* Header do Drawer com Botão Fechar */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Activity className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                      <span>Portal de Dados</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[11px] font-semibold">
                        CVM
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-500">Menu do Sistema</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links de Navegação */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Seção Principal */}
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-3">
                    Navegação
                  </h3>
                  <nav className="space-y-1">
                    <Link
                      href="/"
                      onClick={onClose}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        pathname === "/"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                          : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-cyan-400" />
                        <span>Início & Consulta de Empresas</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </Link>
                  </nav>
                </div>

                {/* Seção de Administração */}
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-3">
                    Administração & Controle
                  </h3>
                  <nav className="space-y-1">
                    <Link
                      href="/admin/users"
                      onClick={onClose}
                      className={`flex items-start justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                        pathname === "/admin/users"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1 rounded-md bg-slate-900 border border-slate-800 text-cyan-400 mt-0.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              Administradores
                            </span>
                            {isMaster && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Master
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pré-cadastro de usuários e níveis de acesso
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
                    </Link>
                  </nav>
                </div>

                {/* Card de Informações Técnicas do Sistema */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
                  <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ambiente CVM Ativo</span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1 font-mono">
                    <div>Persistência: SQLite Integrado</div>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Criptografia: scrypt + Módulo 11</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé do Sidebar com Dados do Usuário e Logout */}
            <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/60 space-y-4">
              {/* Card do Usuário */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-xs sm:text-sm font-bold text-white truncate"
                      title={adminUser?.name}
                    >
                      {formatShortName(adminUser?.name)}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {adminUser?.email || "admin@cvm.gov.br"}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getLevelBadgeClasses(
                    adminUser?.level
                  )}`}
                >
                  {getAdminLevelLabel(adminUser?.level).replace(
                    "Administrador ",
                    ""
                  )}
                </span>
              </div>

              {/* Botão de Encerrar Sessão */}
              <button
                type="button"
                onClick={() => logoutAdmin()}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Encerrar Sessão Administrativa</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
