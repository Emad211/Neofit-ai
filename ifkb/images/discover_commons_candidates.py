#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import io
import json
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont, ImageOps

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "IFKB-ImageCandidateDiscovery/0.11 (+https://github.com/Emad211/Neofit-ai)"
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MIN_DIMENSION = 500
MAX_SEARCH_RESULTS = 30
TAG_RE = re.compile(r"<[^>]+>")
WORD_RE = re.compile(r"[A-Za-z0-9\u0600-\u06FF]+")


@dataclass(frozen=True)
class Candidate:
    canon_id: str
    food_name_fa: str
    food_name_en: str
    query_used: str
    search_rank: int
    page_id: int
    title: str
    page_url: str
    original_url: str
    candidate_url: str
    mime: str
    width: int
    height: int
    source_size_bytes: int
    commons_sha1: str
    artist: str
    credit: str
    license_short_name: str
    license_url: str
    license_bucket: str
    image_description: str
    relevance_score: float


def clean_html(value: str | None) -> str:
    text = html.unescape(value or "")
    text = TAG_RE.sub(" ", text)
    return " ".join(text.split())


def meta_value(ext: dict[str, Any], key: str) -> str:
    raw = ext.get(key, {})
    return clean_html(raw.get("value", "") if isinstance(raw, dict) else str(raw))


def normalize(text: str) -> str:
    return " ".join(WORD_RE.findall((text or "").lower()))


def tokenize(text: str) -> set[str]:
    stop = {"food", "persian", "iranian", "iran", "dish", "the", "with", "and", "of"}
    return {token for token in normalize(text).split() if len(token) > 2 and token not in stop}


def license_bucket(short_name: str) -> str | None:
    value = " ".join((short_name or "").upper().split())
    if any(flag in value for flag in ("-NC", " NC ", "-ND", " ND ")):
        return None
    if value.startswith("CC0") or "PUBLIC DOMAIN" in value or value == "PD":
        return "cc0_pd"
    if value.startswith("CC BY-SA"):
        return "cc_by_sa"
    if value.startswith("CC BY"):
        return "cc_by"
    return None


def api_request(params: dict[str, Any]) -> dict[str, Any]:
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def search_commons(query: str) -> list[dict[str, Any]]:
    payload = api_request({
        "action": "query",
        "format": "json",
        "formatversion": 2,
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": MAX_SEARCH_RESULTS,
        "gsrwhat": "text",
        "prop": "imageinfo|info",
        "inprop": "url",
        "iiprop": "url|size|mime|extmetadata|sha1",
        "iiurlwidth": 1024,
    })
    return payload.get("query", {}).get("pages", [])


def score_candidate(row: dict[str, str], query: str, title: str, description: str, rank: int) -> float:
    expected = tokenize(row["food_name_en"] + " " + query)
    observed = tokenize(title + " " + description)
    overlap = len(expected & observed) / max(len(expected), 1)
    score = overlap * 100.0 + max(0, 25 - rank)
    haystack = normalize(title + " " + description)
    for phrase in [p.strip() for p in row.get("negative_terms", "").split("|") if p.strip()]:
        phrase_n = normalize(phrase)
        if phrase_n and phrase_n in haystack:
            score -= 70
    if "iran" in haystack or "persian" in haystack:
        score += 12
    return score


def build_candidates(row: dict[str, str]) -> list[Candidate]:
    candidates: list[Candidate] = []
    seen_sha1: set[str] = set()
    seen_titles: set[str] = set()
    queries = [row["query_primary"], row.get("query_secondary", "")]
    for query in [q.strip() for q in queries if q and q.strip()]:
        pages = search_commons(query)
        for rank, page in enumerate(pages, start=1):
            title = page.get("title", "")
            title_key = title.casefold()
            if title_key in seen_titles:
                continue
            imageinfo = page.get("imageinfo") or []
            if not imageinfo:
                continue
            ii = imageinfo[0]
            mime = ii.get("mime", "")
            width = int(ii.get("width") or 0)
            height = int(ii.get("height") or 0)
            if mime not in ALLOWED_MIME or min(width, height) < MIN_DIMENSION:
                continue
            ext = ii.get("extmetadata") or {}
            license_short = meta_value(ext, "LicenseShortName")
            bucket = license_bucket(license_short)
            if bucket is None:
                continue
            sha1 = ii.get("sha1", "")
            if sha1 and sha1 in seen_sha1:
                continue
            description = meta_value(ext, "ImageDescription")
            candidates.append(Candidate(
                canon_id=row["canon_id"], food_name_fa=row["food_name_fa"],
                food_name_en=row["food_name_en"], query_used=query, search_rank=rank,
                page_id=int(page.get("pageid") or 0), title=title,
                page_url=page.get("canonicalurl") or page.get("fullurl") or "",
                original_url=ii.get("url", ""), candidate_url=ii.get("thumburl") or ii.get("url", ""),
                mime=mime, width=width, height=height, source_size_bytes=int(ii.get("size") or 0),
                commons_sha1=sha1, artist=meta_value(ext, "Artist"), credit=meta_value(ext, "Credit"),
                license_short_name=license_short, license_url=meta_value(ext, "LicenseUrl"),
                license_bucket=bucket, image_description=description,
                relevance_score=score_candidate(row, query, title, description, rank),
            ))
            seen_titles.add(title_key)
            if sha1:
                seen_sha1.add(sha1)
        time.sleep(0.2)
    candidates.sort(key=lambda item: (-item.relevance_score, item.search_rank, item.title))
    limit = max(1, min(int(row.get("candidate_limit") or 4), 6))
    return candidates[:limit]


