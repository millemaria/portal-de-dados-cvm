"use client";

import { ErrorMessage } from "@/components/shared/ErrorMessage";

export default function CompanyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-10 sm:py-16">
      <ErrorMessage
        title="Erro ao carregar empresa"
        message={error.message || "Não foi possível carregar os dados desta empresa."}
        onRetry={reset}
      />
    </div>
  );
}
