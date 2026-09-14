# Databricks Setup — Portal de Dados CVM

## Visão Geral

O Databricks é responsável por toda a engenharia de dados: ingestão, processamento, transformação, qualidade e armazenamento analítico.

## Estrutura

```
data/
  ingestion/
    config.py           # Configurações de fonte e paths
    download_cvm_dfp.py # Download dos ZIPs da CVM
  bronze/
    load_raw_dfp.py     # Carga dos CSVs raw em Delta tables
  silver/
    transform_companies.py              # Normalização de empresas
    transform_financial_statements.py   # Limpeza das demonstrações
  gold/
    build_company_summary.py      # Visão consolidada por empresa
    build_financial_indicators.py # Indicadores calculados

infra/databricks/
    create_tables.sql   # DDL para catalog e tabelas
```

## Execução

### Ordem dos Notebooks

1. `ingestion/download_cvm_dfp.py` — Download dos ZIPs
2. `bronze/load_raw_dfp.py` — Carga em Bronze
3. `silver/transform_companies.py` — Empresas normalizadas
4. `silver/transform_financial_statements.py` — Demonstrações limpas
5. `gold/build_company_summary.py` — Company Summary
6. `gold/build_financial_indicators.py` — Indicadores

### Configuração do Workspace

1. Criar catalog `portal_cvm` (Unity Catalog)
2. Criar schemas: `bronze`, `silver`, `gold`
3. Configurar SQL Warehouse
4. Gerar Personal Access Token para a API

### Variáveis de Ambiente (Backend)

```env
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi_your_token
DATABRICKS_WAREHOUSE_ID=your_warehouse_id
DATABRICKS_CATALOG=portal_cvm
DATABRICKS_SCHEMA=gold
```

## SQL Warehouse → API

A API se comunica via **Databricks SQL Statement Execution API 2.0**:

```
POST /api/2.0/sql/statements
Authorization: Bearer <token>
```

O `DatabricksClient` no backend encapsula esta chamada.
