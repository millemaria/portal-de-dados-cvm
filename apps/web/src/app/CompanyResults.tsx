import { getCompanies } from "@/lib/api";
import { CompanyCard } from "@/components/company/CompanyCard";
import { EmptyState } from "@/components/shared/EmptyState";

interface CompanyResultsProps {
  search: string;
  page: number;
}

export async function CompanyResults({ search, page }: CompanyResultsProps) {
  try {
    const result = await getCompanies(search || undefined, page, 20);
    const companies = result.data;

    if (companies.length === 0) {
      return (
        <EmptyState
          title="Nenhuma empresa encontrada"
          message={
            search
              ? `Não encontramos resultados para "${search}". Tente buscar por PETR4, VALE3, ITUB4 ou outro código.`
              : "Nenhuma empresa cadastrada no momento."
          }
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {companies.map((company, i) => (
          <CompanyCard key={company.cdCvm} company={company} index={i} />
        ))}
      </div>
    );
  } catch {
    return (
      <EmptyState
        title="Erro ao carregar empresas"
        message="Verifique se a API está rodando em http://localhost:3001"
      />
    );
  }
}
