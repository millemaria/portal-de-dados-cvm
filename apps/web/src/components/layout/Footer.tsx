export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/70 mt-auto w-full py-8">
      <div className="page-container w-full max-w-[1440px] mx-auto px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between text-center sm:text-left">
          <div className="text-xs sm:text-sm text-slate-400 font-medium">
            <p>
              Dados públicos extraídos diretamente do{" "}
              <a
                href="https://dados.cvm.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold underline underline-offset-4"
              >
                Portal de Dados Abertos da CVM
              </a>
            </p>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
            <p>
              Projeto open source para fins educacionais e de pesquisa financeira.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
