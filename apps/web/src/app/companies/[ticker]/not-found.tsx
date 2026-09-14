import Link from "next/link";
import { SearchX } from "lucide-react";

export default function CompanyNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="glass-card p-12 text-center max-w-md mx-auto">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-hover)]">
          <SearchX className="h-7 w-7 text-[var(--color-text-muted)]" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">
          Empresa não encontrada
        </h2>
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          O ticker informado não foi encontrado na base de dados da CVM.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
