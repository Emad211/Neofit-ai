from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parent / "discover_full_image_metadata.py"
SPEC = importlib.util.spec_from_file_location("discover_full_image_metadata", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class FullImageMetadataDiscoveryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.row = {
            "canon_id": "IFKB-CANON-00008",
            "batch_id": "IRANIAN-BATCH-05",
            "image_wave": "IMAGE-WAVE-A",
            "food_name_fa": "قورمه‌سبزی",
            "food_name_en": "Ghormeh sabzi",
            "negative_terms_pipe": "raw ingredients|spice package",
        }

    def test_license_policy_rejects_nc_nd_and_unknown(self) -> None:
        self.assertEqual(MODULE.license_bucket("CC0 1.0"), "cc0_pd")
        self.assertEqual(MODULE.license_bucket("Public domain"), "cc0_pd")
        self.assertEqual(MODULE.license_bucket("CC BY 4.0"), "cc_by")
        self.assertEqual(MODULE.license_bucket("CC BY-SA 4.0"), "cc_by_sa")
        self.assertIsNone(MODULE.license_bucket("CC BY-NC 4.0"))
        self.assertIsNone(MODULE.license_bucket("CC BY-ND 4.0"))
        self.assertIsNone(MODULE.license_bucket("All rights reserved"))

    def test_commons_candidates_are_metadata_only_and_pending_review(self) -> None:
        fixture = [{
            "pageid": 10,
            "title": "File:Ghormeh Sabzi.JPG",
            "canonicalurl": "https://commons.wikimedia.org/wiki/File:Ghormeh_Sabzi.JPG",
            "imageinfo": [{
                "mime": "image/jpeg",
                "width": 1600,
                "height": 1200,
                "size": 500000,
                "sha1": "abc123",
                "url": "https://upload.wikimedia.org/example.jpg",
                "extmetadata": {
                    "LicenseShortName": {"value": "CC BY-SA 4.0"},
                    "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0/"},
                    "Artist": {"value": "Example Creator"},
                    "ImageDescription": {"value": "Iranian Ghormeh Sabzi stew"},
                },
            }],
        }]
        with patch.object(MODULE, "search_commons", return_value=fixture):
            rows = MODULE.commons_candidates(self.row, ['"Ghormeh sabzi" Iranian food'], 6)
        self.assertEqual(len(rows), 1)
        candidate = rows[0]
        self.assertEqual(candidate["download_status"], "not_downloaded")
        self.assertEqual(candidate["visual_identity_review"], "pending")
        self.assertEqual(candidate["selected_for_dataset"], "no")
        self.assertEqual(candidate["nutrition_gold_allowed"], "no")
        self.assertEqual(candidate["landing_page_verified"], "no")

    def test_openverse_candidates_retain_only_allowed_metadata(self) -> None:
        fixture = [{
            "id": "openverse-1",
            "license": "by",
            "mature": False,
            "width": 1400,
            "height": 1000,
            "foreign_landing_url": "https://example.org/item/1",
            "url": "https://example.org/image.jpg",
            "title": "Ghormeh sabzi Persian stew",
            "creator": "Example",
            "license_url": "https://creativecommons.org/licenses/by/4.0/",
            "filetype": "jpg",
            "tags": [{"name": "Iranian food"}],
        }]
        with patch.object(MODULE, "search_openverse", return_value=fixture):
            rows = MODULE.openverse_candidates(self.row, ["Ghormeh sabzi"], 4)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["source"], "openverse")
        self.assertEqual(rows[0]["license_bucket"], "cc_by")
        self.assertEqual(rows[0]["download_status"], "not_downloaded")
        self.assertEqual(rows[0]["nutrition_gold_allowed"], "no")


if __name__ == "__main__":
    unittest.main()
