"""
Pipeline PySpark Medallion — Portal CVM Self-Service
=====================================================
Pipeline de engenharia de dados em PySpark seguindo a Arquitetura Medalhão
(Bronze -> Silver -> Gold) para alimentar o MVP do Portal CVM Self-Service.

Origem Oficial:
    Data Lake / Databricks Unity Catalog:
    - Catálogo: cvm_lakehouse
    - Volume: /Volumes/cvm_lakehouse/ops/cvm_source_files/csv_exports
    - Schemas: bronze, silver, gold

Eixos de Consumo do Portal CVM Self-Service:
    1. Empresas: Busca e identificação da companhia
    2. Consulta Financeira: Balanço Patrimonial, DRE, DFC, Demonstrações Complementares
    3. Documentos: Pareceres de auditoria, entregas e versões de documentos, composição de capital

As 8 Entidades Lógicas Contempladas:
    1. vw_companhia_atual
    2. vw_balanco_patrimonial_latest
    3. vw_resultado_latest
    4. vw_fluxo_caixa_latest
    5. vw_demonstracao_financeira_latest
    6. fato_composicao_capital
    7. fato_parecer_auditoria
    8. fato_documento_cvm
"""

from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from pyspark.sql import DataFrame, SparkSession, Window
from pyspark.sql import functions as F
from pyspark.sql.types import (
    DateType,
    DecimalType,
    IntegerType,
    LongType,
    StringType,
    StructField,
    StructType,
    TimestampType,
)

# Configuração de logging estruturado
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("portal_cvm.pipeline_medallion")


# =============================================================================
# 1. CONFIGURAÇÕES CENTRALIZADAS DO DATABRICKS LAKEHOUSE
# =============================================================================

DATABRICKS_CATALOG: str = os.getenv("DATABRICKS_CATALOG", "cvm_lakehouse")
SCHEMA_OPS: str = os.getenv("DATABRICKS_OPS_SCHEMA", "ops")
SCHEMA_BRONZE: str = os.getenv("DATABRICKS_BRONZE_SCHEMA", "bronze")
SCHEMA_SILVER: str = os.getenv("DATABRICKS_SILVER_SCHEMA", "silver")
SCHEMA_GOLD: str = os.getenv("DATABRICKS_GOLD_SCHEMA", "gold")

# Caminho base para os arquivos CSV reais no Volume do Unity Catalog
BASE_VOLUME_PATH: str = os.getenv(
    "CVM_CSV_BASE_PATH",
    f"/Volumes/{DATABRICKS_CATALOG}/{SCHEMA_OPS}/cvm_source_files/csv_exports",
)

# Diretórios físicos individuais das 8 entidades
PATH_VW_COMPANHIA_ATUAL: str = f"{BASE_VOLUME_PATH}/vw_companhia_atual"
PATH_VW_BALANCO_PATRIMONIAL_LATEST: str = f"{BASE_VOLUME_PATH}/vw_balanco_patrimonial_latest"
PATH_VW_RESULTADO_LATEST: str = f"{BASE_VOLUME_PATH}/vw_resultado_latest"
PATH_VW_FLUXO_CAIXA_LATEST: str = f"{BASE_VOLUME_PATH}/vw_fluxo_caixa_latest"
PATH_VW_DEMONSTRACAO_FINANCEIRA_LATEST: str = f"{BASE_VOLUME_PATH}/vw_demonstracao_financeira_latest"
PATH_FATO_COMPOSICAO_CAPITAL: str = f"{BASE_VOLUME_PATH}/fato_composicao_capital"
PATH_FATO_PARECER_AUDITORIA: str = f"{BASE_VOLUME_PATH}/fato_parecer_auditoria"
PATH_FATO_DOCUMENTO_CVM: str = f"{BASE_VOLUME_PATH}/fato_documento_cvm"

# Nomes de tabelas de destino totalmente qualificados
TABLE_BRONZE_COMPANHIA = f"{DATABRICKS_CATALOG}.{SCHEMA_BRONZE}.raw_vw_companhia_atual"
TABLE_BRONZE_BALANCO = f"{DATABRICKS_CATALOG}.{SCHEMA_BRONZE}.raw_vw_balanco_patrimonial_latest"
TABLE_BRONZE_RESULTADO = f"{DATABRICKS_CATALOG}.{SCHEMA_BRONZE}.raw_vw_resultado_latest"
TABLE_BRONZE_FLUXO_CAIXA = f"{DATABRICKS_CATALOG}.{SCHEMA_BRONZE}.raw_vw_fluxo_caixa_latest"
TABLE_BRONZE_DEMONSTRACAO = f"{DATABRICKS_CATALOG}.{SCHEMA_BRONZE}.raw_vw_demonstracao_financeira_latest"
TABLE_BRONZE_COMPOSICAO = f"{DATABRICKS_CATALOG}.{SCHEMA_BRONZE}.raw_fato_composicao_capital"
TABLE_BRONZE_PARECER = f"{DATABRICKS_CATALOG}.{SCHEMA_BRONZE}.raw_fato_parecer_auditoria"
TABLE_BRONZE_DOCUMENTO = f"{DATABRICKS_CATALOG}.{SCHEMA_BRONZE}.raw_fato_documento_cvm"

TABLE_SILVER_COMPANHIA = f"{DATABRICKS_CATALOG}.{SCHEMA_SILVER}.silver_vw_companhia_atual"
TABLE_SILVER_BALANCO = f"{DATABRICKS_CATALOG}.{SCHEMA_SILVER}.silver_vw_balanco_patrimonial_latest"
TABLE_SILVER_RESULTADO = f"{DATABRICKS_CATALOG}.{SCHEMA_SILVER}.silver_vw_resultado_latest"
TABLE_SILVER_FLUXO_CAIXA = f"{DATABRICKS_CATALOG}.{SCHEMA_SILVER}.silver_vw_fluxo_caixa_latest"
TABLE_SILVER_DEMONSTRACAO = f"{DATABRICKS_CATALOG}.{SCHEMA_SILVER}.silver_vw_demonstracao_financeira_latest"
TABLE_SILVER_COMPOSICAO = f"{DATABRICKS_CATALOG}.{SCHEMA_SILVER}.silver_fato_composicao_capital"
TABLE_SILVER_PARECER = f"{DATABRICKS_CATALOG}.{SCHEMA_SILVER}.silver_fato_parecer_auditoria"
TABLE_SILVER_DOCUMENTO = f"{DATABRICKS_CATALOG}.{SCHEMA_SILVER}.silver_fato_documento_cvm"

TABLE_GOLD_COMPANHIA = f"{DATABRICKS_CATALOG}.{SCHEMA_GOLD}.vw_companhia_atual"
TABLE_GOLD_BALANCO = f"{DATABRICKS_CATALOG}.{SCHEMA_GOLD}.vw_balanco_patrimonial_latest"
TABLE_GOLD_RESULTADO = f"{DATABRICKS_CATALOG}.{SCHEMA_GOLD}.vw_resultado_latest"
TABLE_GOLD_FLUXO_CAIXA = f"{DATABRICKS_CATALOG}.{SCHEMA_GOLD}.vw_fluxo_caixa_latest"
TABLE_GOLD_DEMONSTRACAO = f"{DATABRICKS_CATALOG}.{SCHEMA_GOLD}.vw_demonstracao_financeira_latest"
TABLE_GOLD_COMPOSICAO = f"{DATABRICKS_CATALOG}.{SCHEMA_GOLD}.fato_composicao_capital"
TABLE_GOLD_PARECER = f"{DATABRICKS_CATALOG}.{SCHEMA_GOLD}.fato_parecer_auditoria"
TABLE_GOLD_DOCUMENTO = f"{DATABRICKS_CATALOG}.{SCHEMA_GOLD}.fato_documento_cvm"


# =============================================================================
# 2. SCHEMAS PYSPARK EXPLÍCITOS (STRUCTTYPE) PARA AS 8 ENTIDADES
# =============================================================================

