import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name('initialize_source_fact_queue.py')
spec = importlib.util.spec_from_file_location('source_fact_queue', MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)


class SourceFactQueueTests(unittest.TestCase):
    def candidate(self, canon='IFKB-CANON-00001', url='https://example.com/food'):
        return {
            'canonId': canon,
            'sourceCollectionId': 'SRC-COLLECTION-TEST',
            'candidateUrl': url,
            'candidateTitle': 'Test food',
            'matchScore': '1000',
            'matchReason': 'primary_fa_phrase',
        }

    def test_initializes_null_safe_unapproved_records(self):
        result = module.initialize([self.candidate()])
        self.assertTrue(result['summary']['aligned'])
        record = result['records'][0]
        self.assertIsNone(record['servingWeightG'])
        self.assertEqual(record['ingredients'], [])
        self.assertFalse(record['rawRecipeTextStored'])
        self.assertFalse(record['nutritionValuesAllowed'])
        self.assertFalse(record['promotionEligible'])

    def test_deduplicates_same_canonical_url_pair(self):
        result = module.initialize([self.candidate(), self.candidate()])
        self.assertEqual(result['summary']['sourceFactRecordCount'], 1)

    def test_rejects_invalid_non_https_source(self):
        result = module.initialize([self.candidate(url='http://example.com/food')])
        self.assertFalse(result['summary']['aligned'])
        self.assertEqual(result['summary']['sourceFactRecordCount'], 0)


if __name__ == '__main__':
    unittest.main()
