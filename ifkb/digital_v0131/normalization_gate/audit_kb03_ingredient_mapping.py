#!/usr/bin/env python3
"""Audit generic Concept/Variant candidates for DS2-KB-03 ingredients.

The audit is read-only and cannot approve mappings. The derived aggregate
`meat_total_g` is intentionally excluded from ingredient mapping.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import sys
from pathlib import Path
from typing import Any

TOKEN_RE = re.compile(r"[a-z0-9]+")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize(value: Any) -> str:
    return " ".join(str(value or "").lower().split())


def tokens(value: Any) -> list[str]:
    return TOKEN_RE.findall(normalize(value))


def starts_with_tokens(value: Any, prefix: Any) -> bool:
    value_tokens = tokens(value)
    prefix_tokens = tokens(prefix)
    return bool(prefix_tokens) and value_tokens[:len(prefix_tokens)] == prefix_tokens


def parse_string_list(value: Any) -> list[str]:
    if not isinstance(value, str):
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    return [str(item) for item in parsed] if isinstance(parsed, list) else []


def candidate_from_row(row: sqlite3.Row, ingredient: dict[str, Any], prefix: str) -> dict[str, Any]:
    cooking_tags = parse_string_list(row["cooking_tags_json"])
    form_tags = parse_string_list(row["form_tags_json"])
    fat_tags = parse_string_list(row["fat_tags_json"])
    required_cooking = ingredient.get("requiredCookingTagsAny")
    required_cooking = required_cooking if isinstance(required_cooking, list) else []
    cooking_match = not required_cooking or bool(set(required_cooking) & set(cooking_tags))
    name = normalize(row["name_en"])
    excluded = [
        normalize(token) for token in ingredient.get("excludedNameTokens", [])
        if normalize(token) and normalize(token) in name
    ]
    prefix_match = starts_with_tokens(name, prefix)
    rejection_reasons: list[str] = []
    if not prefix_match:
        rejection_reasons.append("official_name_did_not_start_with_required_tokens")
    if not cooking_match:
        rejection_reasons.append("required_cooking_state_not_present")
    if excluded:
        rejection_reasons.append("excluded_name_form_present")
    qualified = not rejection_reasons
    return {
        "foodId": row["food_id"],
        "sourceType": row["source_type"],
        "sourceNumericId": row["source_numeric_id"],
        "sourceFoodCode": row["source_food_code"],
        "foodNameEn": row["name_en"],
        "macroCompleteness": bool(row["macro_completeness"]),
        "conceptId": row["concept_id"],
        "conceptNameEn": row["concept_name_en"],
        "conceptMappingPolicy": row["mapping_policy"],
        "conceptVariantCount": row["variant_count"],
        "conceptSourceTypeCount": row["source_type_count"],
        "cookingTags": cooking_tags,
        "formTags": form_tags,
        "fatTags": fat_tags,
        "matchedNamePrefix": prefix,
        "excludedNameMatches": excluded,
        "qualifiedForIndependentReview": qualified,
        "qualificationStatus": "qualified_for_independent_review" if qualified else "rejected_by_audit_filter",
        "rejectionReasons": rejection_reasons,
        "mappingApprovalStatus": "not_reviewed"
    }


def audit(database_path: Path, manifest_path: Path, source_queue_path: Path,
          semantics_path: Path, spec_path: Path) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    source_queue = json.loads(source_queue_path.read_text(encoding="utf-8"))
    semantics = json.loads(semantics_path.read_text(encoding="utf-8"))
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    actual_sha = sha256_file(database_path)
    actual_bytes = database_path.stat().st_size
    if manifest.get("databaseSha256") != actual_sha:
        errors.append("catalog database SHA-256 differs from manifest")
    if int(manifest.get("databaseBytes", -1)) != actual_bytes:
        errors.append("catalog database bytes differ from manifest")
    if spec.get("format") != "ifkb-ds2-ingredient-mapping-audit-spec":
        errors.append("invalid ingredient mapping audit spec")
    policy = spec.get("policy") if isinstance(spec.get("policy"), dict) else {}
    for key in ("auditOnly", "automaticMappingForbidden", "derivedAggregateExcluded", "conceptAndVariantEvidenceRequired", "independentReviewRequired"):
        if policy.get(key) is not True:
            errors.append(f"policy.{key} must be true")

    source_id = spec.get("recipeSourceId")
    source_records = source_queue.get("records") if isinstance(source_queue, dict) else None
    semantic_records = semantics.get("records") if isinstance(semantics, dict) else None
    ingredients = spec.get("ingredients") if isinstance(spec, dict) else None
    if not all(isinstance(value, list) for value in (source_records, semantic_records, ingredients)):
        errors.append("source, semantics and ingredient arrays are required")
        source_records = []
        semantic_records = []
        ingredients = []
    source = next((row for row in source_records if isinstance(row, dict) and row.get("recipeSourceId") == source_id), None)
    semantic = next((row for row in semantic_records if isinstance(row, dict) and row.get("recipeSourceId") == source_id), None)
    if not isinstance(source, dict):
        errors.append(f"source queue does not contain {source_id}")
        source = {}
    if not isinstance(semantic, dict):
        errors.append(f"quantity semantics does not contain {source_id}")
        semantic = {}

    independent = semantic.get("independentIngredientKeys") if isinstance(semantic.get("independentIngredientKeys"), list) else []
    aggregates = semantic.get("derivedAggregateKeys") if isinstance(semantic.get("derivedAggregateKeys"), list) else []
    aggregate_keys = {row.get("key") for row in aggregates if isinstance(row, dict)}
    spec_keys = [row.get("quantityKey") for row in ingredients if isinstance(row, dict)]
    if len(spec_keys) != len(set(spec_keys)):
        errors.append("ingredient audit spec contains duplicate quantity keys")
    if set(spec_keys) != set(independent):
        errors.append(
            f"ingredient audit coverage differs from independent ingredients: "
            f"independent_only={sorted(set(independent)-set(spec_keys))}, "
            f"spec_only={sorted(set(spec_keys)-set(independent))}"
        )
    if aggregate_keys & set(spec_keys):
        errors.append(f"derived aggregates entered ingredient mapping: {sorted(aggregate_keys & set(spec_keys))}")
    if "meat_total_g" not in aggregate_keys:
        errors.append("DS2-KB-03 must classify meat_total_g as a derived aggregate")

    report_items: list[dict[str, Any]] = []
    connection = sqlite3.connect(f"file:{database_path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        table_names = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        required_tables = {"generic_foods", "generic_variants", "generic_concepts"}
        if not required_tables.issubset(table_names):
            errors.append(f"catalog missing concept/variant tables: {sorted(required_tables-table_names)}")
        for ingredient in ingredients:
            if not isinstance(ingredient, dict):
                errors.append("ingredient audit entry must be an object")
                continue
            quantity_key = ingredient.get("quantityKey")
            prefixes = ingredient.get("namePrefixes")
            if not isinstance(prefixes, list) or not all(isinstance(value, str) and value.strip() for value in prefixes):
                errors.append(f"{quantity_key}: namePrefixes must be a non-empty string array")
                continue
            candidates_by_food: dict[str, dict[str, Any]] = {}
            for prefix in prefixes:
                first_token = tokens(prefix)[0] if tokens(prefix) else ""
                rows = connection.execute(
                    """
                    SELECT f.id AS food_id,f.source_type,f.source_numeric_id,f.source_food_code,
                           f.name_en,f.macro_completeness,
                           v.concept_id,v.cooking_tags_json,v.form_tags_json,v.fat_tags_json,
                           c.name_en AS concept_name_en,c.mapping_policy,c.variant_count,c.source_type_count
                    FROM generic_foods f
                    JOIN generic_variants v ON v.food_id=f.id
                    JOIN generic_concepts c ON c.id=v.concept_id
                    WHERE lower(f.name_en) LIKE ?
                    ORDER BY f.name_en,f.id
                    """,
                    (f"{first_token}%",),
                ).fetchall()
                for row in rows:
                    candidate = candidate_from_row(row, ingredient, prefix)
                    existing = candidates_by_food.get(candidate["foodId"])
                    if existing is None or (
                        candidate["qualifiedForIndependentReview"] and not existing["qualifiedForIndependentReview"]
                    ):
                        candidates_by_food[candidate["foodId"]] = candidate
            ranked = sorted(
                candidates_by_food.values(),
                key=lambda row: (
                    not row["qualifiedForIndependentReview"],
                    not row["macroCompleteness"],
                    row["foodNameEn"],
                    row["foodId"],
                ),
            )
            qualified = [row for row in ranked if row["qualifiedForIndependentReview"]][:30]
            rejected = [row for row in ranked if not row["qualifiedForIndependentReview"]][:15]
            if not qualified:
                warnings.append(f"{quantity_key}: no qualified generic Concept/Variant candidate")
            report_items.append({
                "quantityKey": quantity_key,
                "sourceQuantity": source.get("rawQuantityFacts", {}).get(quantity_key),
                "reviewQuestion": ingredient.get("reviewQuestion"),
                "qualifiedCandidateCount": len(qualified),
                "qualifiedCandidates": qualified,
                "rejectedCandidateSample": rejected,
                "proposedFoodId": None,
                "proposedConceptId": None,
                "reviewer1": None,
                "reviewer2": None,
                "adjudicator": None,
                "reviewStatus": "not_started",
                "mappingApprovalStatus": "not_approved"
            })
    finally:
        connection.close()

    return {
        "format": "ifkb-ds2-ingredient-mapping-audit-report",
        "version": "1.0.0",
        "auditOnly": True,
        "recipeSourceId": source_id,
        "canonId": spec.get("canonId"),
        "catalog": {
            "version": manifest.get("version"),
            "databaseSha256": actual_sha,
            "databaseBytes": actual_bytes
        },
        "valid": not errors,
        "independentIngredientCount": len(independent),
        "derivedAggregateCount": len(aggregate_keys),
        "mappedIngredientCount": 0,
        "ingredientsWithQualifiedCandidates": sum(bool(item["qualifiedCandidates"]) for item in report_items),
        "errors": errors,
        "warnings": warnings,
        "ingredients": report_items
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--source-queue", type=Path, required=True)
    parser.add_argument("--semantics", type=Path, required=True)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    try:
        report = audit(args.database, args.manifest, args.source_queue, args.semantics, args.spec)
    except (OSError, sqlite3.Error, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(f"Could not audit KB03 ingredient mapping: {exc}", file=sys.stderr)
        return 2
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "valid": report["valid"],
        "recipeSourceId": report["recipeSourceId"],
        "independentIngredientCount": report["independentIngredientCount"],
        "derivedAggregateCount": report["derivedAggregateCount"],
        "ingredientsWithQualifiedCandidates": report["ingredientsWithQualifiedCandidates"],
        "mappedIngredientCount": report["mappedIngredientCount"],
        "warnings": report["warnings"]
    }, ensure_ascii=False, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
