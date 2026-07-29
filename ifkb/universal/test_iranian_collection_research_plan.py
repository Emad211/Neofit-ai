import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name('build_iranian_collection_research_plan.py')
spec = importlib.util.spec_from_file_location('iranian_collection_plan', MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)


def food():
    return {
        'canonId': 'IFKB-CANON-00001',
        'batchId': 'IRANIAN-BATCH-01',
        'nameFa': 'غذای تست',
        'nameEn': 'Test food',
        'category': 'stew',
        'currentStatus': 'ds0_broad_fallback',
        'discoveryMode': 'new_source_acquisition',
    }


def source(source_id='SRC-1', recipe='true', nutrient='true', categories='all'):
    return {
        'source_collection_id': source_id,
        'title': 'Source',
        'source_class': 'test',
        'authority_tier': 'A',
        'applicable_categories': categories,
        'applicable_discovery_modes': 'all',
        'access_status': 'public',
        'license_or_reuse_status': 'review_required',
        'recipe_discovery_candidate': recipe,
        'nutrient_authority_candidate': nutrient,
        'automatic_approval_allowed': 'false',
        'direct_url': 'https://example.com/source',
        'use_boundary': 'candidate only',
        'notes': '',
    }


class CollectionResearchPlanTests(unittest.TestCase):
    def test_assignments_never_claim_exact_match_or_approval(self):
        foods = [{**food(), 'canonId': f'IFKB-CANON-{index:05d}'} for index in range(1, 262)]
        result = module.build_plan(foods, [source()])
        self.assertTrue(result['summary']['aligned'], result['summary']['errors'])
        self.assertEqual(result['summary']['canonicalFoodCount'], 261)
        self.assertEqual(result['summary']['exactFoodMatchesFound'], 0)
        self.assertEqual(result['summary']['approvedSourceRecordCount'], 0)
        self.assertTrue(all(row['assignmentStatus'] == 'candidate_collection_to_search' for row in result['assignments']))

    def test_automatic_approval_is_rejected(self):
        foods = [{**food(), 'canonId': f'IFKB-CANON-{index:05d}'} for index in range(1, 262)]
        bad = source()
        bad['automatic_approval_allowed'] = 'true'
        result = module.build_plan(foods, [bad])
        self.assertFalse(result['summary']['aligned'])
        self.assertTrue(any('automatic approval' in error for error in result['summary']['errors']))

    def test_every_food_requires_recipe_and_nutrient_collection_assignments(self):
        foods = [{**food(), 'canonId': f'IFKB-CANON-{index:05d}'} for index in range(1, 262)]
        result = module.build_plan(foods, [source(recipe='false', nutrient='true')])
        self.assertFalse(result['summary']['aligned'])
        self.assertTrue(any('recipe-discovery' in error for error in result['summary']['errors']))


if __name__ == '__main__':
    unittest.main()
