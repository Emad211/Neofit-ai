import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name('route_source_facts_to_batches.py')
spec = importlib.util.spec_from_file_location('route_source_facts', MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)


class RouteSourceFactsTests(unittest.TestCase):
    def discovery(self):
        return [
            {'canonId': f'IFKB-CANON-{index:05d}', 'batchId': f'IRANIAN-BATCH-{((index - 1) % 12) + 1:02d}'}
            for index in range(1, 262)
        ]

    def record(self, canon='IFKB-CANON-00001', extracted=True):
        return {
            'recordId': 'IFKB-SFR-1234567890abcdef1234',
            'canonId': canon,
            'sourceUrl': 'https://example.com/food',
            'matchScore': 1000,
            'structuredFactsExtracted': extracted,
            'ingredients': [{'sourceLabel': '1 cup food'}] if extracted else [],
            'exactIdentityStatus': 'unreviewed',
            'nutritionValuesAllowed': False,
            'promotionEligible': False,
        }

    def test_routes_records_without_changing_approval_state(self):
        result = module.route([self.record()], self.discovery())
        self.assertTrue(result['summary']['aligned'], result['summary']['errors'])
        self.assertEqual(result['summary']['batchCount'], 12)
        self.assertEqual(result['summary']['routedRecordCount'], 1)
        self.assertEqual(result['summary']['structuredFactsExtractedCount'], 1)
        self.assertEqual(result['summary']['approvedNutritionUseCount'], 0)
        self.assertFalse(result['batches'][0]['records'][0]['nutritionValuesAllowed'])

    def test_missing_batch_assignment_fails_closed(self):
        discovery = self.discovery()[:-1]
        result = module.route([self.record('IFKB-CANON-00261')], discovery)
        self.assertFalse(result['summary']['aligned'])
        self.assertTrue(any('261 canonical foods' in error for error in result['summary']['errors']))
        self.assertTrue(any('no batch assignment' in error for error in result['summary']['errors']))


if __name__ == '__main__':
    unittest.main()
