export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/50 mt-auto">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col items-center gap-3 sm:gap-4 sm:flex-row sm:justify-between text-center sm:text-left">
          <div className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            <p>
              Dados públicos extraídos do{" "}
              <a
                href="https://dados.cvm.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors underline underline-offset-2"
              >
                Portal de Dados Abertos da CVM
              </a>
            </p>
          </div>
          <div className="text-[11px] sm:text-xs text-[var(--color-text-muted)]">
            <p>
              Este portal não constitui recomendação de investimento.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
