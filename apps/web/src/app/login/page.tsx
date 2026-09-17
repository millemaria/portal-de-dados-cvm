"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  UserCheck,
} from "lucide-react";
import { formatCpf, normalizeCpf, validateCpf } from "@portal-cvm/validation";
import { loginAdmin } from "@/lib/authClient";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [cpfError, setCpfError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Manipulação de digitação do CPF com formatação amigável
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCpf(rawValue);
    setCpf(formatted);

    // Limpa erro anterior ao digitar
    if (cpfError) setCpfError(null);
    if (serverError) setServerError(null);
  };

  // Validação ao perder o foco do campo de CPF
  const handleCpfBlur = () => {
    if (!cpf) return;
    const normalized = normalizeCpf(cpf);
    if (normalized.length > 0 && !validateCpf(normalized)) {
      setCpfError("CPF inválido. Verifique os números digitados.");
    } else {
      setCpfError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const normalizedCpf = normalizeCpf(cpf);

    // Validação no frontend antes do envio
    if (!normalizedCpf) {
      setCpfError("Por favor, informe o CPF.");
      return;
    }

    if (!validateCpf(normalizedCpf)) {
      setCpfError("CPF inválido. Verifique os números digitados.");
      return;
    }

    if (!password) {
      setServerError("Por favor, informe sua senha administrativa.");
      return;
    }

    if (password.length < 6) {
      setServerError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      await loginAdmin(normalizedCpf, password);
      setIsSubmitting(false);
      setIsSuccess(true);

      // Redireciona para o destino ou dashboard inicial
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 700);
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Erro inesperado ao realizar o login. Tente novamente.");
      }
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-2xl shadow-2xl p-6 sm:p-10 relative overflow-hidden">
      {/* Brilho sutil no topo do card */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

      {/* Cabeçalho */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Logo Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 mb-4 ring-1 ring-cyan-400/30">
          <Activity className="w-7 h-7 text-slate-950 stroke-[2.5]" />
        </div>

        {/* Título do Sistema */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
          Portal de Dados <span className="gradient-text">CVM</span>
        </h1>

        {/* Badge de Acesso Administrativo */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.15)]">
          <Shield className="w-3.5 h-3.5" />
          <span>Acesso Administrativo</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-xs">
          Autenticação obrigatória para consulta de dados financeiros e companhias
          abertas.
        </p>
      </div>

      {/* Mensagem de Erro Geral */}
      {serverError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-snug">{serverError}</div>
        </motion.div>
      )}

      {/* Mensagem de Sucesso */}
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5"
          role="status"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Acesso autorizado com sucesso! Redirecionando...</span>
        </motion.div>
      )}

      {/* Formulário de Login */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Campo CPF */}
        <div>
          <label
            htmlFor="cpf"
            className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5"
          >
            CPF
          </label>
          <div className="relative">
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              onBlur={handleCpfBlur}
              disabled={isSubmitting || isSuccess}
              aria-invalid={!!cpfError}
              aria-describedby={cpfError ? "cpf-error" : undefined}
              maxLength={14}
              className={`w-full px-4 py-3 rounded-xl bg-slate-950/80 border text-white placeholder-slate-500 text-sm font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                cpfError
                  ? "border-rose-500/80 focus:border-rose-500"
                  : "border-slate-800 hover:border-slate-700 focus:border-cyan-400"
              }`}
            />
          </div>
          {cpfError && (
            <p
              id="cpf-error"
              className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {cpfError}
            </p>
          )}
        </div>

        {/* Campo Senha */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-semibold text-slate-300"
            >
              Senha
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (serverError) setServerError(null);
              }}
              disabled={isSubmitting || isSuccess}
              className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-400 text-white placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
              disabled={isSubmitting || isSuccess}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-lg disabled:opacity-40"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Botão Entrar */}
        <button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Validando credenciais...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Acesso liberado</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Entrar</span>
            </>
          )}
        </button>
      </form>

      {/* Dica de Credenciais para Testes de Homologação */}
      <div className="mt-8 pt-5 border-t border-slate-800/80 text-center">
        <details className="group text-left cursor-pointer">
          <summary className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-1.5 list-none font-medium">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Credenciais de Demonstração</span>
          </summary>
          <div className="mt-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/70 text-[11px] text-slate-400 space-y-1 font-mono">
            <div className="text-cyan-300 font-sans font-semibold mb-1">
              Administrador:
            </div>
            <div>CPF: 111.444.777-35 (ou 11144477735)</div>
            <div>Senha: Admin@123456</div>
            <div className="text-slate-500 text-[10px] mt-1 pt-1 border-t border-slate-800">
              Perfil não-admin (para teste de bloqueio): 222.555.888-46 / User@123456
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] w-full flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Luz ambiente de fundo (consistente com o Hero do portal) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-80 bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-purple-600/20 blur-3xl rounded-full pointer-events-none -z-10 opacity-75" />

      {/* Card Principal de Login */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Suspense
          fallback={
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
