#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))


def record_id(canon_id: str, source_url: str) -> str:
    digest = hashlib.sha256(f'{canon_id}|{source_url}'.encode('utf-8')).hexdigest()[:20]
    return f'IFKB-SFR-{digest}'


def initialize(candidates: list[dict[str, str]]) -> dict:
    errors: list[str] = []
    records: list[dict[str, object]] = []
    seen_ids: set[str] = set()
    seen_pairs: set[tuple[str, str]] = set()
    for row in candidates:
        canon_id = row.get('canonId', '').strip()
        source_url = row.get('candidateUrl', '').strip()
        source_collection_id = row.get('sourceCollectionId', '').strip()
        if not canon_id.startswith('IFKB-CANON-') or not source_url.startswith('https://') or not source_collection_id:
            errors.append(f'invalid candidate identity/source: {canon_id}|{source_url}|{source_collection_id}')
            continue
        pair = (canon_id, source_url)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        rid = record_id(canon_id, source_url)
        if rid in seen_ids:
            errors.append(f'duplicate generated record id: {rid}')
            continue
        seen_ids.add(rid)
        try:
            score = float(row.get('matchScore', '0'))
        except ValueError:
            errors.append(f'{canon_id}: invalid match score')
            continue
        records.append({
            'format': 'ifkb-source-fact-record',
            'version': '1.0.0',
            'recordId': rid,
            'canonId': canon_id,
            'sourceCollectionId': source_collection_id,
            'sourceUrl': source_url,
            'candidateTitle': row.get('candidateTitle', '').strip(),
            'matchScore': score,
            'matchReason': row.get('matchReason', '').strip() or 'unspecified',
            'exactIdentityStatus': 'unreviewed',
            'reuseReviewStatus': 'unreviewed',
            'publisher': None,
            'independenceGroup': None,
            'accessedAt': None,
            'declaredServings': None,
            'cookedBatchWeightG': None,
            'servingWeightG': None,
            'rawRecipeTextStored': False,
            'structuredFactsExtracted': False,
            'ingredients': [],
            'reviewers': [],
            'adjudicator': None,
            'nutritionValuesAllowed': False,
            'promotionEligible': False,
            'notes': None,
        })
    records.sort(key=lambda value: (str(value['canonId']), -float(value['matchScore']), str(value['sourceUrl'])))
    summary = {
        'format': 'ifkb-source-fact-queue-summary',
        'version': '1.0.0',
        'aligned': not errors,
        'candidateInputCount': len(candidates),
        'sourceFactRecordCount': len(records),
        'canonicalFoodsWithRecords': len({str(record['canonId']) for record in records}),
        'matchReasonCounts': dict(sorted(Counter(str(record['matchReason']) for record in records).items())),
        'exactIdentityConfirmedCount': 0,
        'structuredFactsExtractedCount': 0,
        'approvedNutritionUseCount': 0,
        'promotionEligibleCount': 0,
        'errors': errors,
        'policy': 'Queue initialization creates reviewable URL records only. Missing fields remain null and are never interpreted as zero.',
    }
    return {'summary': summary, 'records': records}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--candidates', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    result = initialize(read_csv(args.candidates))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / 'summary.json').write_text(json.dumps(result['summary'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (args.output_dir / 'source-fact-records.json').write_text(json.dumps(result['records'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result['summary'], ensure_ascii=False, indent=2))
    return 0 if result['summary']['aligned'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
