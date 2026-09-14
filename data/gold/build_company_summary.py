# Databricks notebook source
# MAGIC %md
# MAGIC # Gold Layer — Company Summary
# MAGIC Creates `gold.company_summary` table with latest financial position per company.
# MAGIC This is the primary table consumed by the API for company listings.

from pyspark.sql import functions as F
from pyspark.sql.window import Window

# COMMAND ----------

def build_company_summary(catalog, silver_schema, gold_schema):
    """
    Build company_summary from Silver tables.
    Joins company data with latest balance sheet and income statement values.
    """
    companies = spark.table(f"{catalog}.{silver_schema}.companies")
    balance = spark.table(f"{catalog}.{silver_schema}.balance_sheet")
    income = spark.table(f"{catalog}.{silver_schema}.income_statement")

    # Get latest consolidated balance sheet per company
    latest_window = Window.partitionBy("cd_cvm").orderBy(
        F.col("reference_date").desc(), F.col("version").desc()
    )

    # Total Assets (account_code = "1")
    total_assets = (
        balance
        .filter(
            (F.col("consolidation_type") == "CON") &
            (F.col("account_code") == "1") &
            (F.col("statement_side") == "ATIVO")
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .select("cd_cvm", F.col("value").alias("total_assets"), "currency_scale",
                F.col("reference_date").alias("latest_reference_date"))
    )

    # Total Equity (account_code = "2.03")
    total_equity = (
        balance
        .filter(
            (F.col("consolidation_type") == "CON") &
            (F.col("account_code") == "2.03") &
            (F.col("statement_side") == "PASSIVO")
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .select("cd_cvm", F.col("value").alias("total_equity"))
    )

    # Net Revenue (account_code = "3.01")
    net_revenue = (
        income
        .filter(
            (F.col("consolidation_type") == "CON") &
            (F.col("account_code") == "3.01")
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .select("cd_cvm", F.col("value").alias("net_revenue"))
    )

    # Net Income (account_code = "3.08" or "3.11")
    net_income = (
        income
        .filter(
            (F.col("consolidation_type") == "CON") &
            (F.col("account_code").isin("3.08", "3.11"))
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .select("cd_cvm", F.col("value").alias("net_income"))
    )

    # Join everything
    summary = (
        companies
        .join(total_assets, "cd_cvm", "left")
        .join(total_equity, "cd_cvm", "left")
        .join(net_revenue, "cd_cvm", "left")
        .join(net_income, "cd_cvm", "left")
        .select(
            "cd_cvm", "cnpj", "company_name", "ticker", "status",
            "latest_reference_date", "total_assets", "total_equity",
            "net_revenue", "net_income", "currency_scale"
        )
    )

    table_name = f"{catalog}.{gold_schema}.company_summary"
    summary.write.format("delta").mode("overwrite").saveAsTable(table_name)
    print(f"✓ {table_name}: {summary.count()} rows")

# COMMAND ----------

# Execute:
# build_company_summary("portal_cvm", "silver", "gold")
