# Databricks notebook source
# MAGIC %md
# MAGIC # Silver Layer — Transform Financial Statements
# MAGIC Limpa, normaliza e estrutura as demonstrações financeiras padronizadas (BPA, BPP, DRE, DFC, DMPL, DVA, DRA)
# MAGIC para **todas as companhias** da camada Silver / Lakehouse sem limitações artificiais.

from pyspark.sql import functions as F
from pyspark.sql.window import Window

# COMMAND ----------

def transform_financial_statements(catalog="portal_cvm", bronze_schema="bronze", silver_schema="silver", silver_base_path="cvm_lakehouse/silver"):
    """
    Transforma as demonstrações financeiras em tabelas/views Silver:
    - vw_balanco_patrimonial_latest / balance_sheet
    - vw_resultado_latest / income_statement
    - vw_fluxo_caixa_latest / cash_flow
    - vw_demonstracao_financeira_latest
    """
    _transform_balance_sheet(catalog, bronze_schema, silver_schema, silver_base_path)
    _transform_income_statement(catalog, bronze_schema, silver_schema, silver_base_path)
    _transform_cash_flow(catalog, bronze_schema, silver_schema, silver_base_path)
    _transform_demonstracao_unificada(catalog, bronze_schema, silver_schema, silver_base_path)


def _clean_dfp(df):
    """Padronização comum aplicada a todas as demonstrações financeiras."""
    cols = {c.upper(): c for c in df.columns}

    cd_cvm_col = cols.get("CD_CVM", "cd_cvm")
    cnpj_col = cols.get("CNPJ_CIA", cols.get("CNPJ", "cnpj_cia"))
    denom_col = cols.get("DENOM_CIA", cols.get("DENOMINACAO_CIA", cols.get("DENOMINACAO_SOCIAL", "denominacao_cia")))
    dt_ref_col = cols.get("DT_REFER", "dt_refer")
    dt_ini_col = cols.get("DT_INI_EXERC", "dt_ini_exerc")
    dt_fim_col = cols.get("DT_FIM_EXERC", "dt_fim_exerc")
    versao_col = cols.get("VERSAO", "versao")
    grupo_col = cols.get("GRUPO_DFP", "grupo_dfp")
    moeda_col = cols.get("MOEDA", "moeda")
    escala_col = cols.get("ESCALA_MOEDA", "escala_moeda")
    ordem_col = cols.get("ORDEM_EXERC", "ordem_exerc")
    cd_conta_col = cols.get("CD_CONTA", "cd_conta")
    ds_conta_col = cols.get("DS_CONTA", "ds_conta")
    vl_conta_col = cols.get("VL_CONTA", "vl_conta")

    clean_df = (
        df
        .withColumn("cd_cvm", F.trim(F.col(cd_cvm_col)) if cd_cvm_col in df.columns else F.lit(None).cast("string"))
        .withColumn("cnpj", F.trim(F.col(cnpj_col)))
        .withColumn("cnpj_cia", F.trim(F.col(cnpj_col)))
        .withColumn("company_name", F.trim(F.upper(F.col(denom_col))) if denom_col in df.columns else F.lit(None).cast("string"))
        .withColumn("reference_date", F.to_date(F.col(dt_ref_col)) if dt_ref_col in df.columns else F.lit(None).cast("date"))
        .withColumn("period_start", F.to_date(F.col(dt_ini_col)) if dt_ini_col in df.columns else F.lit(None).cast("date"))
        .withColumn("period_end", F.to_date(F.col(dt_fim_col)) if dt_fim_col in df.columns else F.to_date(F.col(dt_ref_col)))
        .withColumn("version", F.col(versao_col).cast("int") if versao_col in df.columns else F.lit(1))
        .withColumn("consolidation_type", F.trim(F.upper(F.col(grupo_col))) if grupo_col in df.columns else F.lit("CON"))
        .withColumn("currency", F.trim(F.col(moeda_col)) if moeda_col in df.columns else F.lit("REAL"))
        .withColumn("currency_scale", F.trim(F.col(escala_col)) if escala_col in df.columns else F.lit("MIL"))
        .withColumn("exercise_order", F.trim(F.upper(F.col(ordem_col))) if ordem_col in df.columns else F.lit("ÚLTIMO"))
        .withColumn("account_code", F.trim(F.col(cd_conta_col)))
        .withColumn("account_description", F.trim(F.col(ds_conta_col)))
        .withColumn("value", F.col(vl_conta_col).cast("double"))
        .withColumn("level", F.size(F.split(F.col("account_code"), "\\.")))
        .filter(F.col("cnpj").isNotNull() & (F.col("cnpj") != ""))
        .filter(F.col("exercise_order") == "ÚLTIMO")
    )

    return clean_df


