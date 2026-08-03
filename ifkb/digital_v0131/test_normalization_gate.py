import copy
import csv
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATE_DIR = ROOT / "ifkb/digital_v0131/normalization_gate"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


validator = load_module("validate_normalization_gate", GATE_DIR / "validate_normalization_gate.py")
alignment = load_module("verify_consensus_alignment", GATE_DIR / "verify_consensus_alignment.py")
source_queue_validator = load_module("validate_source_work_queue", GATE_DIR / "validate_source_work_queue.py")
CURRENT_PATH = GATE_DIR / "current-status.v1.json"
SCHEMA_PATH = GATE_DIR / "gate.schema.json"
SOURCE_QUEUE_PATH = GATE_DIR / "source-record-normalization-work-queue.v1.json"
UNIT_QUEUE_PATH = GATE_DIR / "unit-conversion-work-queue.v1.json"


def ready_profile():
    return {
        "canonId": "IFKB-CANON-99999",
        "consensusId": "CONS-IFKB-CANON-99999-V1",
        "foodNameFa": "غذای آزمون",
        "sourceRecords": 3,
        "independentSourceGroups": 3,
        "identityStatus": "multi_source_consensus",
        "evidenceTier": "DS2",
        "sourceRecordIds": ["SRC-1", "SRC-2", "SRC-3"],
        "sourceStatus": {
            "nutrientIntervalStatusRaw": "ready",
            "portionPriorStatusRaw": "calculated_serving_available",
            "userGroundingRequiredForDS3": True,
        },
        "normalization": {
            "ingredientMapping": "complete",
            "quantityNormalization": "complete",
            "yieldNormalization": "complete",
            "retentionFactors": "complete",
            "edibleFractions": "complete",
            "servingBasis": "measured_or_calculated",
        },
        "servingWeightG": 250.0,
        "nutrientIntervals": "ready",
        "nutritionCenterBasis": "normalized_recipe_calculation",
        "calculationArtifactSha256": "a" * 64,
        "ingredientMappingArtifactSha256": "b" * 64,
        "review": {
            "reviewer1": "reviewer-a",
            "reviewer2": "reviewer-b",
            "adjudicator": "adjudicator-c",
            "status": "adjudicated",
        },
        "promotionEligible": True,
        "blockingReasons": [],
    }


def ready_document():
    return {
        "format": "ifkb-ds2-normalization-gate",
        "version": "1.0.0",
        "sourceRelease": "test-release",
        "status": "release-ready",
        "scientificPolicy": {
            "identityConsensusIsNotNutrientReadiness": True,
            "legacyNutritionCenterMayNotBeRelabelledAsNormalizedRecipeCalculation": True,
            "promotionRequiresIndependentReview": True,
        },
        "profiles": [ready_profile()],
    }


