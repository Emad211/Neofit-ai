#!/usr/bin/env python3
"""Compare per-100-g nutrient vectors for unapproved DS2-KB-03 candidates.

This report supports variant adjudication. It does not multiply by recipe mass,
does not calculate recipe nutrition and does not approve an ingredient mapping.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sqlite3
import sys
from pathlib import Path
from typing import Any

NUTRIENT_COLUMNS = (
    "calories_kcal",
    "protein_g",
    "fat_g",
    "carbs_g",
    "fiber_g",
    "sugars_g",
    "sodium_mg",
    "cholesterol_mg",
    "calcium_mg",
    "iron_mg",
    "potassium_mg",
    "vitamin_c_mg",
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def finite_or_none(value: Any) -> float | None:
    if value is None:
        return None
    number = float(value)
    return number if math.isfinite(number) else None


def envelope(rows: list[dict[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for nutrient in NUTRIENT_COLUMNS:
        values = [row["nutrientsPer100g"][nutrient] for row in rows if row["nutrientsPer100g"].get(nutrient) is not None]
        result[nutrient] = {
            "knownCount": len(values),
            "missingCount": len(rows) - len(values),
            "min": min(values) if values else None,
            "max": max(values) if values else None,
            "spread": (max(values) - min(values)) if values else None,
        }
    return result


def build(database_path: Path, manifest_path: Path, review_queue_path: Path) -> dict[str, Any]:
    errors: list[str] = []
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    review = json.loads(review_queue_path.read_text(encoding="utf-8"))
    actual_sha = sha256_file(database_path)
    actual_bytes = database_path.stat().st_size
    if manifest.get("databaseSha256") != actual_sha:
        errors.append("catalog SHA-256 differs from manifest")
    if int(manifest.get("databaseBytes", -1)) != actual_bytes:
        errors.append("catalog bytes differ from manifest")
    if review.get("format") != "ifkb-ds2-kb03-ingredient-mapping-review-queue":
        errors.append("invalid KB03 mapping review queue format")
    if review.get("valid") is not True:
        errors.append("KB03 mapping review queue is not valid")
    if review.get("approvedMappingCount") != 0:
        errors.append("mapping review queue unexpectedly contains approved mappings")
    policy = review.get("policy") if isinstance(review.get("policy"), dict) else {}
    if policy.get("blindVariantAveragingForbidden") is not True:
        errors.append("blind variant averaging must remain forbidden")
    items = review.get("items")
    if not isinstance(items, list):
        errors.append("mapping review items must be an array")
        items = []

    output_items: list[dict[str, Any]] = []
    connection = sqlite3.connect(f"file:{database_path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        for item in items:
            if not isinstance(item, dict):
                errors.append("mapping review item must be an object")
                continue
            quantity_key = item.get("quantityKey")
            evidence = item.get("candidateEvidence")
            if not isinstance(evidence, list):
                errors.append(f"{quantity_key}: candidateEvidence must be an array")
                evidence = []
            candidate_rows: list[dict[str, Any]] = []
            for candidate in evidence:
                if not isinstance(candidate, dict):
                    errors.append(f"{quantity_key}: candidate evidence must be an object")
                    continue
                food_id = candidate.get("foodId")
                row = connection.execute(
                    f"SELECT id,name_en,source_type,source_numeric_id,source_food_code,{','.join(NUTRIENT_COLUMNS)},macro_completeness FROM generic_foods WHERE id=?",
                    (food_id,),
                ).fetchone()
                if row is None:
                    errors.append(f"{quantity_key}: candidate {food_id} is missing from generic_foods")
                    continue
                if row["name_en"] != candidate.get("foodNameEn"):
                    errors.append(f"{quantity_key}: candidate {food_id} name drifted")
                nutrients = {nutrient: finite_or_none(row[nutrient]) for nutrient in NUTRIENT_COLUMNS}
                candidate_rows.append({
                    "foodId": row["id"],
                    "foodNameEn": row["name_en"],
                    "sourceType": row["source_type"],
                    "sourceNumericId": row["source_numeric_id"],
                    "sourceFoodCode": row["source_food_code"],
                    "conceptId": candidate.get("conceptId"),
                    "macroCompleteness": bool(row["macro_completeness"]),
                    "nutrientsPer100g": nutrients,
                    "mappingApprovalStatus": "not_reviewed"
                })
            output_items.append({
                "quantityKey": quantity_key,
                "sourceQuantityG": item.get("sourceQuantityG"),
                "mappingStatus": item.get("status"),
                "candidateCount": len(candidate_rows),
                "candidateNutrients": candidate_rows,
                "per100gEnvelope": envelope(candidate_rows),
                "recipeContributionCalculated": False,
                "selectedFoodId": None,
                "selectedConceptId": None,
                "selectedNutrientVector": None,
                "reviewStatus": "not_started",
                "approvalStatus": "not_approved"
            })
    finally:
        connection.close()

    return {
        "format": "ifkb-ds2-kb03-candidate-nutrient-comparison",
        "version": "1.0.0",
        "valid": not errors,
        "recipeSourceId": review.get("recipeSourceId"),
        "canonId": review.get("canonId"),
        "catalog": {
            "version": manifest.get("version"),
            "databaseSha256": actual_sha,
            "databaseBytes": actual_bytes
        },
        "policy": {
            "per100gComparisonOnly": True,
            "recipeContributionCalculationForbiddenBeforeMappingApproval": True,
            "blindVariantAveragingForbidden": True,
            "missingNutrientsRemainMissing": True
        },
        "itemCount": len(output_items),
        "approvedMappingCount": 0,
        "recipeNutritionCalculated": False,
        "errors": errors,
        "items": output_items
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--review-queue", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        output = build(args.database, args.manifest, args.review_queue)
    except (OSError, sqlite3.Error, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(f"Could not compare KB03 candidate nutrients: {exc}", file=sys.stderr)
        return 2
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "valid": output["valid"],
        "itemCount": output["itemCount"],
        "approvedMappingCount": output["approvedMappingCount"],
        "recipeNutritionCalculated": output["recipeNutritionCalculated"],
        "errors": output["errors"]
    }, ensure_ascii=False, indent=2))
    return 0 if output["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
