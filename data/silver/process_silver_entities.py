# Databricks notebook source
# MAGIC %md
# MAGIC # Silver Layer — Processamento das 8 Entidades Lógicas do Lakehouse CVM
# MAGIC
# MAGIC Processa a camada `cvm_lakehouse/silver/*` considerando:
# MAGIC - Leitura recursiva de todas as partições (`part-*.csv`)
# MAGIC - Nenhuma limitação artificial de empresas (sem `.limit(8)`, sem tickers fixos)
# MAGIC - Deduplicação rigorosa baseada nas chaves de negócio reais de cada entidade
# MAGIC - Geração de métricas completas por entidade (registros, empresas distintas, arquivos, períodos)

import os
import sys
from datetime import datetime

try:
    from pyspark.sql import functions as F
    from pyspark.sql.window import Window
    from pyspark.sql.types import StringType, DoubleType, IntegerType, DateType
except ImportError:
    pass


def normalize_column_names(df):
    """
    Normaliza os nomes das colunas para minúsculas e mapeia sinônimos
    comuns da CVM (ex: DENOM_CIA -> denominacao_cia, CD_CVM -> cd_cvm).
    """
    column_mapping = {
        "CNPJ_CIA": "cnpj_cia",
        "DENOM_CIA": "denominacao_cia",
        "DENOMINACAO_CIA": "denominacao_cia",
        "DENOMINACAO_SOCIAL": "denominacao_social",
        "CD_CVM": "cd_cvm",
        "SITUACAO": "situacao",
        "SEGMENTO": "segmento",
        "DT_INI_SIT": "data_inicio_situacao",
        "DT_INICIO_SITUACAO": "data_inicio_situacao",
        "DT_REG": "data_registro",
        "DATA_REGISTRO": "data_registro",
        "DT_REFER": "dt_refer",
        "VERSAO": "versao",
        "GRUPO_DFP": "grupo_dfp",
        "MOEDA": "moeda",
        "ESCALA_MOEDA": "escala_moeda",
        "ORDEM_EXERC": "ordem_exerc",
        "DT_INI_EXERC": "dt_ini_exerc",
        "DT_FIM_EXERC": "dt_fim_exerc",
        "CD_CONTA": "cd_conta",
        "DS_CONTA": "ds_conta",
        "VL_CONTA": "vl_conta",
        "SETOR_ATIV": "setor_atividade",
        "TP_MERC": "tipo_mercado",
        "CATEG_REG": "categoria_registro"
    }

    current_cols = df.columns
    for orig_col in current_cols:
        orig_upper = orig_col.upper()
        if orig_upper in column_mapping:
            df = df.withColumnRenamed(orig_col, column_mapping[orig_upper])
        else:
            df = df.withColumnRenamed(orig_col, orig_col.lower())

    return df


def read_silver_partitioned_dataset(spark, silver_base_path, subdirs=None, file_pattern="*.csv"):
    """
    Lê todas as partições de dados de forma recursiva dentro de `cvm_lakehouse/silver/*`.
    
    Características:
    - Lê TODAS as partições (part-00000, part-00001, etc.)
    - Ativa .option("recursiveFileLookup", "true")
    - Ignora arquivos de metadados (_SUCCESS, _committed, etc.)
    - Aceita subdiretórios específicos ou a raiz da camada Silver
    """
    paths_to_check = []
    if subdirs:
        for subdir in subdirs:
            paths_to_check.append(os.path.join(silver_base_path, subdir).replace("\\", "/"))
    paths_to_check.append(silver_base_path.replace("\\", "/"))

    df = None
    target_path_used = None

    for target_path in paths_to_check:
        try:
            reader = (
                spark.read
                .option("header", "true")
                .option("sep", ";")
                .option("encoding", "ISO-8859-1")
                .option("recursiveFileLookup", "true")
                .option("ignoreCorruptFiles", "true")
                .option("pathGlobFilter", "*.csv")
            )
            loaded_df = reader.csv(target_path)
            
            # Se carregou com colunas válidas
            if len(loaded_df.columns) > 1:
                df = loaded_df
                target_path_used = target_path
                break
        except Exception:
            continue

    # Fallback: leitura direta do caminho com glob
    if df is None:
        try:
            df = (
                spark.read
                .option("header", "true")
                .option("sep", ";")
                .option("encoding", "ISO-8859-1")
                .csv(f"{silver_base_path}/*/*.csv")
            )
            target_path_used = f"{silver_base_path}/*/*.csv"
        except Exception:
            # Fallback para tabela Delta se já persistida
            pass

    if df is not None:
        df = normalize_column_names(df)
        
        # Garante a presença de metadados se não existirem
        if "_source_file" not in df.columns:
            df = df.withColumn("_source_file", F.input_file_name())
        if "_ingestion_date" not in df.columns:
            df = df.withColumn("_ingestion_date", F.lit(datetime.now().isoformat()))
        if "_year" not in df.columns:
            if "dt_refer" in df.columns:
                df = df.withColumn("_year", F.year(F.to_date(F.col("dt_refer"))))
            elif "data_registro" in df.columns:
                df = df.withColumn("_year", F.year(F.to_date(F.col("data_registro"))))
            else:
                df = df.withColumn("_year", F.lit(datetime.now().year))

    return df, target_path_used


