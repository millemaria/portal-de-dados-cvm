import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/layout/SearchBar";
import { CompanyResults } from "./CompanyResults";
import { SkeletonCard } from "@/components/shared/LoadingSpinner";
import { TrendingUp, Sparkles, Flame } from "lucide-react";

interface HomePageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

const POPULAR_TICKERS = [
  { ticker: "PETR4", name: "Petrobras" },
  { ticker: "VALE3", name: "Vale" },
  { ticker: "ITUB4", name: "Itaú" },
  { ticker: "BBAS3", name: "Banco do Brasil" },
  { ticker: "BBDC4", name: "Bradesco" },
  { ticker: "WEGE3", name: "WEG" },
  { ticker: "ABEV3", name: "Ambev" },
  { ticker: "CPFE3", name: "CPFL Energia" },
  { ticker: "RAIL3", name: "Rumo" },
  { ticker: "ELET3", name: "Eletrobras" },
  { ticker: "SUZB3", name: "Suzano" },
  { ticker: "MGLU3", name: "Magalu" },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = parseInt(params.page ?? "1", 10);

  return (
    <div className="w-full">
      {/* Centered page container */}
      <div className="page-container relative w-full max-w-[1440px] mx-auto px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/15 blur-3xl rounded-full pointer-events-none -z-10 opacity-70" />

        {/* Hero Section */}
        {!search && (
          <section className="flex flex-col items-center justify-center text-center py-6 sm:py-12 max-w-3xl mx-auto w-full mb-16 sm:mb-20">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide uppercase mb-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dados Oficiais • CVM & B3</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-5 leading-tight text-center">
              Dados Financeiros de{" "}
              <span className="gradient-text">Companhias Abertas</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed text-center px-2">
              Consulte demonstrações financeiras completas, balanço patrimonial, DRE,
              fluxo de caixa e múltiplos de mercado direto da CVM.
            </p>

            {/* SearchBar Container */}
            <div className="w-full max-w-xl mx-auto mb-6 px-1">
              <SearchBar variant="hero" />
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-2xl mx-auto px-2">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-semibold mr-1">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mais buscadas:</span>
              </div>
              {POPULAR_TICKERS.map((t) => (
                <Link
                  key={t.ticker}
                  href={`/companies/${t.ticker}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-all font-mono text-xs shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                  title={t.name}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                  {t.ticker}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search Mode Header */}
        {search && (
          <section className="mb-8 w-full">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <h2 className="text-lg sm:text-2xl text-slate-300 font-medium">
                Resultados para{" "}
                <span className="font-bold text-white gradient-text">
                  &ldquo;{search}&rdquo;
                </span>
              </h2>
              <Link
                href="/"
                className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40"
              >
                Limpar busca
              </Link>
            </div>
          </section>
        )}

        {/* Search Results */}
        {search && (
          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            }
          >
            <CompanyResults search={search} page={page} />
          </Suspense>
        )}

        {/* Featured Companies Section */}
        {!search && (
          <section className="w-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Empresas em Destaque
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                    Principais companhias abertas listadas na B3 com dados da CVM
                  </p>
                </div>
              </div>
            </div>

            <Suspense
              fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              }
            >
              <CompanyResults search="" page={1} />
            </Suspense>
          </section>
        )}
      </div>
    </div>
  );
}
