import copy
import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATE = ROOT / "ifkb/digital_v0131/normalization_gate"
MODULE_PATH = GATE / "validate_quantity_semantics.py"


def load_module():
    spec = importlib.util.spec_from_file_location("validate_quantity_semantics", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


module = load_module()
SOURCE_QUEUE = json.loads((GATE / "source-record-normalization-work-queue.v1.json").read_text(encoding="utf-8"))
SEMANTICS = json.loads((GATE / "source-quantity-semantics.v1.json").read_text(encoding="utf-8"))


class QuantitySemanticsTests(unittest.TestCase):
    def test_current_13_record_semantics_cover_every_raw_key_once(self):
        report = module.validate(SOURCE_QUEUE, SEMANTICS)
        self.assertTrue(report["valid"], report["errors"])
        self.assertEqual(report["recordCount"], 13)
        self.assertEqual(report["derivedAggregateKeyCount"], 2)
        self.assertEqual(report["ingredientIntervalPairCount"], 4)
        self.assertEqual(report["recipeOutputKeyCount"], 2)
        self.assertEqual(report["recipeOutputIntervalPairCount"], 1)

    def test_duplicate_role_is_rejected(self):
        semantics = copy.deepcopy(SEMANTICS)
        semantics["records"][0]["recipeOutputKeys"].append(
            semantics["records"][0]["independentIngredientKeys"][0]
        )
        report = module.validate(SOURCE_QUEUE, semantics)
        self.assertFalse(report["valid"])
        self.assertTrue(any("multiple semantic roles" in error for error in report["errors"]))

    def test_unclassified_raw_key_is_rejected(self):
        semantics = copy.deepcopy(SEMANTICS)
        semantics["records"][0]["independentIngredientKeys"].pop()
        report = module.validate(SOURCE_QUEUE, semantics)
        self.assertFalse(report["valid"])
        self.assertTrue(any("role coverage mismatch" in error for error in report["errors"]))

    def test_aggregate_mismatch_is_rejected(self):
        queue = copy.deepcopy(SOURCE_QUEUE)
        record = next(row for row in queue["records"] if row["recipeSourceId"] == "DS2-KB-03")
        record["rawQuantityFacts"]["meat_total_g"] += 1
        report = module.validate(queue, SEMANTICS)
        self.assertFalse(report["valid"])
        self.assertTrue(any("does not equal component sum" in error for error in report["errors"]))

    def test_reversed_interval_is_rejected(self):
        queue = copy.deepcopy(SOURCE_QUEUE)
        record = next(row for row in queue["records"] if row["recipeSourceId"] == "DS2-FS-01")
        record["rawQuantityFacts"]["sugar_total_tbsp_low"] = 5
        record["rawQuantityFacts"]["sugar_total_tbsp_high"] = 1
        report = module.validate(queue, SEMANTICS)
        self.assertFalse(report["valid"])
        self.assertTrue(any("low bound exceeds high bound" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
