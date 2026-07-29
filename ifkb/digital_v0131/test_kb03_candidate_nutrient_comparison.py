import hashlib
import importlib.util
import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "ifkb/digital_v0131/normalization_gate/build_kb03_candidate_nutrient_comparison.py"


def load_module():
    spec = importlib.util.spec_from_file_location("build_kb03_candidate_nutrient_comparison", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


module = load_module()


class Kb03CandidateNutrientComparisonTests(unittest.TestCase):
    def fixture(self, directory: Path):
        database = directory / "catalog.db"
        connection = sqlite3.connect(database)
        connection.execute("""
        CREATE TABLE generic_foods(
          id TEXT PRIMARY KEY,source_type TEXT,source_numeric_id INTEGER,source_food_code TEXT,name_en TEXT,
          calories_kcal REAL,protein_g REAL,fat_g REAL,carbs_g REAL,fiber_g REAL,sugars_g REAL,
          sodium_mg REAL,cholesterol_mg REAL,calcium_mg REAL,iron_mg REAL,potassium_mg REAL,
          vitamin_c_mg REAL,macro_completeness INTEGER,portion_count INTEGER
        )
        """)
        rows = [
            ("a","sr_legacy",1,None,"Beef raw A",200,20,10,0,None,None,50,70,10,2,300,None,1,0),
            ("b","sr_legacy",2,None,"Beef raw B",300,18,25,0,None,None,60,80,12,2.5,280,None,1,0),
        ]
        connection.executemany("INSERT INTO generic_foods VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", rows)
        connection.commit(); connection.close()
        manifest = directory / "manifest.json"
        manifest.write_text(json.dumps({
            "version": "test",
            "databaseSha256": hashlib.sha256(database.read_bytes()).hexdigest(),
            "databaseBytes": database.stat().st_size
        }), encoding="utf-8")
        review = directory / "review.json"
        review.write_text(json.dumps({
            "format": "ifkb-ds2-kb03-ingredient-mapping-review-queue",
            "valid": True,
            "recipeSourceId": "DS2-KB-03",
            "canonId": "IFKB-CANON-00028",
            "approvedMappingCount": 0,
            "policy": {"blindVariantAveragingForbidden": True},
            "items": [{
                "quantityKey": "beef_total_g",
                "sourceQuantityG": 500,
                "status": "needs_identity_and_variant_adjudication",
                "candidateEvidence": [
                    {"foodId": "a", "foodNameEn": "Beef raw A", "conceptId": "c1"},
                    {"foodId": "b", "foodNameEn": "Beef raw B", "conceptId": "c2"},
                ]
            }]
        }), encoding="utf-8")
        return database, manifest, review

    def test_builds_per100g_envelope_without_recipe_contribution(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, review = self.fixture(Path(temp))
            output = module.build(database, manifest, review)
            self.assertTrue(output["valid"], output["errors"])
            self.assertFalse(output["recipeNutritionCalculated"])
            item = output["items"][0]
            self.assertFalse(item["recipeContributionCalculated"])
            self.assertEqual(item["per100gEnvelope"]["calories_kcal"]["min"], 200)
            self.assertEqual(item["per100gEnvelope"]["calories_kcal"]["max"], 300)
            self.assertEqual(item["per100gEnvelope"]["fat_g"]["spread"], 15)
            self.assertEqual(item["per100gEnvelope"]["fiber_g"]["knownCount"], 0)
            self.assertIsNone(item["selectedFoodId"])

    def test_rejects_review_queue_with_approved_mapping(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, review = self.fixture(Path(temp))
            value = json.loads(review.read_text(encoding="utf-8"))
            value["approvedMappingCount"] = 1
            review.write_text(json.dumps(value), encoding="utf-8")
            output = module.build(database, manifest, review)
            self.assertFalse(output["valid"])
            self.assertTrue(any("approved mappings" in error for error in output["errors"]))

    def test_rejects_candidate_name_drift(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, review = self.fixture(Path(temp))
            value = json.loads(review.read_text(encoding="utf-8"))
            value["items"][0]["candidateEvidence"][0]["foodNameEn"] = "Changed"
            review.write_text(json.dumps(value), encoding="utf-8")
            output = module.build(database, manifest, review)
            self.assertFalse(output["valid"])
            self.assertTrue(any("name drifted" in error for error in output["errors"]))


if __name__ == "__main__":
    unittest.main()
