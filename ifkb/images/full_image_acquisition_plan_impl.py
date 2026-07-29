#!/usr/bin/env python3
"""Build the full 261-class IFKB image acquisition ledger and query packs.

This is a deterministic planning/audit step. It never downloads media and never
turns a candidate or release-level aggregate into an approved image row.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

EXPECTED_CANON_COUNT = 261
EXPECTED_BATCH_COUNT = 12
EXPECTED_P0_COUNT = 60
RELEASE_LICENSED_ASSET_COUNT = 58
RELEASE_P0_COVERED_CLASS_COUNT = 43

P0_INPUTS = (
    "ifkb/images/pilot_seed_manifest.csv",
    "ifkb/images/p0_candidate_queries.csv",
    "ifkb/images/p0_wave2_accepted_manifest.csv",
    "ifkb/images/p0_wave3_refined_queries.csv",
    "ifkb/images/p0_wave3_rate_limit_retry_queries.csv",
    "ifkb/images/openverse_unresolved_queries.csv",
    "ifkb/images/manual_exact_commons_manifest_v0.12.csv",
    "ifkb/images/releases/0.12.0/exact-source-registry.csv",
    "ifkb/images/releases/0.12.0/field-capture-fallback.csv",
    "ifkb/images/consented_field_capture_fallback.csv",
)
ROW_LEVEL_ACCEPTED_INPUTS = (
    "ifkb/images/pilot_seed_manifest.csv",
    "ifkb/images/p0_wave2_accepted_manifest.csv",
)
EXACT_SOURCE_INPUT = "ifkb/images/releases/0.12.0/exact-source-registry.csv"
FIELD_CAPTURE_INPUTS = (
    "ifkb/images/releases/0.12.0/field-capture-fallback.csv",
    "ifkb/images/consented_field_capture_fallback.csv",
)

NEGATIVE_TERMS_BY_CATEGORY: dict[str, tuple[str, ...]] = {
    "stew": ("raw ingredients", "soup only", "spice package"),
    "rice": ("uncooked rice", "rice field", "raw grain"),
    "kebab": ("doner", "shawarma", "raw meat"),
    "soup": ("dry ingredients", "drink only"),
    "breakfast": ("ingredient package",),
    "street_food": ("unrelated regional dish",),
    "bread": ("flour package", "raw dough only"),
    "dessert": ("industrial package only",),
    "beverage": ("ingredient package",),
    "dairy_beverage": ("commercial logo only",),
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def canonical_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def fingerprint(lines: Iterable[str]) -> str:
    payload = "\n".join(sorted(lines)) + "\n"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def canon_id_from_row(row: dict[str, str]) -> str:
    return (row.get("canon_id") or row.get("canonId") or "").strip()


def collect_canon_ids(root: Path, relative_paths: Iterable[str]) -> set[str]:
    result: set[str] = set()
    for relative in relative_paths:
        path = root / relative
        if not path.exists():
            continue
        for row in read_csv(path):
            canon_id = canon_id_from_row(row)
            if canon_id:
                result.add(canon_id)
    return result


def collect_accepted_assets(root: Path) -> tuple[list[dict[str, str]], set[str]]:
    assets: list[dict[str, str]] = []
    classes: set[str] = set()
    seen_ids: set[str] = set()
    for relative in ROW_LEVEL_ACCEPTED_INPUTS:
        path = root / relative
        if not path.exists():
            continue
        for row in read_csv(path):
            canon_id = canon_id_from_row(row)
            asset_id = (
                row.get("seed_image_id")
                or row.get("candidate_id")
                or row.get("source_record_id")
                or ""
            ).strip()
            if not canon_id or not asset_id or asset_id in seen_ids:
                continue
            status = (
                row.get("identity_review")
                or row.get("visual_review_status")
                or ""
            ).strip().lower()
            if status and status not in {
                "approved",
                "accepted",
                "accepted_with_components",
                "accepted_variant_specific",
            }:
                continue
            seen_ids.add(asset_id)
            classes.add(canon_id)
            assets.append(
                {
                    "assetId": asset_id,
                    "canonId": canon_id,
                    "sourceFile": relative,
                    "license": (
                        row.get("expected_license")
                        or row.get("license")
                        or ""
                    ).strip(),
                    "role": (
                        row.get("image_role")
                        or row.get("reviewed_image_role")
                        or ""
                    ).strip(),
                    "landingUrl": (
                        row.get("commons_page_url")
                        or row.get("foreign_landing_url")
                        or ""
                    ).strip(),
                }
            )
    return assets, classes


def exact_source_status(root: Path) -> dict[str, str]:
    path = root / EXACT_SOURCE_INPUT
    if not path.exists():
        return {}
    status: dict[str, str] = {}
    for row in read_csv(path):
        canon_id = canon_id_from_row(row)
        if not canon_id:
            continue
        status[canon_id] = (
            row.get("dataset_eligibility")
            or row.get("asset_acquisition_status")
            or "exact_source_known"
        ).strip()
    return status


def normalize_aliases(value: str) -> list[str]:
    aliases: list[str] = []
    seen: set[str] = set()
    for raw in value.replace("،", "|").split("|"):
        alias = " ".join(raw.split())
        if alias and alias.casefold() not in seen:
            aliases.append(alias)
            seen.add(alias.casefold())
    return aliases


def query_variants(row: dict[str, str]) -> tuple[list[str], list[str]]:
    name_en = " ".join(row["name_en"].split())
    name_fa = " ".join(row["name_fa"].split())
    aliases = normalize_aliases(row.get("aliases_fa", ""))
    english = [
        f'"{name_en}" Iranian food',
        f"{name_en} Persian dish",
        name_en,
    ]
    persian = [name_fa, *aliases[:3]]
    commons: list[str] = []
    openverse: list[str] = []
    for value in [*english, *persian]:
        if value and value.casefold() not in {item.casefold() for item in commons}:
            commons.append(value)
    for value in [*english[:2], name_fa]:
        if value and value.casefold() not in {item.casefold() for item in openverse}:
            openverse.append(value)
    return commons, openverse


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument(
        "--canon",
        type=Path,
        default=Path("ifkb/universal/iranian_canon_v1.csv"),
    )
    parser.add_argument(
        "--batch-assignments",
        type=Path,
        default=Path(
            "ifkb/universal/releases/iranian-bulk-source-registry-v1/"
            "iranian-batch-assignments.csv"
        ),
    )
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--release-mode", action="store_true")
    args = parser.parse_args()

    root = args.root.resolve()
    canon_path = (root / args.canon).resolve()
    batches_path = (root / args.batch_assignments).resolve()
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)

    canon_rows = read_csv(canon_path)
    if len(canon_rows) != EXPECTED_CANON_COUNT:
        raise ValueError(f"Expected {EXPECTED_CANON_COUNT} canon rows; found {len(canon_rows)}")
    canon_ids = [row["canon_id"].strip() for row in canon_rows]
    if len(set(canon_ids)) != len(canon_ids):
        raise ValueError("Canonical image-class ids are not unique.")

    batch_rows = read_csv(batches_path)
    batch_by_canon = {
        row["canonId"].strip(): row
        for row in batch_rows
        if row.get("canonId")
    }
    if set(batch_by_canon) != set(canon_ids):
        missing = sorted(set(canon_ids) - set(batch_by_canon))
        extra = sorted(set(batch_by_canon) - set(canon_ids))
        raise ValueError(f"Batch assignment coverage mismatch. missing={missing}; extra={extra}")
    batch_ids = sorted({row["batchId"] for row in batch_by_canon.values()})
    if len(batch_ids) != EXPECTED_BATCH_COUNT:
        raise ValueError(f"Expected {EXPECTED_BATCH_COUNT} image batches; found {len(batch_ids)}")

    p0_ids = collect_canon_ids(root, P0_INPUTS)
    if len(p0_ids) != EXPECTED_P0_COUNT:
        raise ValueError(
            f"Historical P0 reconstruction expected {EXPECTED_P0_COUNT} classes; "
            f"found {len(p0_ids)}"
        )

    accepted_assets, accepted_classes = collect_accepted_assets(root)
    exact_status = exact_source_status(root)
    field_capture_ids = collect_canon_ids(root, FIELD_CAPTURE_INPUTS)

    remaining = [
        row for row in canon_rows
        if row["canon_id"].strip() not in p0_ids
    ]
    readiness_weight = {
        "ds2_consensus_blocked": 3,
        "legacy_estimate": 2,
        "ds0_broad_fallback": 1,
    }
    remaining.sort(
        key=lambda row: (
            -readiness_weight.get(
                batch_by_canon[row["canon_id"].strip()].get("readinessStatus", ""),
                0,
            ),
            row["canon_id"],
        )
    )
    wave_b_ids = {row["canon_id"].strip() for row in remaining[:115]}
    wave_c_ids = {row["canon_id"].strip() for row in remaining[115:]}
    if len(wave_b_ids) != 115 or len(wave_c_ids) != 86:
        raise ValueError("Operational image-wave split is not 60/115/86.")

    ledger: list[dict[str, object]] = []
    query_rows: list[dict[str, object]] = []
    by_batch: dict[str, list[dict[str, object]]] = defaultdict(list)

    for row in canon_rows:
        canon_id = row["canon_id"].strip()
        assignment = batch_by_canon[canon_id]
        wave = (
            "IMAGE-WAVE-A"
            if canon_id in p0_ids
            else "IMAGE-WAVE-B"
            if canon_id in wave_b_ids
            else "IMAGE-WAVE-C"
        )
        if canon_id in accepted_classes:
            status = "row_level_licensed_asset_present"
        elif canon_id in exact_status:
            status = f"exact_source_{exact_status[canon_id]}"
        elif canon_id in field_capture_ids:
            status = "field_capture_required"
        elif canon_id in p0_ids:
            status = "p0_release_coverage_not_reconstructable_from_branch_rows"
        else:
            status = "not_yet_acquired"

        commons_queries, openverse_queries = query_variants(row)
        negative_terms = NEGATIVE_TERMS_BY_CATEGORY.get(
            row.get("category", ""), ("unrelated food",)
        )
        ledger_row = {
            "canonId": canon_id,
            "batchId": assignment["batchId"],
            "imageWave": wave,
            "nameFa": row["name_fa"],
            "nameEn": row["name_en"],
            "aliasesFa": row.get("aliases_fa", ""),
            "category": row.get("category", ""),
            "region": row.get("region", ""),
            "nutritionReadiness": assignment.get("readinessStatus", ""),
            "currentImageStatus": status,
            "rowLevelAcceptedAssetCount": sum(
                1 for asset in accepted_assets if asset["canonId"] == canon_id
            ),
            "exactSourceStatus": exact_status.get(canon_id, ""),
            "fieldCaptureRequired": "yes" if canon_id in field_capture_ids else "no",
            "minimumViewsPerCapturedInstance": 3,
            "internetImageNutritionGoldAllowed": "no",
            "automaticIdentityApprovalAllowed": "no",
        }
        ledger.append(ledger_row)

        query_row = {
            "canon_id": canon_id,
            "batch_id": assignment["batchId"],
            "image_wave": wave,
            "food_name_fa": row["name_fa"],
            "food_name_en": row["name_en"],
            "aliases_fa": row.get("aliases_fa", ""),
            "category": row.get("category", ""),
            "region": row.get("region", ""),
            "commons_queries_pipe": "|".join(commons_queries),
            "openverse_queries_pipe": "|".join(openverse_queries),
            "negative_terms_pipe": "|".join(negative_terms),
            "metadata_candidate_target": 8 if wave == "IMAGE-WAVE-A" else 6 if wave == "IMAGE-WAVE-B" else 4,
            "required_roles_pipe": "served_final|top_view|45_degree|side_view|regional_variant",
            "landing_page_license_verification_required": "yes",
            "visual_identity_review_required": "yes",
            "download_original_allowed_before_review": "no",
            "nutrition_gold_allowed": "no",
        }
        query_rows.append(query_row)
        by_batch[assignment["batchId"]].append(query_row)

    ledger_fields = list(ledger[0].keys())
    query_fields = list(query_rows[0].keys())
    write_csv(output / "image-class-ledger.csv", ledger, ledger_fields)
    write_csv(output / "image-query-pack.csv", query_rows, query_fields)
    for batch_id in batch_ids:
        write_csv(
            output / "batches" / f"{batch_id}.csv",
            by_batch[batch_id],
            query_fields,
        )

    release_asset_row_gap = RELEASE_LICENSED_ASSET_COUNT - len(accepted_assets)
    release_class_row_gap = RELEASE_P0_COVERED_CLASS_COUNT - len(accepted_classes)
    reconstruction_rows = [
        {
            "gapId": "IMG-RECON-001",
            "subject": "licensed_asset_rows",
            "releaseAggregateCount": RELEASE_LICENSED_ASSET_COUNT,
            "reconstructableRowCount": len(accepted_assets),
            "missingRowCount": release_asset_row_gap,
            "releaseBlocking": "yes",
            "requiredAction": "Restore every accepted asset manifest row from retained workflow artifacts before final release.",
        },
        {
            "gapId": "IMG-RECON-002",
            "subject": "covered_p0_class_rows",
            "releaseAggregateCount": RELEASE_P0_COVERED_CLASS_COUNT,
            "reconstructableRowCount": len(accepted_classes),
            "missingRowCount": release_class_row_gap,
            "releaseBlocking": "yes",
            "requiredAction": "Restore per-canon coverage rows for artifact-only Wave 2/3/retry assets.",
        },
    ]
    write_csv(
        output / "asset-ledger-reconstruction-gaps.csv",
        reconstruction_rows,
        list(reconstruction_rows[0].keys()),
    )

    status_counts = Counter(str(row["currentImageStatus"]) for row in ledger)
    wave_counts = Counter(str(row["imageWave"]) for row in ledger)
    batch_counts = Counter(str(row["batchId"]) for row in ledger)
    summary = {
        "format": "ifkb-full-image-acquisition-plan",
        "version": "1.0.0",
        "status": "stage-1-of-10-foundation",
        "canonicalClassCount": len(ledger),
        "batchCount": len(batch_ids),
        "waveCounts": dict(sorted(wave_counts.items())),
        "batchCounts": dict(sorted(batch_counts.items())),
        "p0ReconstructedClassCount": len(p0_ids),
        "rowLevelAcceptedAssetCount": len(accepted_assets),
        "rowLevelCoveredClassCount": len(accepted_classes),
        "releaseAggregateLicensedAssetCount": RELEASE_LICENSED_ASSET_COUNT,
        "releaseAggregateP0CoveredClassCount": RELEASE_P0_COVERED_CLASS_COUNT,
        "assetRowsMissingFromBranchLedger": release_asset_row_gap,
        "coveredClassRowsMissingFromBranchLedger": release_class_row_gap,
        "fieldCaptureClassCount": len(field_capture_ids),
        "statusCounts": dict(sorted(status_counts.items())),
        "queryRowCount": len(query_rows),
        "commonsQueryCount": sum(
            len(str(row["commons_queries_pipe"]).split("|")) for row in query_rows
        ),
        "openverseQueryCount": sum(
            len(str(row["openverse_queries_pipe"]).split("|")) for row in query_rows
        ),
        "internetImagesApprovedForNutritionGold": 0,
        "automaticIdentityApprovals": 0,
        "classLedgerFingerprintSha256": fingerprint(
            f"{row['canonId']}|{row['batchId']}|{row['imageWave']}|{row['currentImageStatus']}"
            for row in ledger
        ),
        "queryPackFingerprintSha256": fingerprint(
            f"{row['canon_id']}|{row['commons_queries_pipe']}|{row['openverse_queries_pipe']}"
            for row in query_rows
        ),
    }
    (output / "summary.json").write_text(canonical_json(summary), encoding="utf-8")

    if args.release_mode and (release_asset_row_gap != 0 or release_class_row_gap != 0):
        raise RuntimeError(
            "Final release mode requires complete row-level reconstruction of all "
            "58 licensed assets and all 43 covered P0 classes."
        )
    print(canonical_json(summary), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
