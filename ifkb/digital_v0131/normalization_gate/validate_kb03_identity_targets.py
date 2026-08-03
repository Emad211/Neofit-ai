#!/usr/bin/env python3
"""Validate candidate IFKB ingredient identities for DS2-KB-03."""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from typing import Any

ID_RE = re.compile(r"^IFKB-ING-(\d{4})$")
EXPECTED_EXTENSION_IDS = {"IFKB-ING-0092", "IFKB-ING-0093", "IFKB-ING-0094", "IFKB-ING-0095"}


def read_catalog(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def validate(core_rows: Any, extension_rows: Any, semantics: Any, targets: Any) -> dict[str, Any]:
    errors: list[str] = []
    if not all(isinstance(value, list) for value in (core_rows, extension_rows)):
        return {"format": "ifkb-ds2-kb03-identity-target-validation-report", "version": "1.1.0", "valid": False, "errors": ["catalog inputs must be arrays"]}
    if not isinstance(semantics, dict) or not isinstance(targets, dict):
        return {"format": "ifkb-ds2-kb03-identity-target-validation-report", "version": "1.1.0", "valid": False, "errors": ["semantics and targets must be objects"]}
    if targets.get("format") != "ifkb-ds2-kb03-ingredient-identity-targets":
        errors.append("invalid identity target format")
    if targets.get("status") != "candidate-not-final":
        errors.append("identity targets must remain candidate-not-final")
    policy = targets.get("policy") if isinstance(targets.get("policy"), dict) else {}
    for key in (
        "identityTargetIsSeparateFromNutrientSource",
        "derivedAggregateExcluded",
        "nutrientSourceApprovalRequiredSeparately",
        "promotionForbiddenFromIdentityCoverageAlone",
        "sourceUnspecifiedSubtypesMustNotBeSilentlySpecialized",
    ):
        if policy.get(key) is not True:
            errors.append(f"policy.{key} must be true")

    all_rows = [row for row in [*core_rows, *extension_rows] if isinstance(row, dict)]
    by_id: dict[str, dict[str, str]] = {}
    for row in all_rows:
        ingredient_id = row.get("ingredient_id", "")
        if not ID_RE.fullmatch(ingredient_id):
            errors.append(f"invalid ingredient id {ingredient_id!r}")
            continue
        if ingredient_id in by_id:
            errors.append(f"duplicate ingredient id {ingredient_id}")
        by_id[ingredient_id] = row
    extension_ids = {row.get("ingredient_id") for row in extension_rows if isinstance(row, dict)}
    if extension_ids != EXPECTED_EXTENSION_IDS:
        errors.append(f"extension id set differs: {sorted(extension_ids)}")
    core_numbers = [int(match.group(1)) for key in [row.get("ingredient_id", "") for row in core_rows if isinstance(row, dict)] if (match := ID_RE.fullmatch(key))]
    if core_numbers and max(core_numbers) != 91:
        errors.append(f"core ingredient id tail changed; expected 0091, found {max(core_numbers):04d}")
    extension_numbers = sorted(int(ID_RE.fullmatch(value).group(1)) for value in extension_ids if isinstance(value, str) and ID_RE.fullmatch(value))
    if extension_numbers != [92, 93, 94, 95]:
        errors.append("candidate extension ids must be contiguous 0092-0095")

    semantic_records = semantics.get("records")
    semantic = next((row for row in semantic_records if isinstance(row, dict) and row.get("recipeSourceId") == "DS2-KB-03"), None) if isinstance(semantic_records, list) else None
    if not isinstance(semantic, dict):
        errors.append("DS2-KB-03 quantity semantics are missing")
        independent: list[str] = []
        aggregate_keys: set[str] = set()
    else:
        independent = semantic.get("independentIngredientKeys") if isinstance(semantic.get("independentIngredientKeys"), list) else []
        aggregate_keys = {row.get("key") for row in semantic.get("derivedAggregateKeys", []) if isinstance(row, dict)}

    target_rows = targets.get("targets")
    if not isinstance(target_rows, list):
        errors.append("targets must be an array")
        target_rows = []
    target_keys = [row.get("quantityKey") for row in target_rows if isinstance(row, dict)]
    target_ids = [row.get("ingredientId") for row in target_rows if isinstance(row, dict)]
    if len(target_keys) != len(set(target_keys)):
        errors.append("identity targets contain duplicate quantityKey values")
    if len(target_ids) != len(set(target_ids)):
        errors.append("identity targets contain duplicate ingredientId values")
    if set(target_keys) != set(independent):
        errors.append(
            f"identity target coverage differs: independent_only={sorted(set(independent)-set(target_keys))}, "
            f"target_only={sorted(set(target_keys)-set(independent))}"
        )
    if aggregate_keys & set(target_keys):
        errors.append(f"derived aggregates entered identity targets: {sorted(aggregate_keys & set(target_keys))}")
    if "meat_total_g" not in aggregate_keys:
        errors.append("meat_total_g must remain a derived aggregate")

    resolved: list[dict[str, Any]] = []
    for target in target_rows:
        if not isinstance(target, dict):
            errors.append("identity target must be an object")
            continue
        quantity_key = target.get("quantityKey")
        ingredient_id = target.get("ingredientId")
        if quantity_key == "onion_total_g" and ingredient_id != "IFKB-ING-0095":
            errors.append("source-unspecified onion must use IFKB-ING-0095 rather than a white/red/yellow subtype")
        row = by_id.get(ingredient_id)
        if row is None:
            errors.append(f"{quantity_key}: ingredient id {ingredient_id} does not exist")
            continue
        if row.get("name_en") != target.get("expectedNameEn"):
            errors.append(f"{quantity_key}: ingredient English name drifted")
        if row.get("default_state") != target.get("expectedDefaultState"):
            errors.append(f"{quantity_key}: ingredient default state drifted")
        expected_status = "proposed_extension" if ingredient_id in EXPECTED_EXTENSION_IDS else "proposed"
        if target.get("identityTargetStatus") != expected_status:
            errors.append(f"{quantity_key}: invalid identityTargetStatus")
        resolved.append({
            "quantityKey": quantity_key,
            "ingredientId": ingredient_id,
            "nameFa": row.get("name_fa"),
            "nameEn": row.get("name_en"),
            "foodGroup": row.get("food_group"),
            "defaultState": row.get("default_state"),
            "identityTargetStatus": target.get("identityTargetStatus"),
            "nutrientSourceApproved": False,
        })

    return {
        "format": "ifkb-ds2-kb03-identity-target-validation-report",
        "version": "1.1.0",
        "valid": not errors,
        "recipeSourceId": "DS2-KB-03",
        "independentIngredientCount": len(independent),
        "identityTargetCoverageCount": len(resolved),
        "candidateExtensionCount": len(extension_rows),
        "nutrientSourceApprovedCount": 0,
        "promotionEligible": False,
        "errors": errors,
        "targets": sorted(resolved, key=lambda row: row["quantityKey"]),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--core-catalog", type=Path, required=True)
    parser.add_argument("--extension", type=Path, required=True)
    parser.add_argument("--semantics", type=Path, required=True)
    parser.add_argument("--targets", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    try:
        core = read_catalog(args.core_catalog)
        extension = read_catalog(args.extension)
        semantics = json.loads(args.semantics.read_text(encoding="utf-8"))
        targets = json.loads(args.targets.read_text(encoding="utf-8"))
        report = validate(core, extension, semantics, targets)
    except (OSError, csv.Error, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(f"Could not validate KB03 identity targets: {exc}", file=sys.stderr)
        return 2
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "valid": report["valid"],
        "identityTargetCoverageCount": report["identityTargetCoverageCount"],
        "candidateExtensionCount": report["candidateExtensionCount"],
        "nutrientSourceApprovedCount": report["nutrientSourceApprovedCount"],
        "promotionEligible": report["promotionEligible"],
        "errors": report["errors"],
    }, ensure_ascii=False, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
