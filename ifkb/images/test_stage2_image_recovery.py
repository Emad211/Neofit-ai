from __future__ import annotations

import csv
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RELEASE = ROOT / "ifkb/images/releases/0.12.2"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


class Stage2ImageRecoveryTests(unittest.TestCase):
    def test_retry_and_wave3_manifests_close_historical_ledger(self) -> None:
        retry = read_csv(RELEASE / "retry-readjudicated-manifest.csv")
        wave3 = read_csv(RELEASE / "wave3-readjudicated-manifest.csv")
        self.assertEqual(len(retry), 11)
        self.assertEqual(len(wave3), 5)
        combined = retry + wave3
        self.assertEqual(len({row["candidate_id"] for row in combined}), 16)
        self.assertEqual(len({row["canon_id"] for row in combined}), 10)
        self.assertTrue(
            all(
                row["identity_review"] == "approved"
                and row["nutrition_gold_allowed"] == "no"
                and row["automatic_identity_approval_allowed"] == "no"
                for row in combined
            )
        )
        self.assertTrue(
            all(
                row["license_bucket"] in {"cc0_pd", "cc_by", "cc_by_sa"}
                for row in combined
            )
        )
        self.assertTrue(all(len(row["local_sha256"]) == 64 for row in combined))

        tahchin = next(
            row for row in wave3
            if row["candidate_id"] == "IFKB-CANON-00020-C01"
        )
        self.assertEqual(tahchin["image_role"], "preparation_process")
        self.assertEqual(
            tahchin["dataset_use"],
            "preparation_context_only",
        )

        shishlik = [
            row for row in wave3
            if row["canon_id"] == "IFKB-CANON-00029"
        ]
        self.assertEqual(len(shishlik), 2)
        self.assertEqual(
            len({row["split_group_id"] for row in shishlik}),
            1,
        )
        self.assertTrue(
            all(row["image_role"] == "served_final" for row in shishlik)
        )

        dizi = [
            row for row in wave3
            if row["canon_id"] == "IFKB-CANON-00108"
        ]
        self.assertEqual(
            {row["image_role"] for row in dizi},
            {"restaurant_context", "vessel_context"},
        )
        self.assertTrue(
            all(
                row["identity_reference_allowed"] == "no_context_only"
                for row in dizi
            )
        )

    def test_wave3_resolution_is_traceable_and_not_fabricated(self) -> None:
        rows = read_csv(RELEASE / "unresolved-wave3-recovery.csv")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["historical_asset_row_count"], "5")
        self.assertEqual(rows[0]["artifact_id"], "8634114609")
        self.assertEqual(
            rows[0]["row_level_identity_status"],
            "resolved_by_stage2_explicit_readjudication",
        )
        self.assertIn(
            "not falsely claimed",
            rows[0]["evidence_boundary"],
        )

    def test_release_manifest_reports_zero_historical_gap(self) -> None:
        value = json.loads(
            (RELEASE / "manifest.json").read_text(encoding="utf-8")
        )
        recovery = value["stage2Recovery"]
        self.assertEqual(recovery["totalReadjudicatedAssetRows"], 16)
        self.assertEqual(recovery["totalNewCoveredClasses"], 10)
        self.assertEqual(recovery["reconstructableAssetRowsAfterStage2"], 58)
        self.assertEqual(
            recovery["reconstructableCoveredClassesAfterStage2"],
            43,
        )
        self.assertEqual(recovery["remainingHistoricalAssetRowGap"], 0)
        self.assertEqual(recovery["remainingHistoricalCoveredClassGap"], 0)
        self.assertEqual(recovery["wave3"]["readjudicatedAssetRows"], 5)
        self.assertEqual(recovery["wave3"]["newCoveredClasses"], 3)
        self.assertEqual(
            value["status"],
            "stage2_historical_recovery_complete_broad_metadata_review_open",
        )
        self.assertEqual(value["safety"]["internetNutritionGoldImages"], 0)
        self.assertEqual(value["safety"]["automaticIdentityApprovals"], 0)
        self.assertEqual(
            value["batchRegistry"]["status"],
            "synchronized_stage2",
        )
        self.assertEqual(
            value["batchRegistry"]["batchSizes"],
            [22] * 9 + [21] * 3,
        )


if __name__ == "__main__":
    unittest.main()
