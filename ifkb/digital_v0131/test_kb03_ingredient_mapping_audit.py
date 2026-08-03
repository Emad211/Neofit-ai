import hashlib
import importlib.util
import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "ifkb/digital_v0131/normalization_gate/audit_kb03_ingredient_mapping.py"


def load_module():
    spec = importlib.util.spec_from_file_location("audit_kb03_ingredient_mapping", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


module = load_module()


class Kb03IngredientMappingAuditTests(unittest.TestCase):
    def fixture(self, directory: Path):
        database = directory / "catalog.db"
        connection = sqlite3.connect(database)
        connection.executescript("""
        CREATE TABLE generic_foods(
          id TEXT PRIMARY KEY,source_type TEXT,source_numeric_id INTEGER,source_food_code TEXT,
          name_en TEXT,macro_completeness INTEGER
        );
        CREATE TABLE generic_concepts(
          id TEXT PRIMARY KEY,name_en TEXT,mapping_policy TEXT,variant_count INTEGER,source_type_count INTEGER
        );
        CREATE TABLE generic_variants(
          food_id TEXT PRIMARY KEY,concept_id TEXT,cooking_tags_json TEXT,form_tags_json TEXT,
          fat_tags_json TEXT,original_name_en TEXT,source_type TEXT
        );
        INSERT INTO generic_foods VALUES ('sr:beef','sr_legacy',1,NULL,'Beef, ground, 80% lean meat / 20% fat, raw',1);
        INSERT INTO generic_concepts VALUES ('ugc:beef','Beef, ground, 80% lean meat / 20% fat','conservative_comma_parser',2,1);
        INSERT INTO generic_variants VALUES ('sr:beef','ugc:beef','["raw"]','[]','[]','Beef, ground, 80% lean meat / 20% fat, raw','sr_legacy');
        INSERT INTO generic_foods VALUES ('sr:cooked','sr_legacy',2,NULL,'Beef, ground, 80% lean meat / 20% fat, cooked',1);
        INSERT INTO generic_variants VALUES ('sr:cooked','ugc:beef','["cooked"]','[]','[]','Beef, ground, 80% lean meat / 20% fat, cooked','sr_legacy');
        """)
        connection.commit()
        connection.close()
        digest = hashlib.sha256(database.read_bytes()).hexdigest()
        manifest = directory / "manifest.json"
        manifest.write_text(json.dumps({"version": "test", "databaseSha256": digest, "databaseBytes": database.stat().st_size}), encoding="utf-8")
        source = directory / "source.json"
        source.write_text(json.dumps({"records": [{
            "recipeSourceId": "DS2-KB-03",
            "rawQuantityFacts": {"beef_total_g": 500, "meat_total_g": 1000}
        }]}), encoding="utf-8")
        semantics = directory / "semantics.json"
        semantics.write_text(json.dumps({"records": [{
            "recipeSourceId": "DS2-KB-03",
            "independentIngredientKeys": ["beef_total_g"],
            "derivedAggregateKeys": [{"key": "meat_total_g", "componentKeys": ["beef_total_g", "lamb_total_g"], "relation": "sum"}]
        }]}), encoding="utf-8")
        spec = directory / "spec.json"
        spec.write_text(json.dumps({
            "format": "ifkb-ds2-ingredient-mapping-audit-spec",
            "recipeSourceId": "DS2-KB-03",
            "canonId": "IFKB-CANON-00028",
            "policy": {
                "auditOnly": True,
                "automaticMappingForbidden": True,
                "derivedAggregateExcluded": True,
                "conceptAndVariantEvidenceRequired": True,
                "independentReviewRequired": True
            },
            "ingredients": [{
                "quantityKey": "beef_total_g",
                "namePrefixes": ["beef, ground"],
                "requiredCookingTagsAny": ["raw"],
                "excludedNameTokens": ["cooked"]
            }]
        }), encoding="utf-8")
        return database, manifest, source, semantics, spec

    def test_returns_raw_ground_beef_concept_variant_without_mapping(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, source, semantics, spec = self.fixture(Path(temp))
            report = module.audit(database, manifest, source, semantics, spec)
            self.assertTrue(report["valid"], report["errors"])
            self.assertEqual(report["mappedIngredientCount"], 0)
            ingredient = report["ingredients"][0]
            self.assertEqual(ingredient["qualifiedCandidateCount"], 1)
            candidate = ingredient["qualifiedCandidates"][0]
            self.assertEqual(candidate["foodId"], "sr:beef")
            self.assertEqual(candidate["conceptId"], "ugc:beef")
            self.assertIn("raw", candidate["cookingTags"])
            self.assertEqual(candidate["mappingApprovalStatus"], "not_reviewed")
            self.assertIsNone(ingredient["proposedFoodId"])

    def test_derived_aggregate_cannot_enter_mapping_spec(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, source, semantics, spec = self.fixture(Path(temp))
            value = json.loads(spec.read_text(encoding="utf-8"))
            value["ingredients"].append({
                "quantityKey": "meat_total_g",
                "namePrefixes": ["beef"],
                "requiredCookingTagsAny": [],
                "excludedNameTokens": []
            })
            spec.write_text(json.dumps(value), encoding="utf-8")
            report = module.audit(database, manifest, source, semantics, spec)
            self.assertFalse(report["valid"])
            self.assertTrue(any("derived aggregates entered" in error for error in report["errors"]))

    def test_cooked_variant_is_rejected_for_raw_requirement(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, source, semantics, spec = self.fixture(Path(temp))
            report = module.audit(database, manifest, source, semantics, spec)
            ingredient = report["ingredients"][0]
            rejected_ids = {candidate["foodId"] for candidate in ingredient["rejectedCandidateSample"]}
            self.assertIn("sr:cooked", rejected_ids)


if __name__ == "__main__":
    unittest.main()