def download_bytes(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def safe_slug(text: str) -> str:
    value = re.sub(r"[^A-Za-z0-9_-]+", "-", text).strip("-").lower()
    return value or "candidate"


def open_as_rgb(data: bytes) -> Image.Image:
    with Image.open(io.BytesIO(data)) as image:
        image.load()
        return ImageOps.exif_transpose(image).convert("RGB")


def default_font(size: int = 22) -> ImageFont.ImageFont:
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"):
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def make_class_contact_sheet(row: dict[str, str], downloaded: list[dict[str, Any]], destination: Path) -> None:
    canvas = Image.new("RGB", (1400, 980), "white")
    draw = ImageDraw.Draw(canvas)
    draw.text((30, 20), f"{row['canon_id']} | {row['food_name_en']}", fill="black", font=default_font(34))
    slots = [(30, 100), (720, 100), (30, 540), (720, 540)]
    for item, (left, top) in zip(downloaded, slots):
        image = Image.open(item["local_path"]).convert("RGB")
        preview = ImageOps.contain(image, (620, 340))
        canvas.paste(preview, (left + (620-preview.width)//2, top + (340-preview.height)//2))
        draw.text((left, top + 350), f"{item['candidate_id']} | {item['license_short_name']} | score {item['relevance_score']:.1f}"[:80], fill="black", font=default_font(22))
        draw.text((left, top + 382), item["title"][:70], fill="black", font=default_font(22))
    canvas.save(destination, quality=90, optimize=True)


def make_global_contact_sheets(class_sheets: list[tuple[dict[str, str], Path]], output_dir: Path) -> None:
    for page_no, start in enumerate(range(0, len(class_sheets), 12), start=1):
        page_items = class_sheets[start:start+12]
        canvas = Image.new("RGB", (1800, 2400), "#f4f4f4")
        draw = ImageDraw.Draw(canvas)
        draw.text((30, 18), f"IFKB P0 Candidate Review — page {page_no}", fill="black", font=default_font(32))
        for index, (row, path) in enumerate(page_items):
            col, row_idx = index % 3, index // 3
            left, top = 30 + col*590, 80 + row_idx*570
            image = Image.open(path).convert("RGB")
            thumb = ImageOps.contain(image, (550, 480))
            canvas.paste(thumb, (left + (550-thumb.width)//2, top))
            draw.text((left, top+490), f"{row['canon_id']} | {row['food_name_en']}"[:55], fill="black", font=default_font(20))
        canvas.save(output_dir / f"candidate_review_page_{page_no:02d}.jpg", quality=88, optimize=True)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader(); writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--queries", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    output = args.output
    candidates_dir, contacts_dir, global_dir = output/"candidates", output/"class_contact_sheets", output/"review_pages"
    for directory in (candidates_dir, contacts_dir, global_dir):
        directory.mkdir(parents=True, exist_ok=True)
    with args.queries.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    manifest_rows, class_rows, failures, class_sheets = [], [], [], []
    for class_index, row in enumerate(rows, start=1):
        try:
            candidates = build_candidates(row)
            downloaded = []
            class_dir = candidates_dir / row["canon_id"]
            class_dir.mkdir(parents=True, exist_ok=True)
            for candidate_index, candidate in enumerate(candidates, start=1):
                image = open_as_rgb(download_bytes(candidate.candidate_url))
                candidate_id = f"{row['canon_id']}-C{candidate_index:02d}"
                local_path = class_dir / f"{candidate_id}-{safe_slug(candidate.title.replace('File:', ''))[:70]}.jpg"
                image.save(local_path, quality=92, optimize=True)
                manifest = {**candidate.__dict__, "candidate_id": candidate_id,
                    "local_relative_path": str(local_path.relative_to(output)).replace('\\','/'),
                    "local_sha256": hashlib.sha256(local_path.read_bytes()).hexdigest(),
                    "decoded_width": image.width, "decoded_height": image.height,
                    "downloaded_size_bytes": local_path.stat().st_size,
                    "review_status": "pending_visual_review", "identity_reference_allowed": "no_until_review",
                    "nutrition_gold_allowed": "no"}
                manifest_rows.append(manifest); downloaded.append({**manifest, "local_path": local_path}); time.sleep(0.15)
            contact_path = contacts_dir / f"{row['canon_id']}.jpg"
            if downloaded:
                make_class_contact_sheet(row, downloaded, contact_path); class_sheets.append((row, contact_path))
            class_rows.append({"canon_id": row["canon_id"], "food_name_fa": row["food_name_fa"], "food_name_en": row["food_name_en"],
                "category": row["category"], "query_primary": row["query_primary"], "query_secondary": row["query_secondary"],
                "candidate_count": len(downloaded), "contact_sheet": str(contact_path.relative_to(output)).replace('\\','/') if downloaded else "",
                "discovery_status": "candidates_ready" if downloaded else "no_compatible_candidate"})
        except Exception as exc:
            failures.append({"canon_id": row["canon_id"], "food_name_fa": row["food_name_fa"], "food_name_en": row["food_name_en"], "error_type": type(exc).__name__, "error": str(exc)})
            class_rows.append({"canon_id": row["canon_id"], "food_name_fa": row["food_name_fa"], "food_name_en": row["food_name_en"], "category": row["category"], "query_primary": row["query_primary"], "query_secondary": row["query_secondary"], "candidate_count": 0, "contact_sheet": "", "discovery_status": "error"})
        print(f"[{class_index}/{len(rows)}] {row['canon_id']}: {class_rows[-1]['candidate_count']} candidates", flush=True)
    make_global_contact_sheets(class_sheets, global_dir)
    manifest_fields = ["candidate_id","canon_id","food_name_fa","food_name_en","query_used","search_rank","page_id","title","page_url","original_url","candidate_url","mime","width","height","source_size_bytes","commons_sha1","artist","credit","license_short_name","license_url","license_bucket","image_description","relevance_score","local_relative_path","local_sha256","decoded_width","decoded_height","downloaded_size_bytes","review_status","identity_reference_allowed","nutrition_gold_allowed"]
    write_csv(output/"candidate_manifest.csv", manifest_fields, manifest_rows)
    write_csv(output/"class_summary.csv", ["canon_id","food_name_fa","food_name_en","category","query_primary","query_secondary","candidate_count","contact_sheet","discovery_status"], class_rows)
    write_csv(output/"query_failures.csv", ["canon_id","food_name_fa","food_name_en","error_type","error"], failures)
    lines = ["# IFKB Wikimedia Commons Candidate Attribution", ""]
    for item in manifest_rows:
        lines += [f"## {item['candidate_id']} — {item['food_name_en']}", f"- File: {item['title']}", f"- Author: {item['artist'] or item['credit'] or 'Not stated'}", f"- Licence: {item['license_short_name']}", f"- Licence URL: {item['license_url']}", f"- Commons page: {item['page_url']}", f"- Local SHA-256: `{item['local_sha256']}`", "- Status: candidate only; not approved until visual review.", ""]
    (output/"ATTRIBUTION.md").write_text("\n".join(lines), encoding="utf-8")
    counts = {}
    for item in manifest_rows: counts[item["license_bucket"]] = counts.get(item["license_bucket"], 0) + 1
    dataset_manifest = {"format":"ifkb-wikimedia-candidate-discovery","version":"0.11.0","classesRequested":len(rows),"classesWithCandidates":sum(int(r["candidate_count"])>0 for r in class_rows),"candidateImages":len(manifest_rows),"queryFailures":len(failures),"licenseBuckets":counts,"policy":{"automaticClassApproval":False,"nutritionGoldAllowed":False,"acceptedSources":["Wikimedia Commons"],"candidateDownloadsAreThumbnails":True,"originalUrlRetained":True}}
    (output/"dataset_manifest.json").write_text(json.dumps(dataset_manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(dataset_manifest, ensure_ascii=False, indent=2))
    return 0 if manifest_rows else 2


if __name__ == "__main__":
    raise SystemExit(main())
