#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

STOPWORDS = {
    'persian', 'iranian', 'recipe', 'food', 'with', 'and', 'the', 'a', 'an', 'of',
    'stew', 'rice', 'soup', 'bread', 'dessert', 'drink', 'grilled',
}


def normalize_fa(value: str) -> str:
    value = unicodedata.normalize('NFKC', value).lower()
    value = value.translate(str.maketrans({'ي': 'ی', 'ى': 'ی', 'ك': 'ک', 'ۀ': 'ه', 'ة': 'ه', 'ؤ': 'و', 'إ': 'ا', 'أ': 'ا'}))
    value = re.sub(r'[َُِّْٰـ\u200c\u200f\u202a-\u202e]', ' ', value)
    value = re.sub(r'[^\w\u0600-\u06ff\s]', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def normalize_en(value: str) -> str:
    value = unicodedata.normalize('NFKC', value).lower()
    value = re.sub(r'[^a-z0-9\s]', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def english_tokens(value: str) -> set[str]:
    return {token for token in normalize_en(value).split() if len(token) >= 3 and token not in STOPWORDS}


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.current_href: str | None = None
        self.current_text: list[str] = []
        self.links: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != 'a' or self.current_href is not None:
            return
        attributes = dict(attrs)
        href = attributes.get('href')
        if href:
            self.current_href = href
            self.current_text = []

    def handle_data(self, data: str) -> None:
        if self.current_href is not None:
            self.current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == 'a' and self.current_href is not None:
            text = html.unescape(' '.join(self.current_text))
            text = re.sub(r'\s+', ' ', text).strip()
            if text:
                self.links.append((self.current_href, text))
            self.current_href = None
            self.current_text = []


def fetch_html(url: str, attempts: int = 3) -> str:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    'User-Agent': 'NeoFit-IFKB-source-discovery/1.0 (+research URL matching; no recipe-content redistribution)',
                    'Accept': 'text/html,application/xhtml+xml',
                },
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                content_type = response.headers.get_content_type()
                if content_type not in {'text/html', 'application/xhtml+xml'}:
                    raise ValueError(f'unsupported content type: {content_type}')
                payload = response.read(5 * 1024 * 1024 + 1)
                if len(payload) > 5 * 1024 * 1024:
                    raise ValueError('recipe index exceeded 5 MiB safety limit')
                return payload.decode(response.headers.get_content_charset() or 'utf-8', errors='replace')
        except Exception as exc:  # network failure is reported to the workflow
            last_error = exc
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)
    raise RuntimeError(f'could not fetch recipe index after {attempts} attempts: {last_error}')


def is_recipe_link(base_url: str, href: str) -> bool:
    absolute = urllib.parse.urljoin(base_url, href)
    base = urllib.parse.urlparse(base_url)
    parsed = urllib.parse.urlparse(absolute)
    if parsed.scheme not in {'http', 'https'} or parsed.netloc.lower() != base.netloc.lower():
        return False
    path = parsed.path.rstrip('/')
    if not path or path in {'/recipe-index', '/all-recipes'}:
        return False
    if any(segment in path for segment in ('/category/', '/tag/', '/author/', '/paged-', '/page/')):
        return False
    return len([segment for segment in path.split('/') if segment]) == 1


def extract_recipe_links(index_html: str, base_url: str) -> list[dict[str, str]]:
    parser = LinkParser()
    parser.feed(index_html)
    deduplicated: dict[str, dict[str, str]] = {}
    for href, title in parser.links:
        if not is_recipe_link(base_url, href):
            continue
        url = urllib.parse.urljoin(base_url, href).split('#', 1)[0]
        existing = deduplicated.get(url)
        if existing is None or len(title) > len(existing['title']):
            deduplicated[url] = {'url': url, 'title': title}
    return sorted(deduplicated.values(), key=lambda row: (row['title'].lower(), row['url']))


def read_canon(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))