def log_entity_metrics(entity_name, df_raw, df_final, target_table=None):
    """
    Gera e exibe métricas detalhadas de validação conforme as seções 13, 19 e 21.
    """
    total_raw_rows = df_raw.count() if df_raw is not None else 0
    total_final_rows = df_final.count() if df_final is not None else 0
    
    distinct_companies = 0
    if df_final is not None and "cnpj_cia" in df_final.columns:
        distinct_companies = (
            df_final
            .select("cnpj_cia")
            .where(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
            .distinct()
            .count()
        )
    elif df_final is not None and "cnpj" in df_final.columns:
        distinct_companies = (
            df_final
            .select("cnpj")
            .where(F.col("cnpj").isNotNull() & (F.col("cnpj") != ""))
            .distinct()
            .count()
        )

    distinct_files = 0
    if df_raw is not None and "_source_file" in df_raw.columns:
        distinct_files = df_raw.select("_source_file").distinct().count()
    elif df_final is not None and "_source_file" in df_final.columns:
        distinct_files = df_final.select("_source_file").distinct().count()

    distinct_years = []
    if df_final is not None and "_year" in df_final.columns:
        years_rows = df_final.select("_year").where(F.col("_year").isNotNull()).distinct().collect()
        distinct_years = sorted([r[0] for r in years_rows if r[0] is not None])

    print("=" * 80)
    print(f"ENTIDADE: {entity_name}")
    print(f"  • Registros brutos lidos:          {total_raw_rows:,}")
    print(f"  • Registros após deduplicação:     {total_final_rows:,}")
    print(f"  • Total de empresas distintas:     {distinct_companies:,}")
    print(f"  • Arquivos/partições processadas:  {distinct_files}")
    print(f"  • Períodos / Anos identificados:   {distinct_years}")
    if target_table:
        print(f"  • Destino Delta / View:            {target_table}")
    print("=" * 80)

    return {
        "entity": entity_name,
        "raw_rows": total_raw_rows,
        "final_rows": total_final_rows,
        "distinct_companies": distinct_companies,
        "distinct_files": distinct_files,
        "years": distinct_years,
        "target_table": target_table
    }


# ==============================================================================
# 1. vw_companhia_atual
# ==============================================================================
def process_vw_companhia_atual(spark, silver_base_path, catalog="portal_cvm", schema="silver"):
    """
    Entidade 1: vw_companhia_atual
    Visão cadastral com a situação mais recente de TODAS as companhias abertas.
    Deduplicação: Último registro válido por CNPJ/Código CVM.
    """
    subdirs = ["companhia", "cia", "cad", "cadastral", "dfp_cia_aberta"]
    df_raw, path_used = read_silver_partitioned_dataset(spark, silver_base_path, subdirs)

    if df_raw is None:
        raise ValueError(f"Não foi possível ler dados para vw_companhia_atual em {silver_base_path}")

    # Limpeza e padronização
    df_clean = (
        df_raw
        .withColumn("cnpj_cia", F.trim(F.col("cnpj_cia")))
        .withColumn("denominacao_cia", F.trim(F.upper(F.coalesce(F.col("denominacao_cia"), F.col("denominacao_social")))))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")) if "cd_cvm" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("situacao", F.trim(F.upper(F.col("situacao"))) if "situacao" in df_raw.columns else F.lit("ATIVO"))
        .withColumn("segmento", F.trim(F.col("segmento")) if "segmento" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("data_inicio_situacao", F.col("data_inicio_situacao") if "data_inicio_situacao" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("data_registro", F.col("data_registro") if "data_registro" in df_raw.columns else F.lit(None).cast("string"))
        .filter(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
    )

    # Deduplicação por chave natural: cnpj_cia (mantém a versão cadastral mais recente)
    order_cols = []
    if "data_registro" in df_clean.columns:
        order_cols.append(F.col("data_registro").desc_nulls_last())
    if "data_inicio_situacao" in df_clean.columns:
        order_cols.append(F.col("data_inicio_situacao").desc_nulls_last())
    if "_year" in df_clean.columns:
        order_cols.append(F.col("_year").desc_nulls_last())
    if "versao" in df_clean.columns:
        order_cols.append(F.col("versao").cast("int").desc_nulls_last())

    window = Window.partitionBy("cnpj_cia").orderBy(*order_cols) if order_cols else Window.partitionBy("cnpj_cia").orderBy(F.col("cnpj_cia"))

    df_dedup = (
        df_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    table_name = f"{catalog}.{schema}.vw_companhia_atual"
    df_dedup.write.format("delta").mode("overwrite").saveAsTable(table_name)
    metrics = log_entity_metrics("vw_companhia_atual", df_raw, df_dedup, table_name)
    return df_dedup, metrics


# ==============================================================================
# 2. vw_balanco_patrimonial_latest
# ==============================================================================
def process_vw_balanco_patrimonial_latest(spark, silver_base_path, catalog="portal_cvm", schema="silver"):
    """
    Entidade 2: vw_balanco_patrimonial_latest
    Balanço Patrimonial mais recente por empresa, período, consolidação e conta contábil.
    Deduplicação: Última versão por combinação (cnpj_cia, cd_conta, grupo_dfp, dt_fim_exerc, ordem_exerc).
    """
    subdirs = ["balanco", "bpa", "bpp", "balanco_patrimonial", "dfp_bpa", "dfp_bpp"]
    df_raw, path_used = read_silver_partitioned_dataset(spark, silver_base_path, subdirs)

    if df_raw is None:
        raise ValueError(f"Não foi possível ler dados para vw_balanco_patrimonial_latest em {silver_base_path}")

    df_clean = (
        df_raw
        .withColumn("cnpj_cia", F.trim(F.col("cnpj_cia")))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")) if "cd_cvm" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("cd_conta", F.trim(F.col("cd_conta")))
        .withColumn("ds_conta", F.trim(F.col("ds_conta")))
        .withColumn("vl_conta", F.col("vl_conta").cast("double"))
        .withColumn("grupo_dfp", F.trim(F.upper(F.col("grupo_dfp"))))
        .withColumn("ordem_exerc", F.trim(F.upper(F.col("ordem_exerc"))))
        .withColumn("dt_refer", F.to_date(F.col("dt_refer")))
        .withColumn("dt_fim_exerc", F.to_date(F.col("dt_fim_exerc")) if "dt_fim_exerc" in df_raw.columns else F.to_date(F.col("dt_refer")))
        .withColumn("versao", F.col("versao").cast("int") if "versao" in df_raw.columns else F.lit(1))
        .filter(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
    )

    # Latest window por conta/período/empresa
    window = Window.partitionBy(
        "cnpj_cia", "cd_conta", "grupo_dfp", "dt_fim_exerc", "ordem_exerc"
    ).orderBy(F.col("versao").desc_nulls_last(), F.col("dt_refer").desc_nulls_last())

    df_latest = (
        df_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    table_name = f"{catalog}.{schema}.vw_balanco_patrimonial_latest"
    df_latest.write.format("delta").mode("overwrite").saveAsTable(table_name)
    metrics = log_entity_metrics("vw_balanco_patrimonial_latest", df_raw, df_latest, table_name)
    return df_latest, metrics


# ==============================================================================
# 3. vw_resultado_latest
# ==============================================================================
def process_vw_resultado_latest(spark, silver_base_path, catalog="portal_cvm", schema="silver"):
    """
    Entidade 3: vw_resultado_latest
    DRE mais recente por empresa, período, consolidação e conta contábil.
    Deduplicação: Última versão por combinação (cnpj_cia, cd_conta, grupo_dfp, dt_fim_exerc, dt_ini_exerc, ordem_exerc).
    """
    subdirs = ["resultado", "dre", "demonstracao_resultado", "dfp_dre"]
    df_raw, path_used = read_silver_partitioned_dataset(spark, silver_base_path, subdirs)

    if df_raw is None:
        raise ValueError(f"Não foi possível ler dados para vw_resultado_latest em {silver_base_path}")

    df_clean = (
        df_raw
        .withColumn("cnpj_cia", F.trim(F.col("cnpj_cia")))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")) if "cd_cvm" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("cd_conta", F.trim(F.col("cd_conta")))
        .withColumn("ds_conta", F.trim(F.col("ds_conta")))
        .withColumn("vl_conta", F.col("vl_conta").cast("double"))
        .withColumn("grupo_dfp", F.trim(F.upper(F.col("grupo_dfp"))))
        .withColumn("ordem_exerc", F.trim(F.upper(F.col("ordem_exerc"))))
        .withColumn("dt_refer", F.to_date(F.col("dt_refer")))
        .withColumn("dt_ini_exerc", F.to_date(F.col("dt_ini_exerc")) if "dt_ini_exerc" in df_raw.columns else F.lit(None).cast("date"))
        .withColumn("dt_fim_exerc", F.to_date(F.col("dt_fim_exerc")) if "dt_fim_exerc" in df_raw.columns else F.to_date(F.col("dt_refer")))
        .withColumn("versao", F.col("versao").cast("int") if "versao" in df_raw.columns else F.lit(1))
        .filter(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
    )

    window = Window.partitionBy(
        "cnpj_cia", "cd_conta", "grupo_dfp", "dt_fim_exerc", "dt_ini_exerc", "ordem_exerc"
    ).orderBy(F.col("versao").desc_nulls_last(), F.col("dt_refer").desc_nulls_last())

    df_latest = (
        df_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    table_name = f"{catalog}.{schema}.vw_resultado_latest"
    df_latest.write.format("delta").mode("overwrite").saveAsTable(table_name)
    metrics = log_entity_metrics("vw_resultado_latest", df_raw, df_latest, table_name)
    return df_latest, metrics


# ==============================================================================
# 4. vw_fluxo_caixa_latest
# ==============================================================================
def process_vw_fluxo_caixa_latest(spark, silver_base_path, catalog="portal_cvm", schema="silver"):
    """
    Entidade 4: vw_fluxo_caixa_latest
    Demonstração dos Fluxos de Caixa (DFC_MI / DFC_MD) mais recente.
    Deduplicação: Última versão por combinação (cnpj_cia, cd_conta, grupo_dfp, metodo, dt_fim_exerc, dt_ini_exerc, ordem_exerc).
    """
    subdirs = ["fluxo_caixa", "dfc", "dfc_mi", "dfc_md", "dfp_dfc"]
    df_raw, path_used = read_silver_partitioned_dataset(spark, silver_base_path, subdirs)

    if df_raw is None:
        raise ValueError(f"Não foi possível ler dados para vw_fluxo_caixa_latest em {silver_base_path}")

    metodo_col = F.col("metodo") if "metodo" in df_raw.columns else F.lit("MI")

    df_clean = (
        df_raw
        .withColumn("cnpj_cia", F.trim(F.col("cnpj_cia")))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")) if "cd_cvm" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("cd_conta", F.trim(F.col("cd_conta")))
        .withColumn("ds_conta", F.trim(F.col("ds_conta")))
        .withColumn("vl_conta", F.col("vl_conta").cast("double"))
        .withColumn("grupo_dfp", F.trim(F.upper(F.col("grupo_dfp"))))
        .withColumn("metodo", metodo_col)
        .withColumn("ordem_exerc", F.trim(F.upper(F.col("ordem_exerc"))))
        .withColumn("dt_refer", F.to_date(F.col("dt_refer")))
        .withColumn("dt_ini_exerc", F.to_date(F.col("dt_ini_exerc")) if "dt_ini_exerc" in df_raw.columns else F.lit(None).cast("date"))
        .withColumn("dt_fim_exerc", F.to_date(F.col("dt_fim_exerc")) if "dt_fim_exerc" in df_raw.columns else F.to_date(F.col("dt_refer")))
        .withColumn("versao", F.col("versao").cast("int") if "versao" in df_raw.columns else F.lit(1))
        .filter(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
    )

    window = Window.partitionBy(
        "cnpj_cia", "cd_conta", "grupo_dfp", "metodo", "dt_fim_exerc", "dt_ini_exerc", "ordem_exerc"
    ).orderBy(F.col("versao").desc_nulls_last(), F.col("dt_refer").desc_nulls_last())

    df_latest = (
        df_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    table_name = f"{catalog}.{schema}.vw_fluxo_caixa_latest"
    df_latest.write.format("delta").mode("overwrite").saveAsTable(table_name)
    metrics = log_entity_metrics("vw_fluxo_caixa_latest", df_raw, df_latest, table_name)
    return df_latest, metrics


# ==============================================================================
# 5. vw_demonstracao_financeira_latest
# ==============================================================================
def process_vw_demonstracao_financeira_latest(spark, silver_base_path, catalog="portal_cvm", schema="silver"):
    """
    Entidade 5: vw_demonstracao_financeira_latest
    Visão unificada das demonstrações financeiras (BPA, BPP, DRE, DFC, DMPL, DVA, DRA).
    Deduplicação: Última versão por tipo_dem, cnpj_cia, cd_conta, grupo_dfp, dt_fim_exerc, ordem_exerc.
    """
    subdirs = ["demonstracao_financeira", "demonstracoes", "dfp"]
    df_raw, path_used = read_silver_partitioned_dataset(spark, silver_base_path, subdirs)

    if df_raw is None:
        raise ValueError(f"Não foi possível ler dados para vw_demonstracao_financeira_latest em {silver_base_path}")

    tipo_dem_col = F.col("tipo_dem") if "tipo_dem" in df_raw.columns else F.col("document_type") if "document_type" in df_raw.columns else F.lit("DFP")

    df_clean = (
        df_raw
        .withColumn("tipo_dem", tipo_dem_col)
        .withColumn("cnpj_cia", F.trim(F.col("cnpj_cia")))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")) if "cd_cvm" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("cd_conta", F.trim(F.col("cd_conta")))
        .withColumn("ds_conta", F.trim(F.col("ds_conta")))
        .withColumn("vl_conta", F.col("vl_conta").cast("double"))
        .withColumn("grupo_dfp", F.trim(F.upper(F.col("grupo_dfp"))))
        .withColumn("ordem_exerc", F.trim(F.upper(F.col("ordem_exerc"))))
        .withColumn("dt_refer", F.to_date(F.col("dt_refer")))
        .withColumn("dt_fim_exerc", F.to_date(F.col("dt_fim_exerc")) if "dt_fim_exerc" in df_raw.columns else F.to_date(F.col("dt_refer")))
        .withColumn("versao", F.col("versao").cast("int") if "versao" in df_raw.columns else F.lit(1))
        .filter(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
    )

    window = Window.partitionBy(
        "tipo_dem", "cnpj_cia", "cd_conta", "grupo_dfp", "dt_fim_exerc", "ordem_exerc"
    ).orderBy(F.col("versao").desc_nulls_last(), F.col("dt_refer").desc_nulls_last())

    df_latest = (
        df_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    table_name = f"{catalog}.{schema}.vw_demonstracao_financeira_latest"
    df_latest.write.format("delta").mode("overwrite").saveAsTable(table_name)
    metrics = log_entity_metrics("vw_demonstracao_financeira_latest", df_raw, df_latest, table_name)
    return df_latest, metrics


# ==============================================================================
# 6. fato_composicao_capital
# ==============================================================================
def process_fato_composicao_capital(spark, silver_base_path, catalog="portal_cvm", schema="silver"):
    """
    Entidade 6: fato_composicao_capital
    Composição de capital social e classes de ações (ordinárias, preferenciais, total).
    Deduplicação: Última versão por (cnpj_cia, dt_refer, tipo_acao).
    """
    subdirs = ["composicao_capital", "capital", "acoes", "dfp_capital"]
    df_raw, path_used = read_silver_partitioned_dataset(spark, silver_base_path, subdirs)

    if df_raw is None:
        raise ValueError(f"Não foi possível ler dados para fato_composicao_capital em {silver_base_path}")

    tipo_acao_col = F.col("tipo_acao") if "tipo_acao" in df_raw.columns else F.col("classe_acao") if "classe_acao" in df_raw.columns else F.lit("ON")

    df_clean = (
        df_raw
        .withColumn("cnpj_cia", F.trim(F.col("cnpj_cia")))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")) if "cd_cvm" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("dt_refer", F.to_date(F.col("dt_refer")))
        .withColumn("tipo_acao", tipo_acao_col)
        .withColumn("versao", F.col("versao").cast("int") if "versao" in df_raw.columns else F.lit(1))
        .filter(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
    )

    window = Window.partitionBy("cnpj_cia", "dt_refer", "tipo_acao").orderBy(
        F.col("versao").desc_nulls_last(), F.col("dt_refer").desc_nulls_last()
    )

    df_dedup = (
        df_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    table_name = f"{catalog}.{schema}.fato_composicao_capital"
    df_dedup.write.format("delta").mode("overwrite").saveAsTable(table_name)
    metrics = log_entity_metrics("fato_composicao_capital", df_raw, df_dedup, table_name)
    return df_dedup, metrics


# ==============================================================================
# 7. fato_parecer_auditoria
# ==============================================================================
def process_fato_parecer_auditoria(spark, silver_base_path, catalog="portal_cvm", schema="silver"):
    """
    Entidade 7: fato_parecer_auditoria
    Pareceres e relatórios de auditoria independente.
    Deduplicação: Última versão por (cnpj_cia, dt_refer, cnpj_auditor / auditor).
    """
    subdirs = ["parecer_auditoria", "auditoria", "parecer", "dfp_auditoria"]
    df_raw, path_used = read_silver_partitioned_dataset(spark, silver_base_path, subdirs)

    if df_raw is None:
        raise ValueError(f"Não foi possível ler dados para fato_parecer_auditoria em {silver_base_path}")

    auditor_col = F.col("cnpj_auditor") if "cnpj_auditor" in df_raw.columns else F.col("auditor") if "auditor" in df_raw.columns else F.lit("AUDITOR_GERAL")

    df_clean = (
        df_raw
        .withColumn("cnpj_cia", F.trim(F.col("cnpj_cia")))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")) if "cd_cvm" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("dt_refer", F.to_date(F.col("dt_refer")))
        .withColumn("cnpj_auditor", auditor_col)
        .withColumn("versao", F.col("versao").cast("int") if "versao" in df_raw.columns else F.lit(1))
        .filter(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
    )

    window = Window.partitionBy("cnpj_cia", "dt_refer", "cnpj_auditor").orderBy(
        F.col("versao").desc_nulls_last(), F.col("dt_refer").desc_nulls_last()
    )

    df_dedup = (
        df_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    table_name = f"{catalog}.{schema}.fato_parecer_auditoria"
    df_dedup.write.format("delta").mode("overwrite").saveAsTable(table_name)
    metrics = log_entity_metrics("fato_parecer_auditoria", df_raw, df_dedup, table_name)
    return df_dedup, metrics


# ==============================================================================
# 8. fato_documento_cvm
# ==============================================================================
def process_fato_documento_cvm(spark, silver_base_path, catalog="portal_cvm", schema="silver"):
    """
    Entidade 8: fato_documento_cvm
    Metadados de todos os documentos e formulários CVM entregues.
    Deduplicação: Por id_doc ou chave (cnpj_cia, tipo_doc, dt_refer, versao).
    """
    subdirs = ["documento_cvm", "documentos", "doc_cvm", "dfp_documentos"]
    df_raw, path_used = read_silver_partitioned_dataset(spark, silver_base_path, subdirs)

    if df_raw is None:
        raise ValueError(f"Não foi possível ler dados para fato_documento_cvm em {silver_base_path}")

    tipo_doc_col = F.col("tipo_doc") if "tipo_doc" in df_raw.columns else F.col("document_type") if "document_type" in df_raw.columns else F.lit("DFP")

    df_clean = (
        df_raw
        .withColumn("cnpj_cia", F.trim(F.col("cnpj_cia")))
        .withColumn("cd_cvm", F.trim(F.col("cd_cvm")) if "cd_cvm" in df_raw.columns else F.lit(None).cast("string"))
        .withColumn("dt_refer", F.to_date(F.col("dt_refer")))
        .withColumn("tipo_doc", tipo_doc_col)
        .withColumn("versao", F.col("versao").cast("int") if "versao" in df_raw.columns else F.lit(1))
        .filter(F.col("cnpj_cia").isNotNull() & (F.col("cnpj_cia") != ""))
    )

    if "id_doc" in df_clean.columns:
        window = Window.partitionBy("id_doc").orderBy(F.col("versao").desc_nulls_last())
    else:
        window = Window.partitionBy("cnpj_cia", "tipo_doc", "dt_refer").orderBy(F.col("versao").desc_nulls_last())

    df_dedup = (
        df_clean
        .withColumn("rn", F.row_number().over(window))
        .filter(F.col("rn") == 1)
        .drop("rn")
    )

    table_name = f"{catalog}.{schema}.fato_documento_cvm"
    df_dedup.write.format("delta").mode("overwrite").saveAsTable(table_name)
    metrics = log_entity_metrics("fato_documento_cvm", df_raw, df_dedup, table_name)
    return df_dedup, metrics


# ==============================================================================
# Orquestrador Geral das 8 Entidades Silver
# ==============================================================================
def process_all_silver_entities(spark, silver_base_path="cvm_lakehouse/silver", catalog="portal_cvm", schema="silver"):
    """
    Executa o processamento sequencial das 8 entidades lógicas do projeto.
    Gera o resumo consolidado de validação métrica.
    """
    print("\n" + "#" * 80)
    print("INICIANDO PROCESSAMENTO DAS 8 ENTIDADES SILVER — CVM LAKEHOUSE")
    print(f"Origem base: {silver_base_path}")
    print(f"Catálogo/Schema destino: {catalog}.{schema}")
    print("#" * 80 + "\n")

    results = []

    entity_processors = [
        ("1. vw_companhia_atual", process_vw_companhia_atual),
        ("2. vw_balanco_patrimonial_latest", process_vw_balanco_patrimonial_latest),
        ("3. vw_resultado_latest", process_vw_resultado_latest),
        ("4. vw_fluxo_caixa_latest", process_vw_fluxo_caixa_latest),
        ("5. vw_demonstracao_financeira_latest", process_vw_demonstracao_financeira_latest),
        ("6. fato_composicao_capital", process_fato_composicao_capital),
        ("7. fato_parecer_auditoria", process_fato_parecer_auditoria),
        ("8. fato_documento_cvm", process_fato_documento_cvm),
    ]

    for label, processor in entity_processors:
        print(f"\n>> Processando {label}...")
        try:
            _, metrics = processor(spark, silver_base_path, catalog, schema)
            results.append(metrics)
        except Exception as e:
            print(f"ERRO ao processar {label}: {e}")
            results.append({
                "entity": label,
                "error": str(e)
            })

    # Resumo Final Consolidado
    print("\n" + "=" * 80)
    print("RESUMO CONSOLIDADO DE VALIDAÇÃO DAS ENTIDADES SILVER")
    print("=" * 80)
    print(f"{'Entidade':<36} | {'Arquivos':<8} | {'Total Linhas':<12} | {'Empresas Distintas':<18}")
    print("-" * 80)
    for m in results:
        if "error" in m:
            print(f"{m['entity']:<36} | ERRO: {m['error'][:35]}")
        else:
            print(f"{m['entity']:<36} | {m['distinct_files']:<8} | {m['final_rows']:<12,d} | {m['distinct_companies']:<18,d}")
    print("=" * 80 + "\n")

    return results
