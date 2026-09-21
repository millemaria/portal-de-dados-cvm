# Databricks notebook source
# MAGIC %md
# MAGIC # Gold Layer — Company Summary
# MAGIC Cria a tabela `gold.company_summary` com o resumo e os principais totais financeiros de **TODAS as companhias** da base Silver.
# MAGIC Esta tabela é consumida diretamente pela API REST do Portal CVM.

from pyspark.sql import functions as F
from pyspark.sql.window import Window

# COMMAND ----------

def build_company_summary(catalog="portal_cvm", silver_schema="silver", gold_schema="gold"):
    """
    Constrói gold.company_summary a partir das tabelas/views Silver.
    Une todas as empresas da vw_companhia_atual com os saldos mais recentes de balanço e DRE.
    NÃO limita a quantidade de empresas.
    """
    try:
        companies = spark.table(f"{catalog}.{silver_schema}.vw_companhia_atual")
    except Exception:
        companies = spark.table(f"{catalog}.{silver_schema}.companies")

    balance = spark.table(f"{catalog}.{silver_schema}.vw_balanco_patrimonial_latest")
    income = spark.table(f"{catalog}.{silver_schema}.vw_resultado_latest")

    # Padronização de identificadores para join
    comp = (
        companies
        .withColumn("cnpj", F.coalesce(F.col("cnpj_cia"), F.col("cnpj") if "cnpj" in companies.columns else F.col("cnpj_cia")))
        .withColumn("company_name", F.coalesce(F.col("denominacao_cia"), F.col("company_name") if "company_name" in companies.columns else F.col("denominacao_cia")))
        .withColumn("cd_cvm", F.col("cd_cvm") if "cd_cvm" in companies.columns else F.lit(None).cast("string"))
        .withColumn("ticker", F.col("ticker") if "ticker" in companies.columns else F.lit(None).cast("string"))
        .withColumn("sector", F.col("setor_atividade") if "setor_atividade" in companies.columns else F.col("sector") if "sector" in companies.columns else F.lit(None).cast("string"))
        .withColumn("sub_sector", F.col("sub_sector") if "sub_sector" in companies.columns else F.lit(None).cast("string"))
        .withColumn("segment", F.col("segmento") if "segmento" in companies.columns else F.col("segment") if "segment" in companies.columns else F.lit(None).cast("string"))
        .withColumn("status", F.coalesce(F.col("situacao"), F.col("status") if "status" in companies.columns else F.lit("ATIVO")))
    )

    bal = (
        balance
        .withColumn("cnpj", F.coalesce(F.col("cnpj_cia"), F.col("cnpj") if "cnpj" in balance.columns else F.col("cnpj_cia")))
        .withColumn("consolidation_type", F.coalesce(F.col("grupo_dfp"), F.col("consolidation_type") if "consolidation_type" in balance.columns else F.lit("CON")))
        .withColumn("account_code", F.coalesce(F.col("cd_conta"), F.col("account_code") if "account_code" in balance.columns else F.col("cd_conta")))
        .withColumn("statement_side", F.coalesce(F.col("statement_side"), F.lit("ATIVO")))
        .withColumn("value", F.coalesce(F.col("vl_conta"), F.col("value") if "value" in balance.columns else F.col("vl_conta")).cast("double"))
        .withColumn("reference_date", F.coalesce(F.col("dt_refer"), F.col("reference_date") if "reference_date" in balance.columns else F.col("dt_refer")))
        .withColumn("version", F.coalesce(F.col("versao"), F.col("version") if "version" in balance.columns else F.lit(1)).cast("int"))
        .withColumn("currency_scale", F.coalesce(F.col("escala_moeda"), F.col("currency_scale") if "currency_scale" in balance.columns else F.lit("MIL")))
    )

    inc = (
        income
        .withColumn("cnpj", F.coalesce(F.col("cnpj_cia"), F.col("cnpj") if "cnpj" in income.columns else F.col("cnpj_cia")))
        .withColumn("consolidation_type", F.coalesce(F.col("grupo_dfp"), F.col("consolidation_type") if "consolidation_type" in income.columns else F.lit("CON")))
        .withColumn("account_code", F.coalesce(F.col("cd_conta"), F.col("account_code") if "account_code" in income.columns else F.col("cd_conta")))
        .withColumn("value", F.coalesce(F.col("vl_conta"), F.col("value") if "value" in income.columns else F.col("vl_conta")).cast("double"))
        .withColumn("reference_date", F.coalesce(F.col("dt_refer"), F.col("reference_date") if "reference_date" in income.columns else F.col("dt_refer")))
        .withColumn("version", F.coalesce(F.col("versao"), F.col("version") if "version" in income.columns else F.lit(1)).cast("int"))
    )

    # Window para o balanço consolidado mais recente por CNPJ
    latest_window = Window.partitionBy("cnpj").orderBy(
        F.col("reference_date").desc_nulls_last(), F.col("version").desc_nulls_last()
    )

    # Ativo Total (1)
    total_assets = (
        bal
        .filter(
            (F.col("consolidation_type") == "CON") &
            (F.col("account_code") == "1")
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .select("cnpj", F.col("value").alias("total_assets"), "currency_scale",
                F.col("reference_date").alias("latest_reference_date"))
    )

    # Patrimônio Líquido (2.03)
    total_equity = (
        bal
        .filter(
            (F.col("consolidation_type") == "CON") &
            (F.col("account_code") == "2.03")
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .select("cnpj", F.col("value").alias("total_equity"))
    )

    # Receita Líquida (3.01)
    net_revenue = (
        inc
        .filter(
            (F.col("consolidation_type") == "CON") &
            (F.col("account_code") == "3.01")
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .select("cnpj", F.col("value").alias("net_revenue"))
    )

    # Lucro Líquido (3.08 ou 3.11)
    net_income = (
        inc
        .filter(
            (F.col("consolidation_type") == "CON") &
            (F.col("account_code").isin("3.08", "3.11", "3.09", "3.13"))
        )
        .withColumn("rn", F.row_number().over(latest_window))
        .filter(F.col("rn") == 1)
        .select("cnpj", F.col("value").alias("net_income"))
    )

    # Join com preservação de 100% das companhias
    summary = (
        comp
        .join(total_assets, "cnpj", "left")
        .join(total_equity, "cnpj", "left")
        .join(net_revenue, "cnpj", "left")
        .join(net_income, "cnpj", "left")
        .select(
            "cd_cvm", "cnpj", "company_name", "ticker", "sector", "sub_sector", "segment", "status",
            "latest_reference_date", "total_assets", "total_equity",
            "net_revenue", "net_income",
            F.coalesce(F.col("currency_scale"), F.lit("MIL")).alias("currency_scale")
        )
    )

    table_name = f"{catalog}.{gold_schema}.company_summary"
    summary.write.format("delta").mode("overwrite").saveAsTable(table_name)

    total_rows = summary.count()
    distinct_companies = summary.select("cnpj").distinct().count()

    print("=" * 80)
    print(f"GOLD LAYER — COMPANY SUMMARY")
    print(f"  • Total de registros gravados na Gold: {total_rows:,}")
    print(f"  • Total de empresas distintas na Gold: {distinct_companies:,}")
    print(f"  • Tabela de destino:                  {table_name}")
    print("=" * 80)

    return summary

# COMMAND ----------

# Execute:
# build_company_summary("portal_cvm", "silver", "gold")