class NormalizationGateTests(unittest.TestCase):
    def test_schema_and_current_status_are_parseable_json(self):
        self.assertIsInstance(json.loads(SCHEMA_PATH.read_text(encoding="utf-8")), dict)
        self.assertIsInstance(json.loads(CURRENT_PATH.read_text(encoding="utf-8")), dict)

    def test_current_v0131_status_is_structurally_valid_but_release_blocked(self):
        current = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
        draft = validator.validate_document(current, require_v0131_profile_set=True)
        self.assertFalse(draft.errors)
        self.assertEqual((draft.profile_count, draft.eligible_count, draft.blocked_count), (3, 0, 3))
        release = validator.validate_document(
            current,
            require_all_release_ready=True,
            require_v0131_profile_set=True,
        )
        self.assertTrue(any("3 remain blocked" in error for error in release.errors))

    def test_complete_independently_reviewed_profile_can_pass_release_mode(self):
        result = validator.validate_document(ready_document(), require_all_release_ready=True)
        self.assertFalse(result.errors)
        self.assertEqual(result.eligible_count, 1)

    def test_legacy_center_cannot_be_relabelled_as_promotion_ready(self):
        document = ready_document()
        document["profiles"][0]["nutritionCenterBasis"] = "legacy_estimate"
        result = validator.validate_document(document, require_all_release_ready=True)
        self.assertTrue(any("without normalized recipe nutrition" in error for error in result.errors))

    def test_null_serving_weight_blocks_promotion(self):
        document = ready_document()
        document["profiles"][0]["servingWeightG"] = None
        result = validator.validate_document(document)
        self.assertTrue(any("without servingWeightG" in error for error in result.errors))

    def test_reviewers_must_be_distinct(self):
        document = ready_document()
        document["profiles"][0]["review"]["adjudicator"] = "reviewer-a"
        result = validator.validate_document(document)
        self.assertTrue(any("three distinct people" in error for error in result.errors))

    def test_source_record_count_and_uniqueness_are_enforced(self):
        document = ready_document()
        document["profiles"][0]["sourceRecordIds"] = ["SRC-1", "SRC-1"]
        result = validator.validate_document(document)
        self.assertTrue(any("contains duplicates" in error for error in result.errors))
        self.assertTrue(any("count does not match" in error for error in result.errors))

    def test_duplicate_canonical_identity_is_rejected(self):
        document = ready_document()
        duplicate = copy.deepcopy(document["profiles"][0])
        duplicate["consensusId"] = "CONS-IFKB-CANON-99999-V2"
        document["profiles"].append(duplicate)
        result = validator.validate_document(document)
        self.assertTrue(any("duplicate canonId" in error for error in result.errors))

    def test_blocked_profile_must_explain_blockers(self):
        current = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
        current["profiles"][0]["blockingReasons"] = []
        result = validator.validate_document(current)
        self.assertTrue(any("blocked but has no blockingReasons" in error for error in result.errors))

    def test_consensus_csv_alignment_preserves_raw_readiness_fields(self):
        current = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
        headers = [
            "consensus_id", "canon_id", "food_name_fa", "variant_label",
            "source_records", "independent_source_groups", "independence_groups",
            "evidence_tier", "identity_status", "nutrient_interval_status",
            "portion_prior_status", "user_grounding_required_for_DS3", "notes",
        ]
        with tempfile.TemporaryDirectory() as directory:
            csv_path = Path(directory) / "ds2.csv"
            with csv_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=headers)
                writer.writeheader()
                for profile in current["profiles"]:
                    writer.writerow({
                        "consensus_id": profile["consensusId"],
                        "canon_id": profile["canonId"],
                        "food_name_fa": profile["foodNameFa"],
                        "variant_label": "test",
                        "source_records": profile["sourceRecords"],
                        "independent_source_groups": profile["independentSourceGroups"],
                        "independence_groups": "test",
                        "evidence_tier": profile["evidenceTier"],
                        "identity_status": profile["identityStatus"],
                        "nutrient_interval_status": profile["sourceStatus"]["nutrientIntervalStatusRaw"],
                        "portion_prior_status": profile["sourceStatus"]["portionPriorStatusRaw"],
                        "user_grounding_required_for_DS3": "yes",
                        "notes": "test",
                    })
            report = alignment.verify(csv_path, CURRENT_PATH)
            self.assertTrue(report["aligned"])
            self.assertEqual(report["ds2RowCount"], 3)

    def test_alignment_rejects_ready_claim_while_source_remains_blocked(self):
        current = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as directory:
            status_path = Path(directory) / "status.json"
            current["profiles"][0]["promotionEligible"] = True
            status_path.write_text(json.dumps(current, ensure_ascii=False), encoding="utf-8")
            csv_path = Path(directory) / "ds2.csv"
            headers = [
                "consensus_id", "canon_id", "food_name_fa", "source_records",
                "independent_source_groups", "evidence_tier", "identity_status",
                "nutrient_interval_status", "portion_prior_status",
                "user_grounding_required_for_DS3",
            ]
            with csv_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=headers)
                writer.writeheader()
                for profile in current["profiles"]:
                    writer.writerow({
                        "consensus_id": profile["consensusId"],
                        "canon_id": profile["canonId"],
                        "food_name_fa": profile["foodNameFa"],
                        "source_records": profile["sourceRecords"],
                        "independent_source_groups": profile["independentSourceGroups"],
                        "evidence_tier": "DS2",
                        "identity_status": "multi_source_consensus",
                        "nutrient_interval_status": "blocked_pending_complete_quantity_and_yield_normalization",
                        "portion_prior_status": "digital_source_distribution_available",
                        "user_grounding_required_for_DS3": "yes",
                    })
            report = alignment.verify(csv_path, status_path)
            self.assertFalse(report["aligned"])
            self.assertTrue(any("promotionEligible" in error for error in report["errors"]))

    def test_source_work_queue_covers_all_13_records_and_three_profiles(self):
        queue = json.loads(SOURCE_QUEUE_PATH.read_text(encoding="utf-8"))
        status = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
        report = source_queue_validator.validate(queue, status)
        self.assertTrue(report["aligned"], report["errors"])
        self.assertEqual(report["sourceRecordCount"], 13)
        self.assertEqual(report["canonCounts"], {
            "IFKB-CANON-00008": 4,
            "IFKB-CANON-00010": 4,
            "IFKB-CANON-00028": 5,
        })

    def test_unit_conversion_queue_contains_no_unreviewed_gram_factor(self):
        queue = json.loads(UNIT_QUEUE_PATH.read_text(encoding="utf-8"))
        self.assertGreater(len(queue["requirements"]), 0)
        for requirement in queue["requirements"]:
            self.assertIsNone(requirement["conversionFactorToGrams"])
            self.assertIsNone(requirement["sourceReference"])
            self.assertEqual(requirement["reviewStatus"], "unresolved")

    def test_source_queue_cannot_sneak_in_nutrition_output(self):
        queue = json.loads(SOURCE_QUEUE_PATH.read_text(encoding="utf-8"))
        status = json.loads(CURRENT_PATH.read_text(encoding="utf-8"))
        queue["records"][0]["rawQuantityFacts"]["energy_kcal"] = 999
        report = source_queue_validator.validate(queue, status)
        self.assertFalse(report["aligned"])
        self.assertTrue(any("nutrition output key" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
