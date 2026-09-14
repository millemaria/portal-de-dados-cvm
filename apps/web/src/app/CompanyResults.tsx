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
      return <EmptyState />;
    }

    return (
      <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
