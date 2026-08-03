#!/usr/bin/env python3
"""Validate semantic roles for every raw DS2 source quantity key."""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any


def validate(source_queue: Any, semantics: Any) -> dict[str, Any]:
    errors: list[str] = []
    if not isinstance(source_queue, dict) or not isinstance(semantics, dict):
        return {"valid": False, "errors": ["source queue and semantics must be objects"]}
    if semantics.get("format") != "ifkb-ds2-source-quantity-semantics":
        errors.append("invalid quantity semantics format")
    policy = semantics.get("policy") if isinstance(semantics.get("policy"), dict) else {}
    for key in (
        "everyRawQuantityKeyMustHaveExactlyOneRole",
        "derivedAggregatesMustNotBeAddedToComponents",
        "intervalBoundsMustNotBeAddedAsIndependentIngredients",
        "recipeOutputsMustNotBeAddedAsIngredients",
    ):
        if policy.get(key) is not True:
            errors.append(f"policy.{key} must be true")

    source_records = source_queue.get("records")
    semantic_records = semantics.get("records")
    if not isinstance(source_records, list) or not isinstance(semantic_records, list):
        errors.append("records must be arrays")
        source_records = []
        semantic_records = []
    source_by_id = {row.get("recipeSourceId"): row for row in source_records if isinstance(row, dict)}
    semantic_by_id = {row.get("recipeSourceId"): row for row in semantic_records if isinstance(row, dict)}
    if len(source_by_id) != len(source_records):
        errors.append("source queue contains duplicate or invalid recipeSourceId values")
    if len(semantic_by_id) != len(semantic_records):
        errors.append("semantics contains duplicate or invalid recipeSourceId values")
    if set(source_by_id) != set(semantic_by_id):
        errors.append(
            f"semantic record set differs from source queue: "
            f"source_only={sorted(set(source_by_id)-set(semantic_by_id))}, "
            f"semantics_only={sorted(set(semantic_by_id)-set(source_by_id))}"
        )

    totals = {
        "rawQuantityKeyCount": 0,
        "independentIngredientKeyCount": 0,
        "derivedAggregateKeyCount": 0,
        "ingredientIntervalPairCount": 0,
        "recipeOutputKeyCount": 0,
        "recipeOutputIntervalPairCount": 0,
    }
    records_report: list[dict[str, Any]] = []

    for source_id in sorted(set(source_by_id) & set(semantic_by_id)):
        source = source_by_id[source_id]
        semantic = semantic_by_id[source_id]
        raw = source.get("rawQuantityFacts") if isinstance(source.get("rawQuantityFacts"), dict) else {}
        raw_keys = set(raw)
        independent = semantic.get("independentIngredientKeys")
        aggregates = semantic.get("derivedAggregateKeys")
        ingredient_intervals = semantic.get("ingredientIntervalPairs")
        output_keys = semantic.get("recipeOutputKeys")
        output_intervals = semantic.get("recipeOutputIntervalPairs")
        if not all(isinstance(value, list) for value in (independent, aggregates, ingredient_intervals, output_keys, output_intervals)):
            errors.append(f"{source_id}: every semantic role field must be an array")
            continue

        role_occurrences: list[str] = list(independent) + list(output_keys)
        for aggregate in aggregates:
            if not isinstance(aggregate, dict):
                errors.append(f"{source_id}: aggregate entry must be an object")
                continue
            key = aggregate.get("key")
            components = aggregate.get("componentKeys")
            role_occurrences.append(key)
            if aggregate.get("relation") != "sum":
                errors.append(f"{source_id}.{key}: only sum aggregates are supported")
            if not isinstance(components, list) or len(components) < 2:
                errors.append(f"{source_id}.{key}: aggregate requires at least two componentKeys")
                continue
            if not set(components).issubset(set(independent)):
                errors.append(f"{source_id}.{key}: aggregate components must be independent ingredient keys")
            if key in raw and all(component in raw for component in components):
                component_sum = sum(float(raw[component]) for component in components)
                if not math.isclose(float(raw[key]), component_sum, rel_tol=1e-9, abs_tol=1e-6):
                    errors.append(f"{source_id}.{key}: aggregate value does not equal component sum")

        def add_pairs(pairs: list[Any], label: str) -> None:
            for pair in pairs:
                if not isinstance(pair, dict):
                    errors.append(f"{source_id}: {label} entry must be an object")
                    continue
                low = pair.get("lowKey")
                high = pair.get("highKey")
                canonical = pair.get("canonicalKey")
                role_occurrences.extend([low, high])
                if not all(isinstance(value, str) and value for value in (low, high, canonical)):
                    errors.append(f"{source_id}: {label} requires lowKey, highKey and canonicalKey")
                    continue
                if low in raw and high in raw and float(raw[low]) > float(raw[high]):
                    errors.append(f"{source_id}.{canonical}: low bound exceeds high bound")
                if canonical in raw_keys:
                    errors.append(f"{source_id}.{canonical}: canonical interval key must not duplicate a raw key")

        add_pairs(ingredient_intervals, "ingredient interval")
        add_pairs(output_intervals, "recipe output interval")

        duplicates = sorted({key for key in role_occurrences if role_occurrences.count(key) > 1})
        if duplicates:
            errors.append(f"{source_id}: keys have multiple semantic roles: {duplicates}")
        classified = {key for key in role_occurrences if isinstance(key, str)}
        if classified != raw_keys:
            errors.append(
                f"{source_id}: raw quantity role coverage mismatch; "
                f"unclassified={sorted(raw_keys-classified)}, unknown={sorted(classified-raw_keys)}"
            )

        totals["rawQuantityKeyCount"] += len(raw_keys)
        totals["independentIngredientKeyCount"] += len(independent)
        totals["derivedAggregateKeyCount"] += len(aggregates)
        totals["ingredientIntervalPairCount"] += len(ingredient_intervals)
        totals["recipeOutputKeyCount"] += len(output_keys)
        totals["recipeOutputIntervalPairCount"] += len(output_intervals)
        records_report.append({
            "recipeSourceId": source_id,
            "rawQuantityKeyCount": len(raw_keys),
            "independentIngredientKeyCount": len(independent),
            "derivedAggregateKeyCount": len(aggregates),
            "ingredientIntervalPairCount": len(ingredient_intervals),
            "recipeOutputKeyCount": len(output_keys),
            "recipeOutputIntervalPairCount": len(output_intervals),
        })

    return {
        "format": "ifkb-ds2-source-quantity-semantics-validation-report",
        "version": "1.0.0",
        "valid": not errors,
        "recordCount": len(records_report),
        **totals,
        "errors": errors,
        "records": records_report,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-queue", type=Path, required=True)
    parser.add_argument("--semantics", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    try:
        source_queue = json.loads(args.source_queue.read_text(encoding="utf-8"))
        semantics = json.loads(args.semantics.read_text(encoding="utf-8"))
        report = validate(source_queue, semantics)
    except (OSError, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(f"Could not validate quantity semantics: {exc}", file=sys.stderr)
        return 2
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "valid": report["valid"],
        "recordCount": report["recordCount"],
        "rawQuantityKeyCount": report["rawQuantityKeyCount"],
        "independentIngredientKeyCount": report["independentIngredientKeyCount"],
        "errors": report["errors"],
    }, ensure_ascii=False, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
