#!/usr/bin/env python3
"""Validate the 13-record DS2 source-normalization work queue.

No conversion factors or nutrition values are inferred by this validator.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

EXPECTED_COUNTS = {
    "IFKB-CANON-00008": (4, 4),
    "IFKB-CANON-00010": (4, 3),
    "IFKB-CANON-00028": (5, 5),
}
FORBIDDEN_NUTRITION_TOKENS = ("calorie", "energy", "protein", "carb", "fat_g", "nutrient")


def validate(queue: Any, gate_status: Any) -> dict[str, Any]:
    errors: list[str] = []
    if not isinstance(queue, dict) or queue.get("format") != "ifkb-ds2-source-normalization-work-queue":
        return {"aligned": False, "errors": ["invalid work-queue format"]}
    records = queue.get("records")
    if not isinstance(records, list):
        return {"aligned": False, "errors": ["records must be an array"]}
    if len(records) != 13:
        errors.append(f"expected 13 source records; found {len(records)}")

    ids: list[str] = []
    by_canon: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for index, record in enumerate(records):
        prefix = f"records[{index}]"
        if not isinstance(record, dict):
            errors.append(f"{prefix} must be an object")
            continue
        source_id = record.get("recipeSourceId")
        canon_id = record.get("canonId")
        if not isinstance(source_id, str) or not source_id:
            errors.append(f"{prefix}.recipeSourceId is required")
        else:
            ids.append(source_id)
        if canon_id not in EXPECTED_COUNTS:
            errors.append(f"{prefix}.canonId is outside the v0.13.1 DS2 set")
        else:
            by_canon[canon_id].append(record)
        url = record.get("sourceUrl")
        if not isinstance(url, str) or urlparse(url).scheme != "https" or not urlparse(url).netloc:
            errors.append(f"{prefix}.sourceUrl must be an HTTPS source URL")
        for field, expected in {
            "rightsStatus": "derived_structured_facts_only",
            "identityReviewStatus": "accepted",
            "sourceNormalizationStatus": "normalized",
            "fullGramNormalizationStatus": "incomplete",
            "yieldStatus": "missing",
            "servingWeightStatus": "missing",
            "gateStatus": "blocked",
        }.items():
            if record.get(field) != expected:
                errors.append(f"{prefix}.{field} must remain {expected!r}")
        quantities = record.get("rawQuantityFacts")
        if not isinstance(quantities, dict) or not quantities:
            errors.append(f"{prefix}.rawQuantityFacts must be a non-empty object")
            quantities = {}
        for key, value in quantities.items():
            lowered = str(key).lower()
            if any(token in lowered for token in FORBIDDEN_NUTRITION_TOKENS):
                errors.append(f"{prefix}.rawQuantityFacts contains nutrition output key {key!r}")
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
                errors.append(f"{prefix}.rawQuantityFacts.{key} must be finite and non-negative")
        mass_keys = record.get("massAnchoredKeys")
        unresolved = record.get("unresolvedConversionKeys")
        if not isinstance(mass_keys, list) or sorted(mass_keys) != sorted(k for k in quantities if k.endswith("_g")):
            errors.append(f"{prefix}.massAnchoredKeys drifted from raw quantity keys")
        if not isinstance(unresolved, list) or sorted(unresolved) != sorted(k for k in quantities if not k.endswith("_g")):
            errors.append(f"{prefix}.unresolvedConversionKeys drifted from raw quantity keys")
        min_servings = record.get("servingsMin")
        max_servings = record.get("servingsMax")
        if (min_servings is None) != (max_servings is None):
            errors.append(f"{prefix} must define both serving bounds or neither")
        if min_servings is not None:
            if not all(isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0 for value in (min_servings, max_servings)):
                errors.append(f"{prefix} serving bounds must be positive")
            elif min_servings > max_servings:
                errors.append(f"{prefix} servingsMin exceeds servingsMax")

    if len(ids) != len(set(ids)):
        errors.append("recipeSourceId values are not unique")

    for canon_id, (expected_rows, expected_groups) in EXPECTED_COUNTS.items():
        rows = by_canon.get(canon_id, [])
        if len(rows) != expected_rows:
            errors.append(f"{canon_id} source count is {len(rows)}; expected {expected_rows}")
        groups = {row.get("independenceGroup") for row in rows}
        if len(groups) != expected_groups:
            errors.append(f"{canon_id} independent group count is {len(groups)}; expected {expected_groups}")

    profiles = gate_status.get("profiles") if isinstance(gate_status, dict) else None
    if not isinstance(profiles, list):
        errors.append("gate status profiles must be an array")
    else:
        expected_source_ids = {
            source_id
            for profile in profiles if isinstance(profile, dict)
            for source_id in profile.get("sourceRecordIds", [])
        }
        if set(ids) != expected_source_ids:
            errors.append(
                f"source work queue differs from gate source ids: "
                f"queue_only={sorted(set(ids)-expected_source_ids)}, "
                f"gate_only={sorted(expected_source_ids-set(ids))}"
            )

    return {
        "format": "ifkb-ds2-source-normalization-validation-report",
        "version": "1.0.0",
        "aligned": not errors,
        "sourceRecordCount": len(records),
        "canonCounts": dict(sorted(Counter(record.get("canonId") for record in records if isinstance(record, dict)).items())),
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--queue", type=Path, required=True)
    parser.add_argument("--gate-status", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    try:
        queue = json.loads(args.queue.read_text(encoding="utf-8"))
        status = json.loads(args.gate_status.read_text(encoding="utf-8"))
        report = validate(queue, status)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Could not validate source work queue: {exc}", file=sys.stderr)
        return 2
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["aligned"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
