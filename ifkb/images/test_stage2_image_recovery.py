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
    def test_retry_readjudication_is_complete_and_fail_closed(self) -> None:
        rows = read_csv(RELEASE / "retry-readjudicated-manifest.csv")
        self.assertEqual(len(rows), 11)
        self.assertEqual(len({row["candidate_id"] for row in rows}), 11)
        self.assertEqual(len({row["canon_id"] for row in rows}), 7)
        self.assertTrue(all(row["identity_review"] == "approved" for row in rows))
        self.assertTrue(all(row["nutrition_gold_allowed"] == "no" for row in rows))
        self.assertTrue(all(row["automatic_identity_approval_allowed"] == "no" for row in rows))
        self.assertTrue(all(row["license_bucket"] in {"cc0_pd", "cc_by", "cc_by_sa"} for row in rows))
        self.assertTrue(all(len(row["local_sha256"]) == 64 for row in rows))
        self.assertTrue(all(row["source_artifact_id"] == "8634119409" for row in rows))

        dolmeh = next(row for row in rows if row["candidate_id"] == "IFKB-CANON-00050-C04")
        self.assertEqual(dolmeh["image_role"], "preparation_process")
        self.assertEqual(dolmeh["dataset_use"], "preparation_context_only")

        gheymeh = [
            row for row in rows if row["canon_id"] == "IFKB-CANON-00119"
        ]
        self.assertEqual(len(gheymeh), 3)
        self.assertEqual(len({row["split_group_id"] for row in gheymeh}), 1)

        reshteh = [
            row for row in rows if row["canon_id"] == "IFKB-CANON-00122"
        ]
        self.assertEqual(len(reshteh), 2)
        self.assertEqual(len({row["split_group_id"] for row in reshteh}), 1)

    def test_wave3_gap_is_not_fabricated(self) -> None:
        rows = read_csv(RELEASE / "unresolved-wave3-recovery.csv")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["historical_asset_row_count"], "5")
        self.assertEqual(rows[0]["row_level_identity_status"], "unresolved")
        self.assertEqual(rows[0]["artifact_id"], "")
        self.assertIn("No candidate id", rows[0]["evidence_boundary"])

    def test_release_manifest_reports_only_proven_progress(self) -> None:
        value = json.loads((RELEASE / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(value["stage2Recovery"]["readjudicatedAssetRows"], 11)
        self.assertEqual(value["stage2Recovery"]["reconstructableAssetRowsAfterRetry"], 53)
        self.assertEqual(value["stage2Recovery"]["remainingHistoricalAssetRowGap"], 5)
        self.assertEqual(value["stage2Recovery"]["remainingHistoricalCoveredClassGap"], 3)
        self.assertEqual(value["safety"]["internetNutritionGoldImages"], 0)
        self.assertEqual(value["safety"]["automaticIdentityApprovals"], 0)
        self.assertEqual(value["batchRegistry"]["status"], "synchronized_stage2")
        self.assertEqual(value["batchRegistry"]["knownRowMovesApplied"], 187)
        self.assertEqual(value["batchRegistry"]["canonicalRows"], 261)
        self.assertEqual(value["batchRegistry"]["batchSizes"], [22] * 9 + [21] * 3)

if __name__ == "__main__":
    unittest.main()