# 1. Schema: vw_companhia_atual
SCHEMA_BRONZE_COMPANHIA = StructType([
    StructField("cnpj_cia", StringType(), True),
    StructField("denominacao_cia", StringType(), True),
    StructField("denominacao_social", StringType(), True),
    StructField("situacao", StringType(), True),
    StructField("segmento", StringType(), True),
    StructField("data_inicio_situacao", StringType(), True),
    StructField("data_registro", StringType(), True),
    StructField("_source_file", StringType(), True),
    StructField("_run_id", StringType(), True),
    StructField("_ingestion_date", StringType(), True),
    StructField("_year", StringType(), True),
])

# 2. Schema: vw_balanco_patrimonial_latest
SCHEMA_BRONZE_BALANCO_PATRIMONIAL = StructType([
    StructField("cnpj_cia", StringType(), True),
    StructField("dt_refer", StringType(), True),
    StructField("versao", StringType(), True),
    StructField("tipo_demonstracao", StringType(), True),
    StructField("ind_individual_consolidado", StringType(), True),
    StructField("ordem_exerc", StringType(), True),
    StructField("dt_ini_exerc", StringType(), True),
    StructField("dt_fim_exerc", StringType(), True),
    StructField("cd_conta", StringType(), True),
    StructField("ds_conta", StringType(), True),
    StructField("st_conta_fixa", StringType(), True),
    StructField("coluna_df", StringType(), True),
    StructField("valor_original", StringType(), True),
    StructField("escala_original", StringType(), True),
    StructField("fator_escala", StringType(), True),
    StructField("moeda", StringType(), True),
    StructField("_source_file", StringType(), True),
    StructField("_run_id", StringType(), True),
    StructField("_ingestion_date", StringType(), True),
    StructField("_year", StringType(), True),
    StructField("valor_normalizado", StringType(), True),
    StructField("chave_logica", StringType(), True),
])

# 3. Schema: vw_resultado_latest
SCHEMA_BRONZE_RESULTADO = StructType([
    StructField("cnpj_cia", StringType(), True),
    StructField("dt_refer", StringType(), True),
    StructField("versao", StringType(), True),
    StructField("tipo_demonstracao", StringType(), True),
    StructField("ind_individual_consolidado", StringType(), True),
    StructField("ordem_exerc", StringType(), True),
    StructField("dt_ini_exerc", StringType(), True),
    StructField("dt_fim_exerc", StringType(), True),
    StructField("cd_conta", StringType(), True),
    StructField("ds_conta", StringType(), True),
    StructField("st_conta_fixa", StringType(), True),
    StructField("coluna_df", StringType(), True),
    StructField("valor_original", StringType(), True),
    StructField("escala_original", StringType(), True),
    StructField("fator_escala", StringType(), True),
    StructField("moeda", StringType(), True),
    StructField("_source_file", StringType(), True),
    StructField("_run_id", StringType(), True),
    StructField("_ingestion_date", StringType(), True),
    StructField("_year", StringType(), True),
    StructField("valor_normalizado", StringType(), True),
    StructField("chave_logica", StringType(), True),
])

# 4. Schema: vw_fluxo_caixa_latest
SCHEMA_BRONZE_FLUXO_CAIXA = StructType([
    StructField("cnpj_cia", StringType(), True),
    StructField("dt_refer", StringType(), True),
    StructField("versao", StringType(), True),
    StructField("tipo_demonstracao", StringType(), True),
    StructField("ind_individual_consolidado", StringType(), True),
    StructField("ordem_exerc", StringType(), True),
    StructField("dt_ini_exerc", StringType(), True),
    StructField("dt_fim_exerc", StringType(), True),
    StructField("cd_conta", StringType(), True),
    StructField("ds_conta", StringType(), True),
    StructField("st_conta_fixa", StringType(), True),
    StructField("coluna_df", StringType(), True),
    StructField("valor_original", StringType(), True),
    StructField("escala_original", StringType(), True),
    StructField("fator_escala", StringType(), True),
    StructField("moeda", StringType(), True),
    StructField("_source_file", StringType(), True),
    StructField("_run_id", StringType(), True),
    StructField("_ingestion_date", StringType(), True),
    StructField("_year", StringType(), True),
    StructField("valor_normalizado", StringType(), True),
    StructField("chave_logica", StringType(), True),
])

# 5. Schema: vw_demonstracao_financeira_latest
SCHEMA_BRONZE_DEMONSTRACAO_FINANCEIRA = StructType([
    StructField("cnpj_cia", StringType(), True),
    StructField("dt_refer", StringType(), True),
    StructField("versao", StringType(), True),
    StructField("tipo_demonstracao", StringType(), True),
    StructField("ind_individual_consolidado", StringType(), True),
    StructField("ordem_exerc", StringType(), True),
    StructField("dt_ini_exerc", StringType(), True),
    StructField("dt_fim_exerc", StringType(), True),
    StructField("cd_conta", StringType(), True),
    StructField("ds_conta", StringType(), True),
    StructField("st_conta_fixa", StringType(), True),
    StructField("coluna_df", StringType(), True),
    StructField("valor_original", StringType(), True),
    StructField("escala_original", StringType(), True),
    StructField("fator_escala", StringType(), True),
    StructField("moeda", StringType(), True),
    StructField("_source_file", StringType(), True),
    StructField("_run_id", StringType(), True),
    StructField("_ingestion_date", StringType(), True),
    StructField("_year", StringType(), True),
    StructField("valor_normalizado", StringType(), True),
    StructField("chave_logica", StringType(), True),
])

# 6. Schema: fato_composicao_capital
SCHEMA_BRONZE_COMPOSICAO_CAPITAL = StructType([
    StructField("cnpj_cia", StringType(), True),
    StructField("dt_refer", StringType(), True),
    StructField("versao", StringType(), True),
    StructField("qt_acao_ordin_cap_integr", StringType(), True),
    StructField("qt_acao_pref_cap_integr", StringType(), True),
    StructField("qt_acao_total_cap_integr", StringType(), True),
    StructField("qt_acao_ordin_tesouro", StringType(), True),
    StructField("qt_acao_pref_tesouro", StringType(), True),
    StructField("qt_acao_total_tesouro", StringType(), True),
    StructField("_source_file", StringType(), True),
    StructField("_run_id", StringType(), True),
    StructField("_ingestion_date", StringType(), True),
    StructField("_year", StringType(), True),
])

# 7. Schema: fato_parecer_auditoria
SCHEMA_BRONZE_PARECER_AUDITORIA = StructType([
    StructField("cnpj_cia", StringType(), True),
    StructField("dt_refer", StringType(), True),
    StructField("versao", StringType(), True),
    StructField("tp_relat_aud", StringType(), True),
    StructField("tipo_parecer", StringType(), True),
    StructField("num_item_parecer_decl", StringType(), True),
    StructField("txt_parecer_decl", StringType(), True),
    StructField("_source_file", StringType(), True),
    StructField("_run_id", StringType(), True),
    StructField("_ingestion_date", StringType(), True),
    StructField("_year", StringType(), True),
])

# 8. Schema: fato_documento_cvm
SCHEMA_BRONZE_DOCUMENTO_CVM = StructType([
    StructField("cnpj_cia", StringType(), True),
    StructField("denominacao_cia", StringType(), True),
    StructField("cd_cvm", StringType(), True),
    StructField("dt_refer", StringType(), True),
    StructField("versao", StringType(), True),
    StructField("tipo_documento", StringType(), True),
    StructField("ind_individual_consolidado", StringType(), True),
    StructField("dt_ini_exerc", StringType(), True),
    StructField("dt_fim_exerc", StringType(), True),
    StructField("ordem_exerc", StringType(), True),
    StructField("_source_file", StringType(), True),
    StructField("_run_id", StringType(), True),
    StructField("_ingestion_date", StringType(), True),
    StructField("_year", StringType(), True),
])


# =============================================================================
# 3. FUNÇÕES AUXILIARES
# =============================================================================

def get_or_create_spark() -> SparkSession:
    """Retorna a SparkSession ativa ou inicializa uma nova configurada."""
    spark = SparkSession.getActiveSession()
    if spark is None:
        logger.info("Criando nova SparkSession...")
        spark = (
            SparkSession.builder.appName("PortalCVM_MedallionPipeline")
            .config("spark.sql.adaptive.enabled", "true")
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
            .config("spark.sql.caseSensitive", "false")
            .getOrCreate()
        )
    return spark


