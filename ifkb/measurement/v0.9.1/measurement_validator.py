from dataclasses import dataclass
from statistics import mean, stdev
from typing import Any


@dataclass(frozen=True)
class Issue:
    severity: str
    code: str
    message: str


def coefficient_of_variation(values):
    clean = [float(value) for value in values if value is not None]
    if len(clean) < 2 or mean(clean) == 0:
        return None
    return stdev(clean) / mean(clean)


def validate_measure_replicates(values, minimum_n=10, cv_limit=0.10):
    clean = [float(value) for value in values if value is not None]
    issues = []
    if len(clean) < minimum_n:
        issues.append(Issue("high", "MEAS-QA-005", f"Only {len(clean)} replicates; {minimum_n} required."))
        return issues
    cv = coefficient_of_variation(clean)
    if cv is None or cv > cv_limit:
        issues.append(Issue("high", "MEAS-QA-005", f"Replicate CV {cv!r} exceeds limit {cv_limit}."))
    return issues


def validate_ingredient(row: dict[str, Any]):
    issues = []
    purchased = row.get("as_purchased_g")
    refuse = row.get("refuse_g")
    edible = row.get("edible_raw_g")
    if row.get("required_or_optional") == "required" and edible is None:
        issues.append(Issue("critical", "MEAS-QA-019", "Required ingredient lacks edible raw weight."))
    if purchased is not None and edible is not None and edible > purchased:
        issues.append(Issue("critical", "MEAS-QA-003", "Edible raw weight exceeds as-purchased weight."))
    if purchased is not None and refuse is not None and edible is not None:
        if abs((purchased - refuse) - edible) > max(2.0, purchased * 0.03):
            issues.append(Issue("high", "MEAS-QA-003", "Purchased - refuse does not agree with edible raw weight."))
    return issues


def validate_batch(row: dict[str, Any]):
    issues = []
    for field in ("batch_id", "recipe_version_id", "canon_id", "kitchen_id", "cook_id", "scale_calibration_id"):
        if not row.get(field):
            issues.append(Issue("critical", "MEAS-QA-008", f"Missing {field}."))
    raw = row.get("total_edible_raw_g")
    cooked = row.get("cooked_yield_g")
    completion = row.get("ingredient_completion_pct")
    if raw is None or raw <= 0 or cooked is None or cooked <= 0:
        issues.append(Issue("critical", "MEAS-QA-006", "Raw edible mass and cooked yield must be positive."))
    if completion is None or completion < 1:
        issues.append(Issue("critical", "MEAS-QA-019", "Ingredient measurements are incomplete."))
    if row.get("oil_input_g") is not None and row.get("oil_recovered_g") is not None:
        if row["oil_recovered_g"] > row["oil_input_g"]:
            issues.append(Issue("critical", "MEAS-QA-007", "Recovered oil exceeds input oil."))
    return issues


def validate_gold_image(row: dict[str, Any]):
    issues = []
    for field in ("image_id", "dish_instance_id", "batch_id", "recipe_version_id", "canon_id", "license_or_consent_id"):
        if not row.get(field):
            issues.append(Issue("critical", "MEAS-QA-015", f"Gold image missing {field}."))
    if row.get("ground_truth_source") == "user_only":
        issues.append(Issue("critical", "MEAS-QA-015", "User-only label cannot be nutrition gold."))
    if row.get("total_food_weight_g") in (None, 0):
        issues.append(Issue("critical", "MEAS-QA-015", "Gold image lacks measured total food weight."))
    return issues
