# Databricks notebook source
# MAGIC %md
# MAGIC # Bronze Layer — Load Raw DFP Data
# MAGIC Reads CSV files from CVM ZIP archives and loads them as-is into Bronze tables.
# MAGIC Adds ingestion metadata columns: source_file, ingestion_date, reference_year, document_type.

from pyspark.sql import functions as F
from pyspark.sql.types import StringType
import zipfile
import os
from datetime import datetime

# COMMAND ----------

def load_raw_dfp_to_bronze(raw_path, bronze_path, catalog, schema, years=None):
    """
    Extract CSVs from ZIP files and load into Bronze Delta tables.
    Each document type (BPA, BPP, DRE, etc.) becomes a separate table.
    """
    if years is None:
        years = list(range(2020, 2027))

    for year in years:
        zip_path = os.path.join(raw_path, f"dfp_cia_aberta_{year}.zip")
        if not os.path.exists(zip_path):
            print(f"⚠ ZIP not found: {zip_path}")
            continue

        print(f"\n📦 Processing {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zf:
            csv_files = [f for f in zf.namelist() if f.endswith('.csv')]

            for csv_file in csv_files:
                # Extract document type from filename (e.g., "dfp_cia_aberta_con_BPA_2023.csv")
                doc_type = _extract_doc_type(csv_file)
                if not doc_type:
                    continue

                print(f"  📄 Loading {csv_file} → {doc_type}...")

                # Read CSV with CVM format settings
                df = (
                    spark.read
                    .option("header", "true")
                    .option("sep", ";")
                    .option("encoding", "ISO-8859-1")
                    .option("inferSchema", "false")
                    .csv(f"zip://{zip_path}!{csv_file}")
                )

                # Add ingestion metadata
                df = (
                    df
                    .withColumn("source_file", F.lit(csv_file))
                    .withColumn("ingestion_date", F.lit(datetime.now().isoformat()))
                    .withColumn("reference_year", F.lit(str(year)))
                    .withColumn("document_type", F.lit(doc_type))
                )

                # Write to Bronze table (append mode, partitioned by year)
                table_name = f"{catalog}.{schema}.dfp_{doc_type.lower()}"
                (
                    df.write
                    .format("delta")
                    .mode("append")
                    .partitionBy("reference_year")
                    .saveAsTable(table_name)
                )

                print(f"    ✓ Loaded {df.count()} rows into {table_name}")


def _extract_doc_type(filename):
    """Extract document type from CVM CSV filename."""
    parts = filename.upper().replace(".CSV", "").split("_")
    known_types = {"BPA", "BPP", "DRE", "DFC", "DMPL", "DVA", "DRA"}
    for part in parts:
        if part in known_types:
            return part
        if part.startswith("DFC"):
            return part.replace("-", "_")
    return None

# COMMAND ----------

# Execute:
# load_raw_dfp_to_bronze(
#     raw_path="/mnt/portal_cvm/raw",
#     bronze_path="/mnt/portal_cvm/bronze",
#     catalog="portal_cvm",
#     schema="bronze",
#     years=[2023, 2024, 2025]
# )
