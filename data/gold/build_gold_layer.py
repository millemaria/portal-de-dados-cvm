# Databricks notebook source
# MAGIC %md
# MAGIC # Gold Layer — Orquestrador Geral das Tabelas e Views Analíticas
# MAGIC Constrói e publica todas as estruturas da camada Gold com cobertura integral de todas as companhias da Silver.

from pyspark.sql import functions as F

try:
    from build_company_summary import build_company_summary
    from build_financial_indicators import build_financial_indicators
except ImportError:
    pass

# COMMAND ----------

def build_gold_views_and_tables(catalog="portal_cvm", silver_schema="silver", gold_schema="gold"):
    """
    Publica/materializa as views das 8 entidades lógicas na camada Gold
    e constrói as tabelas analíticas principais (company_summary e financial_indicators).
    """
    print("\n" + "#" * 80)
    print("INICIANDO CONSTRUÇÃO DA CAMADA GOLD — PORTAL CVM SELF-SERVICE")
    print(f"Catálogo/Schemas: {catalog} | Silver: {silver_schema} | Gold: {gold_schema}")
    print("#" * 80 + "\n")

    gold_entities_metrics = []

    # 1. Criação das views das 8 entidades na Gold
    entities = [
        "vw_companhia_atual",
        "vw_balanco_patrimonial_latest",
        "vw_resultado_latest",
        "vw_fluxo_caixa_latest",
        "vw_demonstracao_financeira_latest",
        "fato_composicao_capital",
        "fato_parecer_auditoria",
        "fato_documento_cvm"
    ]

    for ent in entities:
        silver_table = f"{catalog}.{silver_schema}.{ent}"
        gold_target = f"{catalog}.{gold_schema}.{ent}"
        try:
            df = spark.table(silver_table)
            df.write.format("delta").mode("overwrite").saveAsTable(gold_target)
            
            count = df.count()
            distinct_cnpj = 0
            if "cnpj_cia" in df.columns:
                distinct_cnpj = df.select("cnpj_cia").where(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != "")).distinct().count()
            elif "cnpj" in df.columns:
                distinct_cnpj = df.select("cnpj").where(F.col("cnpj").isNotNull() & (F.col("cnpj") != "")).distinct().count()

            print(f"✓ Gold {ent}: {count:,} registros | {distinct_cnpj:,} empresas distintas → {gold_target}")
            gold_entities_metrics.append({
                "entity": f"gold.{ent}",
                "rows": count,
                "distinct_companies": distinct_cnpj
            })
        except Exception as e:
            print(f"⚠ Aviso ao publicar {gold_target}: {e}")
            gold_entities_metrics.append({
                "entity": f"gold.{ent}",
                "error": str(e)
            })

    # 2. Construção de gold.company_summary
    try:
        from build_company_summary import build_company_summary
        df_summary = build_company_summary(catalog, silver_schema, gold_schema)
        gold_entities_metrics.append({
            "entity": "gold.company_summary",
            "rows": df_summary.count(),
            "distinct_companies": df_summary.select("cnpj").distinct().count()
        })
    except Exception as e:
        print(f"ERRO ao construir gold.company_summary: {e}")

    # 3. Construção de gold.financial_indicators
    try:
        from build_financial_indicators import build_financial_indicators
        df_ind = build_financial_indicators(catalog, silver_schema, gold_schema)
        gold_entities_metrics.append({
            "entity": "gold.financial_indicators",
            "rows": df_ind.count(),
            "distinct_companies": df_ind.select("cnpj").distinct().count()
        })
    except Exception as e:
        print(f"ERRO ao construir gold.financial_indicators: {e}")

    # Resumo Gold
    print("\n" + "=" * 80)
    print("RESUMO DE GRAVAÇÃO NA CAMADA GOLD")
    print("=" * 80)
    for g in gold_entities_metrics:
        if "error" in g:
            print(f"{g['entity']:<36} | ERRO: {g['error'][:35]}")
        else:
            print(f"{g['entity']:<36} | {g['rows']:<12,d} linhas | {g['distinct_companies']:<18,d} empresas")
    print("=" * 80 + "\n")

    return gold_entities_metrics

# COMMAND ----------

# Execute:
# build_gold_views_and_tables("portal_cvm", "silver", "gold")
