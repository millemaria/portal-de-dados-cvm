# Databricks notebook source
# MAGIC %md
# MAGIC # Download DFP Data from CVM
# MAGIC Downloads ZIP files from CVM open data portal and stores in raw landing zone.

import urllib.request
import os
from config import CVM_BASE_URL, DFP_FILE_PATTERN, YEARS_RANGE, RAW_PATH

# COMMAND ----------

def download_cvm_dfp(years=None, target_path=RAW_PATH):
    """Download DFP ZIP files from CVM for specified years."""
    if years is None:
        years = list(YEARS_RANGE)

    downloaded = []
    for year in years:
        filename = DFP_FILE_PATTERN.format(year=year)
        url = f"{CVM_BASE_URL}/{filename}"
        local_path = os.path.join(target_path, filename)

        print(f"Downloading {url}...")
        try:
            urllib.request.urlretrieve(url, local_path)
            downloaded.append({"year": year, "file": local_path, "status": "success"})
            print(f"  ✓ Saved to {local_path}")
        except Exception as e:
            downloaded.append({"year": year, "file": local_path, "status": f"error: {e}"})
            print(f"  ✗ Error: {e}")

    return downloaded

# COMMAND ----------

# Execute download for all years
# Uncomment and adjust years as needed:
# results = download_cvm_dfp(years=[2023, 2024, 2025])
# display(spark.createDataFrame(results))
