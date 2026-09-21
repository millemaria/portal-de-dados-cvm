-- =============================================================================
-- Databricks SQL: Schemas e Tabelas Gold para o Portal CVM Self-Service
-- Catálogo Oficial: cvm_lakehouse
-- =============================================================================

USE CATALOG cvm_lakehouse;

-- Criação do schema Gold (caso não exista)
CREATE SCHEMA IF NOT EXISTS cvm_lakehouse.gold
COMMENT 'Camada Gold - estruturas analíticas prontas para o Portal CVM Self-Service';

-- -----------------------------------------------------------------------------
-- EIXO 1: EMPRESAS
-- -----------------------------------------------------------------------------

-- 1. vw_companhia_atual
CREATE TABLE IF NOT EXISTS cvm_lakehouse.gold.vw_companhia_atual (
    cnpj STRING COMMENT 'CNPJ da companhia normalizado com 14 dígitos',
    codigo_cvm STRING COMMENT 'Código CVM da companhia padronizado com 6 dígitos',
    nome_empresa STRING COMMENT 'Razão Social / Denominação Comercial',
    nome_social STRING COMMENT 'Denominação Social completa',
    situacao_companhia STRING COMMENT 'Situação cadastral atual (e.g. ATIVO, CANCELADO)',
    segmento_mercado STRING COMMENT 'Segmento de mercado de atuação',
    data_inicio_situacao DATE COMMENT 'Data de início da situação cadastral atual',
    data_registro DATE COMMENT 'Data de registro original na CVM',
    ano_referencia_ultimo INT COMMENT 'Ano da última entrega / referência',
    data_processamento_gold TIMESTAMP COMMENT 'Data e hora do processamento Gold'
) USING DELTA
COMMENT 'Visão analítica de companhias abertas para busca e identificação no Portal CVM';

-- -----------------------------------------------------------------------------
-- EIXO 2: CONSULTA FINANCEIRA
-- -----------------------------------------------------------------------------

-- 2. vw_balanco_patrimonial_latest
CREATE TABLE IF NOT EXISTS cvm_lakehouse.gold.vw_balanco_patrimonial_latest (
    cnpj STRING COMMENT 'CNPJ da companhia (14 dígitos)',
    data_referencia DATE COMMENT 'Data de encerramento do exercício',
    versao_documento INT COMMENT 'Versão do documento da demonstração',
    tipo_demonstracao STRING COMMENT 'BPA (Ativo) ou BPP (Passivo/PL)',
    classificacao_contabil STRING COMMENT 'ATIVO, PASSIVO ou PATRIMONIO_LIQUIDO',
    consolidado_individual STRING COMMENT 'CON (Consolidado) ou IND (Individual)',
    codigo_conta STRING COMMENT 'Código contábil hierárquico (e.g. 1, 1.01, 2.03)',
    descricao_conta STRING COMMENT 'Nome descritivo da conta contábil',
    nivel_conta INT COMMENT 'Nível na hierarquia contábil',
    valor_original DECIMAL(18, 2) COMMENT 'Valor contábil na escala original reportada',
    escala_original STRING COMMENT 'Escala original informada (MIL, UNIDADE, etc.)',
    fator_escala DECIMAL(10, 4) COMMENT 'Multiplicador aplicado para normalização em R$',
    valor_reais DECIMAL(18, 2) COMMENT 'Valor financeiro normalizado em Reais (R$)',
    moeda STRING COMMENT 'Moeda da demonstração (e.g. REAL)',
    chave_logica STRING COMMENT 'Chave lógica única do lançamento contábil',
    ano_exercicio INT COMMENT 'Ano do exercício de referência',
    data_processamento_gold TIMESTAMP COMMENT 'Data e hora do processamento Gold'
) USING DELTA
PARTITIONED BY (ano_exercicio)
COMMENT 'Balanço Patrimonial analítico mais recente por companhia e exercício';

