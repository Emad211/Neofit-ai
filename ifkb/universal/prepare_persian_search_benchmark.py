#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import sqlite3
from pathlib import Path


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))


def sanitize_fts_query(value: str) -> str:
    tokens = re.sub(r'[^a-z0-9\s]', ' ', value.lower()).split()[:10]
    return ' AND '.join(f'"{token.replace(chr(34), chr(34) * 2)}"' for token in tokens)


def target_variants(target: str) -> set[str]:
    values = {target.strip()}
    lower = target.lower()
    if 'egg' not in lower or 'white' not in lower:
        values.add('egg, white')
    if not re.search(r'\b(boiled|poached)\b', lower):
        values.add(f'{target}, boiled')
    if not re.search(r'\bfried\b', lower):
        values.add(f'{target}, fried')
    if not re.search(r'\bgrilled\b', lower):
        values.add(f'{target}, grilled')
    if not re.search(r'(?:no|without) added fat', lower):
        values.add(f'{target}, no added fat')
    return {value.strip() for value in values if value.strip()}


def query_candidates(db: sqlite3.Connection, target: str) -> list[dict[str, object]]:
    fts = sanitize_fts_query(target)
    if not fts:
        return []
    rows = db.execute(
        '''SELECT f.id,f.source_type,f.name_en,f.calories_kcal,f.protein_g,f.fat_g,f.carbs_g,
                  f.fiber_g,f.sugars_g,f.sodium_mg,f.cholesterol_mg,f.calcium_mg,f.iron_mg,
                  f.potassium_mg,f.vitamin_c_mg,f.macro_completeness,f.portion_count,
                  bm25(generic_food_search) AS bm25_score
           FROM generic_food_search s
           JOIN generic_foods f ON f.id=s.id
           WHERE generic_food_search MATCH ?
           LIMIT 100''',
        (fts,),
    ).fetchall()
    keys = [
        'id', 'sourceType', 'nameEn', 'caloriesKcal', 'proteinG', 'fatG', 'carbsG',
        'fiberG', 'sugarsG', 'sodiumMg', 'cholesterolMg', 'calciumMg', 'ironMg',
        'potassiumMg', 'vitaminCMg', 'macroComplete', 'portionCount', 'bm25',
    ]
    result: list[dict[str, object]] = []
    for row in rows:
        value = dict(zip(keys, row))
        value['macroComplete'] = value['macroComplete'] == 1
        result.append(value)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--database', type=Path, required=True)
    parser.add_argument('--aliases', type=Path, required=True)
    parser.add_argument('--benchmark', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()

    aliases = read_csv(args.aliases)
    cases = read_csv(args.benchmark)
    generic_targets = sorted({
        variant
        for row in aliases
        if row['target_type'] == 'generic'
        for variant in target_variants(row['target'])
    })

    db = sqlite3.connect(args.database)
    try:
        candidates = {target: query_candidates(db, target) for target in generic_targets}
        canon_ids = {row[0] for row in db.execute('SELECT canon_id FROM iranian_canon')}
        integrity = db.execute('PRAGMA integrity_check').fetchone()[0]
    finally:
        db.close()
    if integrity != 'ok':
        raise RuntimeError(f'Catalog integrity check failed: {integrity}')

    payload = {
        'format': 'ifkb-persian-search-benchmark-input',
        'aliases': [
            {
                'aliasFa': row['alias_fa'],
                'target': row['target'],
                'targetType': row['target_type'],
            }
            for row in aliases
        ],
        'cases': [
            {
                'queryId': row['query_id'],
                'query': row['query'],
                'canonicalAlias': row['canonical_alias'],
                'targetType': row['target_type'],
                'expectedTargets': row['expected_targets'].split('|'),
                'variantType': row['variant_type'],
            }
            for row in cases
        ],
        'candidatesByTarget': candidates,
        'iranianCanonIds': sorted(canon_ids),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
    empty = [target for target, values in candidates.items() if not values]
    print({
        'cases': len(cases),
        'aliases': len(aliases),
        'candidate_targets': len(candidates),
        'empty_candidate_targets': len(empty),
    })
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
