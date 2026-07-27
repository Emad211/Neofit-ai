#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import sqlite3
from collections import Counter
from pathlib import Path


def parse_tags(value: str) -> list[str]:
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    return [item for item in parsed if isinstance(item, str)] if isinstance(parsed, list) else []


def audit(database_path: Path, output_json: Path, output_csv: Path) -> dict[str, object]:
    db = sqlite3.connect(database_path)
    try:
        integrity = db.execute('PRAGMA integrity_check').fetchone()[0]
        foods = db.execute('SELECT COUNT(*) FROM generic_foods').fetchone()[0]
        concepts = db.execute('SELECT COUNT(*) FROM generic_concepts').fetchone()[0]
        mappings = db.execute('SELECT COUNT(*) FROM generic_variants').fetchone()[0]
        distinct_mapped_foods = db.execute('SELECT COUNT(DISTINCT food_id) FROM generic_variants').fetchone()[0]
        orphan_foods = db.execute('''SELECT COUNT(*) FROM generic_foods f
          LEFT JOIN generic_variants v ON v.food_id=f.id WHERE v.food_id IS NULL''').fetchone()[0]
        orphan_variants = db.execute('''SELECT COUNT(*) FROM generic_variants v
          LEFT JOIN generic_concepts c ON c.id=v.concept_id WHERE c.id IS NULL''').fetchone()[0]
        duplicate_mappings = db.execute('''SELECT COUNT(*) FROM (
          SELECT food_id,COUNT(*) AS n FROM generic_variants GROUP BY food_id HAVING n<>1
        )''').fetchone()[0]
        policy_counts = dict(db.execute(
            'SELECT mapping_policy,COUNT(*) FROM generic_concepts GROUP BY mapping_policy ORDER BY mapping_policy'
        ).fetchall())
        top_rows = db.execute('''
          SELECT c.id,c.name_en,c.normalized_key,c.mapping_policy,c.variant_count,c.source_type_count,
                 GROUP_CONCAT(DISTINCT v.source_type) AS source_types
          FROM generic_concepts c
          JOIN generic_variants v ON v.concept_id=c.id
          GROUP BY c.id
          ORDER BY c.variant_count DESC,c.name_en,c.id
          LIMIT 50
        ''').fetchall()
        top_clusters: list[dict[str, object]] = []
        for row in top_rows:
            cid, name, key, policy, variant_count, source_type_count, source_types = row
            variants = db.execute('''
              SELECT original_name_en,cooking_tags_json,form_tags_json,fat_tags_json,source_type
              FROM generic_variants WHERE concept_id=? ORDER BY original_name_en,food_id
            ''', (cid,)).fetchall()
            cooking = Counter(tag for _, tags_json, _, _, _ in variants for tag in parse_tags(tags_json))
            forms = Counter(tag for _, _, tags_json, _, _ in variants for tag in parse_tags(tags_json))
            fats = Counter(tag for _, _, _, tags_json, _ in variants for tag in parse_tags(tags_json))
            names = [variant[0] for variant in variants]
            top_clusters.append({
                'conceptId': cid,
                'nameEn': name,
                'normalizedKey': key,
                'mappingPolicy': policy,
                'variantCount': variant_count,
                'sourceTypeCount': source_type_count,
                'sourceTypes': (source_types or '').split(','),
                'cookingTags': dict(cooking.most_common()),
                'formTags': dict(forms.most_common()),
                'fatTags': dict(fats.most_common()),
                'sampleVariantNames': names[:20],
                'distinctVariantNameCount': len(set(names)),
            })
        max_cluster = top_clusters[0]['variantCount'] if top_clusters else 0
        concept_search_rows = db.execute('SELECT COUNT(*) FROM generic_concept_search').fetchone()[0]
    finally:
        db.close()

    report = {
        'format': 'ifkb-generic-concept-audit',
        'catalogVersion': '1.2.0',
        'integrity': integrity,
        'genericFoodCount': foods,
        'genericConceptCount': concepts,
        'genericVariantMappingCount': mappings,
        'distinctMappedFoodCount': distinct_mapped_foods,
        'mappingCoverage': mappings / foods if foods else 0,
        'orphanFoodCount': orphan_foods,
        'orphanVariantCount': orphan_variants,
        'duplicateFoodMappingCount': duplicate_mappings,
        'conceptSearchRowCount': concept_search_rows,
        'maximumVariantCount': max_cluster,
        'mappingPolicyCounts': policy_counts,
        'topClusters': top_clusters,
        'gates': {
            'integrityOk': integrity == 'ok',
            'allFoodsMappedExactlyOnce': mappings == foods == distinct_mapped_foods and duplicate_mappings == 0,
            'noOrphans': orphan_foods == 0 and orphan_variants == 0,
            'conceptSearchComplete': concept_search_rows == concepts,
            'maximumClusterWithinReviewLimit': int(max_cluster) <= 250,
        },
    }
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    with output_csv.open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            'rank','concept_id','name_en','mapping_policy','variant_count','source_type_count',
            'source_types','distinct_variant_name_count','sample_variant_names'
        ])
        writer.writeheader()
        for rank, cluster in enumerate(top_clusters, start=1):
            writer.writerow({
                'rank': rank,
                'concept_id': cluster['conceptId'],
                'name_en': cluster['nameEn'],
                'mapping_policy': cluster['mappingPolicy'],
                'variant_count': cluster['variantCount'],
                'source_type_count': cluster['sourceTypeCount'],
                'source_types': '|'.join(cluster['sourceTypes']),
                'distinct_variant_name_count': cluster['distinctVariantNameCount'],
                'sample_variant_names': ' | '.join(cluster['sampleVariantNames']),
            })
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--database', type=Path, required=True)
    parser.add_argument('--output-json', type=Path, required=True)
    parser.add_argument('--output-csv', type=Path, required=True)
    args = parser.parse_args()
    report = audit(args.database, args.output_json, args.output_csv)
    failed = [name for name, passed in report['gates'].items() if not passed]
    print(json.dumps({
        'concepts': report['genericConceptCount'],
        'mappings': report['genericVariantMappingCount'],
        'coverage': report['mappingCoverage'],
        'maximumVariantCount': report['maximumVariantCount'],
        'failedGates': failed,
    }, indent=2))
    if failed:
        raise SystemExit(f'Concept audit failed gates: {failed}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
