#!/usr/bin/env python3
"""Download a fail-closed, licence-audited IFKB pilot image set from Wikimedia Commons."""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import mimetypes
import re
import sys
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen

from PIL import Image, ImageOps

API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "IFKB-Research/0.10 (Iranian food knowledge base; github.com/Emad211/Neofit-ai)"
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MIN_DIMENSION = 500


def http_bytes(url: str, *, retries: int = 2, timeout: int = 30) -> bytes:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "image/avif,image/webp,image/png,image/jpeg,application/json,*/*;q=0.8",
                },
            )
            with urlopen(request, timeout=timeout) as response:
                return response.read()
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            if attempt + 1 == retries:
                break
            time.sleep(2 ** attempt)
    raise RuntimeError(f"download failed after {retries} attempts: {url}: {last_error}")


def api_json(params: dict[str, str]) -> dict[str, Any]:
    query = urlencode(params)
    return json.loads(http_bytes(f"{API_URL}?{query}", retries=3, timeout=30).decode("utf-8"))


def plain_text(value: str | None) -> str:
    text = html.unescape(value or "")
    text = re.sub(r"<br\s*/?>", " | ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return " ".join(text.split())


def normalize_license(value: str) -> str:
    text = plain_text(value).upper().replace("CREATIVE COMMONS", "CC")
    text = re.sub(r"[^A-Z0-9]+", " ", text)
    return " ".join(text.split())


def license_matches(expected: str, actual: str) -> bool:
    e = normalize_license(expected)
    a = normalize_license(actual)
    if e.startswith("CC0") and a.startswith("CC0"):
        return True
    return e == a


def license_bucket(license_name: str) -> str:
    name = normalize_license(license_name)
    if name.startswith("CC0") or "PUBLIC DOMAIN" in name:
        return "cc0_pd"
    if "CC BY SA" in name:
        return "cc_by_sa"
    if name.startswith("CC BY"):
        return "cc_by"
    raise RuntimeError(f"licence is outside approved buckets: {license_name}")


def commons_page_url(file_title: str) -> str:
    return "https://commons.wikimedia.org/wiki/File:" + quote(file_title.replace(" ", "_"), safe="_().-~")


def resolve_commons_file(file_title: str) -> dict[str, Any]:
    payload = api_json({
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "titles": f"File:{file_title}",
        "prop": "imageinfo",
        "iiprop": "url|size|sha1|mime|extmetadata",
        "iiurlwidth": "1600",
    })
    pages = payload.get("query", {}).get("pages", [])
    if len(pages) != 1 or pages[0].get("missing") is True:
        raise RuntimeError(f"Commons file page not found: {file_title}")
    infos = pages[0].get("imageinfo") or []
    if len(infos) != 1:
        raise RuntimeError(f"imageinfo missing or ambiguous: {file_title}")
    info = infos[0]
    metadata = {key: value.get("value", "") for key, value in (info.get("extmetadata") or {}).items()}
    return {
        "canonical_title": pages[0].get("title", f"File:{file_title}"),
        "original_url": info["url"],
        "thumb_url": info.get("thumburl", ""),
        "description_url": info.get("descriptionurl") or commons_page_url(file_title),
        "mime": info.get("mime", ""),
        "width": int(info.get("width") or 0),
        "height": int(info.get("height") or 0),
        "size_bytes": int(info.get("size") or 0),
        "commons_sha1": info.get("sha1", ""),
        "license_short_name": plain_text(metadata.get("LicenseShortName")),
        "license_url": plain_text(metadata.get("LicenseUrl")),
        "artist": plain_text(metadata.get("Artist")),
        "credit": plain_text(metadata.get("Credit")),
        "description": plain_text(metadata.get("ImageDescription")),
        "date_time_original": plain_text(metadata.get("DateTimeOriginal")),
        "attribution_required": plain_text(metadata.get("AttributionRequired")),
        "usage_terms": plain_text(metadata.get("UsageTerms")),
    }


def extension_for(url: str, mime: str) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    guessed = mimetypes.guess_extension(mime) or ".bin"
    return ".jpg" if guessed == ".jpe" else guessed


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def acquire(manifest_path: Path, output_dir: Path) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    with manifest_path.open("r", encoding="utf-8-sig", newline="") as handle:
        entries = list(csv.DictReader(handle))
    if not entries:
        raise RuntimeError("manifest is empty")

    resolved_rows: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    attributions: list[str] = ["# IFKB Pilot Image Attributions", ""]

    for entry in entries:
        seed_id = entry["seed_image_id"].strip()
        try:
            if entry.get("identity_review") != "approved":
                raise RuntimeError("identity_review must be approved")
            info = resolve_commons_file(entry["commons_file_title"].strip())
            if info["mime"] not in ALLOWED_MIME:
                raise RuntimeError(f"unsupported MIME type: {info['mime']}")
            if min(info["width"], info["height"]) < MIN_DIMENSION:
                raise RuntimeError(f"source image smaller than {MIN_DIMENSION}px on one axis")
            if not license_matches(entry["expected_license"], info["license_short_name"]):
                raise RuntimeError(
                    f"licence mismatch; expected {entry['expected_license']!r}, got {info['license_short_name']!r}"
                )
            bucket = license_bucket(info["license_short_name"])

            download_url = info["original_url"]
            download_variant = "original"
            try:
                raw = http_bytes(download_url, retries=2, timeout=30)
            except RuntimeError as original_error:
                if not info.get("thumb_url"):
                    raise original_error
                download_url = info["thumb_url"]
                download_variant = "commons_1600px_thumbnail_fallback"
                raw = http_bytes(download_url, retries=3, timeout=30)

            local_sha256 = hashlib.sha256(raw).hexdigest()
            extension = extension_for(download_url, info["mime"])
            file_rel = Path("images") / bucket / entry["canon_id"] / f"{seed_id}{extension}"
            file_path = output_dir / file_rel
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_bytes(raw)

            with Image.open(file_path) as image:
                image = ImageOps.exif_transpose(image)
                actual_width, actual_height = image.size
                if min(actual_width, actual_height) < MIN_DIMENSION:
                    raise RuntimeError("decoded image is below minimum dimension")
                preview = image.convert("RGB")
                preview.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                preview_rel = Path("previews") / entry["canon_id"] / f"{seed_id}.jpg"
                preview_path = output_dir / preview_rel
                preview_path.parent.mkdir(parents=True, exist_ok=True)
                preview.save(preview_path, "JPEG", quality=88, optimize=True)

            attribution = info["artist"] or info["credit"] or "Wikimedia Commons contributor"
            attribution_text = (
                f"{entry['food_name_en']} — {attribution}; {info['license_short_name']}; "
                f"{info['description_url']}"
            )
            row = {
                **entry,
                **info,
                "license_bucket": bucket,
                "download_url_used": download_url,
                "download_variant": download_variant,
                "image_relative_path": str(file_rel).replace("\\", "/"),
                "preview_relative_path": str(preview_rel).replace("\\", "/"),
                "downloaded_size_bytes": len(raw),
                "local_sha256": local_sha256,
                "decoded_width": actual_width,
                "decoded_height": actual_height,
                "attribution_text": attribution_text,
                "dataset_use_status": "identity_reference_only_not_nutrition_gold",
                "download_status": "downloaded_verified",
            }
            resolved_rows.append(row)
            attributions.extend([f"## {seed_id} — {entry['food_name_fa']}", "", attribution_text, ""])
            print(f"OK {seed_id}: {entry['commons_file_title']} ({download_variant})", flush=True)
            time.sleep(0.2)
        except Exception as exc:
            failures.append({
                "seed_image_id": seed_id,
                "canon_id": entry.get("canon_id", ""),
                "commons_file_title": entry.get("commons_file_title", ""),
                "error": str(exc),
            })
            print(f"FAILED {seed_id}: {exc}", file=sys.stderr, flush=True)

    if resolved_rows:
        write_csv(output_dir / "resolved_manifest.csv", resolved_rows, list(resolved_rows[0].keys()))
    write_csv(output_dir / "failures.csv", failures, ["seed_image_id", "canon_id", "commons_file_title", "error"])
    (output_dir / "ATTRIBUTION.md").write_text("\n".join(attributions), encoding="utf-8")
    dataset_manifest = {
        "format": "ifkb-internet-image-seed",
        "version": "0.10.1",
        "source": "Wikimedia Commons API",
        "requested": len(entries),
        "downloaded": len(resolved_rows),
        "failed": len(failures),
        "licenceBuckets": sorted({row["license_bucket"] for row in resolved_rows}),
        "downloadVariants": sorted({row["download_variant"] for row in resolved_rows}),
        "nutritionGoldRecords": 0,
        "policy": [
            "Internet images are identity/retrieval references only.",
            "No image is nutrition gold without measured weight and a linked locked recipe.",
            "CC BY and CC BY-SA attribution must travel with all copies and derivatives.",
            "CC BY-SA assets remain partitioned from CC0/CC BY assets.",
        ],
    }
    (output_dir / "dataset_manifest.json").write_text(
        json.dumps(dataset_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    if failures or len(resolved_rows) != len(entries):
        raise RuntimeError(f"acquisition incomplete: {len(resolved_rows)}/{len(entries)} downloaded")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    return acquire(args.manifest, args.output)


if __name__ == "__main__":
    raise SystemExit(main())
