from __future__ import annotations
from dataclasses import dataclass
from collections import defaultdict
from typing import Any

@dataclass(frozen=True)
class Issue:
    severity: str
    code: str
    message: str

def validate_consent(row: dict[str, Any]) -> list[Issue]:
    issues: list[Issue] = []
    if row.get("withdrawn") == "yes":
        issues.append(Issue("critical", "CAP-VAL-001", "Consent has been withdrawn."))
    for field in ("food_photography_allowed", "model_training_allowed"):
        if row.get(field) != "yes":
            issues.append(Issue("critical", "CAP-VAL-002", f"{field} is not explicitly yes."))
    if not row.get("private_record_uri"):
        issues.append(Issue("high", "CAP-VAL-003", "Private consent record URI is missing."))
    return issues

def validate_session(row: dict[str, Any]) -> list[Issue]:
    issues: list[Issue] = []
    required = ("assignment_id", "canon_id", "provider_id", "consent_id", "dish_instance_id", "split_group_id")
    for field in required:
        if not row.get(field):
            issues.append(Issue("critical", "CAP-VAL-004", f"Missing {field}."))
    if row.get("ground_truth_source") == "user_only" and row.get("gold_candidate_status") == "GOLD_CANDIDATE":
        issues.append(Issue("critical", "CAP-VAL-005", "User-only ground truth cannot become Gold."))
    if row.get("gold_candidate_status") == "GOLD_CANDIDATE":
        for field in ("batch_id", "recipe_version_id", "scale_calibration_id", "total_edible_weight_g"):
            if row.get(field) in (None, "", 0):
                issues.append(Issue("critical", "CAP-VAL-006", f"Gold candidate missing {field}."))
        if row.get("privacy_review_status") != "accepted" or row.get("identity_review_status") != "accepted":
            issues.append(Issue("critical", "CAP-VAL-007", "Gold candidate lacks accepted privacy/identity review."))
    return issues

def validate_shots(rows: list[dict[str, Any]]) -> list[Issue]:
    issues: list[Issue] = []
    seen_hashes: dict[str, str] = {}
    group_splits: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        digest = row.get("local_sha256")
        if digest:
            if digest in seen_hashes:
                issues.append(Issue("critical", "CAP-VAL-008", f"Duplicate file hash: {digest}."))
            seen_hashes[digest] = row.get("shot_id", "")
        group = row.get("split_group_id")
        split = row.get("dataset_split")
        if group and split:
            group_splits[group].add(split)
        if row.get("privacy_review") == "rejected" and row.get("shot_status") == "accepted":
            issues.append(Issue("critical", "CAP-VAL-009", "Privacy-rejected shot cannot be accepted."))
    for group, splits in group_splits.items():
        if len(splits) > 1:
            issues.append(Issue("critical", "CAP-VAL-010", f"Split group {group} spans {sorted(splits)}."))
    return issues

def readiness_tier(split_groups: int, providers: int) -> str:
    if split_groups >= 10 and providers >= 4:
        return "R3_benchmark_candidate"
    if split_groups >= 5 and providers >= 3:
        return "R2_provisional_split"
    if split_groups >= 3 and providers >= 2:
        return "R1_prototype_holdout_only"
    return "R0_reference_only"
