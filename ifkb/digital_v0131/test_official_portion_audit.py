import hashlib
import importlib.util
import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "ifkb/digital_v0131/normalization_gate/audit_official_portion_candidates.py"


def load_module():
    spec = importlib.util.spec_from_file_location("audit_official_portion_candidates", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


audit_module = load_module()


class OfficialPortionAuditTests(unittest.TestCase):
    def fixture(self, directory: Path):
        database = directory / "catalog.db"
        connection = sqlite3.connect(database)
        connection.executescript("""
        CREATE TABLE generic_foods(
          id TEXT PRIMARY KEY,source_type TEXT,source_numeric_id INTEGER,
          source_food_code TEXT,name_en TEXT
        );
        CREATE TABLE generic_portions(
          id INTEGER PRIMARY KEY,food_id TEXT,amount REAL,label TEXT,
          measure_unit TEXT,gram_weight REAL
        );
        INSERT INTO generic_foods VALUES ('sr:test','sr_legacy',123,NULL,'Oil, olive, salad or cooking');
        INSERT INTO generic_portions VALUES (1,'sr:test',1,'1 tablespoon','tbsp',13.5);
        """)
        connection.commit()
        connection.close()
        digest = hashlib.sha256(database.read_bytes()).hexdigest()
        manifest = directory / "manifest.json"
        manifest.write_text(json.dumps({
            "version": "test",
            "databaseSha256": digest,
            "databaseBytes": database.stat().st_size
        }), encoding="utf-8")
        queue = directory / "queue.json"
        queue.write_text(json.dumps({"requirements": [
            {"quantityFamily": "oil_total_tbsp", "conversionFactorToGrams": None, "reviewStatus": "unresolved"},
            {"quantityFamily": "skewer_count", "conversionFactorToGrams": None, "reviewStatus": "unresolved"}
        ]}), encoding="utf-8")
        spec = directory / "spec.json"
        spec.write_text(json.dumps({
            "format": "ifkb-ds2-official-portion-audit-spec",
            "policy": {
                "auditOnly": True,
                "automaticApprovalForbidden": True,
                "candidateGramWeightsMustRemainRawOfficialPortions": True,
                "sourceSpecificFormReviewRequired": True
            },
            "families": [
                {
                    "quantityFamily": "oil_total_tbsp",
                    "mode": "search",
                    "foodQueries": ["oil, olive"],
                    "measureTokens": ["tablespoon", "tbsp"],
                    "targetAmount": 1
                },
                {
                    "quantityFamily": "skewer_count",
                    "mode": "unsupported",
                    "reason": "output unit"
                }
            ]
        }), encoding="utf-8")
        return database, manifest, queue, spec

    def test_returns_raw_official_candidate_without_approval(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, queue, spec = self.fixture(Path(temp))
            report = audit_module.audit(database, manifest, queue, spec)
            self.assertTrue(report["aligned"], report["errors"])
            self.assertEqual(report["approvedConversionCount"], 0)
            oil = next(row for row in report["families"] if row["quantityFamily"] == "oil_total_tbsp")
            self.assertEqual(oil["candidateCount"], 1)
            self.assertEqual(oil["candidates"][0]["gramWeight"], 13.5)
            self.assertEqual(oil["candidates"][0]["approvalStatus"], "not_reviewed")
            self.assertNotIn("conversionFactorToGrams", oil["candidates"][0])

    def test_rejects_spec_that_does_not_cover_queue(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, queue, spec = self.fixture(Path(temp))
            value = json.loads(spec.read_text(encoding="utf-8"))
            value["families"] = value["families"][:1]
            spec.write_text(json.dumps(value), encoding="utf-8")
            report = audit_module.audit(database, manifest, queue, spec)
            self.assertFalse(report["aligned"])
            self.assertTrue(any("coverage differs" in error for error in report["errors"]))

    def test_rejects_queue_with_prefilled_unreviewed_factor(self):
        with tempfile.TemporaryDirectory() as temp:
            database, manifest, queue, spec = self.fixture(Path(temp))
            value = json.loads(queue.read_text(encoding="utf-8"))
            value["requirements"][0]["conversionFactorToGrams"] = 13.5
            queue.write_text(json.dumps(value), encoding="utf-8")
            report = audit_module.audit(database, manifest, queue, spec)
            self.assertFalse(report["aligned"])
            self.assertTrue(any("unreviewed conversion factor" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
