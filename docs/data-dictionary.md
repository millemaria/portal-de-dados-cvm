# Dicionário de Dados — Portal de Dados CVM

## Regra Fundamental do Modelo de Dados

> **As 8 entidades representam estruturas/datasets lógicos do projeto e NÃO 8 companhias.**
> Cada uma das 8 entidades processa **todas as companhias** (centenas/milhares) existentes na origem (`cvm_lakehouse/silver/*`).

---

## As 8 Entidades Lógicas do Projeto

### 1. `vw_companhia_atual`
Visão cadastral com a situação mais recente de **todas as companhias abertas** na CVM.
- **Chave de deduplicação**: `cnpj_cia` (Window ordenada por `data_registro DESC`, `data_inicio_situacao DESC`, `_year DESC`, `versao DESC`, pegando o primeiro registro `rn = 1`).
- **Colunas principais**: `cnpj_cia`, `denominacao_cia`, `denominacao_social`, `cd_cvm`, `situacao`, `segmento`, `data_inicio_situacao`, `data_registro`, `setor_atividade`, `_source_file`, `_ingestion_date`, `_year`.

### 2. `vw_balanco_patrimonial_latest`
Balanço Patrimonial (Ativo e Passivo: BPA e BPP) mais recente por empresa, período e conta contábil.
- **Chave de deduplicação/latest**: `(cnpj_cia, cd_conta, grupo_dfp, dt_fim_exerc, ordem_exerc)` ordenada por `versao DESC`, `dt_refer DESC`.
- **Colunas principais**: `cnpj_cia`, `cd_cvm`, `cd_conta`, `ds_conta`, `vl_conta`, `grupo_dfp`, `ordem_exerc`, `dt_refer`, `dt_fim_exerc`, `versao`, `statement_side` (`ATIVO`/`PASSIVO`), `escala_moeda`.

### 3. `vw_resultado_latest`
Demonstração do Resultado do Exercício (DRE) mais recente por empresa, período e conta contábil.
- **Chave de deduplicação/latest**: `(cnpj_cia, cd_conta, grupo_dfp, dt_fim_exerc, dt_ini_exerc, ordem_exerc)` ordenada por `versao DESC`, `dt_refer DESC`.
- **Colunas principais**: `cnpj_cia`, `cd_cvm`, `cd_conta`, `ds_conta`, `vl_conta`, `grupo_dfp`, `ordem_exerc`, `dt_refer`, `dt_ini_exerc`, `dt_fim_exerc`, `versao`, `escala_moeda`.

### 4. `vw_fluxo_caixa_latest`
Demonstração dos Fluxos de Caixa (DFC Método Direto e Indireto: DFC_MD / DFC_MI) mais recente.
- **Chave de deduplicação/latest**: `(cnpj_cia, cd_conta, grupo_dfp, metodo, dt_fim_exerc, dt_ini_exerc, ordem_exerc)` ordenada por `versao DESC`, `dt_refer DESC`.
- **Colunas principais**: `cnpj_cia`, `cd_cvm`, `cd_conta`, `ds_conta`, `vl_conta`, `grupo_dfp`, `metodo` (`MI`/`MD`), `dt_refer`, `dt_fim_exerc`, `versao`.

### 5. `vw_demonstracao_financeira_latest`
Visão consolidada unificada de todas as demonstrações contábeis (BPA, BPP, DRE, DFC, DMPL, DVA, DRA).
- **Chave de deduplicação/latest**: `(tipo_dem, cnpj_cia, cd_conta, grupo_dfp, dt_fim_exerc, ordem_exerc)` ordenada por `versao DESC`, `dt_refer DESC`.
- **Colunas principais**: `tipo_dem`, `cnpj_cia`, `cd_cvm`, `cd_conta`, `ds_conta`, `vl_conta`, `grupo_dfp`, `dt_refer`, `dt_fim_exerc`, `versao`.

### 6. `fato_composicao_capital`
Composição de capital social e classes de ações (ordinárias, preferenciais, total emitido).
- **Chave de deduplicação**: `(cnpj_cia, dt_refer, tipo_acao)` ordenada por `versao DESC`.
- **Colunas principais**: `cnpj_cia`, `cd_cvm`, `dt_refer`, `tipo_acao` (`ON`/`PN`/`TOTAL`), `qtde_acoes`, `valor_capital`, `versao`.

### 7. `fato_parecer_auditoria`
Relatórios e pareceres de auditoria independente emitidos sobre as demonstrações financeiras.
- **Chave de deduplicação**: `(cnpj_cia, dt_refer, cnpj_auditor)` ordenada por `versao DESC`.
- **Colunas principais**: `cnpj_cia`, `cd_cvm`, `dt_refer`, `cnpj_auditor`, `nome_auditor`, `tipo_parecer`, `versao`.

### 8. `fato_documento_cvm`
Metadados de todos os formulários e documentos protocolados junto à CVM.
- **Chave de deduplicação**: `id_doc` ou `(cnpj_cia, tipo_doc, dt_refer)` ordenada por `versao DESC`.
- **Colunas principais**: `id_doc`, `cnpj_cia`, `cd_cvm`, `tipo_doc`, `dt_refer`, `data_entrega`, `versao`, `status`, `link_doc`.

---

## Camadas de Dados do Lakehouse

### Silver (`cvm_lakehouse/silver/*`)
- Dados limpos, tipados, normalizados e deduplicados por regras de negócio.
- Leitura recursiva de todas as partições (`part-*.csv`) ignorando arquivos de controle (`_SUCCESS`, etc.).
- Preserva **todas as companhias** e todos os anos disponíveis.

### Gold (`cvm_lakehouse/gold/*` e tabelas Delta)
Tabelas otimizadas e orientadas ao consumo da API REST e Portal Web:

**`gold.company_summary`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| cd_cvm | STRING | Código CVM |
| cnpj | STRING | CNPJ |
| company_name | STRING | Razão Social / Nome da Empresa |
| ticker | STRING | Símbolo de negociação |
| sector | STRING | Setor de atividade |
| status | STRING | Situação cadastral (`ATIVO`/`INATIVO`) |
| latest_reference_date | DATE | Data de referência da última demonstração |
| total_assets | DOUBLE | Ativo Total consolidado |
| total_equity | DOUBLE | Patrimônio Líquido consolidado |
| net_revenue | DOUBLE | Receita Líquida consolidada |
| net_income | DOUBLE | Lucro Líquido consolidado |
| currency_scale | STRING | Escala da moeda (`MIL`/`UNIDADE`) |

**`gold.financial_indicators`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| cd_cvm | STRING | Código CVM |
| cnpj | STRING | CNPJ |
| ticker | STRING | Ticker |
| reference_date | DATE | Data de referência |
| roe | DOUBLE | Retorno sobre o Patrimônio Líquido (`net_income / total_equity`) |
| roa | DOUBLE | Retorno sobre o Ativo Total (`net_income / total_assets`) |
| net_margin | DOUBLE | Margem Líquida (`net_income / net_revenue`) |
| gross_margin | DOUBLE | Margem Bruta (`gross_profit / net_revenue`) |
| current_ratio | DOUBLE | Liquidez Corrente (`current_assets / current_liabilities`) |
| debt_to_equity | DOUBLE | Dívida/PL (`(total_assets - total_equity) / total_equity`) |