def _transform_balance_sheet(catalog, bronze_schema, silver_schema, silver_base_path):
    """Combina BPA e BPP em balance_sheet e vw_balanco_patrimonial_latest para todas as empresas."""
    try:
        reader = spark.read.option("header", "true").option("sep", ";").option("encoding", "ISO-8859-1").option("recursiveFileLookup", "true")
        bpa_raw = reader.csv(f"{silver_base_path}/balanco")
        bpp_raw = reader.csv(f"{silver_base_path}/balanco")
    except Exception:
        try:
            bpa_raw = spark.table(f"{catalog}.{bronze_schema}.dfp_bpa")
            bpp_raw = spark.table(f"{catalog}.{bronze_schema}.dfp_bpp")
        except Exception:
            bpa_raw = spark.table(f"{catalog}.{silver_schema}.vw_balanco_patrimonial_latest")
            bpp_raw = bpa_raw

    bpa_clean = _clean_dfp(bpa_raw).withColumn("statement_side", F.lit("ATIVO"))
    bpp_clean = _clean_dfp(bpp_raw).withColumn("statement_side", F.lit("PASSIVO"))

    balance_sheet = bpa_clean.unionByName(bpp_clean)

    # Latest window por conta contábil / empresa / período
    window = Window.partitionBy(
        "cnpj", "account_code", "consolidation_type", "statement_side", "period_end", "exercise_order"
    ).orderBy(F.col("version").desc_nulls_last(), F.col("reference_date").desc_nulls_last())

    balance_sheet_latest = (
        balance_sheet
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
        .select(
            "cd_cvm", "cnpj", "cnpj_cia", "company_name", "reference_date",
            "period_start", "period_end", "version", "consolidation_type",
            "currency", "currency_scale", "account_code", "account_description",
            "value", "level", "statement_side"
        )
    )

    table_name = f"{catalog}.{silver_schema}.balance_sheet"
    balance_sheet_latest.write.format("delta").mode("overwrite").saveAsTable(table_name)
    view_name = f"{catalog}.{silver_schema}.vw_balanco_patrimonial_latest"
    balance_sheet_latest.write.format("delta").mode("overwrite").saveAsTable(view_name)

    total_count = balance_sheet_latest.count()
    distinct_companies = balance_sheet_latest.select("cnpj").distinct().count()
    print(f"✓ {table_name}: {total_count:,} linhas | {distinct_companies:,} empresas distintas")


def _transform_income_statement(catalog, bronze_schema, silver_schema, silver_base_path):
    """Transforma DRE em income_statement e vw_resultado_latest para todas as empresas."""
    try:
        reader = spark.read.option("header", "true").option("sep", ";").option("encoding", "ISO-8859-1").option("recursiveFileLookup", "true")
        dre_raw = reader.csv(f"{silver_base_path}/resultado")
    except Exception:
        try:
            dre_raw = spark.table(f"{catalog}.{bronze_schema}.dfp_dre")
        except Exception:
            dre_raw = spark.table(f"{catalog}.{silver_schema}.vw_resultado_latest")

    income_clean = _clean_dfp(dre_raw)

    window = Window.partitionBy(
        "cnpj", "account_code", "consolidation_type", "period_end", "period_start", "exercise_order"
    ).orderBy(F.col("version").desc_nulls_last(), F.col("reference_date").desc_nulls_last())

    income_latest = (
        income_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
        .select(
            "cd_cvm", "cnpj", "cnpj_cia", "company_name", "reference_date",
            "period_start", "period_end", "version", "consolidation_type",
            "currency", "currency_scale", "account_code", "account_description",
            "value", "level"
        )
    )

    table_name = f"{catalog}.{silver_schema}.income_statement"
    income_latest.write.format("delta").mode("overwrite").saveAsTable(table_name)
    view_name = f"{catalog}.{silver_schema}.vw_resultado_latest"
    income_latest.write.format("delta").mode("overwrite").saveAsTable(view_name)

    total_count = income_latest.count()
    distinct_companies = income_latest.select("cnpj").distinct().count()
    print(f"✓ {table_name}: {total_count:,} linhas | {distinct_companies:,} empresas distintas")


def _transform_cash_flow(catalog, bronze_schema, silver_schema, silver_base_path):
    """Transforma DFC em cash_flow e vw_fluxo_caixa_latest para todas as empresas."""
    try:
        reader = spark.read.option("header", "true").option("sep", ";").option("encoding", "ISO-8859-1").option("recursiveFileLookup", "true")
        dfc_raw = reader.csv(f"{silver_base_path}/fluxo_caixa")
    except Exception:
        try:
            dfc_raw = spark.table(f"{catalog}.{bronze_schema}.dfp_dfc")
        except Exception:
            dfc_raw = spark.table(f"{catalog}.{silver_schema}.vw_fluxo_caixa_latest")

    cash_flow_clean = _clean_dfp(dfc_raw).withColumn("method", F.lit("MI"))

    window = Window.partitionBy(
        "cnpj", "account_code", "consolidation_type", "method", "period_end", "period_start", "exercise_order"
    ).orderBy(F.col("version").desc_nulls_last(), F.col("reference_date").desc_nulls_last())

    cash_flow_latest = (
        cash_flow_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
        .select(
            "cd_cvm", "cnpj", "cnpj_cia", "company_name", "reference_date",
            "period_start", "period_end", "version", "consolidation_type",
            "currency", "currency_scale", "account_code", "account_description",
            "value", "level", "method"
        )
    )

    table_name = f"{catalog}.{silver_schema}.cash_flow"
    cash_flow_latest.write.format("delta").mode("overwrite").saveAsTable(table_name)
    view_name = f"{catalog}.{silver_schema}.vw_fluxo_caixa_latest"
    cash_flow_latest.write.format("delta").mode("overwrite").saveAsTable(view_name)

    total_count = cash_flow_latest.count()
    distinct_companies = cash_flow_latest.select("cnpj").distinct().count()
    print(f"✓ {table_name}: {total_count:,} linhas | {distinct_companies:,} empresas distintas")


def _transform_demonstracao_unificada(catalog, bronze_schema, silver_schema, silver_base_path):
    """Cria a visão integrada vw_demonstracao_financeira_latest."""
    try:
        from process_silver_entities import process_vw_demonstracao_financeira_latest
        process_vw_demonstracao_financeira_latest(spark, silver_base_path, catalog, silver_schema)
    except Exception as e:
        print(f"Nota: vw_demonstracao_financeira_latest: {e}")

# COMMAND ----------

# Execute:
# transform_financial_statements("portal_cvm", "bronze", "silver", "cvm_lakehouse/silver")

