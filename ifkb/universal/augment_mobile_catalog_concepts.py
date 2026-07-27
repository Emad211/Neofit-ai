#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import Counter
from pathlib import Path

COOKING_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ('raw', re.compile(r'\b(raw|uncooked|fresh)\b', re.I)),
    ('boiled', re.compile(r'\b(boiled|poached|simmered)\b', re.I)),
    ('fried', re.compile(r'\b(fried|deep fried|pan fried|stir fried|breaded)\b', re.I)),
    ('grilled', re.compile(r'\b(grilled|charbroiled|barbecued|barbequed)\b', re.I)),
    ('roasted', re.compile(r'\b(roasted|roast)\b', re.I)),
    ('baked', re.compile(r'\b(baked|oven baked)\b', re.I)),
    ('broiled', re.compile(r'\bbroiled\b', re.I)),
    ('steamed', re.compile(r'\bsteamed\b', re.I)),
    ('stewed', re.compile(r'\b(stewed|braised)\b', re.I)),
    ('smoked', re.compile(r'\bsmoked\b', re.I)),
    ('dried', re.compile(r'\b(dried|dehydrated|powdered|powder)\b', re.I)),
    ('frozen', re.compile(r'\bfrozen\b', re.I)),
    ('canned', re.compile(r'\b(canned|packed in)\b', re.I)),
    ('cooked', re.compile(r'\bcooked\b', re.I)),
)
FORM_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ('skinless', re.compile(r'\b(skinless|without skin|skin removed)\b', re.I)),
    ('with_skin', re.compile(r'\b(with skin|skin eaten)\b', re.I)),
    ('boneless', re.compile(r'\b(boneless|bone removed)\b', re.I)),
    ('meat_only', re.compile(r'\b(meat only|lean only|separable lean only)\b', re.I)),
    ('lean_and_fat', re.compile(r'\b(lean and fat|separable lean and fat)\b', re.I)),
    ('peeled', re.compile(r'\b(peeled|without peel|without skin)\b', re.I)),
    ('drained', re.compile(r'\bdrained\b', re.I)),
    ('mashed', re.compile(r'\b(mashed|pureed|purée|pulp)\b', re.I)),
    ('chopped', re.compile(r'\b(chopped|diced|sliced|shredded|grated|minced)\b', re.I)),
    ('juice', re.compile(r'\bjuice\b', re.I)),
    ('concentrate', re.compile(r'\bconcentrate\b', re.I)),
)
FAT_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ('no_added_fat', re.compile(r'\b(no|without) added (fat|oil|butter|margarine)\b', re.I)),
    ('with_oil', re.compile(r'\b(with|in) (oil|vegetable oil)\b', re.I)),
    ('with_butter', re.compile(r'\bwith butter\b', re.I)),
    ('with_margarine', re.compile(r'\bwith margarine\b', re.I)),
    ('added_fat_unspecified', re.compile(r'\b(with|fat) added\b', re.I)),
)
VARIANT_FORM_PATTERNS = tuple(
    pattern for name, pattern in FORM_PATTERNS if name not in {'juice', 'concentrate'}
)
VARIANT_SEGMENT_PATTERNS = tuple(
    pattern for _, pattern in (*COOKING_PATTERNS, *FAT_PATTERNS)
) + VARIANT_FORM_PATTERNS


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def normalized_key(value: str) -> str:
    value = unicodedata.normalize('NFKC', value).lower()
    value = re.sub(r'[^a-z0-9]+', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def tags(value: str, patterns: tuple[tuple[str, re.Pattern[str]], ...]) -> list[str]:
    return [name for name, pattern in patterns if pattern.search(value)]


def segment_is_variant(segment: str) -> bool:
    return any(pattern.search(segment) for pattern in VARIANT_SEGMENT_PATTERNS)


def parse_description(name: str) -> dict[str, object]:
    segments = [segment.strip() for segment in name.split(',') if segment.strip()]
    cooking = tags(name, COOKING_PATTERNS)
    forms = tags(name, FORM_PATTERNS)
    fat = tags(name, FAT_PATTERNS)
    if len(segments) < 2:
        return {
            'concept_name': name.strip(),
            'concept_key': normalized_key(name),
            'mapping_policy': 'identity_preserving_exact',
            'cooking_tags': cooking,
            'form_tags': forms,
            'fat_tags': fat,
        }

    split_index: int | None = None
    for index, segment in enumerate(segments[1:], start=1):
        # In USDA meat descriptions, a leading `fresh` is an identity family
        # marker followed by the actual cut (for example pork backfat). Splitting
        # at that segment would collapse hundreds of distinct cuts into `Pork`.
        if index == 1 and normalized_key(segment) == 'fresh':
            continue
        if segment_is_variant(segment):
            split_index = index
            break
    if split_index is None:
        return {
            'concept_name': name.strip(),
            'concept_key': normalized_key(name),
            'mapping_policy': 'identity_preserving_exact',
            'cooking_tags': cooking,
            'form_tags': forms,
            'fat_tags': fat,
        }

    concept_name = ', '.join(segments[:split_index]).strip()
    concept_key = normalized_key(concept_name)
    if len(concept_key) < 3:
        concept_name = name.strip()
        concept_key = normalized_key(name)
        policy = 'identity_preserving_exact'
    else:
        policy = 'conservative_comma_parser'
    return {
        'concept_name': concept_name,
        'concept_key': concept_key,
        'mapping_policy': policy,
        'cooking_tags': cooking,
        'form_tags': forms,
        'fat_tags': fat,
    }


def concept_id(key: str) -> str:
    return f'ugc:{hashlib.sha256(key.encode("utf-8")).hexdigest()[:20]}'


def build(database_path: Path, manifest_path: Path) -> dict[str, object]:
    database = sqlite3.connect(database_path)
    database.execute('PRAGMA foreign_keys=ON')
    try:
        database.executescript('''
          DROP TABLE IF EXISTS generic_concept_search;
          DROP TABLE IF EXISTS generic_variants;
          DROP TABLE IF EXISTS generic_concepts;

          CREATE TABLE generic_concepts(
            id TEXT PRIMARY KEY,
            normalized_key TEXT NOT NULL UNIQUE,
            name_en TEXT NOT NULL,
            mapping_policy TEXT NOT NULL CHECK(mapping_policy IN (
              'conservative_comma_parser','identity_preserving_exact'
            )),
            variant_count INTEGER NOT NULL DEFAULT 0 CHECK(variant_count > 0),
            source_type_count INTEGER NOT NULL DEFAULT 1 CHECK(source_type_count > 0)
          );

          CREATE TABLE generic_variants(
            food_id TEXT PRIMARY KEY,
            concept_id TEXT NOT NULL,
            cooking_tags_json TEXT NOT NULL,
            form_tags_json TEXT NOT NULL,
            fat_tags_json TEXT NOT NULL,
            original_name_en TEXT NOT NULL,
            source_type TEXT NOT NULL,
            FOREIGN KEY(food_id) REFERENCES generic_foods(id) ON DELETE CASCADE,
            FOREIGN KEY(concept_id) REFERENCES generic_concepts(id) ON DELETE CASCADE
          );
          CREATE INDEX generic_variants_concept_idx ON generic_variants(concept_id, source_type);

          CREATE VIRTUAL TABLE generic_concept_search USING fts5(
            concept_id UNINDEXED,
            name_en,
            tokenize='unicode61 remove_diacritics 2'
          );
        ''')
        foods = database.execute(
            'SELECT id,source_type,name_en FROM generic_foods ORDER BY id'
        ).fetchall()
        concepts: dict[str, dict[str, object]] = {}
        variants: list[tuple[object, ...]] = []
        policies: Counter[str] = Counter()
        for food_id, source_type, name_en in foods:
            parsed = parse_description(name_en)
            key = str(parsed['concept_key']) or normalized_key(name_en)
            cid = concept_id(key)
            current = concepts.setdefault(cid, {
                'id': cid,
                'key': key,
                'name': str(parsed['concept_name']),
                'policy': str(parsed['mapping_policy']),
                'foods': 0,
                'sources': set(),
            })
            current['foods'] = int(current['foods']) + 1
            current['sources'].add(source_type)
            if current['policy'] == 'identity_preserving_exact' and parsed['mapping_policy'] == 'conservative_comma_parser':
                current['policy'] = 'conservative_comma_parser'
                current['name'] = str(parsed['concept_name'])
            policies[str(parsed['mapping_policy'])] += 1
            variants.append((
                food_id,
                cid,
                json.dumps(parsed['cooking_tags'], separators=(',', ':')),
                json.dumps(parsed['form_tags'], separators=(',', ':')),
                json.dumps(parsed['fat_tags'], separators=(',', ':')),
                name_en,
                source_type,
            ))

        database.executemany(
            '''INSERT INTO generic_concepts(
                 id,normalized_key,name_en,mapping_policy,variant_count,source_type_count
               ) VALUES (?,?,?,?,?,?)''',
            [
                (
                    value['id'], value['key'], value['name'], value['policy'],
                    value['foods'], len(value['sources']),
                )
                for value in concepts.values()
            ],
        )
        database.executemany(
            '''INSERT INTO generic_variants(
                 food_id,concept_id,cooking_tags_json,form_tags_json,fat_tags_json,
                 original_name_en,source_type
               ) VALUES (?,?,?,?,?,?,?)''',
            variants,
        )
        database.execute(
            '''INSERT INTO generic_concept_search(concept_id,name_en)
               SELECT id,name_en FROM generic_concepts'''
        )
        database.executemany(
            '''INSERT INTO meta(key,value) VALUES (?,?)
               ON CONFLICT(key) DO UPDATE SET value=excluded.value''',
            [
                ('genericConceptCount', str(len(concepts))),
                ('genericVariantMappingCount', str(len(variants))),
                ('genericConservativeMappingCount', str(policies['conservative_comma_parser'])),
                ('genericExactMappingCount', str(policies['identity_preserving_exact'])),
            ],
        )
        database.commit()
        database.execute('PRAGMA optimize')
        database.execute('VACUUM')
        database.commit()

        mapped = database.execute('SELECT COUNT(*) FROM generic_variants').fetchone()[0]
        generic_count = database.execute('SELECT COUNT(*) FROM generic_foods').fetchone()[0]
        clustered = database.execute(
            'SELECT COUNT(*) FROM generic_concepts WHERE variant_count > 1'
        ).fetchone()[0]
        multi_source = database.execute(
            'SELECT COUNT(*) FROM generic_concepts WHERE source_type_count > 1'
        ).fetchone()[0]
        max_variants = database.execute(
            'SELECT MAX(variant_count) FROM generic_concepts'
        ).fetchone()[0]
        integrity = database.execute('PRAGMA integrity_check').fetchone()[0]
    finally:
        database.close()

    if integrity != 'ok':
        raise RuntimeError(f'Catalog integrity check failed: {integrity}')
    if mapped != generic_count:
        raise RuntimeError(f'Every source record must map once: {mapped}/{generic_count}')
    if len(concepts) >= generic_count:
        raise RuntimeError('Concept builder did not cluster any source variants.')

    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest.update({
        'databaseBytes': database_path.stat().st_size,
        'databaseSha256': sha256(database_path),
        'genericConceptCount': len(concepts),
        'genericVariantMappingCount': mapped,
        'genericVariantMappingCoverage': mapped / generic_count,
        'genericClusteredConceptCount': clustered,
        'genericMultiSourceConceptCount': multi_source,
        'genericMaximumVariantsPerConcept': max_variants,
        'genericMappingPolicies': dict(sorted(policies.items())),
    })
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--database', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    args = parser.parse_args()
    result = build(args.database, args.manifest)
    print(json.dumps({
        'genericConceptCount': result['genericConceptCount'],
        'genericVariantMappingCount': result['genericVariantMappingCount'],
        'genericVariantMappingCoverage': result['genericVariantMappingCoverage'],
        'genericClusteredConceptCount': result['genericClusteredConceptCount'],
        'genericMultiSourceConceptCount': result['genericMultiSourceConceptCount'],
        'genericMaximumVariantsPerConcept': result['genericMaximumVariantsPerConcept'],
        'databaseBytes': result['databaseBytes'],
    }, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
