# Databricks notebook source
# MAGIC %md
# MAGIC # Gold Layer — Financial Indicators
# MAGIC Computes financial ratios and metrics from Silver tables.
# MAGIC Creates `gold.financial_indicators` consumed by the API.

from pyspark.sql import functions as F
from pyspark.sql.window import Window

# COMMAND ----------

def build_financial_indicators(catalog, silver_schema, gold_schema):
    """
    Build financial_indicators table with ROE, ROA, margins, liquidity.
    One row per company per reference_date.
    """
    balance = spark.table(f"{catalog}.{silver_schema}.balance_sheet")
    income = spark.table(f"{catalog}.{silver_schema}.income_statement")

    # Filter consolidated only
    bal = balance.filter(F.col("consolidation_type") == "CON")
    inc = income.filter(F.col("consolidation_type") == "CON")

    # Pivot key accounts from balance sheet
    def get_account(df, code, side, alias):
        return (
            df.filter((F.col("account_code") == code) & (F.col("statement_side") == side))
            .select("cd_cvm", "reference_date", F.col("value").alias(alias), "currency_scale")
        )

    total_assets = get_account(bal, "1", "ATIVO", "total_assets")
    current_assets = get_account(bal, "1.01", "ATIVO", "current_assets")
    total_equity = get_account(bal, "2.03", "PASSIVO", "total_equity")
    current_liabilities = get_account(bal, "2.01", "PASSIVO", "current_liabilities")

    # Pivot key accounts from income statement
    def get_income_account(df, code, alias):
        return (
            df.filter(F.col("account_code") == code)
            .select("cd_cvm", "reference_date", F.col("value").alias(alias))
        )

    net_revenue = get_income_account(inc, "3.01", "net_revenue")
    gross_profit = get_income_account(inc, "3.03", "gross_profit")
    net_income = get_income_account(inc, "3.08", "net_income")

    # Join all metrics
    indicators = (
        total_assets
        .join(current_assets, ["cd_cvm", "reference_date"], "left")
        .join(total_equity, ["cd_cvm", "reference_date"], "left")
        .join(current_liabilities, ["cd_cvm", "reference_date"], "left")
        .join(net_revenue, ["cd_cvm", "reference_date"], "left")
        .join(gross_profit, ["cd_cvm", "reference_date"], "left")
        .join(net_income, ["cd_cvm", "reference_date"], "left")
    )

    # Compute ratios
    indicators = (
        indicators
        .withColumn("roe", F.when(F.col("total_equity") != 0,
            F.col("net_income") / F.col("total_equity")))
        .withColumn("roa", F.when(F.col("total_assets") != 0,
            F.col("net_income") / F.col("total_assets")))
        .withColumn("net_margin", F.when(F.col("net_revenue") != 0,
            F.col("net_income") / F.col("net_revenue")))
        .withColumn("gross_margin", F.when(F.col("net_revenue") != 0,
            F.col("gross_profit") / F.col("net_revenue")))
        .withColumn("current_ratio", F.when(F.col("current_liabilities") != 0,
            F.col("current_assets") / F.col("current_liabilities")))
        .withColumn("debt_to_equity", F.when(F.col("total_equity") != 0,
            (F.col("total_assets") - F.col("total_equity")) / F.col("total_equity")))
    )

    table_name = f"{catalog}.{gold_schema}.financial_indicators"
    indicators.write.format("delta").mode("overwrite").saveAsTable(table_name)
    print(f"✓ {table_name}: {indicators.count()} rows")

# COMMAND ----------

# Execute:
# build_financial_indicators("portal_cvm", "silver", "gold")
