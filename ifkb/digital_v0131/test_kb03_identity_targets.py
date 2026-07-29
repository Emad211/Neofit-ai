import copy
import csv
import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATE = ROOT / "ifkb/digital_v0131/normalization_gate"
MODULE_PATH = GATE / "validate_kb03_identity_targets.py"


def load_module():
    spec = importlib.util.spec_from_file_location("validate_kb03_identity_targets", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


module = load_module()


def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


CORE = read_csv(ROOT / "mobile/data/ifkb/reference/ingredient-catalog-core.csv")
EXTENSION = read_csv(GATE / "kb03-ingredient-identity-extension.v1.csv")
SEMANTICS = json.loads((GATE / "source-quantity-semantics.v1.json").read_text(encoding="utf-8"))
TARGETS = json.loads((GATE / "kb03-ingredient-identity-targets.v1.json").read_text(encoding="utf-8"))


class Kb03IdentityTargetTests(unittest.TestCase):
    def test_all_seven_independent_ingredients_have_stable_candidate_targets(self):
        report = module.validate(CORE, EXTENSION, SEMANTICS, TARGETS)
        self.assertTrue(report["valid"], report["errors"])
        self.assertEqual(report["independentIngredientCount"], 7)
        self.assertEqual(report["identityTargetCoverageCount"], 7)
        self.assertEqual(report["candidateExtensionCount"], 4)
        self.assertEqual(report["nutrientSourceApprovedCount"], 0)
        self.assertFalse(report["promotionEligible"])
        onion = next(target for target in report["targets"] if target["quantityKey"] == "onion_total_g")
        self.assertEqual(onion["ingredientId"], "IFKB-ING-0095")
        self.assertEqual(onion["nameEn"], "Onion, raw, unspecified variety")

    def test_derived_meat_total_cannot_be_an_identity_target(self):
        targets = copy.deepcopy(TARGETS)
        targets["targets"].append({
            "quantityKey": "meat_total_g",
            "ingredientId": "IFKB-ING-0030",
            "expectedNameEn": "Beef, ground, raw",
            "expectedDefaultState": "raw",
            "identityTargetStatus": "proposed"
        })
        report = module.validate(CORE, EXTENSION, SEMANTICS, targets)
        self.assertFalse(report["valid"])
        self.assertTrue(any("derived aggregates entered" in error for error in report["errors"]))

    def test_extension_id_collision_is_rejected(self):
        extension = copy.deepcopy(EXTENSION)
        extension[0]["ingredient_id"] = "IFKB-ING-0089"
        report = module.validate(CORE, extension, SEMANTICS, TARGETS)
        self.assertFalse(report["valid"])
        self.assertTrue(any("duplicate ingredient id" in error for error in report["errors"]))

    def test_identity_coverage_does_not_approve_nutrient_sources(self):
        report = module.validate(CORE, EXTENSION, SEMANTICS, TARGETS)
        self.assertTrue(all(target["nutrientSourceApproved"] is False for target in report["targets"]))
        self.assertEqual(report["nutrientSourceApprovedCount"], 0)

    def test_unspecified_onion_must_not_silently_use_white_onion_target(self):
        targets = copy.deepcopy(TARGETS)
        onion = next(target for target in targets["targets"] if target["quantityKey"] == "onion_total_g")
        onion.update({
            "ingredientId": "IFKB-ING-0053",
            "expectedNameEn": "Onions, white, raw",
            "expectedDefaultState": "raw",
            "identityTargetStatus": "proposed"
        })
        report = module.validate(CORE, EXTENSION, SEMANTICS, targets)
        self.assertFalse(report["valid"])
        self.assertTrue(any("source-unspecified onion" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