def read_entity_csv(
    spark: SparkSession,
    directory_path: str,
    schema: StructType,
    entity_name: str,
) -> DataFrame:
    """Lê estritamente os arquivos .csv de um diretório particionado, ignorando

    arquivos de controle (_SUCCESS, _committed*, _started*) e adicionando
    metadados técnicos de rastreabilidade (ingestion timestamp, source path,
    source file).
    """
    logger.info("Lendo arquivos CSV para %s em %s", entity_name, directory_path)

    # Leitura direcionada a arquivos .csv via pathGlobFilter
    df_raw = (
        spark.read.format("csv")
        .schema(schema)
        .option("header", "true")
        .option("sep", ",")
        .option("encoding", "UTF-8")
        .option("pathGlobFilter", "*.csv")
        .option("ignoreLeadingWhiteSpace", "true")
        .option("ignoreTrailingWhiteSpace", "true")
        .load(directory_path)
    )

    # Adiciona metadados de ingestão Bronze sem alterar os dados originais
    df_bronze = (
        df_raw.withColumn("_ingestion_timestamp", F.current_timestamp())
        .withColumn("_source_path", F.lit(directory_path))
        .withColumn(
            "_source_file_read",
            F.coalesce(F.input_file_name(), F.lit("unknown")),
        )
    )

    return df_bronze


def clean_cnpj(col_expr: F.Column) -> F.Column:
    """Padroniza CNPJ: remove caracteres não-numéricos e aplica padding para 14 dígitos."""
    cleaned = F.regexp_replace(F.trim(col_expr), r"[^0-9]", "")
    return F.when(
        F.length(cleaned) > 0, F.lpad(cleaned, 14, "0")
    ).otherwise(None)


def clean_cd_cvm(col_expr: F.Column) -> F.Column:
    """Padroniza Código CVM: remove caracteres não-numéricos e aplica padding para 6 dígitos."""
    cleaned = F.regexp_replace(F.trim(col_expr), r"[^0-9]", "")
    return F.when(
        F.length(cleaned) > 0, F.lpad(cleaned, 6, "0")
    ).otherwise(None)


def parse_safe_date(col_expr: F.Column) -> F.Column:
    """Converte para DateType de maneira tolerante a falhas (try_cast)."""
    return F.expr(f"try_cast({col_expr} as date)")


def parse_safe_decimal(col_expr: F.Column, precision: int = 18, scale: int = 2) -> F.Column:
    """Converte string para Decimal com tolerância a formatos da CVM."""
    # Trata eventual separador decimal brasileiro caso apareça vírgula
    sanitized = F.regexp_replace(F.trim(col_expr), r"\.", "")
    sanitized = F.regexp_replace(sanitized, r",", ".")
    # Caso já venha com ponto, preserva
    direct = F.trim(col_expr)
    return F.coalesce(
        F.expr(f"try_cast({direct} as decimal({precision},{scale}))"),
        F.expr(f"try_cast({sanitized} as decimal({precision},{scale}))"),
    )


def write_table_or_view(
    df: DataFrame,
    full_table_name: str,
    partition_by: Optional[List[str]] = None,
    mode: str = "overwrite",
) -> None:
    """Grava o DataFrame como Delta Table gerenciada no Unity Catalog.

    Caso o schema de catálogo não esteja configurado, cria view temporária para testes.
    """
    try:
        writer = df.write.format("delta").mode(mode)
        if partition_by:
            writer = writer.partitionBy(*partition_by)
        writer.saveAsTable(full_table_name)
        logger.info("Tabela persistida com sucesso: %s (%d registros)", full_table_name, df.count())
    except Exception as e:
        view_name = full_table_name.replace(".", "_")
        df.createOrReplaceTempView(view_name)
        logger.warning(
            "Não foi possível salvar tabela Delta gerenciada %s (%s). View temporária criada: %s",
            full_table_name,
            e,
            view_name,
        )


# =============================================================================
# 4. CAMADA BRONZE — LEITURA INDIVIDUAL DAS 8 ENTIDADES
# =============================================================================

def read_vw_companhia_atual(spark: SparkSession, base_path: Optional[str] = None) -> DataFrame:
    """Lê os dados brutos da entidade vw_companhia_atual."""
    path = f"{base_path}/vw_companhia_atual" if base_path else PATH_VW_COMPANHIA_ATUAL
    return read_entity_csv(spark, path, SCHEMA_BRONZE_COMPANHIA, "vw_companhia_atual")


def read_vw_balanco_patrimonial_latest(spark: SparkSession, base_path: Optional[str] = None) -> DataFrame:
    """Lê os dados brutos da entidade vw_balanco_patrimonial_latest."""
    path = f"{base_path}/vw_balanco_patrimonial_latest" if base_path else PATH_VW_BALANCO_PATRIMONIAL_LATEST
    return read_entity_csv(spark, path, SCHEMA_BRONZE_BALANCO_PATRIMONIAL, "vw_balanco_patrimonial_latest")


def read_vw_resultado_latest(spark: SparkSession, base_path: Optional[str] = None) -> DataFrame:
    """Lê os dados brutos da entidade vw_resultado_latest."""
    path = f"{base_path}/vw_resultado_latest" if base_path else PATH_VW_RESULTADO_LATEST
    return read_entity_csv(spark, path, SCHEMA_BRONZE_RESULTADO, "vw_resultado_latest")


def read_vw_fluxo_caixa_latest(spark: SparkSession, base_path: Optional[str] = None) -> DataFrame:
    """Lê os dados brutos da entidade vw_fluxo_caixa_latest."""
    path = f"{base_path}/vw_fluxo_caixa_latest" if base_path else PATH_VW_FLUXO_CAIXA_LATEST
    return read_entity_csv(spark, path, SCHEMA_BRONZE_FLUXO_CAIXA, "vw_fluxo_caixa_latest")


def read_vw_demonstracao_financeira_latest(spark: SparkSession, base_path: Optional[str] = None) -> DataFrame:
    """Lê os dados brutos da entidade vw_demonstracao_financeira_latest."""
    path = f"{base_path}/vw_demonstracao_financeira_latest" if base_path else PATH_VW_DEMONSTRACAO_FINANCEIRA_LATEST
    return read_entity_csv(spark, path, SCHEMA_BRONZE_DEMONSTRACAO_FINANCEIRA, "vw_demonstracao_financeira_latest")


def read_fato_composicao_capital(spark: SparkSession, base_path: Optional[str] = None) -> DataFrame:
    """Lê os dados brutos da entidade fato_composicao_capital."""
    path = f"{base_path}/fato_composicao_capital" if base_path else PATH_FATO_COMPOSICAO_CAPITAL
    return read_entity_csv(spark, path, SCHEMA_BRONZE_COMPOSICAO_CAPITAL, "fato_composicao_capital")


def read_fato_parecer_auditoria(spark: SparkSession, base_path: Optional[str] = None) -> DataFrame:
    """Lê os dados brutos da entidade fato_parecer_auditoria."""
    path = f"{base_path}/fato_parecer_auditoria" if base_path else PATH_FATO_PARECER_AUDITORIA
    return read_entity_csv(spark, path, SCHEMA_BRONZE_PARECER_AUDITORIA, "fato_parecer_auditoria")


def read_fato_documento_cvm(spark: SparkSession, base_path: Optional[str] = None) -> DataFrame:
    """Lê os dados brutos da entidade fato_documento_cvm."""
    path = f"{base_path}/fato_documento_cvm" if base_path else PATH_FATO_DOCUMENTO_CVM
    return read_entity_csv(spark, path, SCHEMA_BRONZE_DOCUMENTO_CVM, "fato_documento_cvm")


# =============================================================================
# 5. CAMADA SILVER — TRANSFORMAÇÕES, TIPAGEM, QUALIDADE E LATEST
# =============================================================================

