# Databricks notebook source
# MAGIC %md
# MAGIC # Silver Layer — Transform Financial Statements
# MAGIC Cleans, normalizes and structures Bronze DFP data into Silver tables:
# MAGIC - silver.balance_sheet (BPA + BPP)
# MAGIC - silver.income_statement (DRE)
# MAGIC - silver.cash_flow (DFC_MI / DFC_MD)

from pyspark.sql import functions as F

# COMMAND ----------

def transform_financial_statements(catalog, bronze_schema, silver_schema):
    """Transform Bronze DFP tables into normalized Silver tables."""

    _transform_balance_sheet(catalog, bronze_schema, silver_schema)
    _transform_income_statement(catalog, bronze_schema, silver_schema)
    _transform_cash_flow(catalog, bronze_schema, silver_schema)


def _clean_dfp(df):
    """Common cleaning applied to all DFP tables."""
    return (
        df
        .withColumn("cd_cvm", F.trim(F.col("CD_CVM")))
        .withColumn("cnpj", F.trim(F.col("CNPJ_CIA")))
        .withColumn("company_name", F.trim(F.col("DENOM_CIA")))
        .withColumn("reference_date", F.to_date(F.col("DT_REFER")))
        .withColumn("period_start", F.to_date(F.col("DT_INI_EXERC")))
        .withColumn("period_end", F.to_date(F.col("DT_FIM_EXERC")))
        .withColumn("version", F.col("VERSAO").cast("int"))
        .withColumn("consolidation_type", F.trim(F.col("GRUPO_DFP")))
        .withColumn("currency", F.trim(F.col("MOEDA")))
        .withColumn("currency_scale", F.trim(F.col("ESCALA_MOEDA")))
        .withColumn("exercise_order", F.trim(F.col("ORDEM_EXERC")))
        .withColumn("account_code", F.trim(F.col("CD_CONTA")))
        .withColumn("account_description", F.trim(F.col("DS_CONTA")))
        .withColumn("value", F.col("VL_CONTA").cast("double"))
        .withColumn("level", F.size(F.split(F.col("account_code"), "\\.")))
        .filter(F.col("exercise_order") == "ÚLTIMO")
    )


def _transform_balance_sheet(catalog, bronze_schema, silver_schema):
    """Combine BPA and BPP into balance_sheet."""
    bpa = spark.table(f"{catalog}.{bronze_schema}.dfp_bpa")
    bpp = spark.table(f"{catalog}.{bronze_schema}.dfp_bpp")

    bpa_clean = _clean_dfp(bpa).withColumn("statement_side", F.lit("ATIVO"))
    bpp_clean = _clean_dfp(bpp).withColumn("statement_side", F.lit("PASSIVO"))

    balance_sheet = bpa_clean.unionByName(bpp_clean).select(
        "cd_cvm", "cnpj", "company_name", "reference_date",
        "period_start", "period_end", "version", "consolidation_type",
        "currency", "currency_scale", "account_code", "account_description",
        "value", "level", "statement_side"
    )

    table_name = f"{catalog}.{silver_schema}.balance_sheet"
    balance_sheet.write.format("delta").mode("overwrite").saveAsTable(table_name)
    print(f"✓ {table_name}: {balance_sheet.count()} rows")


def _transform_income_statement(catalog, bronze_schema, silver_schema):
    """Transform DRE into income_statement."""
    dre = spark.table(f"{catalog}.{bronze_schema}.dfp_dre")
    income = _clean_dfp(dre).select(
        "cd_cvm", "cnpj", "company_name", "reference_date",
        "period_start", "period_end", "version", "consolidation_type",
        "currency", "currency_scale", "account_code", "account_description",
        "value", "level"
    )

    table_name = f"{catalog}.{silver_schema}.income_statement"
    income.write.format("delta").mode("overwrite").saveAsTable(table_name)
    print(f"✓ {table_name}: {income.count()} rows")


def _transform_cash_flow(catalog, bronze_schema, silver_schema):
    """Transform DFC_MI into cash_flow."""
    dfc = spark.table(f"{catalog}.{bronze_schema}.dfp_dfc")
    cash_flow = _clean_dfp(dfc).select(
        "cd_cvm", "cnpj", "company_name", "reference_date",
        "period_start", "period_end", "version", "consolidation_type",
        "currency", "currency_scale", "account_code", "account_description",
        "value", "level"
    ).withColumn("method", F.lit("MI"))

    table_name = f"{catalog}.{silver_schema}.cash_flow"
    cash_flow.write.format("delta").mode("overwrite").saveAsTable(table_name)
    print(f"✓ {table_name}: {cash_flow.count()} rows")

# COMMAND ----------

# Execute:
# transform_financial_statements("portal_cvm", "bronze", "silver")
