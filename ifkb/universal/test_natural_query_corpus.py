from __future__ import annotations

import unittest

from natural_query_corpus import canonical_fingerprint, validate_corpus


COLUMNS = (
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


def row(**overrides: str) -> dict[str, str]:
    value = {
        "case_id": "case-1",
        "query_text": "قورمه سبزی برای ناهار",
        "expected_route": "iranian_canon",
        "expected_target": "IFKB-CANON-00008",
        "acceptable_top5_targets": "",
        "phenomena": "exact_common|portion",
        "ambiguity": "unambiguous",
        "source_kind": "consented_user_query",
        "source_batch_id": "batch-a",
        "collection_basis": "consented in-app search research",
        "privacy_reviewed": "true",
        "annotator_a": "ann-a",
        "annotator_b": "ann-b",
        "adjudicator": "adj-a",
        "annotation_status": "adjudicated",
    }
    value.update(overrides)
    return value


def release_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for index in range(500):
        if index < 250:
            route = "iranian_canon"
            target = f"IFKB-CANON-{index % 261:05d}"
        elif index < 400:
            route = "generic"
            target = f"generic-target-{index}"
        else:
            route = "abstain"
            target = ""

        phenomena: list[str] = []
        if index < 50:
            phenomena.append("typo")
        if 50 <= index < 100:
            phenomena.append("colloquial")
        if 100 <= index < 200:
            phenomena.append("portion")
        if index >= 400:
            phenomena.append("negative")
        if not phenomena:
            phenomena.append("exact_common")

        rows.append(row(
            case_id=f"case-{index:03d}",
            query_text=f"عبارت مستقل غذایی شماره {index}",
            expected_route=route,
            expected_target=target,
            phenomena="|".join(phenomena),
            ambiguity="negative" if route == "abstain" else "unambiguous",
            source_kind=(
                "consented_user_query"
                if index < 400
                else "expert_authored_challenge"
            ),
            source_batch_id=f"batch-{index // 50}",
        ))
    return rows


class NaturalQueryCorpusTests(unittest.TestCase):
    def test_valid_draft_has_stable_order_independent_fingerprint(self) -> None:
        rows = [
            row(case_id="case-a", query_text="قورمه سبزی"),
            row(
                case_id="case-b",
                query_text="یه کاسه عدسی",
                expected_target="IFKB-CANON-00042",
                phenomena="colloquial|portion",
            ),
        ]
        result = validate_corpus(rows)
        self.assertTrue(result.valid, result.errors)
        self.assertEqual(result.row_count, 2)
        self.assertEqual(
            canonical_fingerprint(rows),
            canonical_fingerprint(list(reversed(rows))),
        )

    def test_release_distribution_accepts_500_independent_rows(self) -> None:
        result = validate_corpus(release_rows(), release=True)
        self.assertTrue(result.valid, result.errors)
        self.assertEqual(result.row_count, 500)
        self.assertEqual(result.route_counts["iranian_canon"], 250)
        self.assertEqual(result.route_counts["generic"], 150)
        self.assertEqual(result.route_counts["abstain"], 100)
        self.assertEqual(result.source_counts["consented_user_query"], 400)
        self.assertEqual(result.source_counts["expert_authored_challenge"], 100)

    def test_generated_sources_pii_and_unadjudicated_rows_are_rejected(self) -> None:
        result = validate_corpus([
            row(
                source_kind="generated_alias",
                query_text="شماره من 09123456789 و test@example.com است",
                annotation_status="draft",
                privacy_reviewed="false",
            )
        ])
        self.assertFalse(result.valid)
        joined = "\n".join(result.errors)
        self.assertIn("email, URL or a long digit sequence", joined)
        self.assertIn("invalid or generated source_kind", joined)
        self.assertIn("privacy_reviewed must be true", joined)
        self.assertIn("annotation_status must be adjudicated", joined)

    def test_abstain_and_duplicate_constraints_are_enforced(self) -> None:
        first = row(
            case_id="duplicate-a",
            query_text="غذای نامرتبط",
            expected_route="abstain",
            expected_target="should-be-empty",
            ambiguity="negative",
            phenomena="negative",
        )
        second = dict(first)
        second["case_id"] = "duplicate-b"
        result = validate_corpus([first, second])
        self.assertFalse(result.valid)
        joined = "\n".join(result.errors)
        self.assertIn("abstain cases must not define target ids", joined)
        self.assertIn("duplicate normalized query/route/target", joined)


if __name__ == "__main__":
    unittest.main()