def transform_silver_companhia_atual(
    df_bronze_comp: DataFrame,
    df_bronze_doc: Optional[DataFrame] = None,
) -> DataFrame:
    """Transforma a entidade vw_companhia_atual para a camada Silver:

    - Normalização do CNPJ para 14 dígitos
    - Enriquecimento com o Código CVM (cd_cvm) via cruzamento com fato_documento_cvm
    - Limpeza e padronização da situação e segmento
    - Deduplicação determinística mantendo o registro mais atualizado
    - Validação de qualidade (rejeição de registros sem CNPJ válido)
    """
    logger.info("Transformando Silver: vw_companhia_atual")

    # Mapeamento do Código CVM a partir dos documentos para enriquecer a busca por Código CVM
    cd_cvm_mapping = None
    if df_bronze_doc is not None:
        doc_window = Window.partitionBy("cnpj_limpo").orderBy(
            F.col("dt_refer_parsed").desc_nulls_last(),
            F.col("versao_parsed").desc_nulls_last(),
        )
        cd_cvm_mapping = (
            df_bronze_doc.withColumn("cnpj_limpo", clean_cnpj(F.col("cnpj_cia")))
            .withColumn("cd_cvm_limpo", clean_cd_cvm(F.col("cd_cvm")))
            .withColumn("dt_refer_parsed", parse_safe_date("dt_refer"))
            .withColumn("versao_parsed", F.expr("try_cast(versao as int)"))
            .filter(F.col("cnpj_limpo").isNotNull() & F.col("cd_cvm_limpo").isNotNull())
            .withColumn("rn", F.row_number().over(doc_window))
            .filter(F.col("rn") == 1)
            .select(
                F.col("cnpj_limpo"),
                F.col("cd_cvm_limpo").alias("cd_cvm_enriquecido"),
            )
        )

    # Limpeza e tipagem da companhia
    silver = (
        df_bronze_comp.withColumn("cnpj_cia", clean_cnpj(F.col("cnpj_cia")))
        .withColumn("denominacao_cia", F.trim(F.upper(F.col("denominacao_cia"))))
        .withColumn("denominacao_social", F.trim(F.upper(F.col("denominacao_social"))))
        .withColumn("situacao", F.coalesce(F.trim(F.upper(F.col("situacao"))), F.lit("ATIVO")))
        .withColumn("segmento", F.trim(F.col("segmento")))
        .withColumn("data_inicio_situacao", parse_safe_date("data_inicio_situacao"))
        .withColumn("data_registro", parse_safe_date("data_registro"))
        .withColumn("exercicio_ano", F.expr("try_cast(_year as int)"))
    )

    # Enriquecimento com Código CVM
    if cd_cvm_mapping is not None:
        silver = silver.join(cd_cvm_mapping, silver.cnpj_cia == cd_cvm_mapping.cnpj_limpo, "left").drop("cnpj_limpo")
        silver = silver.withColumn("cd_cvm", F.coalesce(F.col("cd_cvm_enriquecido"), F.lit(None).cast(StringType()))).drop("cd_cvm_enriquecido")
    else:
        silver = silver.withColumn("cd_cvm", F.lit(None).cast(StringType()))

    # Deduplicação determinística: 1 registro por CNPJ mais recente
    comp_window = Window.partitionBy("cnpj_cia").orderBy(
        F.col("exercicio_ano").desc_nulls_last(),
        F.col("data_registro").desc_nulls_last(),
        F.col("_ingestion_timestamp").desc(),
    )

    silver_deduped = (
        silver.filter(F.col("cnpj_cia").isNotNull() & (F.length(F.col("cnpj_cia")) == 14))
        .withColumn("row_num", F.row_number().over(comp_window))
        .filter(F.col("row_num") == 1)
        .drop("row_num")
        .select(
            "cnpj_cia",
            "cd_cvm",
            "denominacao_cia",
            "denominacao_social",
            "situacao",
            "segmento",
            "data_inicio_situacao",
            "data_registro",
            "exercicio_ano",
            "_ingestion_timestamp",
            "_source_path",
            "_source_file",
        )
    )

    return silver_deduped


