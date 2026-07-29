from __future__ import annotations

import csv
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "ifkb/images/build_full_image_acquisition_plan.py"


class FullImageAcquisitionPlanTests(unittest.TestCase):
    def test_full_repository_plan_covers_all_classes_once(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp)
            subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--root",
                    str(ROOT),
                    "--output-dir",
                    str(output),
                ],
                check=True,
                cwd=ROOT,
            )
            summary = json.loads((output / "summary.json").read_text(encoding="utf-8"))
            self.assertEqual(summary["canonicalClassCount"], 261)
            self.assertEqual(summary["batchCount"], 12)
            self.assertEqual(summary["waveCounts"], {
                "IMAGE-WAVE-A": 60,
                "IMAGE-WAVE-B": 115,
                "IMAGE-WAVE-C": 86,
            })
            self.assertEqual(summary["queryRowCount"], 261)
            self.assertEqual(summary["internetImagesApprovedForNutritionGold"], 0)
            self.assertEqual(summary["automaticIdentityApprovals"], 0)
            self.assertGreaterEqual(summary["assetRowsMissingFromBranchLedger"], 0)
            self.assertGreaterEqual(summary["coveredClassRowsMissingFromBranchLedger"], 0)

            with (output / "image-class-ledger.csv").open(
                "r", encoding="utf-8", newline=""
            ) as handle:
                ledger = list(csv.DictReader(handle))
            self.assertEqual(len(ledger), 261)
            self.assertEqual(len({row["canonId"] for row in ledger}), 261)
            self.assertTrue(all(row["automaticIdentityApprovalAllowed"] == "no" for row in ledger))
            self.assertTrue(all(row["internetImageNutritionGoldAllowed"] == "no" for row in ledger))

            with (output / "image-query-pack.csv").open(
                "r", encoding="utf-8", newline=""
            ) as handle:
                queries = list(csv.DictReader(handle))
            self.assertEqual(len(queries), 261)
            self.assertTrue(all(row["commons_queries_pipe"] for row in queries))
            self.assertTrue(all(row["openverse_queries_pipe"] for row in queries))
            self.assertTrue(all(row["download_original_allowed_before_review"] == "no" for row in queries))

            batch_rows = []
            for path in sorted((output / "batches").glob("*.csv")):
                with path.open("r", encoding="utf-8", newline="") as handle:
                    batch_rows.extend(csv.DictReader(handle))
            self.assertEqual(len(batch_rows), 261)
            self.assertEqual(len({row["canon_id"] for row in batch_rows}), 261)

    def test_release_mode_fails_until_asset_rows_are_reconstructed(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            process = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--root",
                    str(ROOT),
                    "--output-dir",
                    temp,
                    "--release-mode",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertNotEqual(process.returncode, 0)
            self.assertIn("row-level reconstruction", process.stderr + process.stdout)


if __name__ == "__main__":
    unittest.main()
