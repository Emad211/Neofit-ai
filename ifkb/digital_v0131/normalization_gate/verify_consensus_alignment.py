#!/usr/bin/env python3
"""Cross-check normalization status against ds2_consensus_profiles.csv.

This script does not infer nutrition. It verifies that the fail-closed status file
tracks the exact DS2 identity-consensus rows and their raw readiness fields.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any

REQUIRED_COLUMNS = {
    "consensus_id",
    "canon_id",
    "food_name_fa",
    "source_records",
    "independent_source_groups",
    "evidence_tier",
    "identity_status",
    "nutrient_interval_status",
    "portion_prior_status",
    "user_grounding_required_for_DS3",
}


def _as_int(value: str, label: str) -> int:
    try:
        parsed = int(value)
    except ValueError as exc:
        raise ValueError(f"{label} must be an integer: {value!r}") from exc
    if parsed < 1:
        raise ValueError(f"{label} must be positive: {parsed}")
    return parsed


def _as_bool(value: str, label: str) -> bool:
    normalized = value.strip().lower()
    if normalized in {"true", "yes", "1"}:
        return True
    if normalized in {"false", "no", "0"}:
        return False
    raise ValueError(f"{label} must be boolean-like: {value!r}")


def verify(consensus_csv: Path, status_json: Path) -> dict[str, Any]:
    with consensus_csv.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = set(reader.fieldnames or [])
        missing = sorted(REQUIRED_COLUMNS - headers)
        if missing:
            raise ValueError(f"consensus CSV is missing columns: {missing}")
        rows = [row for row in reader if row.get("evidence_tier", "").strip() == "DS2"]

    status = json.loads(status_json.read_text(encoding="utf-8"))
    profiles = status.get("profiles")
    if not isinstance(profiles, list):
        raise ValueError("status JSON profiles must be an array")
    by_canon = {profile.get("canonId"): profile for profile in profiles if isinstance(profile, dict)}
    errors: list[str] = []

    csv_canons = {row["canon_id"].strip() for row in rows}
    status_canons = set(by_canon)
    if csv_canons != status_canons:
        errors.append(
            f"DS2 canon set differs: csv_only={sorted(csv_canons-status_canons)}, "
            f"status_only={sorted(status_canons-csv_canons)}"
        )

    for row in rows:
        canon_id = row["canon_id"].strip()
        profile = by_canon.get(canon_id)
        if not profile:
            continue
        expected_pairs = {
            "consensusId": row["consensus_id"].strip(),
            "foodNameFa": row["food_name_fa"].strip(),
            "sourceRecords": _as_int(row["source_records"], f"{canon_id}.source_records"),
            "independentSourceGroups": _as_int(
                row["independent_source_groups"],
                f"{canon_id}.independent_source_groups",
            ),
            "evidenceTier": row["evidence_tier"].strip(),
            "identityStatus": row["identity_status"].strip(),
        }
        for key, expected in expected_pairs.items():
            if profile.get(key) != expected:
                errors.append(f"{canon_id}.{key}: status={profile.get(key)!r}, csv={expected!r}")

        source_status = profile.get("sourceStatus") if isinstance(profile.get("sourceStatus"), dict) else {}
        raw_pairs = {
            "nutrientIntervalStatusRaw": row["nutrient_interval_status"].strip(),
            "portionPriorStatusRaw": row["portion_prior_status"].strip(),
            "userGroundingRequiredForDS3": _as_bool(
                row["user_grounding_required_for_DS3"],
                f"{canon_id}.user_grounding_required_for_DS3",
            ),
        }
        for key, expected in raw_pairs.items():
            if source_status.get(key) != expected:
                errors.append(
                    f"{canon_id}.sourceStatus.{key}: "
                    f"status={source_status.get(key)!r}, csv={expected!r}"
                )

        raw_nutrient_status = row["nutrient_interval_status"].strip().lower()
        if raw_nutrient_status.startswith("blocked") and profile.get("promotionEligible") is True:
            errors.append(f"{canon_id} is promotionEligible while source CSV remains blocked")
        if raw_nutrient_status.startswith("blocked") and profile.get("nutrientIntervals") != "blocked":
            errors.append(f"{canon_id} must preserve blocked nutrientIntervals")

    return {
        "format": "ifkb-ds2-consensus-alignment-report",
        "version": "1.0.0",
        "consensusCsv": str(consensus_csv),
        "statusJson": str(status_json),
        "ds2RowCount": len(rows),
        "aligned": not errors,
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--consensus-csv", type=Path, required=True)
    parser.add_argument("--status-json", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    try:
        report = verify(args.consensus_csv, args.status_json)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"DS2 consensus alignment failed: {exc}", file=sys.stderr)
        return 2
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["aligned"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
