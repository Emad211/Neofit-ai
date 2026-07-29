import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "ifkb/digital_v0131/normalization_gate/build_official_portion_review_queue.py"


def load_module():
    spec = importlib.util.spec_from_file_location("build_official_portion_review_queue", MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


module = load_module()


def candidate(weight, food_id="sr:test"):
    return {
        "foodId": food_id,
        "sourceType": "sr_legacy",
        "sourceNumericId": 1,
        "sourceFoodCode": None,
        "foodNameEn": "Test food",
        "amount": 1,
        "label": "cup",
        "measureUnit": "undetermined",
        "gramWeight": weight,
        "matchedFoodQuery": "test food",
        "approvalStatus": "not_reviewed"
    }


class OfficialPortionReviewQueueTests(unittest.TestCase):
    def base(self, families):
        audit = {
            "format": "ifkb-ds2-official-portion-audit-report",
            "version": "1.1.1",
            "auditOnly": True,
            "aligned": True,
            "approvedConversionCount": 0,
            "catalog": {"version": "1.2.0", "databaseSha256": "a" * 64},
            "families": families
        }
        queue = {"requirements": [
            {
                "quantityFamily": family["quantityFamily"],
                "affectedSourceRecordIds": ["SRC-1"],
                "conversionFactorToGrams": None,
                "reviewStatus": "unresolved"
            }
            for family in families
        ]}
        return audit, queue

    def test_classifies_single_convergent_conflicting_and_gap_items(self):
        families = [
            {"quantityFamily": "single", "mode": "search", "qualifiedCandidates": [candidate(10)], "reviewDisposition": "single"},
            {"quantityFamily": "convergent", "mode": "search", "qualifiedCandidates": [candidate(20, "a"), candidate(20, "b")], "reviewDisposition": "convergent"},
            {"quantityFamily": "conflict", "mode": "search", "qualifiedCandidates": [candidate(30, "a"), candidate(40, "b")], "reviewDisposition": "conflict"},
            {"quantityFamily": "gap", "mode": "search", "qualifiedCandidates": [], "reviewDisposition": "gap"},
            {"quantityFamily": "unsupported", "mode": "unsupported", "qualifiedCandidates": [], "reason": "protocol"}
        ]
        audit, queue = self.base(families)
        output = module.build(audit, queue)
        self.assertTrue(output["valid"], output["errors"])
        self.assertEqual(output["approvedItemCount"], 0)
        statuses = {item["quantityFamily"]: item["status"] for item in output["items"]}
        self.assertEqual(statuses["single"], "ready_for_independent_review")
        self.assertEqual(statuses["convergent"], "ready_for_independent_review_convergent")
        self.assertEqual(statuses["conflict"], "needs_source_specific_adjudication")
        self.assertEqual(statuses["gap"], "blocked_catalog_or_measure_gap")
        self.assertEqual(statuses["unsupported"], "blocked_non_catalog_protocol")
        for item in output["items"]:
            self.assertIsNone(item["proposedConversionFactorToGrams"])
            self.assertEqual(item["approvalStatus"], "not_approved")

    def test_rejects_prefilled_factor(self):
        families = [{"quantityFamily": "single", "mode": "search", "qualifiedCandidates": [candidate(10)]}]
        audit, queue = self.base(families)
        queue["requirements"][0]["conversionFactorToGrams"] = 10
        output = module.build(audit, queue)
        self.assertFalse(output["valid"])
        self.assertTrue(any("already has a conversion factor" in error for error in output["errors"]))

    def test_rejects_audit_with_approved_conversion(self):
        families = [{"quantityFamily": "single", "mode": "search", "qualifiedCandidates": [candidate(10)]}]
        audit, queue = self.base(families)
        audit["approvedConversionCount"] = 1
        output = module.build(audit, queue)
        self.assertFalse(output["valid"])
        self.assertTrue(any("approved conversions" in error for error in output["errors"]))


if __name__ == "__main__":
    unittest.main()