-- 3. vw_resultado_latest
CREATE TABLE IF NOT EXISTS cvm_lakehouse.gold.vw_resultado_latest (
    cnpj STRING COMMENT 'CNPJ da companhia (14 dígitos)',
    data_referencia DATE COMMENT 'Data de encerramento do exercício',
    versao_documento INT COMMENT 'Versão do documento da demonstração',
    tipo_demonstracao STRING COMMENT 'DRE',
    grupo_dre STRING COMMENT 'Classificação analítica (RECEITA, CUSTO, DESPESA, etc.)',
    consolidado_individual STRING COMMENT 'CON ou IND',
    periodo_inicio DATE COMMENT 'Início do período contábil apurado',
    periodo_fim DATE COMMENT 'Fim do período contábil apurado',
    codigo_conta STRING COMMENT 'Código contábil da DRE (e.g. 3.01, 3.05, 3.11)',
    descricao_conta STRING COMMENT 'Nome descritivo da linha de resultado',
    nivel_conta INT COMMENT 'Nível na hierarquia contábil',
    valor_original DECIMAL(18, 2) COMMENT 'Valor na escala original',
    escala_original STRING COMMENT 'Escala da moeda original',
    fator_escala DECIMAL(10, 4) COMMENT 'Fator de escala para R$',
    valor_reais DECIMAL(18, 2) COMMENT 'Valor financeiro normalizado em Reais (R$)',
    moeda STRING COMMENT 'Moeda da demonstração',
    chave_logica STRING COMMENT 'Chave lógica única do lançamento',
    ano_exercicio INT COMMENT 'Ano do exercício',
    data_processamento_gold TIMESTAMP COMMENT 'Data e hora do processamento Gold'
) USING DELTA
PARTITIONED BY (ano_exercicio)
COMMENT 'Demonstração do Resultado do Exercício (DRE) analítica mais recente';

-- 4. vw_fluxo_caixa_latest
CREATE TABLE IF NOT EXISTS cvm_lakehouse.gold.vw_fluxo_caixa_latest (
    cnpj STRING COMMENT 'CNPJ da companhia (14 dígitos)',
    data_referencia DATE COMMENT 'Data de referência',
    versao_documento INT COMMENT 'Versão do documento',
    tipo_demonstracao STRING COMMENT 'DFC_MD (Método Direto) ou DFC_MI (Método Indireto)',
    metodo_dfc STRING COMMENT 'DIRETO ou INDIRETO',
    consolidado_individual STRING COMMENT 'CON ou IND',
    periodo_inicio DATE COMMENT 'Início do período',
    periodo_fim DATE COMMENT 'Fim do período',
    codigo_conta STRING COMMENT 'Código da conta do fluxo de caixa',
    descricao_conta STRING COMMENT 'Descrição da conta de caixa',
    nivel_conta INT COMMENT 'Nível hierárquico da conta',
    valor_original DECIMAL(18, 2) COMMENT 'Valor na escala original',
    escala_original STRING COMMENT 'Escala original',
    fator_escala DECIMAL(10, 4) COMMENT 'Multiplicador para R$',
    valor_reais DECIMAL(18, 2) COMMENT 'Valor normalizado em Reais (R$)',
    moeda STRING COMMENT 'Moeda',
    chave_logica STRING COMMENT 'Chave lógica única',
    ano_exercicio INT COMMENT 'Ano do exercício',
    data_processamento_gold TIMESTAMP COMMENT 'Data e hora do processamento Gold'
) USING DELTA
PARTITIONED BY (ano_exercicio)
COMMENT 'Demonstração dos Fluxos de Caixa (DFC) analítica mais recente';

-- 5. vw_demonstracao_financeira_latest
CREATE TABLE IF NOT EXISTS cvm_lakehouse.gold.vw_demonstracao_financeira_latest (
    cnpj STRING COMMENT 'CNPJ da companhia (14 dígitos)',
    data_referencia DATE COMMENT 'Data de referência',
    versao_documento INT COMMENT 'Versão do documento',
    tipo_demonstracao STRING COMMENT 'Tipo (BPA, BPP, DRE, DFC, DMPL, DRA, DVA)',
    consolidado_individual STRING COMMENT 'CON ou IND',
    periodo_inicio DATE COMMENT 'Início do período',
    periodo_fim DATE COMMENT 'Fim do período',
    codigo_conta STRING COMMENT 'Código contábil',
    descricao_conta STRING COMMENT 'Descrição da conta',
    coluna_demonstracao STRING COMMENT 'Coluna específica (e.g. DMPL)',
    nivel_conta INT COMMENT 'Nível hierárquico',
    valor_original DECIMAL(18, 2) COMMENT 'Valor original',
    escala_original STRING COMMENT 'Escala original',
    fator_escala DECIMAL(10, 4) COMMENT 'Fator de escala',
    valor_reais DECIMAL(18, 2) COMMENT 'Valor normalizado em R$',
    moeda STRING COMMENT 'Moeda',
    chave_logica STRING COMMENT 'Chave lógica única',
    ano_exercicio INT COMMENT 'Ano do exercício',
    data_processamento_gold TIMESTAMP COMMENT 'Data e hora do processamento Gold'
) USING DELTA
PARTITIONED BY (ano_exercicio)
COMMENT 'Visão geral de todas as demonstrações financeiras publicadas';

