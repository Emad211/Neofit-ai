#!/usr/bin/env python3
"""Build a compact, fail-closed human review queue from the official portion audit.

The output is evidence staging only. It cannot approve a conversion, cannot
write the unit-conversion queue and always leaves the proposed factor null.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


def canonical_sha256(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def compact_candidate(candidate: dict[str, Any]) -> dict[str, Any]:
    return {
        "foodId": candidate.get("foodId"),
        "sourceType": candidate.get("sourceType"),
        "sourceNumericId": candidate.get("sourceNumericId"),
        "sourceFoodCode": candidate.get("sourceFoodCode"),
        "foodNameEn": candidate.get("foodNameEn"),
        "amount": candidate.get("amount"),
        "label": candidate.get("label"),
        "measureUnit": candidate.get("measureUnit"),
        "gramWeight": candidate.get("gramWeight"),
        "matchedFoodQuery": candidate.get("matchedFoodQuery"),
        "approvalStatus": "not_reviewed"
    }


def classify_family(family: dict[str, Any]) -> tuple[str, str]:
    if family.get("mode") == "unsupported":
        return (
            "blocked_non_catalog_protocol",
            "Complete the named non-catalog measurement or recipe-output protocol."
        )
    qualified = family.get("qualifiedCandidates")
    if not isinstance(qualified, list) or not qualified:
        return (
            "blocked_catalog_or_measure_gap",
            "Acquire a reviewable external source or a governed unit derivation for the exact form and measure."
        )
    weights = {float(candidate["gramWeight"]) for candidate in qualified}
    if len(qualified) == 1:
        return (
            "ready_for_independent_review",
            "Verify ingredient form and source applicability, then accept or reject the single official candidate."
        )
    if len(weights) == 1:
        return (
            "ready_for_independent_review_convergent",
            "Verify that the convergent official records represent the same ingredient form and measure."
        )
    return (
        "needs_source_specific_adjudication",
        "Select the source-specific ingredient form/portion or approve a defensible interval; do not average forms blindly."
    )


def build(audit_report: Any, unit_queue: Any) -> dict[str, Any]:
    errors: list[str] = []
    if not isinstance(audit_report, dict):
        return {"format": "ifkb-ds2-official-portion-review-queue", "version": "1.0.0", "valid": False, "errors": ["audit report must be an object"]}
    if audit_report.get("format") != "ifkb-ds2-official-portion-audit-report":
        errors.append("invalid audit report format")
    if audit_report.get("auditOnly") is not True:
        errors.append("audit report must be audit-only")
    if audit_report.get("aligned") is not True:
        errors.append("audit report is not aligned")
    if audit_report.get("approvedConversionCount") != 0:
        errors.append("audit report unexpectedly contains approved conversions")

    requirements = unit_queue.get("requirements") if isinstance(unit_queue, dict) else None
    families = audit_report.get("families")
    if not isinstance(requirements, list) or not isinstance(families, list):
        errors.append("unit queue requirements and audit families must be arrays")
        requirements = []
        families = []
    requirement_by_family = {
        row.get("quantityFamily"): row
        for row in requirements
        if isinstance(row, dict) and isinstance(row.get("quantityFamily"), str)
    }
    if set(requirement_by_family) != {row.get("quantityFamily") for row in families if isinstance(row, dict)}:
        errors.append("audit families do not exactly cover the unit-conversion queue")

    review_items: list[dict[str, Any]] = []
    for family in families:
        if not isinstance(family, dict):
            errors.append("audit family must be an object")
            continue
        name = family.get("quantityFamily")
        requirement = requirement_by_family.get(name, {})
        if requirement.get("conversionFactorToGrams") is not None:
            errors.append(f"{name} already has a conversion factor before review")
        if requirement.get("reviewStatus") != "unresolved":
            errors.append(f"{name} must remain unresolved before independent review")
        status, next_action = classify_family(family)
        qualified = family.get("qualifiedCandidates") if isinstance(family.get("qualifiedCandidates"), list) else []
        evidence = [compact_candidate(candidate) for candidate in qualified if isinstance(candidate, dict)]
        review_items.append({
            "quantityFamily": name,
            "affectedSourceRecordIds": sorted(requirement.get("affectedSourceRecordIds", [])),
            "status": status,
            "nextAction": next_action,
            "formReviewNote": family.get("formReviewNote") or family.get("reason"),
            "auditReviewDisposition": family.get("reviewDisposition"),
            "qualifiedEvidenceCount": len(evidence),
            "candidateGramWeights": sorted({float(candidate["gramWeight"]) for candidate in evidence}),
            "candidateEvidence": evidence,
            "proposedConversionFactorToGrams": None,
            "proposedIntervalLowG": None,
            "proposedIntervalHighG": None,
            "reviewer1": None,
            "reviewer2": None,
            "adjudicator": None,
            "reviewStatus": "not_started",
            "approvalStatus": "not_approved"
        })

    counts: dict[str, int] = {}
    for item in review_items:
        counts[item["status"]] = counts.get(item["status"], 0) + 1
    return {
        "format": "ifkb-ds2-official-portion-review-queue",
        "version": "1.0.0",
        "valid": not errors,
        "auditReportSha256": canonical_sha256(audit_report),
        "catalog": audit_report.get("catalog"),
        "policy": {
            "evidenceOnly": True,
            "independentReviewRequired": True,
            "automaticApprovalForbidden": True,
            "noBlindAveragingAcrossForms": True
        },
        "itemCount": len(review_items),
        "statusCounts": dict(sorted(counts.items())),
        "approvedItemCount": 0,
        "errors": errors,
        "items": sorted(review_items, key=lambda item: item["quantityFamily"])
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit-report", type=Path, required=True)
    parser.add_argument("--unit-queue", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        audit_report = json.loads(args.audit_report.read_text(encoding="utf-8"))
        unit_queue = json.loads(args.unit_queue.read_text(encoding="utf-8"))
        output = build(audit_report, unit_queue)
    except (OSError, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(f"Could not build official portion review queue: {exc}", file=sys.stderr)
        return 2
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "valid": output["valid"],
        "itemCount": output["itemCount"],
        "statusCounts": output["statusCounts"],
        "approvedItemCount": output["approvedItemCount"]
    }, ensure_ascii=False, indent=2))
    return 0 if output["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
