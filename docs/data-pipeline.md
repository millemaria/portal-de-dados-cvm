# Pipeline de Dados PySpark — Arquitetura Medalhão (Bronze → Silver → Gold)
## Portal CVM Self-Service

Este documento descreve a arquitetura, o fluxo de processamento e os contratos de dados do pipeline PySpark que alimenta o MVP do **Portal CVM Self-Service**, utilizando como origem oficial o **Data Lake existente no Databricks Unity Catalog**.

---

## 1. Visão Geral da Arquitetura

O pipeline segue rigorosamente o padrão **Medallion Architecture (Bronze → Silver → Gold)**:

```text
Databricks Data Lake (Unity Catalog: cvm_lakehouse)
Volume: /Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/
                       │
                       ▼
                    BRONZE
         (Leitura bruta, schema explícito,
         metadados: _ingestion_timestamp,
         _source_path, _source_file)
                       │
                       ▼
                    SILVER
         (Limpeza, tipagem estrita, CNPJ 14d,
         código CVM 6d, normalização monetária R$,
         deduplicação e regras determinísticas de latest)
                       │
                       ▼
                     GOLD
         (Estruturas analíticas orientadas aos 3 eixos:
         Empresas, Consulta Financeira, Documentos)
                       │
                       ▼
         Databricks SQL Warehouse (Endpoint)
                       │
                       ▼
               Backend (Fastify REST API)
                       │
                       ▼
             Frontend (Next.js Self-Service)
```

---

## 2. Origem Oficial no Databricks

* **Catálogo Unity Catalog**: `cvm_lakehouse`
* **Schemas**:
  * `ops`: Tabelas de controle operacional, manifesto de ingestão e volume de armazenamento.
  * `bronze`: Tabelas Delta de dados brutos com metadados de ingestão.
  * `silver`: Tabelas Delta canônicas, limpas e tipadas.
  * `gold`: Tabelas analíticas finais otimizadas para consulta direta pelo Portal.
* **Volume de Origem dos Arquivos**: `/Volumes/cvm_lakehouse/ops/cvm_source_files/`
* **Diretório Base dos CSVs**: `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/`
* **Formato Físico**: Diretórios individuais para cada entidade, contendo arquivos particionados `part-*.csv`.
* **Arquivos Ignorados na Leitura**: `_SUCCESS`, `_committed_*`, `_started_*` (filtrados via `pathGlobFilter="*.csv"`).
* **Codificação & Separador**: UTF-8, delimitador vírgula (`,`), com linha de cabeçalho.

---

## 3. Matriz de Mapeamento das 8 Entidades

Abaixo está o mapeamento detalhado entre as entidades lógicas do Portal, as origens reais no Databricks, as transformações por camada e as chaves de relacionamento:

