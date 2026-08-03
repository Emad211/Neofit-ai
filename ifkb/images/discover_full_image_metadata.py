#!/usr/bin/env python3
"""Discover openly licensed image metadata for all IFKB image classes.

No image bytes are downloaded. Search results remain candidates until landing
page licence verification and visual identity review are completed.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import random
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API = "https://api.openverse.org/v1/images/"
USER_AGENT = "IFKB-FullImageMetadataDiscovery/1.0 (+https://github.com/Emad211/Neofit-ai)"
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_OPENVERSE_LICENSES = {"cc0", "pdm", "by", "by-sa"}
WORD_RE = re.compile(r"[A-Za-z0-9\u0600-\u06FF]+")
TAG_RE = re.compile(r"<[^>]+>")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def clean_html(value: str | None) -> str:
    return " ".join(TAG_RE.sub(" ", html.unescape(value or "")).split())


def normalize(value: str) -> str:
    return " ".join(WORD_RE.findall((value or "").lower()))


def tokens(value: str) -> set[str]:
    stop = {"food", "dish", "iranian", "persian", "iran", "the", "and", "with", "of"}
    return {token for token in normalize(value).split() if len(token) > 2 and token not in stop}


def license_bucket(value: str) -> str | None:
    normalized = " ".join((value or "").upper().split())
    if any(marker in normalized for marker in ("-NC", " NC ", "-ND", " ND ")):
        return None
    if normalized.startswith("CC0") or "PUBLIC DOMAIN" in normalized or normalized == "PD":
        return "cc0_pd"
    if normalized.startswith("CC BY-SA"):
        return "cc_by_sa"
    if normalized.startswith("CC BY"):
        return "cc_by"
    return None


def request_json(url: str, attempts: int = 5) -> dict[str, Any]:
    delay = 1.5
    for attempt in range(attempts):
        request = urllib.request.Request(
            url,
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except Exception:
            if attempt == attempts - 1:
                raise
            time.sleep(delay + random.uniform(0.0, 0.5))
            delay = min(delay * 2, 20)
    raise RuntimeError("unreachable")


def meta_value(ext: dict[str, Any], key: str) -> str:
    raw = ext.get(key, {})
    return clean_html(raw.get("value", "") if isinstance(raw, dict) else str(raw))


def lexical_score(expected: str, observed: str, rank: int) -> float:
    expected_tokens = tokens(expected)
    observed_tokens = tokens(observed)
    overlap = len(expected_tokens & observed_tokens) / max(len(expected_tokens), 1)
    exact_bonus = 35 if normalize(expected) and normalize(expected) in normalize(observed) else 0
    return round(overlap * 100 + exact_bonus + max(0, 20 - rank), 2)


def search_commons(query: str, result_limit: int) -> list[dict[str, Any]]:
    params = {
        "action": "query",
        "format": "json",
        "formatversion": 2,
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": min(max(result_limit * 3, 10), 30),
        "gsrwhat": "text",
        "prop": "imageinfo|info",
        "inprop": "url",
        "iiprop": "url|size|mime|extmetadata|sha1",
    }
    payload = request_json(COMMONS_API + "?" + urllib.parse.urlencode(params))
    return payload.get("query", {}).get("pages", [])


def commons_candidates(row: dict[str, str], queries: list[str], limit: int) -> list[dict[str, object]]:
    output: list[dict[str, object]] = []
    seen: set[str] = set()
    negative = [normalize(value) for value in row["negative_terms_pipe"].split("|") if value.strip()]
    for query in queries:
        for rank, page in enumerate(search_commons(query, limit), start=1):
            info_rows = page.get("imageinfo") or []
            if not info_rows:
                continue
            info = info_rows[0]
            mime = str(info.get("mime") or "")
            width = int(info.get("width") or 0)
            height = int(info.get("height") or 0)
            if mime not in ALLOWED_MIME or min(width, height) < 500:
                continue
            ext = info.get("extmetadata") or {}
            license_name = meta_value(ext, "LicenseShortName")
            bucket = license_bucket(license_name)
            if not bucket:
                continue
            source_id = str(info.get("sha1") or page.get("pageid") or page.get("title") or "")
            if not source_id or source_id in seen:
                continue
            title = str(page.get("title") or "")
            description = meta_value(ext, "ImageDescription")
            haystack = normalize(f"{title} {description}")
            if any(term and term in haystack for term in negative):
                continue
            seen.add(source_id)
            output.append({
                "candidate_id": f"{row['canon_id']}-COMMONS-{len(output)+1:02d}",
                "canon_id": row["canon_id"],
                "batch_id": row["batch_id"],
                "image_wave": row["image_wave"],
                "food_name_fa": row["food_name_fa"],
                "food_name_en": row["food_name_en"],
                "source": "wikimedia_commons",
                "source_record_id": source_id,
                "query": query,
                "search_rank": rank,
                "title": title,
                "creator": meta_value(ext, "Artist"),
                "license": license_name,
                "license_url": meta_value(ext, "LicenseUrl"),
                "license_bucket": bucket,
                "landing_url": page.get("canonicalurl") or page.get("fullurl") or "",
                "original_url": info.get("url") or "",
                "width": width,
                "height": height,
                "mime": mime,
                "relevance_score": lexical_score(row["food_name_en"], f"{title} {description}", rank),
                "landing_page_verified": "no",
                "visual_identity_review": "pending",
                "selected_for_dataset": "no",
                "download_status": "not_downloaded",
                "nutrition_gold_allowed": "no",
            })
            if len(output) >= limit:
                return sorted(output, key=lambda item: (-float(item["relevance_score"]), int(item["search_rank"])))
    return sorted(output, key=lambda item: (-float(item["relevance_score"]), int(item["search_rank"])))


def search_openverse(query: str, result_limit: int) -> list[dict[str, Any]]:
    params = {
        "q": query,
        "license": "cc0,pdm,by,by-sa",
        "page_size": min(max(result_limit * 3, 10), 20),
        "page": 1,
    }
    payload = request_json(OPENVERSE_API + "?" + urllib.parse.urlencode(params))
    return payload.get("results", [])


def openverse_candidates(row: dict[str, str], queries: list[str], limit: int) -> list[dict[str, object]]:
    output: list[dict[str, object]] = []
    seen: set[str] = set()
    negative = [normalize(value) for value in row["negative_terms_pipe"].split("|") if value.strip()]
    for query in queries:
        for rank, item in enumerate(search_openverse(query, limit), start=1):
            source_id = str(item.get("id") or "")
            license_code = str(item.get("license") or "").lower()
            if not source_id or source_id in seen or license_code not in ALLOWED_OPENVERSE_LICENSES:
                continue
            if item.get("mature") is True:
                continue
            width = int(item.get("width") or 0)
            height = int(item.get("height") or 0)
            if width and height and min(width, height) < 500:
                continue
            landing = str(item.get("foreign_landing_url") or "")
            if not landing:
                continue
            title = str(item.get("title") or "")
            tags = " ".join(str(tag.get("name") or "") for tag in (item.get("tags") or []) if isinstance(tag, dict))
            haystack = normalize(f"{title} {tags}")
            if any(term and term in haystack for term in negative):
                continue
            seen.add(source_id)
            output.append({
                "candidate_id": f"{row['canon_id']}-OPENVERSE-{len(output)+1:02d}",
                "canon_id": row["canon_id"],
                "batch_id": row["batch_id"],
                "image_wave": row["image_wave"],
                "food_name_fa": row["food_name_fa"],
                "food_name_en": row["food_name_en"],
                "source": "openverse",
                "source_record_id": source_id,
                "query": query,
                "search_rank": rank,
                "title": title,
                "creator": str(item.get("creator") or ""),
                "license": license_code,
                "license_url": str(item.get("license_url") or ""),
                "license_bucket": "cc0_pd" if license_code in {"cc0", "pdm"} else "cc_by_sa" if license_code == "by-sa" else "cc_by",
                "landing_url": landing,
                "original_url": str(item.get("url") or ""),
                "width": width,
                "height": height,
                "mime": str(item.get("filetype") or ""),
                "relevance_score": lexical_score(row["food_name_en"], f"{title} {tags}", rank),
                "landing_page_verified": "no",
                "visual_identity_review": "pending",
                "selected_for_dataset": "no",
                "download_status": "not_downloaded",
                "nutrition_gold_allowed": "no",
            })
            if len(output) >= limit:
                return sorted(output, key=lambda value: (-float(value["relevance_score"]), int(value["search_rank"])))
    return sorted(output, key=lambda value: (-float(value["relevance_score"]), int(value["search_rank"])))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--query-pack", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--source", choices=("commons", "openverse", "both"), default="commons")
    parser.add_argument("--batch-id")
    parser.add_argument("--max-per-class", type=int, default=6)
    parser.add_argument("--max-queries-per-class", type=int, default=2)
    parser.add_argument("--sleep-seconds", type=float, default=0.35)
    args = parser.parse_args()

    if args.max_per_class < 1 or args.max_per_class > 20:
        raise ValueError("--max-per-class must be between 1 and 20")
    rows = read_csv(args.query_pack)
    if args.batch_id:
        rows = [row for row in rows if row["batch_id"] == args.batch_id]
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)

    candidates: list[dict[str, object]] = []
    summaries: list[dict[str, object]] = []
    failures: list[dict[str, object]] = []
    sources = ("commons", "openverse") if args.source == "both" else (args.source,)

    for row in rows:
        before = len(candidates)
        source_counts: Counter[str] = Counter()
        for source in sources:
            query_field = "commons_queries_pipe" if source == "commons" else "openverse_queries_pipe"
            queries = [q.strip() for q in row[query_field].split("|") if q.strip()][: args.max_queries_per_class]
            try:
                found = (
                    commons_candidates(row, queries, args.max_per_class)
                    if source == "commons"
                    else openverse_candidates(row, queries, args.max_per_class)
                )
                candidates.extend(found)
                source_counts[source] += len(found)
            except Exception as exc:
                failures.append({
                    "canon_id": row["canon_id"],
                    "batch_id": row["batch_id"],
                    "source": source,
                    "stage": "metadata_search",
                    "error": repr(exc),
                })
            time.sleep(max(args.sleep_seconds, 0.0))
        count = len(candidates) - before
        summaries.append({
            "canon_id": row["canon_id"],
            "batch_id": row["batch_id"],
            "image_wave": row["image_wave"],
            "food_name_fa": row["food_name_fa"],
            "food_name_en": row["food_name_en"],
            "candidate_count": count,
            "commons_candidate_count": source_counts["commons"],
            "openverse_candidate_count": source_counts["openverse"],
            "status": "candidates_found" if count else "no_candidate_or_source_failure",
        })

    candidate_fields = [
        "candidate_id", "canon_id", "batch_id", "image_wave", "food_name_fa", "food_name_en",
        "source", "source_record_id", "query", "search_rank", "title", "creator", "license",
        "license_url", "license_bucket", "landing_url", "original_url", "width", "height", "mime",
        "relevance_score", "landing_page_verified", "visual_identity_review", "selected_for_dataset",
        "download_status", "nutrition_gold_allowed",
    ]
    write_csv(output / "candidate-metadata.csv", candidates, candidate_fields)
    write_csv(output / "class-summary.csv", summaries, list(summaries[0].keys()) if summaries else [
        "canon_id", "batch_id", "image_wave", "food_name_fa", "food_name_en",
        "candidate_count", "commons_candidate_count", "openverse_candidate_count", "status",
    ])
    write_csv(output / "failures.csv", failures, [
        "canon_id", "batch_id", "source", "stage", "error",
    ])
    manifest = {
        "format": "ifkb-full-image-metadata-discovery",
        "version": "1.0.0",
        "sourceMode": args.source,
        "batchId": args.batch_id,
        "classCount": len(rows),
        "candidateMetadataCount": len(candidates),
        "classesWithCandidates": sum(int(row["candidate_count"]) > 0 for row in summaries),
        "classesWithoutCandidates": sum(int(row["candidate_count"]) == 0 for row in summaries),
        "failureCount": len(failures),
        "licenseBuckets": dict(sorted(Counter(str(row["license_bucket"]) for row in candidates).items())),
        "policy": {
            "imageBytesDownloaded": False,
            "landingPageVerificationRequired": True,
            "visualIdentityReviewRequired": True,
            "automaticIdentityApproval": False,
            "nutritionGoldAllowed": False,
            "allowedLicenses": ["CC0", "PDM", "CC BY", "CC BY-SA"],
            "disallowedLicenses": ["NC", "ND", "unknown"],
        },
    }
    (output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
