from __future__ import annotations
from collections import defaultdict
from dataclasses import dataclass
from random import Random
from typing import Iterable, Mapping, Sequence

@dataclass(frozen=True)
class SourceValue:
    value: float
    weight: float = 1.0
    independence_group: str = ""

def weighted_quantile(values: Sequence[SourceValue], q: float) -> float:
    if not values:
        raise ValueError("values are required")
    if not 0 <= q <= 1:
        raise ValueError("q must be between 0 and 1")
    ordered = sorted(values, key=lambda item: item.value)
    total = sum(max(item.weight, 0.0) for item in ordered)
    if total <= 0:
        raise ValueError("positive total weight is required")
    threshold = q * total
    running = 0.0
    for item in ordered:
        running += max(item.weight, 0.0)
        if running >= threshold:
            return item.value
    return ordered[-1].value

def robust_interval(values: Sequence[SourceValue]) -> dict[str, float]:
    return {
        "p10": weighted_quantile(values, 0.10),
        "p50": weighted_quantile(values, 0.50),
        "p90": weighted_quantile(values, 0.90),
    }

def independent_group_count(values: Iterable[SourceValue]) -> int:
    groups = {item.independence_group for item in values if item.independence_group}
    return len(groups)

def digital_evidence_tier(
    independent_domains: int,
    has_consensus: bool,
    user_grounded: bool = False,
    exact_packaged_label: bool = False,
) -> str:
    if exact_packaged_label:
        return "DS4"
    if independent_domains >= 3 and has_consensus and user_grounded:
        return "DS3"
    if independent_domains >= 3 and has_consensus:
        return "DS2"
    if independent_domains >= 1:
        return "DS1"
    return "DS0"

def ingredient_presence_probability(
    source_ingredients: Sequence[set[str]],
    source_weights: Sequence[float] | None = None,
) -> dict[str, float]:
    if not source_ingredients:
        return {}
    weights = list(source_weights or [1.0] * len(source_ingredients))
    if len(weights) != len(source_ingredients):
        raise ValueError("weights length mismatch")
    total = sum(max(w, 0.0) for w in weights)
    if total <= 0:
        raise ValueError("positive source weight is required")
    numerators: dict[str, float] = defaultdict(float)
    for ingredients, weight in zip(source_ingredients, weights):
        for ingredient in ingredients:
            numerators[ingredient] += max(weight, 0.0)
    return {key: value / total for key, value in numerators.items()}

def simulate_nutrient_interval(
    ingredient_quantity_ranges: Mapping[str, tuple[float, float, float]],
    nutrient_per_gram: Mapping[str, float],
    portion_range: tuple[float, float, float] = (1.0, 1.0, 1.0),
    samples: int = 5000,
    seed: int = 13,
) -> dict[str, float]:
    if samples < 100:
        raise ValueError("samples must be at least 100")
    rng = Random(seed)
    results: list[float] = []
    for _ in range(samples):
        total = 0.0
        for ingredient, (p10, p50, p90) in ingredient_quantity_ranges.items():
            if ingredient not in nutrient_per_gram:
                continue
            low, mode, high = sorted((float(p10), float(p50), float(p90)))
            quantity = rng.triangular(low, high, mode)
            total += quantity * float(nutrient_per_gram[ingredient])
        plow, pmode, phigh = sorted(map(float, portion_range))
        portion_multiplier = rng.triangular(plow, phigh, pmode)
        results.append(total * portion_multiplier)
    results.sort()
    def pick(q: float) -> float:
        idx = min(len(results) - 1, max(0, round(q * (len(results) - 1))))
        return results[idx]
    return {"p10": pick(0.10), "p50": pick(0.50), "p90": pick(0.90)}

def validate_synthetic_record(record: Mapping[str, object]) -> list[str]:
    errors: list[str] = []
    if record.get("dataset_split") != "train":
        errors.append("synthetic images are train-only")
    if record.get("nutrition_label_allowed") is not False:
        errors.append("synthetic images cannot carry nutrition labels")
    if not record.get("parent_image_id"):
        errors.append("parent_image_id is required")
    if record.get("split_group_id") != record.get("parent_split_group_id"):
        errors.append("synthetic child must remain in parent split group")
    return errors
