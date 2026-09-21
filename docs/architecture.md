# Arquitetura — Portal de Dados CVM

## Visão Geral

O Portal de Dados CVM é uma solução para captura, tratamento e disponibilização de dados financeiros públicos de companhias abertas brasileiras, extraídos do Portal de Dados Abertos da CVM.

## Fluxo de Dados

```
CVM (dados.cvm.gov.br)
        │
        ▼
   Ingestion (download ZIPs)
        │
        ▼
   Bronze (dados brutos + metadados)
        │
        ▼
   Silver (dados limpos e normalizados)
        │
        ▼
   Gold (tabelas orientadas ao consumo)
        │
        ▼
   Databricks SQL Warehouse
        │
        ▼
   Databricks SQL API (Statement Execution)
        │
        ▼
   Backend (Fastify REST API)
        │
        ▼
   Frontend (Next.js)
```

## Componentes

### 1. Data Pipeline (Databricks Lakehouse)

- **Ingestion**: Download dos ZIPs anuais da CVM (dados.cvm.gov.br)
- **Bronze**: CSVs brutos com metadados de ingestão (`source_file`, `ingestion_date`, `reference_year`)
- **Silver (`cvm_lakehouse/silver/*`)**: Leitura recursiva de todas as partições de dados (`part-*.csv`) das **8 entidades lógicas** sem limitação de empresas:
  1. `vw_companhia_atual`
  2. `vw_balanco_patrimonial_latest`
  3. `vw_resultado_latest`
  4. `vw_fluxo_caixa_latest`
  5. `vw_demonstracao_financeira_latest`
  6. `fato_composicao_capital`
  7. `fato_parecer_auditoria`
  8. `fato_documento_cvm`
- **Gold (`cvm_lakehouse/gold/*`)**: Tabelas analíticas otimizadas com 100% das companhias (`company_summary`, `financial_indicators`) e views publicadas das 8 entidades.

### 2. Backend (Fastify + TypeScript)

- **Clean Architecture**: domain → application → infrastructure → presentation
- **Integração**: DatabricksClient → SQL Statement API → tabelas Gold
- **Busca Global**: Busca dinâmica por Nome Empresarial, Ticker, CNPJ (formatado ou numérico) e Código CVM sobre a base Gold completa
- **Mock Mode**: Repositórios mock para desenvolvimento local sem Databricks
- **Cache**: In-memory com TTL configurável


### 3. Frontend (Next.js + React)

- **SSR/SSG**: Server Components para SEO e performance
- **Design**: Dark theme com glassmorphism, Framer Motion, Recharts
- **Responsivo**: Mobile-first

## Segurança

- Tokens Databricks **apenas** no backend via variáveis de ambiente
- SQL parametrizado (nunca concatenação direta)
- Validação de entrada com Zod em todos os endpoints
- Rate limiting e CORS configurados

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | npm workspaces + Turborepo |
| Backend | Node.js, Fastify, TypeScript, Zod |
| Frontend | Next.js, React, Tailwind CSS, Framer Motion, Recharts |
| Data Pipeline | Databricks, PySpark, Delta Lake |
| Integração | Databricks SQL Statement Execution API 2.0 |
| Tipos | @portal-cvm/types (compartilhado) |
| Validação | @portal-cvm/validation (Zod schemas compartilhados) |
| Container | Docker multi-stage builds |
