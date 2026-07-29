#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))


def split_values(value: str) -> set[str]:
    return {item.strip() for item in value.split('|') if item.strip()}


def applies(source: dict[str, str], food: dict[str, str]) -> bool:
    categories = split_values(source['applicable_categories'])
    modes = split_values(source['applicable_discovery_modes'])
    return ('all' in categories or food['category'] in categories) and (
        'all' in modes or food['discoveryMode'] in modes
    )


def build_plan(discovery_rows: list[dict[str, str]], source_rows: list[dict[str, str]]) -> dict:
    errors: list[str] = []
    canon_ids = [row.get('canonId', '') for row in discovery_rows]
    source_ids = [row.get('source_collection_id', '') for row in source_rows]
    if len(canon_ids) != 261 or len(set(canon_ids)) != 261:
        errors.append(f'discovery queue must contain 261 unique canonical ids; found {len(canon_ids)}/{len(set(canon_ids))}')
    if not source_rows or len(source_ids) != len(set(source_ids)) or any(not value for value in source_ids):
        errors.append('source registry ids must be non-empty and unique')
    for source in source_rows:
        if source.get('automatic_approval_allowed', '').lower() != 'false':
            errors.append(f"{source.get('source_collection_id')}: automatic approval must be false")
        if not source.get('direct_url', '').startswith('https://'):
            errors.append(f"{source.get('source_collection_id')}: direct HTTPS URL is required")
        if source.get('recipe_discovery_candidate', '').lower() not in {'true', 'false'}:
            errors.append(f"{source.get('source_collection_id')}: invalid recipe candidate flag")
        if source.get('nutrient_authority_candidate', '').lower() not in {'true', 'false'}:
            errors.append(f"{source.get('source_collection_id')}: invalid nutrient candidate flag")

    assignments: list[dict[str, object]] = []
    by_batch: dict[str, list[dict[str, object]]] = defaultdict(list)
    for food in discovery_rows:
        matches = [source for source in source_rows if applies(source, food)]
        recipe_candidates = [source for source in matches if source['recipe_discovery_candidate'].lower() == 'true']
        nutrient_candidates = [source for source in matches if source['nutrient_authority_candidate'].lower() == 'true']
        if not recipe_candidates:
            errors.append(f"{food.get('canonId')}: no broad recipe-discovery collection assigned")
        if not nutrient_candidates:
            errors.append(f"{food.get('canonId')}: no nutrient-authority collection assigned")
        for source in matches:
            assignment = {
                'canonId': food['canonId'],
                'batchId': food['batchId'],
                'nameFa': food['nameFa'],
                'nameEn': food['nameEn'],
                'category': food['category'],
                'currentStatus': food['currentStatus'],
                'discoveryMode': food['discoveryMode'],
                'sourceCollectionId': source['source_collection_id'],
                'sourceTitle': source['title'],
                'sourceClass': source['source_class'],
                'authorityTier': source['authority_tier'],
                'accessStatus': source['access_status'],
                'recipeDiscoveryCandidate': source['recipe_discovery_candidate'].lower() == 'true',
                'nutrientAuthorityCandidate': source['nutrient_authority_candidate'].lower() == 'true',
                'directUrl': source['direct_url'],
                'useBoundary': source['use_boundary'],
                'assignmentStatus': 'candidate_collection_to_search',
                'exactFoodMatchFound': False,
                'approvedSourceRecordCount': 0,
                'reviewStatus': 'unstarted',
            }
            assignments.append(assignment)
            by_batch[food['batchId']].append(assignment)

    food_recipe_assignment = Counter()
    food_nutrient_assignment = Counter()
    for assignment in assignments:
        if assignment['recipeDiscoveryCandidate']:
            food_recipe_assignment[str(assignment['canonId'])] += 1
        if assignment['nutrientAuthorityCandidate']:
            food_nutrient_assignment[str(assignment['canonId'])] += 1
    summary = {
        'format': 'neofit-iranian-collection-research-plan',
        'version': '1.0.0',
        'aligned': not errors,
        'canonicalFoodCount': len(discovery_rows),
        'sourceCollectionCount': len(source_rows),
        'candidateAssignmentCount': len(assignments),
        'foodsWithRecipeDiscoveryAssignments': len(food_recipe_assignment),
        'foodsWithNutrientAuthorityAssignments': len(food_nutrient_assignment),
        'exactFoodMatchesFound': 0,
        'approvedSourceRecordCount': 0,
        'sourceClassCounts': dict(sorted(Counter(row['source_class'] for row in source_rows).items())),
        'accessStatusCounts': dict(sorted(Counter(row['access_status'] for row in source_rows).items())),
        'assignmentsByBatch': dict(sorted(Counter(str(row['batchId']) for row in assignments).items())),
        'errors': errors,
        'policy': 'Assignments identify collections to search. They do not claim exact coverage, permission, independent evidence, nutrients or promotion readiness.',
    }
    return {'summary': summary, 'assignments': assignments, 'by_batch': dict(by_batch), 'sources': source_rows}


def write_outputs(result: dict, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / 'batches').mkdir(exist_ok=True)
    (output_dir / 'summary.json').write_text(json.dumps(result['summary'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (output_dir / 'source-collections.json').write_text(json.dumps(result['sources'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    assignments: list[dict[str, object]] = result['assignments']
    headers = list(assignments[0].keys()) if assignments else []
    with (output_dir / 'collection-assignments.csv').open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(assignments)
    for batch_id, rows in sorted(result['by_batch'].items()):
        (output_dir / 'batches' / f'{batch_id}-collection-plan.json').write_text(
            json.dumps({'batchId': batch_id, 'assignmentCount': len(rows), 'assignments': rows}, ensure_ascii=False, indent=2) + '\n',
            encoding='utf-8',
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--discovery-queue', type=Path, required=True)
    parser.add_argument('--registry', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    result = build_plan(read_csv(args.discovery_queue), read_csv(args.registry))
    write_outputs(result, args.output_dir)
    print(json.dumps(result['summary'], ensure_ascii=False, indent=2))
    return 0 if result['summary']['aligned'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
