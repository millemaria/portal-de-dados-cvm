"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  UserPlus,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
} from "lucide-react";
import type { AdminUser, AdminListItem, AdminLevel } from "@portal-cvm/types";
import { canManageAdmins, getAdminLevelLabel } from "@portal-cvm/types";
import { formatCpf, normalizeCpf, validateCpf } from "@portal-cvm/validation";
import { formatShortName } from "@/lib/formatters";
import {
  getStoredAdminUser,
  registerAdmin,
  getAdminsList,
} from "@/lib/authClient";


const ADMIN_LEVEL_OPTIONS: {
  level: AdminLevel;
  title: string;
  badge: string;
  description: string;
  badgeClasses: string;
}[] = [
  {
    level: "ADMIN_MASTER",
    title: "Administrador Master",
    badge: "Master",
    description:
      "Acesso irrestrito ao sistema: pré-cadastro e gestão de administradores, auditoria e consultas financeiras completas.",
    badgeClasses: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  },
  {
    level: "ADMIN_GESTOR",
    title: "Gestor CVM",
    badge: "Gestor",
    description:
      "Acesso gerencial: consultas completas a companhias, demonstrações contábeis e indicadores avançados. Sem gestão de usuários.",
    badgeClasses: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  },
  {
    level: "ADMIN_ANALISTA",
    title: "Analista CVM",
    badge: "Analista",
    description:
      "Acesso operacional: consulta a dados públicos de companhias abertas, balanços patrimoniais e demonstrativos de resultados.",
    badgeClasses: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  },
];

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");

  // Form State
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState<AdminLevel>("ADMIN_GESTOR");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form Validation & Feedback
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredAdminUser();
    setCurrentUser(user);
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoadingList(true);
    try {
      const list = await getAdminsList();
      setAdmins(list);
    } catch {
      // Ignora erro silencioso se for permissão ou lista inicial
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
    if (cpfError) setCpfError(null);
    if (formError) setFormError(null);
  };

  const handleCpfBlur = () => {
    if (!cpf) return;
    const normalized = normalizeCpf(cpf);
    if (normalized.length > 0 && !validateCpf(normalized)) {
      setCpfError("CPF inválido. Verifique os dígitos digitados.");
    } else {
      setCpfError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const normalizedCpf = normalizeCpf(cpf);

    if (!name.trim()) {
      setFormError("O nome completo é obrigatório.");
      return;
    }

    if (name.trim().length < 3) {
      setFormError("O nome deve ter no mínimo 3 caracteres.");
      return;
    }

    if (!normalizedCpf) {
      setCpfError("O CPF é obrigatório.");
      return;
    }

    if (!validateCpf(normalizedCpf)) {
      setCpfError("CPF inválido. Verifique os dígitos informados.");
      return;
    }

    if (!password) {
      setFormError("A senha temporária é obrigatória.");
      return;
    }

    if (password.length < 6) {
      setFormError("A senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerAdmin({
        name: name.trim(),
        cpf: normalizedCpf,
        password,
        level,
        email: email.trim() || undefined,
      });

      setFormSuccess(
        `Usuário "${result.user.name}" pré-cadastrado com sucesso no nível ${getAdminLevelLabel(
          result.user.level
        )}!`
      );

      // Limpa formulário
      setName("");
      setCpf("");
      setPassword("");
      setEmail("");
      setLevel("ADMIN_GESTOR");

      // Recarrega lista
      await loadAdmins();
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Ocorreu um erro ao salvar o pré-cadastro.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMaster = canManageAdmins(currentUser?.level);

  // Filtragem da lista
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.cpf.includes(normalizeCpf(searchTerm));
    const matchesLevel =
      levelFilter === "ALL" || admin.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getBadgeStyle = (lvl: string) => {
    switch (lvl) {
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
    <div className="page-container w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gestão de Administradores
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Pré-cadastro de credenciais administrativas e controle de níveis de
            acesso no Portal CVM.
          </p>
        </div>

        {/* Informações do Administrador Atual */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">
              {formatShortName(currentUser?.name)}
            </div>
            <div className="text-[11px] text-slate-400">
              Nível Atual:{" "}
              <span className="text-cyan-300 font-medium">
                {getAdminLevelLabel(currentUser?.level)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Aviso se o usuário não for ADMIN_MASTER */}
      {!isMaster && currentUser && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Acesso Somente Leitura</div>
            <div className="text-amber-300/80 mt-0.5">
              Seu perfil ({getAdminLevelLabel(currentUser.level)}) permite a
              visualização dos administradores cadastrados, mas o pré-cadastro
              de novos usuários é exclusivo para o perfil{" "}
              <strong>Administrador Master</strong>.
            </div>
          </div>
        </div>
      )}

      {/* Grid Principal: Formulário + Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seção 1: Formulário de Pré-Cadastro (Disponível apenas para Master) */}
        {isMaster && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6"
          >
            <div className="border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <UserPlus className="w-4 h-4" />
                <span>Pré-cadastrar Novo Administrador</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Cadastre o CPF, senha e permissões do novo usuário para que ele
                possa efetuar login no sistema.
              </p>
            </div>

            {/* Alerta de Erro */}
            {formError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{formError}</span>
              </motion.div>
            )}

            {/* Alerta de Sucesso */}
            {formSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{formSuccess}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Nome Completo */}
              <div>
                <label
                  htmlFor="admin-name"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Nome Completo <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="admin-name"
                  type="text"
                  placeholder="Ex: Dra. Ana Beatriz Silva"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-400 text-white placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50"
                />
              </div>

              {/* CPF */}
              <div>
                <label
                  htmlFor="admin-cpf"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  CPF <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="admin-cpf"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  onBlur={handleCpfBlur}
                  maxLength={14}
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-white placeholder-slate-500 text-sm font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50 ${
                    cpfError
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/50"
                      : "border-slate-800 hover:border-slate-700 focus:border-cyan-400"
                  }`}
                />
                {cpfError && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {cpfError}
                  </p>
                )}
              </div>

              {/* E-mail (Opcional) */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  E-mail Institucional{" "}
                  <span className="text-slate-500 font-normal">
                    (opcional)
                  </span>
                </label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="exemplo@cvm.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-400 text-white placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50"
                />
              </div>

              {/* Senha */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Senha de Acesso <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-400 text-white placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                    disabled={isSubmitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nível de Administrador (Seleção Interativa) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Nível de Administrador <span className="text-cyan-400">*</span>
                </label>
                <div className="space-y-2">
                  {ADMIN_LEVEL_OPTIONS.map((opt) => {
                    const isSelected = level === opt.level;
                    return (
                      <div
                        key={opt.level}
                        onClick={() => setLevel(opt.level)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-400/40"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isSelected
                                  ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                                  : "bg-slate-700"
                              }`}
                            />
                            <span className="text-xs font-bold text-white">
                              {opt.title}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${opt.badgeClasses}`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 pl-4 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botão Salvar Pré-Cadastro */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Salvando no banco SQLite...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>Concluir Pré-cadastro</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* Seção 2: Lista de Administradores */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`${
            isMaster ? "lg:col-span-7" : "lg:col-span-12"
          } bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5`}
        >
          {/* Topo da Lista com Contadores e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">
                  Administradores Cadastrados
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                  {admins.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Usuários ativos com permissão de acesso ao Portal CVM
              </p>
            </div>

            {/* Filtro por Nível */}
            <div className="flex items-center gap-1.5">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">Todos os Níveis</option>
                <option value="ADMIN_MASTER">Master</option>
                <option value="ADMIN_GESTOR">Gestor</option>
                <option value="ADMIN_ANALISTA">Analista</option>
              </select>
            </div>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Tabela de Administradores */}
          {isLoadingList ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              <span className="text-xs font-mono">
                Consultando banco SQLite...
              </span>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhum administrador encontrado para os filtros informados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Administrador</th>
                    <th className="py-2.5 px-3">CPF</th>
                    <th className="py-2.5 px-3">Nível</th>
                    <th className="py-2.5 px-3">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">
                          {admin.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {admin.email || "Sem e-mail"}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {formatCpf(admin.cpf)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${getBadgeStyle(
                            admin.level
                          )}`}
                        >
                          {getAdminLevelLabel(admin.level).replace(
                            "Administrador ",
                            ""
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>
                            {new Date(admin.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé Informativo */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Persistência: SQLite Nativo</span>
            <span>Senhas: scrypt + Salt</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