-- -----------------------------------------------------------------------------
-- EIXO 3: DOCUMENTOS
-- -----------------------------------------------------------------------------

-- 6. fato_composicao_capital
CREATE TABLE IF NOT EXISTS cvm_lakehouse.gold.fato_composicao_capital (
    cnpj STRING COMMENT 'CNPJ da companhia (14 dígitos)',
    data_referencia DATE COMMENT 'Data de referência',
    versao_documento INT COMMENT 'Versão do documento',
    acoes_ordinarias_integralizadas DECIMAL(20, 0) COMMENT 'Quantidade de ações ordinárias integralizadas',
    acoes_preferenciais_integralizadas DECIMAL(20, 0) COMMENT 'Quantidade de ações preferenciais integralizadas',
    acoes_totais_integralizadas DECIMAL(20, 0) COMMENT 'Quantidade total de ações integralizadas',
    acoes_ordinarias_tesouraria DECIMAL(20, 0) COMMENT 'Quantidade de ações ordinárias em tesouraria',
    acoes_preferenciais_tesouraria DECIMAL(20, 0) COMMENT 'Quantidade de ações preferenciais em tesouraria',
    acoes_totais_tesouraria DECIMAL(20, 0) COMMENT 'Quantidade total de ações em tesouraria',
    ano_exercicio INT COMMENT 'Ano do exercício',
    data_processamento_gold TIMESTAMP COMMENT 'Data e hora do processamento Gold'
) USING DELTA
PARTITIONED BY (ano_exercicio)
COMMENT 'Composição de capital acionário por companhia e exercício';

-- 7. fato_parecer_auditoria
CREATE TABLE IF NOT EXISTS cvm_lakehouse.gold.fato_parecer_auditoria (
    cnpj STRING COMMENT 'CNPJ da companhia (14 dígitos)',
    data_referencia DATE COMMENT 'Data de referência',
    versao_documento INT COMMENT 'Versão do documento',
    tipo_relatorio_auditor STRING COMMENT 'Tipo de relatório emitido pelo auditor',
    tipo_parecer STRING COMMENT 'Classificação do parecer ou declaração',
    item_declaracao STRING COMMENT 'Número do item do parecer ou declaração',
    texto_parecer_declaracao STRING COMMENT 'Texto integral do parecer ou declaração',
    ano_exercicio INT COMMENT 'Ano do exercício',
    data_processamento_gold TIMESTAMP COMMENT 'Data e hora do processamento Gold'
) USING DELTA
PARTITIONED BY (ano_exercicio)
COMMENT 'Histórico completo de pareceres e relatórios de auditores independentes';

-- 8. fato_documento_cvm
CREATE TABLE IF NOT EXISTS cvm_lakehouse.gold.fato_documento_cvm (
    cnpj STRING COMMENT 'CNPJ da companhia (14 dígitos)',
    nome_empresa STRING COMMENT 'Denominação da companhia',
    codigo_cvm STRING COMMENT 'Código CVM da companhia (6 dígitos)',
    data_referencia DATE COMMENT 'Data de referência do documento',
    versao_documento INT COMMENT 'Versão da entrega',
    tipo_documento STRING COMMENT 'Tipo do documento (e.g. DFP, ITR)',
    consolidado_individual STRING COMMENT 'CON ou IND',
    data_inicio_exercicio DATE COMMENT 'Início do exercício social',
    data_fim_exercicio DATE COMMENT 'Fim do exercício social',
    ordem_exercicio STRING COMMENT 'Ordem do exercício (e.g. ÚLTIMO)',
    ano_exercicio INT COMMENT 'Ano do exercício',
    data_processamento_gold TIMESTAMP COMMENT 'Data e hora do processamento Gold'
) USING DELTA
PARTITIONED BY (ano_exercicio)
COMMENT 'Histórico de entregas e versões de documentos protocolados na CVM';
