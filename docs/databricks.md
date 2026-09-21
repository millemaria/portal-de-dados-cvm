# Databricks Setup — Portal de Dados CVM

## Visão Geral

O Databricks é responsável por toda a engenharia de dados do Lakehouse: ingestão, leitura recursiva multi-partição, normalização, deduplicação por regras de negócio e publicação analítica na camada Gold.

## Estrutura do Pipeline de Dados

```
data/
  ingestion/
    config.py                     # Configurações do Lakehouse e catálogo
    download_cvm_dfp.py           # Download dos ZIPs da CVM
  bronze/
    load_raw_dfp.py               # Carga em Bronze
  silver/
    process_silver_entities.py    # Processamento recursivo das 8 entidades Silver
    transform_companies.py        # Normalização de companhias (vw_companhia_atual)
    transform_financial_statements.py # Demonstrações limpas (BPA, BPP, DRE, DFC)
  gold/
    build_gold_layer.py           # Publicação das 8 entidades na Gold
    build_company_summary.py      # Resumo analítico com todas as empresas
    build_financial_indicators.py # Indicadores financeiros calculados
  pipeline_runner.py              # Runner ponta a ponta com relatório de validação

infra/databricks/
  create_tables.sql               # DDL Unity Catalog para Silver e Gold
```

## Regra Fundamental: 8 Entidades × Todas as Companhias

1. **`vw_companhia_atual`**: Visão cadastral com a totalidade das companhias ativas e inativas.
2. **`vw_balanco_patrimonial_latest`**: Balanço Patrimonial por conta, período e consolidação.
3. **`vw_resultado_latest`**: DRE mais recente por conta, período e consolidação.
4. **`vw_fluxo_caixa_latest`**: DFC mais recente por método, conta e período.
5. **`vw_demonstracao_financeira_latest`**: Visão integrada de todas as demonstrações financeiras.
6. **`fato_composicao_capital`**: Estrutura acionária e capital social.
7. **`fato_parecer_auditoria`**: Pareceres e auditorias independentes.
8. **`fato_documento_cvm`**: Histórico de documentos entregues à CVM.

## Estratégia de Leitura na Silver (`cvm_lakehouse/silver/*`)

- **Leitura Recursiva**: Utiliza `.option("recursiveFileLookup", "true")` para escanear todos os subdiretórios.
- **Todas as Partições**: Lê todos os arquivos `part-*.csv` (part-00000, part-00001, etc.).
- **Filtro de Metadados**: Ignora arquivos de controle como `_SUCCESS`, `_committed*`, `_started*`.
- **Deduplicação de Negócio**: Não descarta registros legítimos da mesma empresa em contas, exercícios ou documentos diferentes.

## Execução

### Ordem de Execução do Pipeline

1. `data/pipeline_runner.py` (executa todo o fluxo Silver -> Gold e emite o relatório de validação)
ou individualmente:
2. `data/silver/process_silver_entities.py` — Processamento das 8 entidades
3. `data/gold/build_gold_layer.py` — Materialização das views e tabelas Gold

### Variáveis de Ambiente (Backend)

```env
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi_your_token
DATABRICKS_WAREHOUSE_ID=your_warehouse_id
DATABRICKS_CATALOG=portal_cvm
DATABRICKS_SCHEMA=gold
```

