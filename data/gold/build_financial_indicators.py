# Databricks notebook source
# MAGIC %md
# MAGIC # Gold Layer — Financial Indicators
# MAGIC Calcula índices financeiros (ROE, ROA, Margens, Liquidez Corrente, Dívida/PL) para **todas as companhias** e todos os períodos históricos disponíveis na Silver.

from pyspark.sql import functions as F
from pyspark.sql.window import Window

# COMMAND ----------

def build_financial_indicators(catalog="portal_cvm", silver_schema="silver", gold_schema="gold"):
    """
    Constrói a tabela gold.financial_indicators com indicadores para todas as companhias.
    Uma linha por empresa por data de referência.
    """
    try:
        balance = spark.table(f"{catalog}.{silver_schema}.vw_balanco_patrimonial_latest")
    except Exception:
        balance = spark.table(f"{catalog}.{silver_schema}.balance_sheet")

    try:
        income = spark.table(f"{catalog}.{silver_schema}.vw_resultado_latest")
    except Exception:
        income = spark.table(f"{catalog}.{silver_schema}.income_statement")

    # Padronização de identificadores
    bal = (
        balance
        .withColumn("cnpj", F.coalesce(F.col("cnpj_cia"), F.col("cnpj") if "cnpj" in balance.columns else F.col("cnpj_cia")))
        .withColumn("consolidation_type", F.coalesce(F.col("grupo_dfp"), F.col("consolidation_type") if "consolidation_type" in balance.columns else F.lit("CON")))
        .withColumn("account_code", F.coalesce(F.col("cd_conta"), F.col("account_code") if "account_code" in balance.columns else F.col("cd_conta")))
        .withColumn("statement_side", F.coalesce(F.col("statement_side"), F.lit("ATIVO")))
        .withColumn("value", F.coalesce(F.col("vl_conta"), F.col("value") if "value" in balance.columns else F.col("vl_conta")).cast("double"))
        .withColumn("reference_date", F.coalesce(F.col("dt_refer"), F.col("reference_date") if "reference_date" in balance.columns else F.col("dt_refer")))
        .withColumn("currency_scale", F.coalesce(F.col("escala_moeda"), F.col("currency_scale") if "currency_scale" in balance.columns else F.lit("MIL")))
        .filter(F.col("consolidation_type") == "CON")
    )

    inc = (
        income
        .withColumn("cnpj", F.coalesce(F.col("cnpj_cia"), F.col("cnpj") if "cnpj" in income.columns else F.col("cnpj_cia")))
        .withColumn("consolidation_type", F.coalesce(F.col("grupo_dfp"), F.col("consolidation_type") if "consolidation_type" in income.columns else F.lit("CON")))
        .withColumn("account_code", F.coalesce(F.col("cd_conta"), F.col("account_code") if "account_code" in income.columns else F.col("cd_conta")))
        .withColumn("value", F.coalesce(F.col("vl_conta"), F.col("value") if "value" in income.columns else F.col("vl_conta")).cast("double"))
        .withColumn("reference_date", F.coalesce(F.col("dt_refer"), F.col("reference_date") if "reference_date" in income.columns else F.col("dt_refer")))
        .filter(F.col("consolidation_type") == "CON")
    )

    # Função para extrair contas específicas do balanço
    def get_bal_account(code, side, alias):
        return (
            bal.filter((F.col("account_code") == code) & (F.col("statement_side") == side))
            .select("cnpj", "reference_date", F.col("value").alias(alias), "currency_scale")
        )

    # Função para extrair contas específicas da DRE
    def get_inc_account(code, alias):
        return (
            inc.filter(F.col("account_code") == code)
            .select("cnpj", "reference_date", F.col("value").alias(alias))
        )

    total_assets = get_bal_account("1", "ATIVO", "total_assets")
    current_assets = get_bal_account("1.01", "ATIVO", "current_assets")
    total_equity = get_bal_account("2.03", "PASSIVO", "total_equity")
    current_liabilities = get_bal_account("2.01", "PASSIVO", "current_liabilities")

    net_revenue = get_inc_account("3.01", "net_revenue")
    gross_profit = get_inc_account("3.03", "gross_profit")
    net_income = get_inc_account("3.08", "net_income")

    # Join das métricas
    indicators = (
        total_assets
        .join(current_assets, ["cnpj", "reference_date"], "left")
        .join(total_equity, ["cnpj", "reference_date"], "left")
        .join(current_liabilities, ["cnpj", "reference_date"], "left")
        .join(net_revenue, ["cnpj", "reference_date"], "left")
        .join(gross_profit, ["cnpj", "reference_date"], "left")
        .join(net_income, ["cnpj", "reference_date"], "left")
    )

    # Cálculo dos índices financeiros
    indicators = (
        indicators
        .withColumn("roe", F.when((F.col("total_equity").isNotNull()) & (F.col("total_equity") != 0),
            F.col("net_income") / F.col("total_equity")))
        .withColumn("roa", F.when((F.col("total_assets").isNotNull()) & (F.col("total_assets") != 0),
            F.col("net_income") / F.col("total_assets")))
        .withColumn("net_margin", F.when((F.col("net_revenue").isNotNull()) & (F.col("net_revenue") != 0),
            F.col("net_income") / F.col("net_revenue")))
        .withColumn("gross_margin", F.when((F.col("net_revenue").isNotNull()) & (F.col("net_revenue") != 0),
            F.col("gross_profit") / F.col("net_revenue")))
        .withColumn("current_ratio", F.when((F.col("current_liabilities").isNotNull()) & (F.col("current_liabilities") != 0),
            F.col("current_assets") / F.col("current_liabilities")))
        .withColumn("debt_to_equity", F.when((F.col("total_equity").isNotNull()) & (F.col("total_equity") != 0),
            (F.col("total_assets") - F.col("total_equity")) / F.col("total_equity")))
    )

    table_name = f"{catalog}.{gold_schema}.financial_indicators"
    indicators.write.format("delta").mode("overwrite").saveAsTable(table_name)

    total_rows = indicators.count()
    distinct_companies = indicators.select("cnpj").distinct().count()

    print("=" * 80)
    print(f"GOLD LAYER — FINANCIAL INDICATORS")
    print(f"  • Total de registros gravados na Gold: {total_rows:,}")
    print(f"  • Total de empresas com indicadores:   {distinct_companies:,}")
    print(f"  • Tabela de destino:                  {table_name}")
    print("=" * 80)

    return indicators

# COMMAND ----------

# Execute:
# build_financial_indicators("portal_cvm", "silver", "gold")