| Entidade Lógica | Origem Real no Databricks | Camada Bronze | Camada Silver | Camada Gold | Chaves de Relacionamento & Regras |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`vw_companhia_atual`** | `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/vw_companhia_atual/` (`part-00000-*.csv`) | `cvm_lakehouse.bronze.raw_vw_companhia_atual` (todos os campos string + metadados) | `cvm_lakehouse.silver.silver_vw_companhia_atual` (CNPJ 14 dígitos, Código CVM enriquecido via `fato_documento_cvm`, situação padronizada) | `cvm_lakehouse.gold.vw_companhia_atual` (Campos: `cnpj`, `codigo_cvm`, `nome_empresa`, `situacao_companhia`, `segmento_mercado`, `data_registro`) | **Chave Primária**: `cnpj` (14 dígitos). **Chave Secundária**: `codigo_cvm`. Deduplicação por `exercicio_ano DESC`, `data_registro DESC`. |
| **`vw_balanco_patrimonial_latest`** | `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/vw_balanco_patrimonial_latest/` (`part-00000` a `part-00003-*.csv`) | `cvm_lakehouse.bronze.raw_vw_balanco_patrimonial_latest` | `cvm_lakehouse.silver.silver_vw_balanco_patrimonial_latest` (Classificação Ativo/Passivo/PL, `nivel_conta`, `valor_normalizado` em R$) | `cvm_lakehouse.gold.vw_balanco_patrimonial_latest` (Filtro direto para BPA/BPP, hierarquia contábil, valores normalizados) | **Chave Lógica**: `cnpj` + `data_referencia` + `tipo_demonstracao` + `consolidado_individual` + `codigo_conta`. **Regra Latest**: `ordem_exerc = 'ÚLTIMO'` e `MAX(versao)`. |
| **`vw_resultado_latest`** | `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/vw_resultado_latest/` (`part-00000-*.csv`) | `cvm_lakehouse.bronze.raw_vw_resultado_latest` | `cvm_lakehouse.silver.silver_vw_resultado_latest` (Classificação estrutural `grupo_dre`: Receita Líquida, Custo, Despesas, Lucro/Prejuízo) | `cvm_lakehouse.gold.vw_resultado_latest` (DRE pronta para visualização tabular com escala e R$) | **Chave Lógica**: `cnpj` + `data_referencia` + `codigo_conta`. **Regra Latest**: `ordem_exerc = 'ÚLTIMO'` e `MAX(versao)`. |
| **`vw_fluxo_caixa_latest`** | `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/vw_fluxo_caixa_latest/` (`part-00000-*.csv`) | `cvm_lakehouse.bronze.raw_vw_fluxo_caixa_latest` | `cvm_lakehouse.silver.silver_vw_fluxo_caixa_latest` (Classificação `metodo_dfc`: Direto ou Indireto, `valor_normalizado`) | `cvm_lakehouse.gold.vw_fluxo_caixa_latest` (DFC pronta para visualização das contas operacionais, de investimento e financiamento) | **Chave Lógica**: `cnpj` + `data_referencia` + `metodo_dfc` + `codigo_conta`. **Regra Latest**: `ordem_exerc = 'ÚLTIMO'` e `MAX(versao)`. |
| **`vw_demonstracao_financeira_latest`** | `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/vw_demonstracao_financeira_latest/` (`part-00000` a `part-00003-*.csv`) | `cvm_lakehouse.bronze.raw_vw_demonstracao_financeira_latest` | `cvm_lakehouse.silver.silver_vw_demonstracao_financeira_latest` (Superset com DMPL, DRA, DVA, etc.) | `cvm_lakehouse.gold.vw_demonstracao_financeira_latest` (Consulta aberta para demonstrações complementares) | **Chave Lógica**: `cnpj` + `data_referencia` + `tipo_demonstracao` + `codigo_conta` + `coluna_demonstracao`. |
| **`fato_composicao_capital`** | `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/fato_composicao_capital/` (`part-00000-*.csv`) | `cvm_lakehouse.bronze.raw_fato_composicao_capital` | `cvm_lakehouse.silver.silver_fato_composicao_capital` (Tipagem de quantidades acionárias em `DECIMAL(20,0)`) | `cvm_lakehouse.gold.fato_composicao_capital` (Ações ordinárias, preferenciais, totais integralizadas e em tesouraria) | **Chave**: `cnpj` + `data_referencia` + `versao`. Versão mais recente selecionada deterministamente. |
| **`fato_parecer_auditoria`** | `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/fato_parecer_auditoria/` (`part-00000-*.csv`) | `cvm_lakehouse.bronze.raw_fato_parecer_auditoria` | `cvm_lakehouse.silver.silver_fato_parecer_auditoria` (Preserva todas as versões, relatórios e pareceres de auditores) | `cvm_lakehouse.gold.fato_parecer_auditoria` (Histórico de auditoria independente e declarações de diretores) | **Chave**: `cnpj` + `data_referencia` + `versao` + `tipo_parecer` + `item_declaracao`. Todas as versões são preservadas. |
| **`fato_documento_cvm`** | `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports/fato_documento_cvm/` (`part-00000-*.csv`) | `cvm_lakehouse.bronze.raw_fato_documento_cvm` | `cvm_lakehouse.silver.silver_fato_documento_cvm` (Histórico completo de entregas documentais, padronização de datas) | `cvm_lakehouse.gold.fato_documento_cvm` (Entregas e versões de documentos por companhia e exercício) | **Chave**: `cnpj` + `codigo_cvm` + `data_referencia` + `versao` + `tipo_documento`. Todo o histórico documental é mantido. |

---

## 4. Camadas da Arquitetura Medalhão

### 4.1 Camada Bronze
* **Objetivo**: Ingestão fiel dos dados brutos existentes nos diretórios de exportação CSV do Data Lake.
* **Preservação de Dados**: Todos os campos da origem são lidos conforme seus tipos brutos usando schemas explícitos (`StructType`), sem transformações destrutivas.
* **Metadados Adicionados**:
  * `_ingestion_timestamp`: Momento exato da leitura.
  * `_source_path`: Caminho físico no volume Databricks.
  * `_source_file_read`: Nome do arquivo particionado lido.
* **Funções de Leitura**: Cada entidade possui sua função dedicada (`read_vw_companhia_atual()`, `read_vw_balanco_patrimonial_latest()`, etc.).

