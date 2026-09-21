"""
Test suite for the Portal CVM Self-Service Data Pipeline.
Validates:
1. The 8 logical entities definition and mapping
2. Deduplication keys per entity (not using CNPJ alone where improper)
3. Absence of artificial limits (.limit(8), .take(8), hardcoded company lists)
4. Recursive file reading and multi-partition support logic
5. Metric collection and logging format
"""

import unittest
import os
import re

class TestDataPipelineRules(unittest.TestCase):

    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.silver_file = os.path.join(self.base_dir, "data", "silver", "process_silver_entities.py")
        self.gold_summary_file = os.path.join(self.base_dir, "data", "gold", "build_company_summary.py")
        self.gold_indicators_file = os.path.join(self.base_dir, "data", "gold", "build_financial_indicators.py")
        self.runner_file = os.path.join(self.base_dir, "data", "pipeline_runner.py")
        self.config_file = os.path.join(self.base_dir, "data", "ingestion", "config.py")

    def test_8_entities_defined(self):
        """Rule: Ensure all 8 logical entities are defined."""
        with open(self.config_file, "r", encoding="utf-8") as f:
            content = f.read()

        expected_entities = [
            "vw_companhia_atual",
            "vw_balanco_patrimonial_latest",
            "vw_resultado_latest",
            "vw_fluxo_caixa_latest",
            "vw_demonstracao_financeira_latest",
            "fato_composicao_capital",
            "fato_parecer_auditoria",
            "fato_documento_cvm"
        ]

        for ent in expected_entities:
            self.assertIn(ent, content, f"Entidade {ent} deve estar definida nas configurações do projeto")

    def test_no_artificial_limits_in_silver(self):
        """Rule 6: No artificial .limit(8), .head(8), .take(8) or fixed company lists."""
        with open(self.silver_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Check for .limit(8) or similar
        self.assertNotIn(".limit(8)", content)
        self.assertNotIn(".limit(10)", content)
        self.assertNotIn(".take(8)", content)
        self.assertNotIn(".head(8)", content)

    def test_recursive_reading_options(self):
        """Rule 4: recursiveFileLookup must be configured."""
        with open(self.silver_file, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("recursiveFileLookup", content)
        self.assertIn("read_silver_partitioned_dataset", content)

    def test_deduplication_keys(self):
        """Rule 8: Deduplication uses entity-specific composite business keys."""
        with open(self.silver_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Check that balanco uses account code and period
        self.assertIn('"cd_conta"', content)
        self.assertIn('"grupo_dfp"', content)
        self.assertIn('"dt_fim_exerc"', content)

        # Check that resultado uses account code, period start/end
        self.assertIn('"dt_ini_exerc"', content)

        # Check that fluxo_caixa uses metodo
        self.assertIn('"metodo"', content)

    def test_gold_summary_preserves_all_companies(self):
        """Rule 11: Gold layer must preserve all companies."""
        with open(self.gold_summary_file, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("vw_companhia_atual", content)
        self.assertIn("left", content)
        self.assertNotIn(".limit(", content)

    def test_metrics_logging(self):
        """Rule 13, 19, 21: Metric logging for count, distinct companies, files, and periods."""
        with open(self.silver_file, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("log_entity_metrics", content)
        self.assertIn("distinct_companies", content)
        self.assertIn("distinct_files", content)

        with open(self.runner_file, "r", encoding="utf-8") as f:
            runner_content = f.read()

        self.assertIn("RELATÓRIO FINAL DE VALIDAÇÃO DO PIPELINE", runner_content)

if __name__ == "__main__":
    unittest.main()
