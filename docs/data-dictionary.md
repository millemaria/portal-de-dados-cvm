# Dicionário de Dados — Portal de Dados CVM

## Fonte: CVM DFP (Demonstrações Financeiras Padronizadas)

URL: `https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/`

### Colunas do CSV Original

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| CNPJ_CIA | STRING | CNPJ da companhia |
| DT_REFER | DATE | Data de referência |
| VERSAO | INT | Versão do documento |
| DENOM_CIA | STRING | Nome empresarial |
| CD_CVM | STRING | Código CVM |
| GRUPO_DFP | STRING | Consolidado (CON) ou Individual (IND) |
| MOEDA | STRING | Moeda |
| ESCALA_MOEDA | STRING | Escala (MIL, UNIDADE) |
| ORDEM_EXERC | STRING | ÚLTIMO ou PENÚLTIMO |
| DT_INI_EXERC | DATE | Início do exercício |
| DT_FIM_EXERC | DATE | Fim do exercício |
| CD_CONTA | STRING | Código da conta contábil |
| DS_CONTA | STRING | Descrição da conta |
| VL_CONTA | DOUBLE | Valor monetário |

### Tipos de Demonstração

| Sigla | Descrição |
|-------|-----------|
| BPA | Balanço Patrimonial Ativo |
| BPP | Balanço Patrimonial Passivo |
| DRE | Demonstração de Resultado |
| DFC-MI | Fluxo de Caixa — Método Indireto |
| DFC-MD | Fluxo de Caixa — Método Direto |
| DMPL | Mutações do Patrimônio Líquido |
| DVA | Demonstração de Valor Adicionado |
| DRA | Resultado Abrangente |

---

## Camadas de Dados

### Bronze

Dados brutos com metadados de ingestão adicionados.

| Coluna adicional | Descrição |
|------------------|-----------|
| source_file | Nome do arquivo CSV original |
| ingestion_date | Data/hora da ingestão |
| reference_year | Ano de referência |
| document_type | Tipo do documento (BPA, BPP, etc.) |

### Silver

Dados limpos, tipados e normalizados.

**silver.companies**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| cd_cvm | STRING | Código CVM |
| cnpj | STRING | CNPJ |
| company_name | STRING | Nome da empresa |
| reference_date | DATE | Data de referência |
| status | STRING | ATIVO/INATIVO |
| ticker | STRING | Ticker (enriquecido) |

**silver.balance_sheet / income_statement / cash_flow**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| cd_cvm | STRING | Código CVM |
| reference_date | DATE | Data de referência |
| consolidation_type | STRING | CON/IND |
| account_code | STRING | Código da conta |
| account_description | STRING | Descrição da conta |
| value | DOUBLE | Valor monetário |
| currency_scale | STRING | Escala da moeda |
| level | INT | Nível hierárquico |

### Gold

Tabelas orientadas ao consumo da API.

**gold.company_summary**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| cd_cvm | STRING | Código CVM |
| cnpj | STRING | CNPJ |
| company_name | STRING | Nome |
| ticker | STRING | Ticker |
| sector | STRING | Setor |
| status | STRING | Status |
| latest_reference_date | DATE | Última data |
| total_assets | DOUBLE | Ativo total |
| total_equity | DOUBLE | Patrimônio líquido |
| net_revenue | DOUBLE | Receita líquida |
| net_income | DOUBLE | Lucro líquido |
| currency_scale | STRING | Escala |

**gold.financial_indicators**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| cd_cvm | STRING | Código CVM |
| ticker | STRING | Ticker |
| reference_date | DATE | Data |
| roe | DOUBLE | ROE |
| roa | DOUBLE | ROA |
| net_margin | DOUBLE | Margem líquida |
| gross_margin | DOUBLE | Margem bruta |
| current_ratio | DOUBLE | Liquidez corrente |
| debt_to_equity | DOUBLE | Dívida/PL |
