# CVM DFP Data Ingestion Configuration

# Source URL pattern
CVM_BASE_URL = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS"
DFP_FILE_PATTERN = "dfp_cia_aberta_{year}.zip"

# Available years
YEARS_RANGE = range(2010, 2027)

# CSV settings (CVM standard)
CSV_SEPARATOR = ";"
CSV_ENCODING = "iso-8859-1"

# Document types within each ZIP
DOCUMENT_TYPES = [
    "BPA",      # Balanço Patrimonial Ativo
    "BPP",      # Balanço Patrimonial Passivo
    "DRE",      # Demonstração de Resultado
    "DFC_MI",   # Fluxo de Caixa - Método Indireto
    "DFC_MD",   # Fluxo de Caixa - Método Direto
    "DMPL",     # Mutações do Patrimônio Líquido
    "DVA",      # Demonstração de Valor Adicionado
    "DRA",      # Resultado Abrangente
]

# Databricks paths (Unity Catalog Volumes & Lakehouse)
CATALOG = "cvm_lakehouse"
SCHEMA_OPS = "ops"
SCHEMA_BRONZE = "bronze"
SCHEMA_SILVER = "silver"
SCHEMA_GOLD = "gold"

VOLUME_SOURCE_FILES = f"/Volumes/{CATALOG}/{SCHEMA_OPS}/cvm_source_files"
CSV_EXPORTS_BASE_PATH = f"{VOLUME_SOURCE_FILES}/csv_exports"

# Lakehouse paths
LAKEHOUSE_BASE_PATH = "cvm_lakehouse"
LAKEHOUSE_SILVER_PATH = "cvm_lakehouse/silver"
LAKEHOUSE_GOLD_PATH = "cvm_lakehouse/gold"
LAKEHOUSE_BRONZE_PATH = "cvm_lakehouse/bronze"

RAW_PATH = VOLUME_SOURCE_FILES
BRONZE_PATH = f"{CATALOG}.{SCHEMA_BRONZE}"
SILVER_PATH = f"{CATALOG}.{SCHEMA_SILVER}"
GOLD_PATH = f"{CATALOG}.{SCHEMA_GOLD}"

# 8 Logical Entities of the Portal CVM Self-Service Project
ENTITIES = {
    "vw_companhia_atual": {
        "description": "Visão cadastral atualizada de todas as companhias abertas",
        "type": "view",
        "source_subdirs": ["companhia", "cia", "cad", "cadastral"],
        "dedup_keys": ["cnpj_cia"],
        "order_keys": ["data_registro", "data_inicio_situacao", "_year", "versao"]
    },
    "vw_balanco_patrimonial_latest": {
        "description": "Balanço Patrimonial mais recente (Ativo e Passivo)",
        "type": "view",
        "source_subdirs": ["balanco", "bpa", "bpp", "balanco_patrimonial"],
        "dedup_keys": ["cnpj_cia", "cd_conta", "grupo_dfp", "dt_fim_exerc", "ordem_exerc"],
        "order_keys": ["versao", "dt_refer", "data_registro"]
    },
    "vw_resultado_latest": {
        "description": "Demonstração de Resultado do Exercício (DRE) mais recente",
        "type": "view",
        "source_subdirs": ["resultado", "dre", "demonstracao_resultado"],
        "dedup_keys": ["cnpj_cia", "cd_conta", "grupo_dfp", "dt_fim_exerc", "dt_ini_exerc", "ordem_exerc"],
        "order_keys": ["versao", "dt_refer", "data_registro"]
    },
    "vw_fluxo_caixa_latest": {
        "description": "Demonstração de Fluxo de Caixa (DFC) mais recente",
        "type": "view",
        "source_subdirs": ["fluxo_caixa", "dfc", "dfc_mi", "dfc_md"],
        "dedup_keys": ["cnpj_cia", "cd_conta", "grupo_dfp", "metodo", "dt_fim_exerc", "dt_ini_exerc", "ordem_exerc"],
        "order_keys": ["versao", "dt_refer", "data_registro"]
    },
    "vw_demonstracao_financeira_latest": {
        "description": "Visão unificada das demonstrações financeiras (BPA, BPP, DRE, DFC, DMPL, DVA, DRA)",
        "type": "view",
        "source_subdirs": ["demonstracao_financeira", "demonstracoes", "dfp"],
        "dedup_keys": ["tipo_dem", "cnpj_cia", "cd_conta", "grupo_dfp", "dt_fim_exerc", "ordem_exerc"],
        "order_keys": ["versao", "dt_refer", "data_registro"]
    },
    "fato_composicao_capital": {
        "description": "Composição de capital social e classes de ações",
        "type": "table",
        "source_subdirs": ["composicao_capital", "capital", "acoes"],
        "dedup_keys": ["cnpj_cia", "dt_refer", "tipo_acao"],
        "order_keys": ["versao", "dt_refer"]
    },
    "fato_parecer_auditoria": {
        "description": "Pareceres e relatórios de auditoria independente",
        "type": "table",
        "source_subdirs": ["parecer_auditoria", "auditoria", "parecer"],
        "dedup_keys": ["cnpj_cia", "dt_refer", "cnpj_auditor"],
        "order_keys": ["versao", "dt_refer"]
    },
    "fato_documento_cvm": {
        "description": "Metadados dos documentos CVM entregues",
        "type": "table",
        "source_subdirs": ["documento_cvm", "documentos", "doc_cvm"],
        "dedup_keys": ["id_doc"],
        "fallback_dedup_keys": ["cnpj_cia", "tipo_doc", "dt_refer", "versao"],
        "order_keys": ["versao", "dt_refer", "data_entrega"]
    }
}

# Control / metadata files to ignore when reading lakehouse partitions
CONTROL_FILES_IGNORE_PATTERNS = [
    "_SUCCESS",
    "_committed*",
    "_started*",
    ".crc",
    "_delta_log"
]
