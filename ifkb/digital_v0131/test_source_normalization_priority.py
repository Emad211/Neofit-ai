import copy
import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATE = ROOT / "ifkb/digital_v0131/normalization_gate"
MODULE_PATH = GATE / "build_source_normalization_priority.py"


def load_module():
    spec = importlib.util.spec_from_file_location("build_source_normalization_priority", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


module = load_module()
SOURCE_QUEUE = json.loads((GATE / "source-record-normalization-work-queue.v1.json").read_text(encoding="utf-8"))
SEMANTICS = json.loads((GATE / "source-quantity-semantics.v1.json").read_text(encoding="utf-8"))
UNIT_QUEUE = json.loads((GATE / "unit-conversion-work-queue.v1.json").read_text(encoding="utf-8"))


def synthetic_review_queue():
    return {
        "valid": True,
        "approvedItemCount": 0,
        "items": [
            {
                "quantityFamily": requirement["quantityFamily"],
                "status": "ready_for_independent_review",
                "candidateGramWeights": [1.0],
                "approvalStatus": "not_approved",
            }
            for requirement in UNIT_QUEUE["requirements"]
        ]
    }


class SourceNormalizationPriorityTests(unittest.TestCase):
    def test_mass_anchored_koobideh_source_is_first_but_not_nutrient_ready(self):
        report = module.build(SOURCE_QUEUE, SEMANTICS, synthetic_review_queue())
        self.assertTrue(report["valid"], report["errors"])
        self.assertEqual(report["recordCount"], 13)
        self.assertEqual(report["nutrientReadyCount"], 0)
        first = report["records"][0]
        self.assertEqual(first["recipeSourceId"], "DS2-KB-03")
        self.assertEqual(first["priorityTier"], "A")
        self.assertEqual(first["householdUnitFamilyCount"], 0)
        self.assertFalse(first["readyForNutrientCalculation"])
        self.assertEqual(first["independentIngredientCount"], 7)
        self.assertEqual(first["derivedAggregateCount"], 1)

    def test_missing_review_family_is_rejected(self):
        review = synthetic_review_queue()
        review["items"] = review["items"][1:]
        report = module.build(SOURCE_QUEUE, SEMANTICS, review)
        self.assertFalse(report["valid"])
        self.assertTrue(any("missing review-queue item" in error for error in report["errors"]))

    def test_missing_servings_is_lowest_priority_tier(self):
        report = module.build(SOURCE_QUEUE, SEMANTICS, synthetic_review_queue())
        record = next(row for row in report["records"] if row["recipeSourceId"] == "DS2-FS-04")
        self.assertEqual(record["priorityTier"], "D")
        self.assertFalse(record["servingsKnown"])

    def test_prefilled_review_approval_is_rejected(self):
        review = synthetic_review_queue()
        review["approvedItemCount"] = 1
        report = module.build(SOURCE_QUEUE, SEMANTICS, review)
        self.assertFalse(report["valid"])
        self.assertTrue(any("zero approved" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
