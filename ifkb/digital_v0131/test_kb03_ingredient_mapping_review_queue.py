import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "ifkb/digital_v0131/normalization_gate/build_kb03_ingredient_mapping_review_queue.py"


def load_module():
    spec = importlib.util.spec_from_file_location("build_kb03_ingredient_mapping_review_queue", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


module = load_module()


def candidate(food_id: str, concept_id: str):
    return {
        "foodId": food_id,
        "sourceType": "sr_legacy",
        "sourceNumericId": 1,
        "sourceFoodCode": None,
        "foodNameEn": "Ingredient raw",
        "macroCompleteness": True,
        "conceptId": concept_id,
        "conceptNameEn": "Ingredient",
        "conceptMappingPolicy": "conservative_comma_parser",
        "cookingTags": ["raw"],
        "formTags": [],
        "fatTags": [],
    }


def audit(ingredients):
    return {
        "format": "ifkb-ds2-ingredient-mapping-audit-report",
        "version": "1.0.0",
        "auditOnly": True,
        "valid": True,
        "recipeSourceId": "DS2-KB-03",
        "canonId": "IFKB-CANON-00028",
        "mappedIngredientCount": 0,
        "catalog": {"version": "1.2.0", "databaseSha256": "a" * 64},
        "ingredients": ingredients,
    }


class Kb03IngredientMappingReviewQueueTests(unittest.TestCase):
    def test_classifies_single_variant_multi_variant_multi_concept_and_gap(self):
        value = audit([
            {"quantityKey": "single", "sourceQuantity": 1, "qualifiedCandidates": [candidate("f1", "c1")]},
            {"quantityKey": "variants", "sourceQuantity": 2, "qualifiedCandidates": [candidate("f1", "c1"), candidate("f2", "c1")]},
            {"quantityKey": "concepts", "sourceQuantity": 3, "qualifiedCandidates": [candidate("f1", "c1"), candidate("f2", "c2")]},
            {"quantityKey": "gap", "sourceQuantity": 4, "qualifiedCandidates": []},
        ])
        output = module.build(value)
        self.assertTrue(output["valid"], output["errors"])
        self.assertEqual(output["approvedMappingCount"], 0)
        statuses = {item["quantityKey"]: item["status"] for item in output["items"]}
        self.assertEqual(statuses["single"], "ready_for_independent_review")
        self.assertEqual(statuses["variants"], "needs_variant_adjudication")
        self.assertEqual(statuses["concepts"], "needs_identity_and_variant_adjudication")
        self.assertEqual(statuses["gap"], "blocked_catalog_gap")
        for item in output["items"]:
            self.assertIsNone(item["proposedFoodId"])
            self.assertIsNone(item["proposedConceptId"])
            self.assertEqual(item["mappingApprovalStatus"], "not_approved")

    def test_rejects_audit_with_prefilled_mapping(self):
        value = audit([])
        value["mappedIngredientCount"] = 1
        output = module.build(value)
        self.assertFalse(output["valid"])
        self.assertTrue(any("mapped ingredients" in error for error in output["errors"]))

    def test_rejects_wrong_source(self):
        value = audit([])
        value["recipeSourceId"] = "DS2-KB-02"
        output = module.build(value)
        self.assertFalse(output["valid"])
        self.assertTrue(any("restricted to DS2-KB-03" in error for error in output["errors"]))


if __name__ == "__main__":
    unittest.main()
