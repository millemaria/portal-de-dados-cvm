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

RAW_PATH = VOLUME_SOURCE_FILES
BRONZE_PATH = f"{CATALOG}.{SCHEMA_BRONZE}"
SILVER_PATH = f"{CATALOG}.{SCHEMA_SILVER}"
GOLD_PATH = f"{CATALOG}.{SCHEMA_GOLD}"
