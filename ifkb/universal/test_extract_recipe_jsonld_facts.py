import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name('extract_recipe_jsonld_facts.py')
spec = importlib.util.spec_from_file_location('recipe_jsonld_facts', MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

HTML = '''
<html><body>
<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"Recipe",
  "name":"Test Persian Food",
  "author":{"@type":"Person","name":"Example Author"},
  "recipeYield":"Serves 6",
  "recipeIngredient":["2 cups rice","1 tsp salt"],
  "recipeInstructions":[{"@type":"HowToStep","text":"Copyrighted instruction text that must not be stored."}],
  "nutrition":{"calories":"999 kcal"}
}
</script>
</body></html>
'''


def record():
    return {
        'format': 'ifkb-source-fact-record',
        'version': '1.0.0',
        'recordId': 'IFKB-SFR-1234567890abcdef1234',
        'canonId': 'IFKB-CANON-00001',
        'sourceCollectionId': 'SRC-COLLECTION-TEST',
        'sourceUrl': 'https://example.com/recipe',
        'candidateTitle': 'Candidate',
        'matchScore': 1000,
        'matchReason': 'primary_fa_phrase',
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
    }


class RecipeJsonLdFactTests(unittest.TestCase):
    def test_extracts_only_structured_name_yield_and_ingredient_labels(self):
        updated, error = module.extract_one(record(), HTML)
        self.assertIsNone(error)
        self.assertTrue(updated['structuredFactsExtracted'])
        self.assertEqual(updated['declaredServings'], 6.0)
        self.assertEqual([row['sourceLabel'] for row in updated['ingredients']], ['2 cups rice', '1 tsp salt'])
        serialized = str(updated)
        self.assertNotIn('Copyrighted instruction text', serialized)
        self.assertNotIn('999 kcal', serialized)
        self.assertFalse(updated['rawRecipeTextStored'])
        self.assertFalse(updated['nutritionValuesAllowed'])
        self.assertFalse(updated['promotionEligible'])

    def test_missing_recipe_jsonld_is_reported_without_mutating_record(self):
        original = record()
        updated, error = module.extract_one(original, '<html><body>No schema</body></html>')
        self.assertIn('no Recipe JSON-LD', error)
        self.assertFalse(updated['structuredFactsExtracted'])
        self.assertEqual(updated['ingredients'], [])


if __name__ == '__main__':
    unittest.main()
