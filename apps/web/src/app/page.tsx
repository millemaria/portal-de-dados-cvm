import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/layout/SearchBar";
import { CompanyResults } from "./CompanyResults";
import { SkeletonCard } from "@/components/shared/LoadingSpinner";
import { TrendingUp, Sparkles } from "lucide-react";

interface HomePageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

const POPULAR_TICKERS = [
  { ticker: "PETR4", name: "Petrobras" },
  { ticker: "VALE3", name: "Vale" },
  { ticker: "ITUB4", name: "Itaú" },
  { ticker: "MGLU3", name: "Magalu" },
  { ticker: "WEGE3", name: "WEG" },
  { ticker: "ABEV3", name: "Ambev" },
  { ticker: "BBAS3", name: "Banco do Brasil" },
  { ticker: "BBDC4", name: "Bradesco" },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = parseInt(params.page ?? "1", 10);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Background ambient lighting — safe overflow containment */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-80 bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-blue-500/15 blur-3xl rounded-full" />
      </div>

      {/* Hero Section */}
      {!search && (
        <section className="flex flex-col items-center justify-center text-center py-10 sm:py-16 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide uppercase mb-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dados Oficiais • CVM & B3</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-tight text-center">
            Dados Financeiros de{" "}
            <span className="gradient-text">Companhias Abertas</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed text-center">
            Consulte demonstrações financeiras completas, balanço patrimonial, DRE,
            fluxo de caixa e múltiplos de mercado direto da CVM.
          </p>

          <div className="w-full max-w-2xl mx-auto mb-6">
            <SearchBar variant="hero" />
          </div>

          {/* Quick pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-xs text-slate-400 font-medium mr-1">Mais buscadas:</span>
            {POPULAR_TICKERS.map((t) => (
              <Link
                key={t.ticker}
                href={`/companies/${t.ticker}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-all font-mono text-xs shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title={t.name}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {t.ticker}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search mode */}
      {search && (
        <section className="mb-6">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <h2 className="text-lg sm:text-xl text-slate-300">
              Resultados para{" "}
              <span className="font-bold text-white">
                &ldquo;{search}&rdquo;
              </span>
            </h2>
            <Link
              href="/"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Limpar busca
            </Link>
          </div>
        </section>
      )}

      {/* Results */}
      {search && (
        <Suspense
          fallback={
            <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          }
        >
          <CompanyResults search={search} page={page} />
        </Suspense>
      )}

      {/* Featured companies when no search */}
      {!search && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Empresas em Destaque
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Principais companhias abertas listadas na B3 com dados da CVM
                </p>
              </div>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
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
  );
}
