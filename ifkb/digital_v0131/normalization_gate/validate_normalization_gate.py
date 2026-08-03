#!/usr/bin/env python3
"""Fail-closed validator for IFKB DS2 normalization readiness.

The validator distinguishes identity consensus from nutrient-calculation readiness.
It intentionally does not calculate nutrition or promote any food profile.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

CANON_RE = re.compile(r"^IFKB-CANON-\d{5}$")
CONSENSUS_RE = re.compile(r"^CONS-IFKB-CANON-\d{5}-V\d+$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
COMPLETE_FIELDS = (
    "ingredientMapping",
    "quantityNormalization",
    "yieldNormalization",
    "retentionFactors",
    "edibleFractions",
)
EXPECTED_V0131_CANONS = {
    "IFKB-CANON-00008",
    "IFKB-CANON-00010",
    "IFKB-CANON-00028",
}


@dataclass(frozen=True)
class ValidationResult:
    errors: tuple[str, ...]
    warnings: tuple[str, ...]
    profile_count: int
    eligible_count: int
    blocked_count: int
    fingerprint_sha256: str

    @property
    def structurally_valid(self) -> bool:
        return not self.errors


def _canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _fingerprint(value: Any) -> str:
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


def _is_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _is_sha256_or_none(value: Any) -> bool:
    return value is None or (isinstance(value, str) and bool(SHA256_RE.fullmatch(value)))


def _profile_errors(profile: Any, index: int) -> list[str]:
    prefix = f"profiles[{index}]"
    errors: list[str] = []
    if not isinstance(profile, dict):
        return [f"{prefix} must be an object"]

    canon_id = profile.get("canonId")
    consensus_id = profile.get("consensusId")
    if not isinstance(canon_id, str) or not CANON_RE.fullmatch(canon_id):
        errors.append(f"{prefix}.canonId is invalid")
    if not isinstance(consensus_id, str) or not CONSENSUS_RE.fullmatch(consensus_id):
        errors.append(f"{prefix}.consensusId is invalid")
    elif isinstance(canon_id, str) and canon_id not in consensus_id:
        errors.append(f"{prefix}.consensusId does not encode canonId")
    if not _is_nonempty_string(profile.get("foodNameFa")):
        errors.append(f"{prefix}.foodNameFa is required")

    source_records = profile.get("sourceRecords")
    independent_groups = profile.get("independentSourceGroups")
    source_ids = profile.get("sourceRecordIds")
    if not isinstance(source_records, int) or isinstance(source_records, bool) or source_records < 1:
        errors.append(f"{prefix}.sourceRecords must be a positive integer")
    if not isinstance(independent_groups, int) or isinstance(independent_groups, bool) or independent_groups < 1:
        errors.append(f"{prefix}.independentSourceGroups must be a positive integer")
    elif isinstance(source_records, int) and independent_groups > source_records:
        errors.append(f"{prefix}.independentSourceGroups cannot exceed sourceRecords")
    if not isinstance(source_ids, list) or not all(_is_nonempty_string(item) for item in source_ids):
        errors.append(f"{prefix}.sourceRecordIds must be a non-empty string array")
    else:
        if len(set(source_ids)) != len(source_ids):
            errors.append(f"{prefix}.sourceRecordIds contains duplicates")
        if isinstance(source_records, int) and len(source_ids) != source_records:
            errors.append(f"{prefix}.sourceRecordIds count does not match sourceRecords")

    if profile.get("identityStatus") != "multi_source_consensus":
        errors.append(f"{prefix}.identityStatus must be multi_source_consensus")
    if profile.get("evidenceTier") != "DS2":
        errors.append(f"{prefix}.evidenceTier must be DS2")

    source_status = profile.get("sourceStatus")
    if not isinstance(source_status, dict):
        errors.append(f"{prefix}.sourceStatus must be an object")
    else:
        if not _is_nonempty_string(source_status.get("nutrientIntervalStatusRaw")):
            errors.append(f"{prefix}.sourceStatus.nutrientIntervalStatusRaw is required")
        if not _is_nonempty_string(source_status.get("portionPriorStatusRaw")):
            errors.append(f"{prefix}.sourceStatus.portionPriorStatusRaw is required")
        if not isinstance(source_status.get("userGroundingRequiredForDS3"), bool):
            errors.append(f"{prefix}.sourceStatus.userGroundingRequiredForDS3 must be boolean")

    normalization = profile.get("normalization")
    if not isinstance(normalization, dict):
        errors.append(f"{prefix}.normalization must be an object")
        normalization = {}
    for field in COMPLETE_FIELDS:
        if normalization.get(field) not in {"not_assessed", "not_started", "incomplete", "complete"}:
            errors.append(f"{prefix}.normalization.{field} has an invalid status")
    if normalization.get("servingBasis") not in {"missing", "prior_only", "measured_or_calculated"}:
        errors.append(f"{prefix}.normalization.servingBasis has an invalid status")

    serving_weight = profile.get("servingWeightG")
    if serving_weight is not None and (
        isinstance(serving_weight, bool)
        or not isinstance(serving_weight, (int, float))
        or not math.isfinite(serving_weight)
        or serving_weight <= 0
    ):
        errors.append(f"{prefix}.servingWeightG must be null or a finite positive number")

    if profile.get("nutrientIntervals") not in {"blocked", "ready"}:
        errors.append(f"{prefix}.nutrientIntervals has an invalid status")
    if profile.get("nutritionCenterBasis") not in {
        "none",
        "legacy_estimate",
        "normalized_recipe_calculation",
    }:
        errors.append(f"{prefix}.nutritionCenterBasis has an invalid value")
    for field in ("calculationArtifactSha256", "ingredientMappingArtifactSha256"):
        if not _is_sha256_or_none(profile.get(field)):
            errors.append(f"{prefix}.{field} must be null or lowercase SHA-256")

    review = profile.get("review")
    if not isinstance(review, dict):
        errors.append(f"{prefix}.review must be an object")
        review = {}
    if review.get("status") not in {"not_ready", "in_review", "adjudicated"}:
        errors.append(f"{prefix}.review.status has an invalid value")
    for field in ("reviewer1", "reviewer2", "adjudicator"):
        value = review.get(field)
        if value is not None and not _is_nonempty_string(value):
            errors.append(f"{prefix}.review.{field} must be null or a non-empty string")

    eligible = profile.get("promotionEligible")
    blockers = profile.get("blockingReasons")
    if not isinstance(eligible, bool):
        errors.append(f"{prefix}.promotionEligible must be boolean")
        eligible = False
    if not isinstance(blockers, list) or not all(_is_nonempty_string(item) for item in blockers):
        errors.append(f"{prefix}.blockingReasons must be a string array")
        blockers = []

    if eligible:
        if not isinstance(independent_groups, int) or independent_groups < 3:
            errors.append(f"{prefix} cannot be promoted with fewer than 3 independent source groups")
        for field in COMPLETE_FIELDS:
            if normalization.get(field) != "complete":
                errors.append(f"{prefix} is promotionEligible but {field} is not complete")
        if normalization.get("servingBasis") != "measured_or_calculated":
            errors.append(f"{prefix} is promotionEligible without a measured_or_calculated serving basis")
        if serving_weight is None:
            errors.append(f"{prefix} is promotionEligible without servingWeightG")
        if profile.get("nutrientIntervals") != "ready":
            errors.append(f"{prefix} is promotionEligible while nutrientIntervals is not ready")
        if profile.get("nutritionCenterBasis") != "normalized_recipe_calculation":
            errors.append(f"{prefix} is promotionEligible without normalized recipe nutrition")
        if not isinstance(profile.get("calculationArtifactSha256"), str):
            errors.append(f"{prefix} is promotionEligible without a calculation artifact hash")
        if not isinstance(profile.get("ingredientMappingArtifactSha256"), str):
            errors.append(f"{prefix} is promotionEligible without an ingredient mapping artifact hash")
        reviewer1 = review.get("reviewer1")
        reviewer2 = review.get("reviewer2")
        adjudicator = review.get("adjudicator")
        if review.get("status") != "adjudicated":
            errors.append(f"{prefix} is promotionEligible before adjudication")
        if not all(_is_nonempty_string(value) for value in (reviewer1, reviewer2, adjudicator)):
            errors.append(f"{prefix} is promotionEligible without two reviewers and an adjudicator")
        elif len({reviewer1, reviewer2, adjudicator}) < 3:
            errors.append(f"{prefix} reviewers and adjudicator must be three distinct people")
        if blockers:
            errors.append(f"{prefix} is promotionEligible but still has blockingReasons")
    elif not blockers:
        errors.append(f"{prefix} is blocked but has no blockingReasons")

    return errors


def validate_document(document: Any, *, require_all_release_ready: bool = False,
                      require_v0131_profile_set: bool = False) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []
    if not isinstance(document, dict):
        return ValidationResult(("document must be an object",), (), 0, 0, 0, _fingerprint(document))

    if document.get("format") != "ifkb-ds2-normalization-gate":
        errors.append("format must be ifkb-ds2-normalization-gate")
    if document.get("version") != "1.0.0":
        errors.append("version must be 1.0.0")
    if not _is_nonempty_string(document.get("sourceRelease")):
        errors.append("sourceRelease is required")
    if document.get("status") not in {
        "blocked-pending-normalization",
        "partially-ready",
        "release-ready",
    }:
        errors.append("status is invalid")

    policy = document.get("scientificPolicy")
    required_policy = {
        "identityConsensusIsNotNutrientReadiness": True,
        "legacyNutritionCenterMayNotBeRelabelledAsNormalizedRecipeCalculation": True,
        "promotionRequiresIndependentReview": True,
    }
    if not isinstance(policy, dict):
        errors.append("scientificPolicy must be an object")
    else:
        for key, expected in required_policy.items():
            if policy.get(key) is not expected:
                errors.append(f"scientificPolicy.{key} must be true")

    profiles = document.get("profiles")
    if not isinstance(profiles, list) or not profiles:
        errors.append("profiles must be a non-empty array")
        profiles = []

    canon_ids: list[str] = []
    consensus_ids: list[str] = []
    eligible_count = 0
    for index, profile in enumerate(profiles):
        errors.extend(_profile_errors(profile, index))
        if isinstance(profile, dict):
            canon_ids.append(str(profile.get("canonId", "")))
            consensus_ids.append(str(profile.get("consensusId", "")))
            eligible_count += int(profile.get("promotionEligible") is True)

    if len(set(canon_ids)) != len(canon_ids):
        errors.append("profiles contain duplicate canonId values")
    if len(set(consensus_ids)) != len(consensus_ids):
        errors.append("profiles contain duplicate consensusId values")
    if require_v0131_profile_set and set(canon_ids) != EXPECTED_V0131_CANONS:
        missing = sorted(EXPECTED_V0131_CANONS - set(canon_ids))
        extra = sorted(set(canon_ids) - EXPECTED_V0131_CANONS)
        errors.append(f"v0.13.1 profile set mismatch; missing={missing}, extra={extra}")

    blocked_count = len(profiles) - eligible_count
    if require_all_release_ready and blocked_count:
        errors.append(f"release mode requires every profile to be eligible; {blocked_count} remain blocked")
    if document.get("status") == "release-ready" and blocked_count:
        errors.append("status is release-ready but blocked profiles remain")
    if document.get("status") == "blocked-pending-normalization" and eligible_count:
        warnings.append("document status is blocked-pending-normalization but some profiles are eligible")

    return ValidationResult(
        errors=tuple(errors),
        warnings=tuple(warnings),
        profile_count=len(profiles),
        eligible_count=eligible_count,
        blocked_count=blocked_count,
        fingerprint_sha256=_fingerprint(document),
    )


def _report(result: ValidationResult, source: Path, mode: str) -> dict[str, Any]:
    return {
        "format": "ifkb-ds2-normalization-validation-report",
        "version": "1.0.0",
        "source": str(source),
        "mode": mode,
        "structurallyValid": result.structurally_valid,
        "profileCount": result.profile_count,
        "promotionEligibleCount": result.eligible_count,
        "blockedCount": result.blocked_count,
        "fingerprintSha256": result.fingerprint_sha256,
        "errors": list(result.errors),
        "warnings": list(result.warnings),
    }


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--mode", choices=("draft", "release"), default="draft")
    parser.add_argument("--require-v0131-profile-set", action="store_true")
    args = parser.parse_args(list(argv) if argv is not None else None)

    try:
        document = json.loads(args.input.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Could not read normalization gate: {exc}", file=sys.stderr)
        return 2

    result = validate_document(
        document,
        require_all_release_ready=args.mode == "release",
        require_v0131_profile_set=args.require_v0131_profile_set,
    )
    report = _report(result, args.input, args.mode)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if result.structurally_valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