def score_match(food: dict[str, str], link: dict[str, str]) -> tuple[float, str]:
    title = link['title']
    title_fa = normalize_fa(title)
    title_en = normalize_en(title)
    primary_fa = normalize_fa(food.get('name_fa', ''))
    aliases = [normalize_fa(value) for value in food.get('aliases_fa', '').split('|') if normalize_fa(value)]
    primary_en = normalize_en(food.get('name_en', ''))
    if primary_fa and primary_fa in title_fa:
        return 1000.0, 'primary_fa_phrase'
    for alias in aliases:
        if alias in title_fa:
            return 950.0, 'alias_fa_phrase'
    if primary_en and primary_en in title_en:
        return 900.0, 'primary_en_phrase'
    query_tokens = english_tokens(primary_en)
    title_tokens = english_tokens(title_en)
    if query_tokens:
        coverage = len(query_tokens & title_tokens) / len(query_tokens)
        if coverage >= 0.5:
            return round(400 + coverage * 400, 2), f'english_token_coverage:{coverage:.2f}'
    return 0.0, 'no_match'


def build_matches(canon_rows: list[dict[str, str]], links: list[dict[str, str]], source_collection_id: str) -> dict:
    candidates: list[dict[str, object]] = []
    foods_with_candidates: set[str] = set()
    foods_with_strong_candidates: set[str] = set()
    for food in canon_rows:
        ranked: list[dict[str, object]] = []
        for link in links:
            score, reason = score_match(food, link)
            if score < 600:
                continue
            ranked.append({
                'canonId': food['canon_id'],
                'nameFa': food['name_fa'],
                'nameEn': food['name_en'],
                'sourceCollectionId': source_collection_id,
                'candidateTitle': link['title'],
                'candidateUrl': link['url'],
                'matchScore': score,
                'matchReason': reason,
                'candidateStatus': 'strong_candidate' if score >= 900 else 'review_candidate',
                'exactFoodMatchApproved': False,
                'structuredFactsExtracted': False,
                'independenceGroupApproved': False,
                'nutritionUseAllowed': False,
                'reviewStatus': 'unreviewed',
            })
        ranked.sort(key=lambda row: (-float(row['matchScore']), str(row['candidateTitle'])))
        ranked = ranked[:5]
        candidates.extend(ranked)
        if ranked:
            foods_with_candidates.add(food['canon_id'])
        if any(float(row['matchScore']) >= 900 for row in ranked):
            foods_with_strong_candidates.add(food['canon_id'])
    return {
        'format': 'ifkb-recipe-index-candidate-discovery',
        'version': '1.0.0',
        'canonicalFoodCount': len(canon_rows),
        'recipeLinkCount': len(links),
        'candidateCount': len(candidates),
        'foodsWithCandidates': len(foods_with_candidates),
        'foodsWithStrongCandidates': len(foods_with_strong_candidates),
        'approvedExactMatchCount': 0,
        'approvedNutritionUseCount': 0,
        'policy': 'Only title and URL candidates are retained. Recipe prose, images, ingredient quantities and nutrition are not copied or approved.',
        'candidates': candidates,
    }


def write_csv(path: Path, candidates: list[dict[str, object]]) -> None:
    headers = list(candidates[0].keys()) if candidates else [
        'canonId', 'nameFa', 'nameEn', 'sourceCollectionId', 'candidateTitle', 'candidateUrl',
        'matchScore', 'matchReason', 'candidateStatus', 'exactFoodMatchApproved',
        'structuredFactsExtracted', 'independenceGroupApproved', 'nutritionUseAllowed', 'reviewStatus',
    ]
    with path.open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(candidates)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--canon', type=Path, required=True)
    parser.add_argument('--index-url', required=True)
    parser.add_argument('--source-collection-id', required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--html-fixture', type=Path)
    args = parser.parse_args()
    index_html = args.html_fixture.read_text(encoding='utf-8') if args.html_fixture else fetch_html(args.index_url)
    links = extract_recipe_links(index_html, args.index_url)
    result = build_matches(read_canon(args.canon), links, args.source_collection_id)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / 'summary.json').write_text(
        json.dumps({key: value for key, value in result.items() if key != 'candidates'}, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    (args.output_dir / 'recipe-link-index.json').write_text(json.dumps(links, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    write_csv(args.output_dir / 'candidate-matches.csv', result['candidates'])
    print(json.dumps({key: value for key, value in result.items() if key != 'candidates'}, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
