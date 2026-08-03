#!/usr/bin/env python3
"""Prioritize DS2 recipe sources by remaining normalization work.

This is a work-planning report, not an evidence-quality score and not a
nutrient-readiness claim.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

TIER_ORDER = {"A": 0, "B": 1, "C": 2, "D": 3}


def build(source_queue: Any, semantics: Any, review_queue: Any) -> dict[str, Any]:
    errors: list[str] = []
    source_records = source_queue.get("records") if isinstance(source_queue, dict) else None
    semantic_records = semantics.get("records") if isinstance(semantics, dict) else None
    review_items = review_queue.get("items") if isinstance(review_queue, dict) else None
    if not all(isinstance(value, list) for value in (source_records, semantic_records, review_items)):
        return {"format": "ifkb-ds2-source-normalization-priority-report", "version": "1.0.0", "valid": False, "errors": ["all inputs must contain arrays"]}
    if review_queue.get("valid") is not True or review_queue.get("approvedItemCount") != 0:
        errors.append("review queue must be valid and contain zero approved items")

    semantic_by_id = {row.get("recipeSourceId"): row for row in semantic_records if isinstance(row, dict)}
    review_by_family = {row.get("quantityFamily"): row for row in review_items if isinstance(row, dict)}
    if len(semantic_by_id) != len(semantic_records):
        errors.append("quantity semantics contains duplicate or invalid source ids")
    if len(review_by_family) != len(review_items):
        errors.append("review queue contains duplicate or invalid quantity families")

    output_records: list[dict[str, Any]] = []
    for source in source_records:
        if not isinstance(source, dict):
            errors.append("source record must be an object")
            continue
        source_id = source.get("recipeSourceId")
        semantic = semantic_by_id.get(source_id)
        if not isinstance(semantic, dict):
            errors.append(f"{source_id}: missing quantity semantics")
            continue
        independent = semantic.get("independentIngredientKeys") if isinstance(semantic.get("independentIngredientKeys"), list) else []
        interval_pairs = semantic.get("ingredientIntervalPairs") if isinstance(semantic.get("ingredientIntervalPairs"), list) else []
        normalized_ingredient_keys = list(independent) + [
            pair.get("canonicalKey") for pair in interval_pairs if isinstance(pair, dict)
        ]
        mass_anchored = sorted(key for key in normalized_ingredient_keys if isinstance(key, str) and key.endswith("_g"))
        unit_families = sorted(key for key in normalized_ingredient_keys if isinstance(key, str) and not key.endswith("_g"))
        unit_items: list[dict[str, Any]] = []
        for family in unit_families:
            review = review_by_family.get(family)
            if not isinstance(review, dict):
                errors.append(f"{source_id}: missing review-queue item for {family}")
                continue
            unit_items.append({
                "quantityFamily": family,
                "reviewStatus": review.get("status"),
                "candidateGramWeights": review.get("candidateGramWeights", []),
                "approvalStatus": review.get("approvalStatus"),
            })

        servings_known = source.get("servingsMin") is not None and source.get("servingsMax") is not None
        unit_count = len(unit_families)
        if servings_known and unit_count == 0:
            tier = "A"
            class_name = "mass_quantities_complete_serving_count_known"
        elif servings_known and unit_count <= 2:
            tier = "B"
            class_name = "limited_unit_conversion_work"
        elif servings_known:
            tier = "C"
            class_name = "multi_unit_conversion_work"
        else:
            tier = "D"
            class_name = "serving_count_missing"

        next_actions = ["Map every independent ingredient to a stable IFKB/USDA identity."]
        if unit_families:
            next_actions.append("Independently review or adjudicate the listed household-unit families.")
        if not servings_known:
            next_actions.append("Resolve recipe serving count or a defensible serving interval.")
        next_actions.extend([
            "Resolve cooked batch yield and edible fractions.",
            "Apply a reviewed nutrient-retention model before nutrient calculation.",
        ])
        output_records.append({
            "priorityTier": tier,
            "workClass": class_name,
            "recipeSourceId": source_id,
            "canonId": source.get("canonId"),
            "foodNameFa": source.get("foodNameFa"),
            "sourceDomain": source.get("sourceDomain"),
            "independenceGroup": source.get("independenceGroup"),
            "sourceWeight": source.get("sourceWeight"),
            "servingsKnown": servings_known,
            "servingsMin": source.get("servingsMin"),
            "servingsMax": source.get("servingsMax"),
            "independentIngredientCount": len(normalized_ingredient_keys),
            "massAnchoredIngredientKeys": mass_anchored,
            "householdUnitFamilies": unit_families,
            "householdUnitFamilyCount": unit_count,
            "unitReviewItems": unit_items,
            "derivedAggregateCount": len(semantic.get("derivedAggregateKeys", [])),
            "recipeOutputFieldCount": len(semantic.get("recipeOutputKeys", [])) + 2 * len(semantic.get("recipeOutputIntervalPairs", [])),
            "yieldStatus": source.get("yieldStatus"),
            "ingredientMappingStatus": "not_started",
            "readyForNutrientCalculation": False,
            "nextActions": next_actions,
        })

    output_records.sort(key=lambda row: (
        TIER_ORDER.get(row["priorityTier"], 9),
        row["householdUnitFamilyCount"],
        -(float(row["sourceWeight"]) if isinstance(row["sourceWeight"], (int, float)) else 0),
        row["recipeSourceId"],
    ))
    for index, row in enumerate(output_records, start=1):
        row["workRank"] = index

    tier_counts: dict[str, int] = {}
    for row in output_records:
        tier_counts[row["priorityTier"]] = tier_counts.get(row["priorityTier"], 0) + 1
    return {
        "format": "ifkb-ds2-source-normalization-priority-report",
        "version": "1.0.0",
        "valid": not errors,
        "interpretation": "Work priority only; not evidence quality and not nutrient readiness.",
        "recordCount": len(output_records),
        "tierCounts": dict(sorted(tier_counts.items())),
        "nutrientReadyCount": 0,
        "errors": errors,
        "records": output_records,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-queue", type=Path, required=True)
    parser.add_argument("--semantics", type=Path, required=True)
    parser.add_argument("--review-queue", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        source_queue = json.loads(args.source_queue.read_text(encoding="utf-8"))
        semantics = json.loads(args.semantics.read_text(encoding="utf-8"))
        review_queue = json.loads(args.review_queue.read_text(encoding="utf-8"))
        output = build(source_queue, semantics, review_queue)
    except (OSError, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(f"Could not build source normalization priority: {exc}", file=sys.stderr)
        return 2
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "valid": output["valid"],
        "recordCount": output["recordCount"],
        "tierCounts": output["tierCounts"],
        "nutrientReadyCount": output["nutrientReadyCount"],
        "firstWorkItem": output["records"][0]["recipeSourceId"] if output["records"] else None,
    }, ensure_ascii=False, indent=2))
    return 0 if output["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
