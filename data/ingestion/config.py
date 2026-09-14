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

# Databricks paths (to be configured per workspace)
BRONZE_PATH = "/mnt/portal_cvm/bronze"
SILVER_PATH = "/mnt/portal_cvm/silver"
GOLD_PATH = "/mnt/portal_cvm/gold"
RAW_PATH = "/mnt/portal_cvm/raw"

# Catalog and schema
CATALOG = "portal_cvm"
SCHEMA_BRONZE = "bronze"
SCHEMA_SILVER = "silver"
SCHEMA_GOLD = "gold"
