#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from copy import deepcopy
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable


class JsonLdParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_jsonld = False
        self.buffer: list[str] = []
        self.blocks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != 'script':
            return
        attributes = {key.lower(): (value or '').lower() for key, value in attrs}
        if 'ld+json' in attributes.get('type', ''):
            self.in_jsonld = True
            self.buffer = []

    def handle_data(self, data: str) -> None:
        if self.in_jsonld:
            self.buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == 'script' and self.in_jsonld:
            value = ''.join(self.buffer).strip()
            if value:
                self.blocks.append(value)
            self.in_jsonld = False
            self.buffer = []


def fetch_html(url: str, attempts: int = 3) -> str:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    'User-Agent': 'NeoFit-IFKB-structured-facts/1.0 (+JSON-LD research extraction; no recipe prose redistribution)',
                    'Accept': 'text/html,application/xhtml+xml',
                },
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = response.read(4 * 1024 * 1024 + 1)
                if len(payload) > 4 * 1024 * 1024:
                    raise ValueError('recipe page exceeded 4 MiB safety limit')
                return payload.decode(response.headers.get_content_charset() or 'utf-8', errors='replace')
        except Exception as exc:
            last_error = exc
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)
    raise RuntimeError(f'could not fetch {url}: {last_error}')


def iter_objects(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for nested in value.values():
            yield from iter_objects(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from iter_objects(nested)


def is_recipe(value: dict[str, Any]) -> bool:
    kind = value.get('@type')
    if isinstance(kind, str):
        return kind.lower() == 'recipe'
    if isinstance(kind, list):
        return any(str(item).lower() == 'recipe' for item in kind)
    return False


def parse_recipe_jsonld(page_html: str) -> dict[str, Any] | None:
    parser = JsonLdParser()
    parser.feed(page_html)
    recipes: list[dict[str, Any]] = []
    for block in parser.blocks:
        try:
            value = json.loads(block)
        except json.JSONDecodeError:
            continue
        recipes.extend(obj for obj in iter_objects(value) if is_recipe(obj))
    if not recipes:
        return None
    return max(recipes, key=lambda item: len(item.get('recipeIngredient', [])) if isinstance(item.get('recipeIngredient'), list) else 0)


def author_name(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    if isinstance(value, dict):
        name = value.get('name')
        return name.strip() if isinstance(name, str) and name.strip() else None
    if isinstance(value, list):
        names = [author_name(item) for item in value]
        clean = [name for name in names if name]
        return ' | '.join(clean) if clean else None
    return None


def parse_servings(value: Any) -> float | None:
    values = value if isinstance(value, list) else [value]
    for item in values:
        if isinstance(item, (int, float)) and not isinstance(item, bool) and item > 0:
            return float(item)
        if isinstance(item, str):
            match = re.search(r'(?<!\d)(\d+(?:\.\d+)?)', item)
            if match and float(match.group(1)) > 0:
                return float(match.group(1))
    return None


def extract_one(record: dict[str, Any], page_html: str | None = None) -> tuple[dict[str, Any], str | None]:
    updated = deepcopy(record)
    try:
        html_text = page_html if page_html is not None else fetch_html(str(record['sourceUrl']))
        recipe = parse_recipe_jsonld(html_text)
        if recipe is None:
            return updated, 'no Recipe JSON-LD object found'
        raw_ingredients = recipe.get('recipeIngredient')
        ingredients = [item.strip() for item in raw_ingredients if isinstance(item, str) and item.strip()] if isinstance(raw_ingredients, list) else []
        if not ingredients:
            return updated, 'Recipe JSON-LD contained no recipeIngredient strings'
        updated['candidateTitle'] = str(recipe.get('name') or updated['candidateTitle']).strip()
        updated['publisher'] = author_name(recipe.get('author')) or urllib.parse.urlparse(str(record['sourceUrl'])).netloc
        updated['accessedAt'] = datetime.now(timezone.utc).isoformat()
        updated['declaredServings'] = parse_servings(recipe.get('recipeYield'))
        updated['structuredFactsExtracted'] = True
        updated['ingredients'] = [
            {
                'sourceLabel': item,
                'amount': None,
                'unit': None,
                'grams': None,
                'state': None,
                'ingredientId': None,
                'mappingStatus': 'unmapped',
            }
            for item in ingredients
        ]
        updated['rawRecipeTextStored'] = False
        updated['nutritionValuesAllowed'] = False
        updated['promotionEligible'] = False
        updated['notes'] = 'Structured Recipe JSON-LD name, yield and ingredient labels extracted; instructions and nutrition were not stored.'
        return updated, None
    except Exception as exc:
        return updated, str(exc)


def extract_records(records: list[dict[str, Any]], max_records: int, workers: int = 2) -> dict:
    selected = records[:max_records]
    extracted: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    with ThreadPoolExecutor(max_workers=max(1, min(workers, 4))) as executor:
        futures = {executor.submit(extract_one, record): record for record in selected}
        for future in as_completed(futures):
            record = futures[future]
            updated, error = future.result()
            extracted.append(updated)
            if error:
                failures.append({'recordId': str(record['recordId']), 'canonId': str(record['canonId']), 'sourceUrl': str(record['sourceUrl']), 'error': error})
    extracted.sort(key=lambda record: (str(record['canonId']), -float(record['matchScore']), str(record['sourceUrl'])))
    summary = {
        'format': 'ifkb-structured-recipe-fact-extraction-summary',
        'version': '1.0.0',
        'inputRecordCount': len(records),
        'attemptedRecordCount': len(selected),
        'structuredFactsExtractedCount': sum(bool(record['structuredFactsExtracted']) for record in extracted),
        'foodsWithStructuredFacts': len({str(record['canonId']) for record in extracted if record['structuredFactsExtracted']}),
        'ingredientLabelCount': sum(len(record['ingredients']) for record in extracted),
        'failureCount': len(failures),
        'rawRecipeTextStoredCount': 0,
        'approvedNutritionUseCount': 0,
        'promotionEligibleCount': 0,
        'policy': 'Only Recipe JSON-LD name, yield and ingredient labels are retained. Instructions, images and nutrition are excluded.',
    }
    return {'summary': summary, 'records': extracted, 'failures': failures}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--records', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--max-records', type=int, default=200)
    parser.add_argument('--workers', type=int, default=2)
    args = parser.parse_args()
    records = json.loads(args.records.read_text(encoding='utf-8'))
    if not isinstance(records, list):
        raise ValueError('source fact records must be a JSON array')
    result = extract_records(records, args.max_records, args.workers)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / 'summary.json').write_text(json.dumps(result['summary'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (args.output_dir / 'source-fact-records.extracted.json').write_text(json.dumps(result['records'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    headers = ['recordId', 'canonId', 'sourceUrl', 'error']
    with (args.output_dir / 'failures.csv').open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(result['failures'])
    print(json.dumps(result['summary'], ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
