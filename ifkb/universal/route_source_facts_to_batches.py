#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))


def route(records: list[dict[str, Any]], discovery_rows: list[dict[str, str]]) -> dict[str, Any]:
    errors: list[str] = []
    canon_to_batch: dict[str, str] = {}
    for row in discovery_rows:
        canon_id = row.get('canonId', '').strip()
        batch_id = row.get('batchId', '').strip()
        if not canon_id or not batch_id:
            errors.append(f'invalid discovery assignment: {canon_id}|{batch_id}')
            continue
        existing = canon_to_batch.get(canon_id)
        if existing and existing != batch_id:
            errors.append(f'{canon_id}: assigned to multiple batches')
        canon_to_batch[canon_id] = batch_id
    if len(canon_to_batch) != 261:
        errors.append(f'discovery assignment must cover 261 canonical foods; found {len(canon_to_batch)}')

    by_batch: dict[str, list[dict[str, Any]]] = defaultdict(list)
    routed: list[dict[str, Any]] = []
    for record in records:
        canon_id = str(record.get('canonId', ''))
        batch_id = canon_to_batch.get(canon_id)
        if not batch_id:
            errors.append(f'{record.get("recordId")}: no batch assignment for {canon_id}')
            continue
        value = {**record, 'batchId': batch_id}
        routed.append(value)
        by_batch[batch_id].append(value)

    batch_summaries: list[dict[str, Any]] = []
    for batch_id in sorted(set(canon_to_batch.values())):
        items = sorted(
            by_batch.get(batch_id, []),
            key=lambda row: (str(row.get('canonId')), -float(row.get('matchScore', 0)), str(row.get('sourceUrl'))),
        )
        batch_summaries.append({
            'batchId': batch_id,
            'sourceFactRecordCount': len(items),
            'canonicalFoodsWithRecords': len({str(row.get('canonId')) for row in items}),
            'structuredFactsExtractedCount': sum(bool(row.get('structuredFactsExtracted')) for row in items),
            'foodsWithStructuredFacts': len({str(row.get('canonId')) for row in items if row.get('structuredFactsExtracted')}),
            'ingredientLabelCount': sum(len(row.get('ingredients', [])) for row in items),
            'identityStatusCounts': dict(sorted(Counter(str(row.get('exactIdentityStatus')) for row in items).items())),
            'approvedNutritionUseCount': sum(bool(row.get('nutritionValuesAllowed')) for row in items),
            'promotionEligibleCount': sum(bool(row.get('promotionEligible')) for row in items),
            'records': items,
        })
    summary = {
        'format': 'ifkb-source-facts-by-iranian-batch',
        'version': '1.0.0',
        'aligned': not errors,
        'batchCount': len(batch_summaries),
        'routedRecordCount': len(routed),
        'canonicalFoodsWithRecords': len({str(row.get('canonId')) for row in routed}),
        'structuredFactsExtractedCount': sum(bool(row.get('structuredFactsExtracted')) for row in routed),
        'foodsWithStructuredFacts': len({str(row.get('canonId')) for row in routed if row.get('structuredFactsExtracted')}),
        'ingredientLabelCount': sum(len(row.get('ingredients', [])) for row in routed),
        'approvedExactIdentityCount': sum(row.get('exactIdentityStatus') == 'confirmed' for row in routed),
        'approvedNutritionUseCount': sum(bool(row.get('nutritionValuesAllowed')) for row in routed),
        'promotionEligibleCount': sum(bool(row.get('promotionEligible')) for row in routed),
        'recordsByBatch': {row['batchId']: row['sourceFactRecordCount'] for row in batch_summaries},
        'foodsWithFactsByBatch': {row['batchId']: row['foodsWithStructuredFacts'] for row in batch_summaries},
        'errors': errors,
        'policy': 'Routing changes no evidence status. It only assigns candidate/extracted source facts to the pre-existing 12 execution batches.',
    }
    return {'summary': summary, 'batches': batch_summaries}


def write_outputs(result: dict[str, Any], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / 'summary.json').write_text(json.dumps(result['summary'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for batch in result['batches']:
        (output_dir / f"{batch['batchId']}-source-facts.json").write_text(
            json.dumps(batch, ensure_ascii=False, indent=2) + '\n',
            encoding='utf-8',
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--records', type=Path, required=True)
    parser.add_argument('--discovery-queue', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    records = json.loads(args.records.read_text(encoding='utf-8'))
    if not isinstance(records, list):
        raise ValueError('records must be a JSON array')
    result = route(records, read_csv(args.discovery_queue))
    write_outputs(result, args.output_dir)
    print(json.dumps(result['summary'], ensure_ascii=False, indent=2))
    return 0 if result['summary']['aligned'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
