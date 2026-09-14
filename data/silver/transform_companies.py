# Databricks notebook source
# MAGIC %md
# MAGIC # Silver Layer — Transform Companies
# MAGIC Extracts unique company records from Bronze data, normalizes and deduplicates.

from pyspark.sql import functions as F
from pyspark.sql.window import Window

# COMMAND ----------

def transform_companies(catalog, bronze_schema, silver_schema):
    """
    Create silver.companies table from Bronze DFP data.
    Deduplicates by CNPJ, keeps the latest version.
    """
    # Read from any Bronze table to extract company info
    bronze_bpa = spark.table(f"{catalog}.{bronze_schema}.dfp_bpa")

    # Select company columns and deduplicate
    companies = (
        bronze_bpa
        .select(
            F.col("CNPJ_CIA").alias("cnpj"),
            F.col("DENOM_CIA").alias("company_name"),
            F.col("CD_CVM").alias("cd_cvm"),
            F.col("DT_REFER").alias("reference_date"),
            F.col("VERSAO").alias("version"),
        )
        .withColumn("cnpj", F.trim(F.col("cnpj")))
        .withColumn("company_name", F.trim(F.upper(F.col("company_name"))))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")))
    )

    # Keep only the latest version per company
    window = Window.partitionBy("cd_cvm").orderBy(
        F.col("reference_date").desc(),
        F.col("version").desc()
    )

    companies_deduped = (
        companies
        .withColumn("row_num", F.row_number().over(window))
        .filter(F.col("row_num") == 1)
        .drop("row_num", "version")
        .withColumn("status", F.lit("ATIVO"))
        .withColumn("ticker", F.lit(None).cast("string"))  # To be enriched
    )

    # Write to Silver
    table_name = f"{catalog}.{silver_schema}.companies"
    (
        companies_deduped.write
        .format("delta")
        .mode("overwrite")
        .saveAsTable(table_name)
    )

    print(f"✓ Silver companies: {companies_deduped.count()} rows → {table_name}")

# COMMAND ----------

# Execute:
# transform_companies("portal_cvm", "bronze", "silver")
