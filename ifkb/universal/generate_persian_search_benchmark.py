#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

ARABIC_TO_PERSIAN = str.maketrans({
    'ي': 'ی', 'ى': 'ی', 'ك': 'ک', 'ة': 'ه', 'ۀ': 'ه', 'ؤ': 'و', 'إ': 'ا', 'أ': 'ا',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
})
DIACRITICS = re.compile(r'[\u064B-\u065F\u0670\u06D6-\u06ED]')
SEPARATORS = re.compile(r'[\u200c\u200d_\-/]+')
NON_WORD = re.compile(r'[^\w\s]', flags=re.UNICODE)
SPACES = re.compile(r'\s+')


def normalize_persian(value: str) -> str:
    normalized = unicodedata.normalize('NFKC', value).lower().translate(ARABIC_TO_PERSIAN)
    normalized = DIACRITICS.sub('', normalized)
    normalized = SEPARATORS.sub(' ', normalized)
    normalized = NON_WORD.sub(' ', normalized).replace('_', ' ')
    return SPACES.sub(' ', normalized).strip()


def read_aliases(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        rows = list(csv.DictReader(handle))
    required = {'alias_fa', 'target', 'target_type'}
    if not rows or not required.issubset(rows[0]):
        raise ValueError(f'Alias CSV must contain {sorted(required)}')
    return rows


def arabic_character_variant(alias: str) -> str:
    changed = alias.replace('ی', 'ي').replace('ک', 'ك')
    return changed if changed != alias else f'  {alias}  '


def half_space_variant(alias: str) -> str:
    if ' ' in alias:
        return alias.replace(' ', '\u200c', 1)
    if '\u200c' in alias:
        return alias.replace('\u200c', ' ', 1)
    return f'{alias}  '


def joined_variant(alias: str) -> str:
    joined = alias.replace(' ', '').replace('\u200c', '')
    return joined if joined != alias else f'{alias}!'


def build_cases(rows: list[dict[str, str]], count: int) -> list[dict[str, str]]:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    display: dict[str, str] = {}
    for row in rows:
        alias = row['alias_fa'].strip()
        key = normalize_persian(alias)
        if not key:
            continue
        grouped[key].append(row)
        display.setdefault(key, alias)

    groups: list[dict[str, object]] = []
    for key in sorted(grouped):
        values = grouped[key]
        iranian = sorted({row['target'] for row in values if row['target_type'] == 'iranian_canon'})
        generic = sorted({row['target'] for row in values if row['target_type'] == 'generic'})
        target_type = 'iranian_canon' if iranian else 'generic'
        targets = iranian if iranian else generic
        if not targets:
            continue
        groups.append({
            'alias': display[key],
            'target_type': target_type,
            'targets': targets,
        })
    if not groups:
        raise ValueError('No benchmarkable aliases were found.')

    cases: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()

    def add(query: str, group: dict[str, object], variant_type: str) -> None:
        if len(cases) >= count:
            return
        target_type = str(group['target_type'])
        targets = '|'.join(str(value) for value in group['targets'])
        key = (normalize_persian(query), target_type, targets)
        if not key[0] or key in seen:
            return
        seen.add(key)
        cases.append({
            'query_id': f'PSQ-{len(cases) + 1:04d}',
            'query': query,
            'canonical_alias': str(group['alias']),
            'target_type': target_type,
            'expected_targets': targets,
            'variant_type': variant_type,
        })

    # Every unique normalized alias appears first as an exact query.
    for group in groups:
        add(str(group['alias']), group, 'exact_alias')

    # Every alias is then tested inside a realistic amount/serving phrase.
    for index, group in enumerate(groups):
        alias = str(group['alias'])
        query = f'یک پرس {alias}' if group['target_type'] == 'iranian_canon' else f'50 گرم {alias}'
        add(query, group, 'quantity_context')

    transforms = [
        ('punctuation', lambda alias: f'«{alias}»'),
        ('arabic_characters', arabic_character_variant),
        ('half_space', half_space_variant),
        ('context_sentence', lambda alias: f'برای ناهار {alias}'),
        ('extra_spacing', lambda alias: f'  {alias.replace(" ", "   ")}  '),
        ('joined_spacing', joined_variant),
        ('trailing_serving', lambda alias: f'{alias}، یک سهم'),
    ]
    round_index = 0
    while len(cases) < count:
        before = len(cases)
        variant_type, transform = transforms[round_index % len(transforms)]
        offset = (round_index * 17) % len(groups)
        for step in range(len(groups)):
            group = groups[(offset + step) % len(groups)]
            add(transform(str(group['alias'])), group, variant_type)
            if len(cases) >= count:
                break
        if len(cases) == before:
            # Guaranteed unique fallback for unusually small/duplicate registries.
            group = groups[round_index % len(groups)]
            add(f'نمونه {round_index + 1} {group["alias"]}', group, 'numbered_context')
        round_index += 1
        if round_index > count * 4:
            raise RuntimeError(f'Could not generate {count} unique benchmark rows.')

    return cases


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--aliases', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--count', type=int, default=500)
    args = parser.parse_args()
    if args.count < 1:
        raise ValueError('--count must be positive')
    cases = build_cases(read_aliases(args.aliases), args.count)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            'query_id', 'query', 'canonical_alias', 'target_type',
            'expected_targets', 'variant_type',
        ])
        writer.writeheader()
        writer.writerows(cases)
    counts: dict[str, int] = defaultdict(int)
    for case in cases:
        counts[case['variant_type']] += 1
    print({'rows': len(cases), 'variant_counts': dict(sorted(counts.items()))})
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