def _transform_silver_demonstracao_generica(
    df_bronze: DataFrame,
    tipo_filtro: Optional[List[str]] = None,
) -> DataFrame:
    """Função compartilhada de transformação para demonstrações financeiras (Balanço,

    DRE, DFC, Demonstrações Gerais).
    """
    filtered = df_bronze
    if tipo_filtro:
        filtered = filtered.filter(F.col("tipo_demonstracao").isin(tipo_filtro))

    # Limpeza e tipagem rigorosa
    silver = (
        filtered.withColumn("cnpj_cia", clean_cnpj(F.col("cnpj_cia")))
        .withColumn("dt_refer", parse_safe_date("dt_refer"))
        .withColumn("versao", F.expr("try_cast(versao as int)"))
        .withColumn("tipo_demonstracao", F.trim(F.upper(F.col("tipo_demonstracao"))))
        .withColumn("ind_individual_consolidado", F.trim(F.upper(F.col("ind_individual_consolidado"))))
        .withColumn("ordem_exerc", F.trim(F.upper(F.col("ordem_exerc"))))
        .withColumn("dt_ini_exerc", parse_safe_date("dt_ini_exerc"))
        .withColumn("dt_fim_exerc", parse_safe_date("dt_fim_exerc"))
        .withColumn("cd_conta", F.trim(F.col("cd_conta")))
        .withColumn("ds_conta", F.trim(F.col("ds_conta")))
        .withColumn("st_conta_fixa", F.trim(F.col("st_conta_fixa")))
        .withColumn("coluna_df", F.trim(F.col("coluna_df")))
        .withColumn("moeda", F.trim(F.col("moeda")))
        .withColumn("escala_original", F.trim(F.upper(F.col("escala_original"))))
        .withColumn(
            "fator_escala",
            F.when(F.col("escala_original") == "MIL", F.lit(1000.0).cast(DecimalType(10, 4)))
            .when(F.col("escala_original") == "MILHOES", F.lit(1000000.0).cast(DecimalType(10, 4)))
            .otherwise(F.lit(1.0).cast(DecimalType(10, 4))),
        )
        .withColumn("valor_original", parse_safe_decimal("valor_original", 18, 2))
        .withColumn("exercicio_ano", F.expr("try_cast(_year as int)"))
    )

    # Cálculo seguro do valor normalizado em R$
    silver = silver.withColumn(
        "valor_normalizado",
        F.expr("try_cast(valor_original * fator_escala as decimal(18,2))"),
    )

    # Adiciona hierarquia contábil (nível da conta derivado dos pontos)
    silver = silver.withColumn(
        "nivel_conta",
        F.size(F.split(F.col("cd_conta"), r"\.")),
    )

    # Gera/revalida a chave lógica única
    silver = silver.withColumn(
        "chave_logica",
        F.concat_ws(
            "|",
            F.col("cnpj_cia"),
            F.col("dt_refer"),
            F.col("versao"),
            F.col("tipo_demonstracao"),
            F.col("ind_individual_consolidado"),
            F.col("ordem_exerc"),
            F.col("cd_conta"),
            F.coalesce(F.col("coluna_df"), F.lit("")),
        ),
    )

    # Regra determinística de Latest:
    # Apenas ordem_exerc = 'ÚLTIMO' e maior versão por exercício e conta
    latest_window = Window.partitionBy(
        "cnpj_cia",
        "dt_refer",
        "tipo_demonstracao",
        "ind_individual_consolidado",
        "cd_conta",
        F.coalesce(F.col("coluna_df"), F.lit("")),
    ).orderBy(
        F.col("versao").desc_nulls_last(),
        F.col("_ingestion_timestamp").desc(),
    )

    silver_latest = (
        silver.filter(
            F.col("cnpj_cia").isNotNull()
            & (F.length(F.col("cnpj_cia")) == 14)
            & F.col("dt_refer").isNotNull()
            & F.col("cd_conta").isNotNull()
            & (F.col("ordem_exerc") == "ÚLTIMO")
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    return silver_latest


def transform_silver_balanco_patrimonial(df_bronze: DataFrame) -> DataFrame:
    """Transforma vw_balanco_patrimonial_latest para a camada Silver."""
    logger.info("Transformando Silver: vw_balanco_patrimonial_latest")
    silver = _transform_silver_demonstracao_generica(df_bronze, ["BPA", "BPP"])
    # Adiciona classificação Ativo / Passivo / Patrimônio Líquido
    silver = silver.withColumn(
        "classificacao_contabil",
        F.when(F.col("tipo_demonstracao") == "BPA", F.lit("ATIVO"))
        .when((F.col("tipo_demonstracao") == "BPP") & (F.col("cd_conta").startswith("2.03")), F.lit("PATRIMONIO_LIQUIDO"))
        .when(F.col("tipo_demonstracao") == "BPP", F.lit("PASSIVO"))
        .otherwise(F.lit("OUTROS")),
    )
    return silver


def transform_silver_resultado(df_bronze: DataFrame) -> DataFrame:
    """Transforma vw_resultado_latest para a camada Silver."""
    logger.info("Transformando Silver: vw_resultado_latest")
    silver = _transform_silver_demonstracao_generica(df_bronze, ["DRE"])
    # Categorização estrutural da DRE
    silver = silver.withColumn(
        "grupo_dre",
        F.when(F.col("cd_conta") == "3.01", F.lit("RECEITA_LIQUIDA"))
        .when(F.col("cd_conta") == "3.02", F.lit("CUSTO_BENS_SERVICOS"))
        .when(F.col("cd_conta") == "3.03", F.lit("LUCRO_BRUTO"))
        .when(F.col("cd_conta").startswith("3.04"), F.lit("DESPESAS_RECEITAS_OPERACIONAIS"))
        .when(F.col("cd_conta") == "3.05", F.lit("RESULTADO_OPERACIONAL"))
        .when(F.col("cd_conta").isin("3.07", "3.08"), F.lit("RESULTADO_ANTES_TRIBUTOS"))
        .when(F.col("cd_conta").isin("3.09", "3.11"), F.lit("LUCRO_PREJUIZO_LIQUIDO"))
        .otherwise(F.lit("DEMAIS_CONTAS")),
    )
    return silver


def transform_silver_fluxo_caixa(df_bronze: DataFrame) -> DataFrame:
    """Transforma vw_fluxo_caixa_latest para a camada Silver."""
    logger.info("Transformando Silver: vw_fluxo_caixa_latest")
    silver = _transform_silver_demonstracao_generica(df_bronze, ["DFC_MD", "DFC_MI"])
    silver = silver.withColumn(
        "metodo_dfc",
        F.when(F.col("tipo_demonstracao") == "DFC_MD", F.lit("DIRETO"))
        .when(F.col("tipo_demonstracao") == "DFC_MI", F.lit("INDIRETO"))
        .otherwise(F.lit("OUTROS")),
    )
    return silver


def transform_silver_demonstracao_financeira(df_bronze: DataFrame) -> DataFrame:
    """Transforma vw_demonstracao_financeira_latest para a camada Silver (superset)."""
    logger.info("Transformando Silver: vw_demonstracao_financeira_latest")
    return _transform_silver_demonstracao_generica(df_bronze, None)


def transform_silver_composicao_capital(df_bronze: DataFrame) -> DataFrame:
    """Transforma fato_composicao_capital para a camada Silver:

    - Tipagem de ações para DecimalType(20, 0)
    - Normalização de CNPJ e data de referência
    - Deduplicação determinística pela versão mais recente.
    """
    logger.info("Transformando Silver: fato_composicao_capital")
    silver = (
        df_bronze.withColumn("cnpj_cia", clean_cnpj(F.col("cnpj_cia")))
        .withColumn("dt_refer", parse_safe_date("dt_refer"))
        .withColumn("versao", F.expr("try_cast(versao as int)"))
        .withColumn("qt_acao_ordin_cap_integr", parse_safe_decimal("qt_acao_ordin_cap_integr", 20, 0))
        .withColumn("qt_acao_pref_cap_integr", parse_safe_decimal("qt_acao_pref_cap_integr", 20, 0))
        .withColumn("qt_acao_total_cap_integr", parse_safe_decimal("qt_acao_total_cap_integr", 20, 0))
        .withColumn("qt_acao_ordin_tesouro", parse_safe_decimal("qt_acao_ordin_tesouro", 20, 0))
        .withColumn("qt_acao_pref_tesouro", parse_safe_decimal("qt_acao_pref_tesouro", 20, 0))
        .withColumn("qt_acao_total_tesouro", parse_safe_decimal("qt_acao_total_tesouro", 20, 0))
        .withColumn("exercicio_ano", F.expr("try_cast(_year as int)"))
    )

    cap_window = Window.partitionBy("cnpj_cia", "dt_refer").orderBy(
        F.col("versao").desc_nulls_last(),
        F.col("_ingestion_timestamp").desc(),
    )

    silver_deduped = (
        silver.filter(
            F.col("cnpj_cia").isNotNull()
            & (F.length(F.col("cnpj_cia")) == 14)
            & F.col("dt_refer").isNotNull()
        )
        .withColumn("rn", F.row_number().over(cap_window))
        .filter(F.col("rn") == 1)
        .drop("rn")
        .select(
            "cnpj_cia",
            "dt_refer",
            "versao",
            "qt_acao_ordin_cap_integr",
            "qt_acao_pref_cap_integr",
            "qt_acao_total_cap_integr",
            "qt_acao_ordin_tesouro",
            "qt_acao_pref_tesouro",
            "qt_acao_total_tesouro",
            "exercicio_ano",
            "_ingestion_timestamp",
            "_source_path",
            "_source_file",
        )
    )

    return silver_deduped


def transform_silver_parecer_auditoria(df_bronze: DataFrame) -> DataFrame:
    """Transforma fato_parecer_auditoria para a camada Silver:

    - Preserva o histórico completo de pareceres sem destruição de versões
    - Limpeza de texto e tipagem.
    """
    logger.info("Transformando Silver: fato_parecer_auditoria")
    silver = (
        df_bronze.withColumn("cnpj_cia", clean_cnpj(F.col("cnpj_cia")))
        .withColumn("dt_refer", parse_safe_date("dt_refer"))
        .withColumn("versao", F.expr("try_cast(versao as int)"))
        .withColumn("tp_relat_aud", F.trim(F.col("tp_relat_aud")))
        .withColumn("tipo_parecer", F.trim(F.col("tipo_parecer")))
        .withColumn("num_item_parecer_decl", F.trim(F.col("num_item_parecer_decl")))
        .withColumn("txt_parecer_decl", F.trim(F.col("txt_parecer_decl")))
        .withColumn("exercicio_ano", F.expr("try_cast(_year as int)"))
        .filter(
            F.col("cnpj_cia").isNotNull()
            & (F.length(F.col("cnpj_cia")) == 14)
            & F.col("dt_refer").isNotNull()
        )
        .select(
            "cnpj_cia",
            "dt_refer",
            "versao",
            "tp_relat_aud",
            "tipo_parecer",
            "num_item_parecer_decl",
            "txt_parecer_decl",
            "exercicio_ano",
            "_ingestion_timestamp",
            "_source_path",
            "_source_file",
        )
    )
    return silver


def transform_silver_documento_cvm(df_bronze: DataFrame) -> DataFrame:
    """Transforma fato_documento_cvm para a camada Silver:

    - Preserva o histórico documental completo (sem manter apenas o mais recente)
    - Normaliza CNPJ e Código CVM
    - Trata datas e versões.
    """
    logger.info("Transformando Silver: fato_documento_cvm")
    silver = (
        df_bronze.withColumn("cnpj_cia", clean_cnpj(F.col("cnpj_cia")))
        .withColumn("denominacao_cia", F.trim(F.upper(F.col("denominacao_cia"))))
        .withColumn("cd_cvm", clean_cd_cvm(F.col("cd_cvm")))
        .withColumn("dt_refer", parse_safe_date("dt_refer"))
        .withColumn("versao", F.expr("try_cast(versao as int)"))
        .withColumn("tipo_documento", F.trim(F.upper(F.col("tipo_documento"))))
        .withColumn("ind_individual_consolidado", F.trim(F.upper(F.col("ind_individual_consolidado"))))
        .withColumn("dt_ini_exerc", parse_safe_date("dt_ini_exerc"))
        .withColumn("dt_fim_exerc", parse_safe_date("dt_fim_exerc"))
        .withColumn("ordem_exerc", F.trim(F.upper(F.col("ordem_exerc"))))
        .withColumn("exercicio_ano", F.expr("try_cast(_year as int)"))
        .filter(
            F.col("cnpj_cia").isNotNull()
            & (F.length(F.col("cnpj_cia")) == 14)
            & F.col("dt_refer").isNotNull()
        )
        .select(
            "cnpj_cia",
            "denominacao_cia",
            "cd_cvm",
            "dt_refer",
            "versao",
            "tipo_documento",
            "ind_individual_consolidado",
            "dt_ini_exerc",
            "dt_fim_exerc",
            "ordem_exerc",
            "exercicio_ano",
            "_ingestion_timestamp",
            "_source_path",
            "_source_file",
        )
    )
    return silver


# =============================================================================
# 6. CAMADA GOLD — ESTRUTURAS ANALÍTICAS PRONTAS PARA O PORTAL CVM SELF-SERVICE
# =============================================================================

def build_gold_companhia_atual(df_silver_comp: DataFrame) -> DataFrame:
    """Constrói Gold.vw_companhia_atual:

    Estrutura otimizada para o Eixo 1 (Empresas): Busca rápida e tabular por
    CNPJ, Código CVM e Denominação Social.
    """
    logger.info("Construindo Gold: vw_companhia_atual")
    return df_silver_comp.select(
        F.col("cnpj_cia").alias("cnpj"),
        F.col("cd_cvm").alias("codigo_cvm"),
        F.col("denominacao_cia").alias("nome_empresa"),
        F.col("denominacao_social").alias("nome_social"),
        F.col("situacao").alias("situacao_companhia"),
        F.col("segmento").alias("segmento_mercado"),
        F.col("data_inicio_situacao"),
        F.col("data_registro"),
        F.col("exercicio_ano").alias("ano_referencia_ultimo"),
        F.current_timestamp().alias("data_processamento_gold"),
    )


def build_gold_balanco_patrimonial_latest(df_silver_bp: DataFrame) -> DataFrame:
    """Constrói Gold.vw_balanco_patrimonial_latest:

    Estrutura otimizada para o Eixo 2 (Consulta Financeira - Balanço Patrimonial):
    Hierarquia contábil preservada, escala explícita, valor em R$ pronto para consumo direto.
    """
    logger.info("Construindo Gold: vw_balanco_patrimonial_latest")
    return df_silver_bp.select(
        F.col("cnpj_cia").alias("cnpj"),
        F.col("dt_refer").alias("data_referencia"),
        F.col("versao").alias("versao_documento"),
        F.col("tipo_demonstracao"),
        F.col("classificacao_contabil"),
        F.col("ind_individual_consolidado").alias("consolidado_individual"),
        F.col("cd_conta").alias("codigo_conta"),
        F.col("ds_conta").alias("descricao_conta"),
        F.col("nivel_conta"),
        F.col("valor_original"),
        F.col("escala_original"),
        F.col("fator_escala"),
        F.col("valor_normalizado").alias("valor_reais"),
        F.col("moeda"),
        F.col("chave_logica"),
        F.col("exercicio_ano").alias("ano_exercicio"),
        F.current_timestamp().alias("data_processamento_gold"),
    )


def build_gold_resultado_latest(df_silver_dre: DataFrame) -> DataFrame:
    """Constrói Gold.vw_resultado_latest:

    Estrutura otimizada para o Eixo 2 (Consulta Financeira - DRE):
    Apresentação das contas de receitas, custos, despesas e lucros.
    """
    logger.info("Construindo Gold: vw_resultado_latest")
    return df_silver_dre.select(
        F.col("cnpj_cia").alias("cnpj"),
        F.col("dt_refer").alias("data_referencia"),
        F.col("versao").alias("versao_documento"),
        F.col("tipo_demonstracao"),
        F.col("grupo_dre"),
        F.col("ind_individual_consolidado").alias("consolidado_individual"),
        F.col("dt_ini_exerc").alias("periodo_inicio"),
        F.col("dt_fim_exerc").alias("periodo_fim"),
        F.col("cd_conta").alias("codigo_conta"),
        F.col("ds_conta").alias("descricao_conta"),
        F.col("nivel_conta"),
        F.col("valor_original"),
        F.col("escala_original"),
        F.col("fator_escala"),
        F.col("valor_normalizado").alias("valor_reais"),
        F.col("moeda"),
        F.col("chave_logica"),
        F.col("exercicio_ano").alias("ano_exercicio"),
        F.current_timestamp().alias("data_processamento_gold"),
    )


def build_gold_fluxo_caixa_latest(df_silver_dfc: DataFrame) -> DataFrame:
    """Constrói Gold.vw_fluxo_caixa_latest:

    Estrutura otimizada para o Eixo 2 (Consulta Financeira - DFC):
    Fluxo operacional, de investimento e financiamento (Direto e Indireto).
    """
    logger.info("Construindo Gold: vw_fluxo_caixa_latest")
    return df_silver_dfc.select(
        F.col("cnpj_cia").alias("cnpj"),
        F.col("dt_refer").alias("data_referencia"),
        F.col("versao").alias("versao_documento"),
        F.col("tipo_demonstracao"),
        F.col("metodo_dfc"),
        F.col("ind_individual_consolidado").alias("consolidado_individual"),
        F.col("dt_ini_exerc").alias("periodo_inicio"),
        F.col("dt_fim_exerc").alias("periodo_fim"),
        F.col("cd_conta").alias("codigo_conta"),
        F.col("ds_conta").alias("descricao_conta"),
        F.col("nivel_conta"),
        F.col("valor_original"),
        F.col("escala_original"),
        F.col("fator_escala"),
        F.col("valor_normalizado").alias("valor_reais"),
        F.col("moeda"),
        F.col("chave_logica"),
        F.col("exercicio_ano").alias("ano_exercicio"),
        F.current_timestamp().alias("data_processamento_gold"),
    )


def build_gold_demonstracao_financeira_latest(df_silver_demo: DataFrame) -> DataFrame:
    """Constrói Gold.vw_demonstracao_financeira_latest:

    Estrutura consolidada para consulta de DMPL, DRA, DVA e demais demonstrações.
    """
    logger.info("Construindo Gold: vw_demonstracao_financeira_latest")
    return df_silver_demo.select(
        F.col("cnpj_cia").alias("cnpj"),
        F.col("dt_refer").alias("data_referencia"),
        F.col("versao").alias("versao_documento"),
        F.col("tipo_demonstracao"),
        F.col("ind_individual_consolidado").alias("consolidado_individual"),
        F.col("dt_ini_exerc").alias("periodo_inicio"),
        F.col("dt_fim_exerc").alias("periodo_fim"),
        F.col("cd_conta").alias("codigo_conta"),
        F.col("ds_conta").alias("descricao_conta"),
        F.col("coluna_df").alias("coluna_demonstracao"),
        F.col("nivel_conta"),
        F.col("valor_original"),
        F.col("escala_original"),
        F.col("fator_escala"),
        F.col("valor_normalizado").alias("valor_reais"),
        F.col("moeda"),
        F.col("chave_logica"),
        F.col("exercicio_ano").alias("ano_exercicio"),
        F.current_timestamp().alias("data_processamento_gold"),
    )


def build_gold_composicao_capital(df_silver_cap: DataFrame) -> DataFrame:
    """Constrói Gold.fato_composicao_capital:

    Estrutura otimizada para o Eixo 3 (Documentos & Companhias):
    Ações em circulação, tesouraria e capital integralizado.
    """
    logger.info("Construindo Gold: fato_composicao_capital")
    return df_silver_cap.select(
        F.col("cnpj_cia").alias("cnpj"),
        F.col("dt_refer").alias("data_referencia"),
        F.col("versao").alias("versao_documento"),
        F.col("qt_acao_ordin_cap_integr").alias("acoes_ordinarias_integralizadas"),
        F.col("qt_acao_pref_cap_integr").alias("acoes_preferenciais_integralizadas"),
        F.col("qt_acao_total_cap_integr").alias("acoes_totais_integralizadas"),
        F.col("qt_acao_ordin_tesouro").alias("acoes_ordinarias_tesouraria"),
        F.col("qt_acao_pref_tesouro").alias("acoes_preferenciais_tesouraria"),
        F.col("qt_acao_total_tesouro").alias("acoes_totais_tesouraria"),
        F.col("exercicio_ano").alias("ano_exercicio"),
        F.current_timestamp().alias("data_processamento_gold"),
    )


def build_gold_parecer_auditoria(df_silver_parecer: DataFrame) -> DataFrame:
    """Constrói Gold.fato_parecer_auditoria:

    Estrutura otimizada para o Eixo 3 (Documentos):
    Pareceres, relatórios dos auditores independentes e declarações.
    """
    logger.info("Construindo Gold: fato_parecer_auditoria")
    return df_silver_parecer.select(
        F.col("cnpj_cia").alias("cnpj"),
        F.col("dt_refer").alias("data_referencia"),
        F.col("versao").alias("versao_documento"),
        F.col("tp_relat_aud").alias("tipo_relatorio_auditor"),
        F.col("tipo_parecer"),
        F.col("num_item_parecer_decl").alias("item_declaracao"),
        F.col("txt_parecer_decl").alias("texto_parecer_declaracao"),
        F.col("exercicio_ano").alias("ano_exercicio"),
        F.current_timestamp().alias("data_processamento_gold"),
    )


def build_gold_documento_cvm(df_silver_doc: DataFrame) -> DataFrame:
    """Constrói Gold.fato_documento_cvm:

    Estrutura otimizada para o Eixo 3 (Documentos):
    Histórico completo de entregas e versões de documentos CVM por empresa e exercício.
    """
    logger.info("Construindo Gold: fato_documento_cvm")
    return df_silver_doc.select(
        F.col("cnpj_cia").alias("cnpj"),
        F.col("denominacao_cia").alias("nome_empresa"),
        F.col("cd_cvm").alias("codigo_cvm"),
        F.col("dt_refer").alias("data_referencia"),
        F.col("versao").alias("versao_documento"),
        F.col("tipo_documento"),
        F.col("ind_individual_consolidado").alias("consolidado_individual"),
        F.col("dt_ini_exerc").alias("data_inicio_exercicio"),
        F.col("dt_fim_exerc").alias("data_fim_exercicio"),
        F.col("ordem_exerc").alias("ordem_exercicio"),
        F.col("exercicio_ano").alias("ano_exercicio"),
        F.current_timestamp().alias("data_processamento_gold"),
    )


# =============================================================================
# 7. PROCESSAMENTO INDIVIDUALIZADO DAS 8 ENTIDADES
# =============================================================================

def process_vw_companhia_atual(
    spark: SparkSession,
    base_path: Optional[str] = None,
    df_bronze_doc: Optional[DataFrame] = None,
    write_tables: bool = True,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    """Executa o pipeline Bronze -> Silver -> Gold para vw_companhia_atual."""
    logger.info(">>> Iniciando processamento: vw_companhia_atual")
    df_bronze = read_vw_companhia_atual(spark, base_path)
    df_silver = transform_silver_companhia_atual(df_bronze, df_bronze_doc)
    df_gold = build_gold_companhia_atual(df_silver)

    if write_tables:
        write_table_or_view(df_bronze, TABLE_BRONZE_COMPANHIA)
        write_table_or_view(df_silver, TABLE_SILVER_COMPANHIA)
        write_table_or_view(df_gold, TABLE_GOLD_COMPANHIA)

    return df_bronze, df_silver, df_gold


def process_vw_balanco_patrimonial_latest(
    spark: SparkSession,
    base_path: Optional[str] = None,
    write_tables: bool = True,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    """Executa o pipeline Bronze -> Silver -> Gold para vw_balanco_patrimonial_latest."""
    logger.info(">>> Iniciando processamento: vw_balanco_patrimonial_latest")
    df_bronze = read_vw_balanco_patrimonial_latest(spark, base_path)
    df_silver = transform_silver_balanco_patrimonial(df_bronze)
    df_gold = build_gold_balanco_patrimonial_latest(df_silver)

    if write_tables:
        write_table_or_view(df_bronze, TABLE_BRONZE_BALANCO)
        write_table_or_view(df_silver, TABLE_SILVER_BALANCO, partition_by=["exercicio_ano"])
        write_table_or_view(df_gold, TABLE_GOLD_BALANCO, partition_by=["ano_exercicio"])

    return df_bronze, df_silver, df_gold


def process_vw_resultado_latest(
    spark: SparkSession,
    base_path: Optional[str] = None,
    write_tables: bool = True,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    """Executa o pipeline Bronze -> Silver -> Gold para vw_resultado_latest."""
    logger.info(">>> Iniciando processamento: vw_resultado_latest")
    df_bronze = read_vw_resultado_latest(spark, base_path)
    df_silver = transform_silver_resultado(df_bronze)
    df_gold = build_gold_resultado_latest(df_silver)

    if write_tables:
        write_table_or_view(df_bronze, TABLE_BRONZE_RESULTADO)
        write_table_or_view(df_silver, TABLE_SILVER_RESULTADO, partition_by=["exercicio_ano"])
        write_table_or_view(df_gold, TABLE_GOLD_RESULTADO, partition_by=["ano_exercicio"])

    return df_bronze, df_silver, df_gold


def process_vw_fluxo_caixa_latest(
    spark: SparkSession,
    base_path: Optional[str] = None,
    write_tables: bool = True,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    """Executa o pipeline Bronze -> Silver -> Gold para vw_fluxo_caixa_latest."""
    logger.info(">>> Iniciando processamento: vw_fluxo_caixa_latest")
    df_bronze = read_vw_fluxo_caixa_latest(spark, base_path)
    df_silver = transform_silver_fluxo_caixa(df_bronze)
    df_gold = build_gold_fluxo_caixa_latest(df_silver)

    if write_tables:
        write_table_or_view(df_bronze, TABLE_BRONZE_FLUXO_CAIXA)
        write_table_or_view(df_silver, TABLE_SILVER_FLUXO_CAIXA, partition_by=["exercicio_ano"])
        write_table_or_view(df_gold, TABLE_GOLD_FLUXO_CAIXA, partition_by=["ano_exercicio"])

    return df_bronze, df_silver, df_gold


def process_vw_demonstracao_financeira_latest(
    spark: SparkSession,
    base_path: Optional[str] = None,
    write_tables: bool = True,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    """Executa o pipeline Bronze -> Silver -> Gold para vw_demonstracao_financeira_latest."""
    logger.info(">>> Iniciando processamento: vw_demonstracao_financeira_latest")
    df_bronze = read_vw_demonstracao_financeira_latest(spark, base_path)
    df_silver = transform_silver_demonstracao_financeira(df_bronze)
    df_gold = build_gold_demonstracao_financeira_latest(df_silver)

    if write_tables:
        write_table_or_view(df_bronze, TABLE_BRONZE_DEMONSTRACAO)
        write_table_or_view(df_silver, TABLE_SILVER_DEMONSTRACAO, partition_by=["exercicio_ano"])
        write_table_or_view(df_gold, TABLE_GOLD_DEMONSTRACAO, partition_by=["ano_exercicio"])

    return df_bronze, df_silver, df_gold


def process_fato_composicao_capital(
    spark: SparkSession,
    base_path: Optional[str] = None,
    write_tables: bool = True,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    """Executa o pipeline Bronze -> Silver -> Gold para fato_composicao_capital."""
    logger.info(">>> Iniciando processamento: fato_composicao_capital")
    df_bronze = read_fato_composicao_capital(spark, base_path)
    df_silver = transform_silver_composicao_capital(df_bronze)
    df_gold = build_gold_composicao_capital(df_silver)

    if write_tables:
        write_table_or_view(df_bronze, TABLE_BRONZE_COMPOSICAO)
        write_table_or_view(df_silver, TABLE_SILVER_COMPOSICAO, partition_by=["exercicio_ano"])
        write_table_or_view(df_gold, TABLE_GOLD_COMPOSICAO, partition_by=["ano_exercicio"])

    return df_bronze, df_silver, df_gold


def process_fato_parecer_auditoria(
    spark: SparkSession,
    base_path: Optional[str] = None,
    write_tables: bool = True,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    """Executa o pipeline Bronze -> Silver -> Gold para fato_parecer_auditoria."""
    logger.info(">>> Iniciando processamento: fato_parecer_auditoria")
    df_bronze = read_fato_parecer_auditoria(spark, base_path)
    df_silver = transform_silver_parecer_auditoria(df_bronze)
    df_gold = build_gold_parecer_auditoria(df_silver)

    if write_tables:
        write_table_or_view(df_bronze, TABLE_BRONZE_PARECER)
        write_table_or_view(df_silver, TABLE_SILVER_PARECER, partition_by=["exercicio_ano"])
        write_table_or_view(df_gold, TABLE_GOLD_PARECER, partition_by=["ano_exercicio"])

    return df_bronze, df_silver, df_gold


def process_fato_documento_cvm(
    spark: SparkSession,
    base_path: Optional[str] = None,
    write_tables: bool = True,
) -> Tuple[DataFrame, DataFrame, DataFrame]:
    """Executa o pipeline Bronze -> Silver -> Gold para fato_documento_cvm."""
    logger.info(">>> Iniciando processamento: fato_documento_cvm")
    df_bronze = read_fato_documento_cvm(spark, base_path)
    df_silver = transform_silver_documento_cvm(df_bronze)
    df_gold = build_gold_documento_cvm(df_silver)

    if write_tables:
        write_table_or_view(df_bronze, TABLE_BRONZE_DOCUMENTO)
        write_table_or_view(df_silver, TABLE_SILVER_DOCUMENTO, partition_by=["exercicio_ano"])
        write_table_or_view(df_gold, TABLE_GOLD_DOCUMENTO, partition_by=["ano_exercicio"])

    return df_bronze, df_silver, df_gold


# =============================================================================
# 8. VALIDAÇÃO DE QUALIDADE E INTEGRIDADE
# =============================================================================

def validate_pipeline_results(results: Dict[str, Dict[str, DataFrame]]) -> Dict[str, Any]:
    """Valida a qualidade dos dados gerados nas camadas Bronze, Silver e Gold."""
    logger.info("Iniciando validações de qualidade e integridade do pipeline...")
    report: Dict[str, Any] = {
        "status": "SUCESSO",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "entidades": {},
    }

    for entity, layers in results.items():
        bronze_count = layers["bronze"].count()
        silver_count = layers["silver"].count()
        gold_count = layers["gold"].count()

        entity_report = {
            "bronze_count": bronze_count,
            "silver_count": silver_count,
            "gold_count": gold_count,
            "silver_le_bronze": silver_count <= bronze_count,
            "gold_eq_silver": gold_count == silver_count,
        }

        # Checagem de nulos críticos em Gold
        gold_df = layers["gold"]
        null_cnpj = gold_df.filter(F.col("cnpj").isNull() | (F.length(F.col("cnpj")) != 14)).count()
        entity_report["invalid_cnpj_count"] = null_cnpj

        if null_cnpj > 0:
            report["status"] = "ALERTA"
            logger.warning("[%s] Encontrados %d registros com CNPJ inválido em Gold!", entity, null_cnpj)

        report["entidades"][entity] = entity_report
        logger.info(
            "[%s] Bronze: %d | Silver: %d | Gold: %d | CNPJ inválidos: %d",
            entity,
            bronze_count,
            silver_count,
            gold_count,
            null_cnpj,
        )

    return report


# =============================================================================
# 9. PONTO DE EXECUÇÃO PRINCIPAL
# =============================================================================

def run_portal_cvm_medallion_pipeline(
    spark: Optional[SparkSession] = None,
    base_path: Optional[str] = None,
    write_tables: bool = True,
) -> Dict[str, Any]:
    """Orquestrador principal do pipeline medalhão end-to-end:

    1. Validar conexão/configuração Databricks
    2. Identificar origens físicas
    3. Executar Bronze
    4. Executar Silver
    5. Executar Gold
    6. Validar resultados e qualidade
    7. Persistir estruturas finais
    """
    start_time = datetime.now(timezone.utc)
    logger.info("=================================================================")
    logger.info("INICIANDO PIPELINE PYSPARK MEDALLION — PORTAL CVM SELF-SERVICE")
    logger.info("=================================================================")
    logger.info("Catálogo Databricks: %s", DATABRICKS_CATALOG)
    logger.info("Volume de Origem:   %s", base_path or BASE_VOLUME_PATH)

    # 1. Validar conexão/configuração
    if spark is None:
        spark = get_or_create_spark()

    # 2. Identificar origens e carregar documento CVM preliminar (para enriquecimento)
    logger.info("Etapa 1: Carregando fato_documento_cvm para mapeamento de Código CVM...")
    doc_bronze, doc_silver, doc_gold = process_fato_documento_cvm(
        spark, base_path=base_path, write_tables=write_tables
    )

    # 3. Processar as demais entidades individualmente
    results: Dict[str, Dict[str, DataFrame]] = {
        "fato_documento_cvm": {"bronze": doc_bronze, "silver": doc_silver, "gold": doc_gold},
    }

    # Companhia Atual (enriquecida com doc_bronze)
    comp_bronze, comp_silver, comp_gold = process_vw_companhia_atual(
        spark, base_path=base_path, df_bronze_doc=doc_bronze, write_tables=write_tables
    )
    results["vw_companhia_atual"] = {"bronze": comp_bronze, "silver": comp_silver, "gold": comp_gold}

    # Balanço Patrimonial
    bp_bronze, bp_silver, bp_gold = process_vw_balanco_patrimonial_latest(
        spark, base_path=base_path, write_tables=write_tables
    )
    results["vw_balanco_patrimonial_latest"] = {"bronze": bp_bronze, "silver": bp_silver, "gold": bp_gold}

    # DRE (Resultado)
    dre_bronze, dre_silver, dre_gold = process_vw_resultado_latest(
        spark, base_path=base_path, write_tables=write_tables
    )
    results["vw_resultado_latest"] = {"bronze": dre_bronze, "silver": dre_silver, "gold": dre_gold}

    # DFC (Fluxo de Caixa)
    dfc_bronze, dfc_silver, dfc_gold = process_vw_fluxo_caixa_latest(
        spark, base_path=base_path, write_tables=write_tables
    )
    results["vw_fluxo_caixa_latest"] = {"bronze": dfc_bronze, "silver": dfc_silver, "gold": dfc_gold}

    # Demonstrações Gerais (DMPL, DRA, DVA, etc.)
    demo_bronze, demo_silver, demo_gold = process_vw_demonstracao_financeira_latest(
        spark, base_path=base_path, write_tables=write_tables
    )
    results["vw_demonstracao_financeira_latest"] = {"bronze": demo_bronze, "silver": demo_silver, "gold": demo_gold}

    # Composição de Capital
    cap_bronze, cap_silver, cap_gold = process_fato_composicao_capital(
        spark, base_path=base_path, write_tables=write_tables
    )
    results["fato_composicao_capital"] = {"bronze": cap_bronze, "silver": cap_silver, "gold": cap_gold}

    # Parecer de Auditoria
    par_bronze, par_silver, par_gold = process_fato_parecer_auditoria(
        spark, base_path=base_path, write_tables=write_tables
    )
    results["fato_parecer_auditoria"] = {"bronze": par_bronze, "silver": par_silver, "gold": par_gold}

    # 4. Validar resultados e qualidade
    quality_report = validate_pipeline_results(results)

    end_time = datetime.now(timezone.utc)
    duration = (end_time - start_time).total_seconds()
    logger.info("=================================================================")
    logger.info("PIPELINE CONCLUÍDO COM SUCESSO EM %.2f SEGUNDOS", duration)
    logger.info("Status da Qualidade: %s", quality_report["status"])
    logger.info("=================================================================")

    return {
        "status": "COMPLETED",
        "duration_seconds": duration,
        "quality_report": quality_report,
    }


if __name__ == "__main__":
    # Ponto de entrada padrão para execução via spark-submit ou Databricks job/notebook
    spark_session = get_or_create_spark()
    run_portal_cvm_medallion_pipeline(spark=spark_session, write_tables=True)
