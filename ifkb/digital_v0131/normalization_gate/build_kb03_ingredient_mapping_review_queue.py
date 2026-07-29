#!/usr/bin/env python3
"""Build a fail-closed independent review queue for DS2-KB-03 mappings."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


def canonical_sha256(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def compact(candidate: dict[str, Any]) -> dict[str, Any]:
    return {
        "foodId": candidate.get("foodId"),
        "sourceType": candidate.get("sourceType"),
        "sourceNumericId": candidate.get("sourceNumericId"),
        "sourceFoodCode": candidate.get("sourceFoodCode"),
        "foodNameEn": candidate.get("foodNameEn"),
        "macroCompleteness": candidate.get("macroCompleteness"),
        "conceptId": candidate.get("conceptId"),
        "conceptNameEn": candidate.get("conceptNameEn"),
        "conceptMappingPolicy": candidate.get("conceptMappingPolicy"),
        "cookingTags": candidate.get("cookingTags", []),
        "formTags": candidate.get("formTags", []),
        "fatTags": candidate.get("fatTags", []),
        "mappingApprovalStatus": "not_reviewed"
    }


def classify(candidates: list[dict[str, Any]]) -> tuple[str, str]:
    if not candidates:
        return (
            "blocked_catalog_gap",
            "Acquire a reviewable source record or add a governed catalog identity for the exact ingredient."
        )
    concepts = {candidate.get("conceptId") for candidate in candidates}
    source_foods = {candidate.get("foodId") for candidate in candidates}
    if len(source_foods) == 1:
        return (
            "ready_for_independent_review",
            "Verify the single source-food and Concept/Variant evidence, then accept or reject it."
        )
    if len(concepts) == 1:
        return (
            "needs_variant_adjudication",
            "Select a defensible source variant or governed interval within the shared concept; do not average variants blindly."
        )
    return (
        "needs_identity_and_variant_adjudication",
        "Resolve the ingredient identity and source variant before mapping; multiple concepts are present."
    )


def build(audit: Any) -> dict[str, Any]:
    errors: list[str] = []
    if not isinstance(audit, dict):
        return {"format": "ifkb-ds2-kb03-ingredient-mapping-review-queue", "version": "1.0.0", "valid": False, "errors": ["audit must be an object"]}
    if audit.get("format") != "ifkb-ds2-ingredient-mapping-audit-report":
        errors.append("invalid ingredient mapping audit format")
    if audit.get("auditOnly") is not True:
        errors.append("ingredient mapping audit must be audit-only")
    if audit.get("valid") is not True:
        errors.append("ingredient mapping audit is not valid")
    if audit.get("mappedIngredientCount") != 0:
        errors.append("audit unexpectedly contains mapped ingredients")
    if audit.get("recipeSourceId") != "DS2-KB-03":
        errors.append("review queue is restricted to DS2-KB-03")
    ingredients = audit.get("ingredients")
    if not isinstance(ingredients, list):
        errors.append("audit ingredients must be an array")
        ingredients = []

    items: list[dict[str, Any]] = []
    for ingredient in ingredients:
        if not isinstance(ingredient, dict):
            errors.append("ingredient audit item must be an object")
            continue
        quantity_key = ingredient.get("quantityKey")
        qualified = ingredient.get("qualifiedCandidates")
        if not isinstance(qualified, list):
            errors.append(f"{quantity_key}: qualifiedCandidates must be an array")
            qualified = []
        evidence = [compact(candidate) for candidate in qualified if isinstance(candidate, dict)]
        status, next_action = classify(evidence)
        concept_ids = sorted({str(candidate.get("conceptId")) for candidate in evidence if candidate.get("conceptId")})
        items.append({
            "quantityKey": quantity_key,
            "sourceQuantityG": ingredient.get("sourceQuantity"),
            "status": status,
            "reviewQuestion": ingredient.get("reviewQuestion"),
            "nextAction": next_action,
            "qualifiedSourceFoodCount": len({candidate.get("foodId") for candidate in evidence}),
            "qualifiedConceptCount": len(concept_ids),
            "candidateConceptIds": concept_ids,
            "candidateEvidence": evidence,
            "proposedFoodId": None,
            "proposedConceptId": None,
            "proposedVariantPolicy": None,
            "proposedNutrientIntervalPolicy": None,
            "reviewer1": None,
            "reviewer2": None,
            "adjudicator": None,
            "reviewStatus": "not_started",
            "mappingApprovalStatus": "not_approved"
        })

    counts: dict[str, int] = {}
    for item in items:
        counts[item["status"]] = counts.get(item["status"], 0) + 1
    return {
        "format": "ifkb-ds2-kb03-ingredient-mapping-review-queue",
        "version": "1.0.0",
        "valid": not errors,
        "recipeSourceId": audit.get("recipeSourceId"),
        "canonId": audit.get("canonId"),
        "auditReportSha256": canonical_sha256(audit),
        "catalog": audit.get("catalog"),
        "policy": {
            "evidenceOnly": True,
            "automaticMappingForbidden": True,
            "twoIndependentReviewersRequired": True,
            "distinctAdjudicatorRequired": True,
            "blindVariantAveragingForbidden": True
        },
        "itemCount": len(items),
        "statusCounts": dict(sorted(counts.items())),
        "approvedMappingCount": 0,
        "errors": errors,
        "items": sorted(items, key=lambda item: item["quantityKey"])
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit-report", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        audit = json.loads(args.audit_report.read_text(encoding="utf-8"))
        output = build(audit)
    except (OSError, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(f"Could not build KB03 ingredient mapping review queue: {exc}", file=sys.stderr)
        return 2
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "valid": output["valid"],
        "itemCount": output["itemCount"],
        "statusCounts": output["statusCounts"],
        "approvedMappingCount": output["approvedMappingCount"]
    }, ensure_ascii=False, indent=2))
    return 0 if output["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
