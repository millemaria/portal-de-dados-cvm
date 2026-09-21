# Databricks notebook source
# MAGIC %md
# MAGIC # Silver Layer — Transform Companies (vw_companhia_atual / companies)
# MAGIC Lê todas as partições da camada Silver/Lakehouse e extrai o universo completo de companhias abertas sem limitações.

from pyspark.sql import functions as F
from pyspark.sql.window import Window
import os

# COMMAND ----------

def transform_companies(catalog="portal_cvm", bronze_schema="bronze", silver_schema="silver", silver_base_path="cvm_lakehouse/silver"):
    """
    Cria silver.vw_companhia_atual e silver.companies a partir dos dados do Lakehouse.
    Lê todas as partições disponíveis sem limitação artificial de quantidade de empresas.
    """
    try:
        from process_silver_entities import process_vw_companhia_atual
        df_dedup, metrics = process_vw_companhia_atual(spark, silver_base_path, catalog, silver_schema)
    except Exception:
        # Fallback de leitura se invocado isoladamente
        reader = (
            spark.read
            .option("header", "true")
            .option("sep", ";")
            .option("encoding", "ISO-8859-1")
            .option("recursiveFileLookup", "true")
            .option("pathGlobFilter", "*.csv")
        )
        try:
            raw_companies = reader.csv(f"{silver_base_path}/companhia")
        except Exception:
            raw_companies = spark.table(f"{catalog}.{bronze_schema}.dfp_bpa")

        # Padronização de colunas
        cols = {c.upper(): c for c in raw_companies.columns}
        cnpj_col = cols.get("CNPJ_CIA", cols.get("CNPJ", "cnpj_cia"))
        denom_col = cols.get("DENOM_CIA", cols.get("DENOMINACAO_CIA", cols.get("DENOMINACAO_SOCIAL", "denominacao_cia")))
        cd_cvm_col = cols.get("CD_CVM", "cd_cvm")
        dt_ref_col = cols.get("DT_REFER", cols.get("DATA_REGISTRO", "dt_refer"))
        versao_col = cols.get("VERSAO", "versao")

        companies = (
            raw_companies
            .select(
                F.col(cnpj_col).alias("cnpj"),
                F.col(denom_col).alias("company_name"),
                (F.col(cd_cvm_col) if cd_cvm_col in raw_companies.columns else F.lit(None)).alias("cd_cvm"),
                (F.col(dt_ref_col) if dt_ref_col in raw_companies.columns else F.lit(None)).alias("reference_date"),
                (F.col(versao_col) if versao_col in raw_companies.columns else F.lit(1)).alias("version"),
            )
            .withColumn("cnpj", F.trim(F.col("cnpj")))
            .withColumn("company_name", F.trim(F.upper(F.col("company_name"))))
            .withColumn("cd_cvm", F.trim(F.col("cd_cvm")))
            .filter(F.col("cnpj").isNotNull() & (F.col("cnpj") != ""))
        )

        window = Window.partitionBy("cnpj").orderBy(
            F.col("reference_date").desc_nulls_last(),
            F.col("version").cast("int").desc_nulls_last()
        )

        df_dedup = (
            companies
            .withColumn("row_num", F.row_number().over(window))
            .filter(F.col("row_num") == 1)
            .drop("row_num", "version")
            .withColumn("status", F.lit("ATIVO"))
            .withColumn("ticker", F.lit(None).cast("string"))
        )

    # Persistir também como silver.companies para compatibilidade
    table_name = f"{catalog}.{silver_schema}.companies"
    df_dedup.write.format("delta").mode("overwrite").saveAsTable(table_name)

    total_rows = df_dedup.count()
    distinct_cnpj = (
        df_dedup.select("cnpj_cia" if "cnpj_cia" in df_dedup.columns else "cnpj")
        .distinct()
        .count()
    )

    print(f"✓ Silver companies concluída:")
    print(f"  • Total de registros gravados: {total_rows:,}")
    print(f"  • Total de empresas distintas: {distinct_cnpj:,}")
    print(f"  • Tabela salva: {table_name}")

    return df_dedup

# COMMAND ----------

# Execute:
# transform_companies("portal_cvm", "bronze", "silver", "cvm_lakehouse/silver")

