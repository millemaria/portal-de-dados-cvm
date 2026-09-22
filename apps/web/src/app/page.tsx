import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/layout/SearchBar";
import { CompanyResults } from "./CompanyResults";
import { SkeletonCard } from "@/components/shared/LoadingSpinner";
import { TrendingUp } from "lucide-react";

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
        {/* Hero Section */}
        {!search && (
          <section className="flex flex-col items-center justify-center text-center py-6 sm:py-10 max-w-3xl mx-auto w-full mb-12 sm:mb-16">
            {/* Institutional Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono mb-5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Base Regulamentar • CVM & B3</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight text-center">
              Dados Financeiros de Companhias Abertas
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed text-center px-2">
              Demonstrações financeiras padronizadas (DFP/ITR), balanços patrimoniais, DRE,
              fluxos de caixa e indicadores de mercado auditados pela CVM.
            </p>

            {/* SearchBar Container */}
            <div className="w-full max-w-xl mx-auto mb-6 px-1">
              <SearchBar variant="hero" />
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto px-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mr-1">
                Tickers frequentes:
              </span>
              {POPULAR_TICKERS.map((t) => (
                <Link
                  key={t.ticker}
                  href={`/companies/${t.ticker}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 hover:border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors font-mono text-xs cursor-pointer"
                  title={t.name}
                >
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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
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