### 4.2 Camada Silver
* **Objetivo**: Limpeza, padronização, tipagem rigorosa, resolução de chaves e governança de qualidade.
* **Tratamento de Identificadores**:
  * CNPJ: Limpeza de pontuações e padding fixo para 14 dígitos numéricos.
  * Código CVM: Padding fixo para 6 dígitos numéricos.
  * Em `vw_companhia_atual`, o Código CVM é enriquecido a partir do cruzamento com `fato_documento_cvm`, permitindo que o frontend filtre tanto por CNPJ quanto por Código CVM.
* **Tratamento Monetário e Escalas**:
  * `valor_original`: Valor numérico original na escala informada pela companhia (`DECIMAL(18, 2)`).
  * `escala_original`: Escala original (`MIL`, `UNIDADE`, `MILHOES`).
  * `fator_escala`: Fator de multiplicação (`MIL` → 1000.0, `UNIDADE` → 1.0, `MILHOES` → 1000000.0).
  * `valor_normalizado`: `valor_original * fator_escala` em unidades de Real (`R$`), garantindo precisão decimal e evitando perdas de ponto flutuante.
* **Regra Determinística de `latest`**:
  * Para entidades de demonstrações com sufixo `_latest`, aplica-se janela particionada pela chave de negócio (`cnpj_cia`, `dt_refer`, `tipo_demonstracao`, `ind_individual_consolidado`, `cd_conta`) e ordenação determinística por `versao DESC`, `_ingestion_timestamp DESC`, filtrando a primeira linha (`rn == 1`) e assegurando `ordem_exerc = 'ÚLTIMO'`.
  * Para `vw_companhia_atual`, a janela particiona por `cnpj_cia` ordenada por `exercicio_ano DESC`, `data_registro DESC`, mantendo a situação mais atualizada.
* **Preservação Histórica**:
  * As tabelas `fato_documento_cvm` e `fato_parecer_auditoria` **não** descartam versões anteriores, permitindo que a aplicação consulte todo o histórico de entregas e revisões.

### 4.3 Camada Gold
* **Objetivo**: Disponibilizar estruturas tabulares prontas para os 3 eixos de consulta do Portal CVM Self-Service:
  1. **Eixo Empresas**: Busca de companhias por CNPJ, Código CVM e Nome Empresarial com paginação rápida (`gold.vw_companhia_atual`).
  2. **Eixo Consulta Financeira**: Consulta tabular de contas contábeis por exercício, consolidado/individual, com escala e valores em R$ (`gold.vw_balanco_patrimonial_latest`, `gold.vw_resultado_latest`, `gold.vw_fluxo_caixa_latest`, `gold.vw_demonstracao_financeira_latest`).
  3. **Eixo Documentos**: Histórico de documentos entregues, pareceres de auditoria e composição acionária (`gold.fato_documento_cvm`, `gold.fato_parecer_auditoria`, `gold.fato_composicao_capital`).

---

## 5. Como Executar o Pipeline

O código completo e executável está localizado em:
[`data/pipeline_medallion.py`](file:///c:/Users/jamille.barbosa/Documents/GitHub/portal-de-dados-cvm/data/pipeline_medallion.py)

### 5.1 Execução no Databricks (Notebook ou Job Spark)
Basta importar o módulo ou executar o script diretamente no Databricks:
```python
from data.pipeline_medallion import run_portal_cvm_medallion_pipeline

# Execução end-to-end com persistência nas tabelas Delta gerenciadas
resultado = run_portal_cvm_medallion_pipeline()
print("Resultado:", resultado["status"])
```

### 5.2 Execução Individual de Entidade
Cada entidade pode ser executada isoladamente caso haja necessidade de reprocessamento seletivo:
```python
from data.pipeline_medallion import (
    get_or_create_spark,
    process_vw_companhia_atual,
    process_vw_balanco_patrimonial_latest,
)

spark = get_or_create_spark()
bronze, silver, gold = process_vw_balanco_patrimonial_latest(spark)
```

### 5.3 Parâmetros de Configuração via Variáveis de Ambiente
* `DATABRICKS_CATALOG`: Catálogo de dados (default: `cvm_lakehouse`).
* `DATABRICKS_BRONZE_SCHEMA`: Schema Bronze (default: `bronze`).
* `DATABRICKS_SILVER_SCHEMA`: Schema Silver (default: `silver`).
* `DATABRICKS_GOLD_SCHEMA`: Schema Gold (default: `gold`).
* `CVM_CSV_BASE_PATH`: Caminho base dos diretórios CSV (default: `/Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports`).
