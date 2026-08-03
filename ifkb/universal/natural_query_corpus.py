#!/usr/bin/env python3
"""Validation and freezing utilities for an independent Persian food-search corpus.

This module deliberately does not generate queries. It validates sanitized,
independently collected or expert-authored records and produces a deterministic
release fingerprint.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Mapping, Sequence

REQUIRED_COLUMNS = (
    "case_id",
    "query_text",
    "expected_route",
    "expected_target",
    "acceptable_top5_targets",
    "phenomena",
    "ambiguity",
    "source_kind",
    "source_batch_id",
    "collection_basis",
    "privacy_reviewed",
    "annotator_a",
    "annotator_b",
    "adjudicator",
    "annotation_status",
)

ROUTES = frozenset({"iranian_canon", "generic", "abstain"})
AMBIGUITY_CLASSES = frozenset({"unambiguous", "ambiguous", "negative"})
SOURCE_KINDS = frozenset({
    "consented_user_query",
    "support_transcript_sanitized",
    "expert_authored_challenge",
})
NATURAL_SOURCE_KINDS = frozenset({
    "consented_user_query",
    "support_transcript_sanitized",
})
ANNOTATION_STATUSES = frozenset({"adjudicated"})
PHENOMENA = frozenset({
    "exact_common",
    "typo",
    "arabic_characters",
    "spacing",
    "half_space",
    "colloquial",
    "regional",
    "preparation",
    "portion",
    "mixed_dish",
    "ambiguous",
    "negative",
})

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
URL_RE = re.compile(r"(?:https?://|www\.)\S+", re.IGNORECASE)
LONG_DIGIT_RE = re.compile(r"\d{7,}")
WHITESPACE_RE = re.compile(r"\s+")

PERSIAN_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


@dataclass(frozen=True)
class CorpusValidationResult:
    row_count: int
    fingerprint_sha256: str
    route_counts: Mapping[str, int]
    source_counts: Mapping[str, int]
    ambiguity_counts: Mapping[str, int]
    phenomenon_counts: Mapping[str, int]
    errors: tuple[str, ...]
    warnings: tuple[str, ...]

    @property
    def valid(self) -> bool:
        return not self.errors

    def to_json(self) -> dict[str, object]:
        return {
            "format": "ifkb-persian-natural-query-corpus-validation",
            "version": "1.0.0",
            "rowCount": self.row_count,
            "fingerprintSha256": self.fingerprint_sha256,
            "routeCounts": dict(sorted(self.route_counts.items())),
            "sourceCounts": dict(sorted(self.source_counts.items())),
            "ambiguityCounts": dict(sorted(self.ambiguity_counts.items())),
            "phenomenonCounts": dict(sorted(self.phenomenon_counts.items())),
            "valid": self.valid,
            "errors": list(self.errors),
            "warnings": list(self.warnings),
        }


def normalize_query(value: str) -> str:
    return WHITESPACE_RE.sub(" ", value.translate(PERSIAN_DIGITS).strip().casefold())


def split_pipe(value: str) -> tuple[str, ...]:
    return tuple(part.strip() for part in value.split("|") if part.strip())


def read_corpus(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = [column for column in REQUIRED_COLUMNS if column not in (reader.fieldnames or [])]
        if missing:
            raise ValueError(f"Corpus is missing required columns: {', '.join(missing)}")
        return [
            {column: (row.get(column) or "").strip() for column in REQUIRED_COLUMNS}
            for row in reader
        ]


def canonical_fingerprint(rows: Sequence[Mapping[str, str]]) -> str:
    canonical_rows = [
        {column: row.get(column, "").strip() for column in REQUIRED_COLUMNS}
        for row in sorted(rows, key=lambda item: item.get("case_id", ""))
    ]
    payload = json.dumps(
        canonical_rows,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _has_pii(value: str) -> bool:
    normalized_digits = value.translate(PERSIAN_DIGITS)
    return bool(
        EMAIL_RE.search(value)
        or URL_RE.search(value)
        or LONG_DIGIT_RE.search(normalized_digits)
    )


def validate_corpus(
    rows: Sequence[Mapping[str, str]],
    *,
    release: bool = False,
    expected_count: int = 500,
) -> CorpusValidationResult:
    errors: list[str] = []
    warnings: list[str] = []
    routes: Counter[str] = Counter()
    sources: Counter[str] = Counter()
    ambiguity: Counter[str] = Counter()
    phenomena_counts: Counter[str] = Counter()
    case_ids: set[str] = set()
    normalized_cases: set[tuple[str, str, str]] = set()

    if release and len(rows) != expected_count:
        errors.append(f"Release corpus must contain exactly {expected_count} rows; found {len(rows)}.")
    elif not rows:
        errors.append("Corpus contains no rows.")

    for index, row in enumerate(rows, start=2):
        prefix = f"row {index}"
        case_id = row.get("case_id", "").strip()
        query = row.get("query_text", "").strip()
        route = row.get("expected_route", "").strip()
        target = row.get("expected_target", "").strip()
        top5 = split_pipe(row.get("acceptable_top5_targets", ""))
        phenomenon_values = split_pipe(row.get("phenomena", ""))
        ambiguity_value = row.get("ambiguity", "").strip()
        source = row.get("source_kind", "").strip()
        source_batch = row.get("source_batch_id", "").strip()
        collection_basis = row.get("collection_basis", "").strip()
        privacy_reviewed = row.get("privacy_reviewed", "").strip().lower()
        annotator_a = row.get("annotator_a", "").strip()
        annotator_b = row.get("annotator_b", "").strip()
        adjudicator = row.get("adjudicator", "").strip()
        status = row.get("annotation_status", "").strip()

        if not case_id:
            errors.append(f"{prefix}: case_id is required.")
        elif case_id in case_ids:
            errors.append(f"{prefix}: duplicate case_id {case_id}.")
        case_ids.add(case_id)

        if not 2 <= len(query) <= 200:
            errors.append(f"{prefix}: query_text must contain 2 to 200 characters.")
        if _has_pii(query):
            errors.append(f"{prefix}: query_text contains email, URL or a long digit sequence.")

        if route not in ROUTES:
            errors.append(f"{prefix}: invalid expected_route {route!r}.")
        routes[route] += 1
        if route == "abstain":
            if target or top5:
                errors.append(f"{prefix}: abstain cases must not define target ids.")
        elif not target:
            errors.append(f"{prefix}: non-abstain cases require expected_target.")

        key = (normalize_query(query), route, target)
        if key in normalized_cases:
            errors.append(f"{prefix}: duplicate normalized query/route/target combination.")
        normalized_cases.add(key)

        if ambiguity_value not in AMBIGUITY_CLASSES:
            errors.append(f"{prefix}: invalid ambiguity class {ambiguity_value!r}.")
        ambiguity[ambiguity_value] += 1
        if route == "abstain" and ambiguity_value == "unambiguous":
            errors.append(f"{prefix}: abstain cannot be marked unambiguous.")

        if not phenomenon_values:
            errors.append(f"{prefix}: at least one phenomenon is required.")
        unknown_phenomena = sorted(set(phenomenon_values) - PHENOMENA)
        if unknown_phenomena:
            errors.append(f"{prefix}: unknown phenomena: {', '.join(unknown_phenomena)}.")
        phenomena_counts.update(phenomenon_values)

        if source not in SOURCE_KINDS:
            errors.append(f"{prefix}: invalid or generated source_kind {source!r}.")
        sources[source] += 1
        if not source_batch:
            errors.append(f"{prefix}: source_batch_id is required.")
        if not collection_basis:
            errors.append(f"{prefix}: collection_basis is required.")
        if privacy_reviewed != "true":
            errors.append(f"{prefix}: privacy_reviewed must be true.")

        if status not in ANNOTATION_STATUSES:
            errors.append(f"{prefix}: annotation_status must be adjudicated.")
        if not annotator_a or not annotator_b or not adjudicator:
            errors.append(f"{prefix}: two annotators and one adjudicator are required.")
        if annotator_a and annotator_a == annotator_b:
            errors.append(f"{prefix}: annotator_a and annotator_b must be different.")

    if release and rows:
        natural_count = sum(sources[source] for source in NATURAL_SOURCE_KINDS)
        release_requirements = {
            "natural-source rows": (natural_count, 400),
            "Iranian-canon routes": (routes["iranian_canon"], 250),
            "generic routes": (routes["generic"], 100),
            "abstain routes": (routes["abstain"], 50),
            "typo cases": (phenomena_counts["typo"], 50),
            "colloquial or regional cases": (
                phenomena_counts["colloquial"] + phenomena_counts["regional"],
                50,
            ),
            "preparation or portion cases": (
                phenomena_counts["preparation"] + phenomena_counts["portion"],
                100,
            ),
            "ambiguous or negative cases": (
                ambiguity["ambiguous"] + ambiguity["negative"],
                50,
            ),
        }
        for label, (actual, minimum) in release_requirements.items():
            if actual < minimum:
                errors.append(f"Release corpus requires at least {minimum} {label}; found {actual}.")
        if sources["expert_authored_challenge"] > 100:
            errors.append(
                "Release corpus may contain at most 100 expert-authored challenge rows."
            )

    if rows and not release:
        warnings.append(
            "Draft validation does not enforce the frozen 500-row distribution requirements."
        )

    return CorpusValidationResult(
        row_count=len(rows),
        fingerprint_sha256=canonical_fingerprint(rows),
        route_counts=dict(routes),
        source_counts=dict(sources),
        ambiguity_counts=dict(ambiguity),
        phenomenon_counts=dict(phenomena_counts),
        errors=tuple(errors),
        warnings=tuple(warnings),
    )


def write_report(result: CorpusValidationResult, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(result.to_json(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--release", action="store_true")
    parser.add_argument("--expected-count", type=int, default=500)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        rows = read_corpus(args.input)
        result = validate_corpus(
            rows,
            release=args.release,
            expected_count=args.expected_count,
        )
    except Exception as error:  # noqa: BLE001 - CLI boundary
        print(str(error), file=sys.stderr)
        return 2
    write_report(result, args.report)
    print(json.dumps(result.to_json(), ensure_ascii=False))
    return 0 if result.valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
