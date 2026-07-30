#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import shutil
from collections import Counter
from pathlib import Path

ALLOWED_LICENSE_BUCKETS = {"cc0_pd", "cc_by", "cc_by_sa"}

def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--artifact-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    rows = read_rows(args.manifest)
    if len(rows) != 11:
        raise ValueError(f"Expected 11 retry rows; found {len(rows)}")
    if len({row["candidate_id"] for row in rows}) != len(rows):
        raise ValueError("Duplicate candidate ids in recovery manifest.")

    output = args.output_dir
    output.mkdir(parents=True, exist_ok=True)
    recovered: list[dict[str, str]] = []
    attribution: list[str] = ["# IFKB Stage 2 recovered asset attribution", ""]

    for row in rows:
        if row["license_bucket"] not in ALLOWED_LICENSE_BUCKETS:
            raise ValueError(f"Disallowed licence bucket: {row['candidate_id']}")
        if row["nutrition_gold_allowed"] != "no":
            raise ValueError(f"Internet asset cannot be Nutrition Gold: {row['candidate_id']}")
        source = args.artifact_root / row["local_relative_path"]
        if not source.is_file():
            raise FileNotFoundError(f"Missing retained artifact file: {source}")
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if digest != row["local_sha256"]:
            raise ValueError(
                f"SHA-256 mismatch for {row['candidate_id']}: {digest} != {row['local_sha256']}"
            )
        extension = source.suffix.lower() or ".jpg"
        destination = (
            output / "assets" / row["license_bucket"] / row["canon_id"]
            / f"{row['candidate_id']}{extension}"
        )
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)

        item = dict(row)
        item["recovered_relative_path"] = destination.relative_to(output).as_posix()
        item["recovered_sha256"] = digest
        item["recovery_status"] = "hash_verified_and_copied"
        recovered.append(item)

        attribution.extend([
            f"## {row['candidate_id']} — {row['food_name_en']}",
            f"- Role: {row['image_role']}",
            f"- Author: {row['artist']}",
            f"- Licence: {row['license_short_name']}",
            f"- Licence URL: {row['license_url']}",
            f"- Commons page: {row['page_url']}",
            f"- SHA-256: `{digest}`",
            f"- Split group: `{row['split_group_id']}`",
            "- Nutrition Gold: no",
            "",
        ])

    fields = list(recovered[0].keys())
    with (output / "recovered-asset-manifest.csv").open(
        "w", encoding="utf-8", newline=""
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(recovered)

    summary = {
        "format": "ifkb-stage2-recovered-retry-assets",
        "recoveredAssetRows": len(recovered),
        "coveredClasses": len({row["canon_id"] for row in recovered}),
        "roleCounts": dict(sorted(Counter(row["image_role"] for row in recovered).items())),
        "licenseBucketCounts": dict(
            sorted(Counter(row["license_bucket"] for row in recovered).items())
        ),
        "hashMismatches": 0,
        "nutritionGoldImages": 0,
        "automaticIdentityApprovals": 0,
    }
    (output / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    (output / "ATTRIBUTION.md").write_text("\n".join(attribution), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
