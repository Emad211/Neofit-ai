#!/usr/bin/env python3
"""Audit official SR Legacy/FNDDS portions for unresolved DS2 quantity families.

This tool is deliberately read-only and audit-only. It returns raw official
portion records for human review; it never writes conversion factors and never
marks a quantity family approved.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
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


def contains_token_phrase(value: Any, phrase: Any) -> bool:
    value_tokens = tokens(value)
    phrase_tokens = tokens(phrase)
    if not phrase_tokens or len(phrase_tokens) > len(value_tokens):
        return False
    width = len(phrase_tokens)
    return any(value_tokens[index:index + width] == phrase_tokens for index in range(len(value_tokens) - width + 1))


def matched_substrings(value: Any, candidates: Any) -> list[str]:
    text = normalize(value)
    if not isinstance(candidates, list):
        return []
    return [normalize(candidate) for candidate in candidates if normalize(candidate) and normalize(candidate) in text]


def review_disposition(qualified: list[dict[str, Any]], raw_count: int) -> str:
    if not qualified:
        return "catalog_gap" if raw_count == 0 else "no_candidate_passed_exact_form_measure_filters"
    unique_weights = sorted({float(candidate["gramWeight"]) for candidate in qualified})
    if len(qualified) == 1:
        return "single_official_candidate_requires_human_review"
    if len(unique_weights) == 1:
        return "multiple_official_records_converge_but_still_require_human_review"
    return "multiple_form_or_weight_candidates_require_source_specific_adjudication"


def score_candidate(row: sqlite3.Row, family: dict[str, Any], matched_query: str) -> tuple[int, dict[str, Any]]:
    name = normalize(row["name_en"])
    label = normalize(row["label"])
    measure_text = normalize(f"{row['label']} {row['measure_unit'] or ''}")
    name_query_matched = contains_token_phrase(name, matched_query)
    score = 50 if name_query_matched else -50

    measure_tokens = [normalize(token) for token in family.get("measureTokens", [])]
    measure_matches = [token for token in measure_tokens if token and token in measure_text]
    score += 25 if measure_matches else -25

    target_amount = family.get("targetAmount")
    amount_matches = (
        isinstance(target_amount, (int, float))
        and not isinstance(target_amount, bool)
        and math.isfinite(float(target_amount))
        and abs(float(row["amount"]) - float(target_amount)) <= 1e-9
    )
    score += 10 if amount_matches else -10

    state_tokens = [normalize(token) for token in family.get("requiredStateTokensAny", [])]
    state_matches = [token for token in state_tokens if token and token in name]
    state_requirement_matched = not state_tokens or bool(state_matches)
    if state_tokens:
        score += 15 if state_matches else -20

    excluded_name_matches = matched_substrings(name, family.get("excludeNameTokens", []))
    excluded_label_matches = matched_substrings(label, family.get("excludeLabelTokens", []))
    score -= 40 * (len(excluded_name_matches) + len(excluded_label_matches))
    score += 2 if row["source_type"] == "sr_legacy" else 1

    rejection_reasons: list[str] = []
    if not name_query_matched:
        rejection_reasons.append("food_name_did_not_match_query_as_token_phrase")
    if not measure_matches:
        rejection_reasons.append("requested_measure_not_present")
    if not amount_matches:
        rejection_reasons.append("portion_amount_did_not_match_target")
    if not state_requirement_matched:
        rejection_reasons.append("required_food_state_not_present")
    if excluded_name_matches:
        rejection_reasons.append("excluded_food_name_form_present")
    if excluded_label_matches:
        rejection_reasons.append("excluded_portion_label_form_present")
    qualified = not rejection_reasons

    candidate = {
        "foodId": row["food_id"],
        "sourceType": row["source_type"],
        "sourceNumericId": row["source_numeric_id"],
        "sourceFoodCode": row["source_food_code"],
        "foodNameEn": row["name_en"],
        "amount": row["amount"],
        "label": row["label"],
        "measureUnit": row["measure_unit"],
        "gramWeight": row["gram_weight"],
        "matchedFoodQuery": matched_query,
        "foodNameTokenPhraseMatched": name_query_matched,
        "matchedMeasureTokens": measure_matches,
        "matchedStateTokens": state_matches,
        "targetAmountMatched": amount_matches,
        "excludedFoodNameMatches": excluded_name_matches,
        "excludedLabelMatches": excluded_label_matches,
        "qualifiedForHumanReview": qualified,
        "qualificationStatus": "qualified_for_human_review" if qualified else "rejected_by_audit_filter",
        "rejectionReasons": rejection_reasons,
        "auditScore": score,
        "approvalStatus": "not_reviewed"
    }
    return score, candidate


def audit(database_path: Path, manifest_path: Path, queue_path: Path, spec_path: Path) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    queue = json.loads(queue_path.read_text(encoding="utf-8"))
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    actual_sha = sha256_file(database_path)
    actual_bytes = database_path.stat().st_size
    if manifest.get("databaseSha256") != actual_sha:
        errors.append("catalog database SHA-256 differs from manifest")
    if int(manifest.get("databaseBytes", -1)) != actual_bytes:
        errors.append("catalog database byte size differs from manifest")
    if spec.get("format") != "ifkb-ds2-official-portion-audit-spec":
        errors.append("invalid audit spec format")
    policy = spec.get("policy") if isinstance(spec.get("policy"), dict) else {}
    for key in ("auditOnly", "automaticApprovalForbidden", "candidateGramWeightsMustRemainRawOfficialPortions", "sourceSpecificFormReviewRequired"):
        if policy.get(key) is not True:
            errors.append(f"policy.{key} must be true")

    requirements = queue.get("requirements") if isinstance(queue, dict) else None
    families = spec.get("families") if isinstance(spec, dict) else None
    if not isinstance(requirements, list) or not isinstance(families, list):
        errors.append("queue requirements and spec families must be arrays")
        requirements = []
        families = []
    queue_names = [row.get("quantityFamily") for row in requirements if isinstance(row, dict)]
    spec_names = [row.get("quantityFamily") for row in families if isinstance(row, dict)]
    if len(queue_names) != len(set(queue_names)):
        errors.append("unit conversion queue contains duplicate quantityFamily values")
    if len(spec_names) != len(set(spec_names)):
        errors.append("audit spec contains duplicate quantityFamily values")
    if set(queue_names) != set(spec_names):
        errors.append(
            f"audit spec coverage differs from unit queue: "
            f"queue_only={sorted(set(queue_names)-set(spec_names))}, "
            f"spec_only={sorted(set(spec_names)-set(queue_names))}"
        )
    for requirement in requirements:
        if not isinstance(requirement, dict):
            continue
        if requirement.get("conversionFactorToGrams") is not None:
            errors.append(f"{requirement.get('quantityFamily')} already contains an unreviewed conversion factor")
        if requirement.get("reviewStatus") != "unresolved":
            errors.append(f"{requirement.get('quantityFamily')} is not unresolved before audit")

    report_families: list[dict[str, Any]] = []
    connection = sqlite3.connect(f"file:{database_path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        table_names = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if not {"generic_foods", "generic_portions"}.issubset(table_names):
            errors.append("catalog is missing generic_foods or generic_portions")
        for family in families:
            if not isinstance(family, dict):
                errors.append("audit family must be an object")
                continue
            quantity_family = family.get("quantityFamily")
            mode = family.get("mode")
            if mode == "unsupported":
                reason = family.get("reason")
                if not isinstance(reason, str) or not reason.strip():
                    errors.append(f"{quantity_family} unsupported mode requires a reason")
                report_families.append({
                    "quantityFamily": quantity_family,
                    "mode": "unsupported",
                    "reason": reason,
                    "rawCandidateCount": 0,
                    "qualifiedCandidateCount": 0,
                    "qualifiedCandidates": [],
                    "rejectedCandidates": [],
                    "reviewDisposition": "blocked_requires_non_catalog_protocol",
                    "approvalStatus": "blocked_requires_non_catalog_protocol"
                })
                continue
            if mode != "search":
                errors.append(f"{quantity_family} has invalid audit mode")
                continue
            queries = family.get("foodQueries")
            if not isinstance(queries, list) or not all(isinstance(value, str) and value.strip() for value in queries):
                errors.append(f"{quantity_family} requires non-empty foodQueries")
                continue
            candidate_map: dict[tuple[Any, ...], tuple[int, dict[str, Any]]] = {}
            for query in queries:
                rows = connection.execute(
                    """
                    SELECT f.id AS food_id,f.source_type,f.source_numeric_id,f.source_food_code,f.name_en,
                           p.amount,p.label,p.measure_unit,p.gram_weight
                    FROM generic_foods f
                    JOIN generic_portions p ON p.food_id=f.id
                    WHERE lower(f.name_en) LIKE ?
                    """,
                    (f"%{normalize(query)}%",),
                ).fetchall()
                for row in rows:
                    score, candidate = score_candidate(row, family, query)
                    key = (candidate["foodId"], candidate["amount"], candidate["label"], candidate["measureUnit"], candidate["gramWeight"])
                    existing = candidate_map.get(key)
                    if existing is None or score > existing[0]:
                        candidate_map[key] = (score, candidate)
            ranked = [item[1] for item in sorted(
                candidate_map.values(),
                key=lambda item: (
                    not item[1]["qualifiedForHumanReview"],
                    -item[0],
                    item[1]["foodNameEn"],
                    item[1]["gramWeight"],
                    item[1]["label"],
                ),
            )]
            qualified = [candidate for candidate in ranked if candidate["qualifiedForHumanReview"]][:20]
            rejected = [candidate for candidate in ranked if not candidate["qualifiedForHumanReview"]][:20]
            disposition = review_disposition(qualified, len(ranked))
            if not qualified:
                warnings.append(f"{quantity_family}: {disposition}")
            report_families.append({
                "quantityFamily": quantity_family,
                "mode": "search",
                "formReviewNote": family.get("formReviewNote"),
                "rawCandidateCount": len(ranked),
                "qualifiedCandidateCount": len(qualified),
                "qualifiedGramWeights": sorted({float(candidate["gramWeight"]) for candidate in qualified}),
                "qualifiedCandidates": qualified,
                "rejectedCandidateSample": rejected,
                "reviewDisposition": disposition,
                "approvalStatus": "not_reviewed"
            })
    finally:
        connection.close()

    return {
        "format": "ifkb-ds2-official-portion-audit-report",
        "version": "1.1.0",
        "auditOnly": True,
        "catalog": {
            "version": manifest.get("version"),
            "databaseSha256": actual_sha,
            "databaseBytes": actual_bytes
        },
        "aligned": not errors,
        "familyCount": len(report_families),
        "searchFamilyCount": sum(row.get("mode") == "search" for row in report_families),
        "unsupportedFamilyCount": sum(row.get("mode") == "unsupported" for row in report_families),
        "familiesWithRawCandidates": sum(int(row.get("rawCandidateCount", 0)) > 0 for row in report_families),
        "familiesWithQualifiedCandidates": sum(int(row.get("qualifiedCandidateCount", 0)) > 0 for row in report_families),
        "approvedConversionCount": 0,
        "errors": errors,
        "warnings": warnings,
        "families": report_families
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--queue", type=Path, required=True)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    try:
        report = audit(args.database, args.manifest, args.queue, args.spec)
    except (OSError, sqlite3.Error, json.JSONDecodeError, ValueError) as exc:
        print(f"Could not audit official portions: {exc}", file=sys.stderr)
        return 2
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "aligned": report["aligned"],
        "familyCount": report["familyCount"],
        "familiesWithRawCandidates": report["familiesWithRawCandidates"],
        "familiesWithQualifiedCandidates": report["familiesWithQualifiedCandidates"],
        "approvedConversionCount": report["approvedConversionCount"],
        "warnings": report["warnings"]
    }, ensure_ascii=False, indent=2))
    return 0 if report["aligned"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
