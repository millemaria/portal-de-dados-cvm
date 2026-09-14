import { Suspense } from "react";
import { SearchBar } from "@/components/layout/SearchBar";
import { CompanyResults } from "./CompanyResults";
import { SkeletonCard } from "@/components/shared/LoadingSpinner";

interface HomePageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = parseInt(params.page ?? "1", 10);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      {!search && (
        <section className="text-center py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Dados Financeiros de{" "}
            <span className="gradient-text">Companhias Abertas</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8">
            Consulte demonstrações financeiras, indicadores e histórico de
            resultados de empresas listadas na B3 — direto dos dados públicos da
            CVM.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar variant="hero" />
          </div>
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            Ex: PETR4, VALE3, Magazine Luiza, Itaú
          </p>
        </section>
      )}

      {/* Search mode */}
      {search && (
        <section className="mb-6">
          <h2 className="text-lg text-[var(--color-text-secondary)] mb-4">
            Resultados para{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              &ldquo;{search}&rdquo;
            </span>
          </h2>
        </section>
      )}

      {/* Results */}
      {search && (
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
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
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          }
        >
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              Empresas em Destaque
            </h2>
            <CompanyResults search="" page={1} />
          </section>
        </Suspense>
      )}
    </div>
  );
}
