import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name('discover_recipe_index_matches.py')
spec = importlib.util.spec_from_file_location('recipe_index_discovery', MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

HTML = '''
<html><body>
<a href="https://persianmama.com/ghormeh-sabzi/">GHORMEH SABZI – PERSIAN HERB STEW قورمه سبزی</a>
<a href="/kabob-koobideh/">KABOB KOOBIDEH | GRILLED MINCED MEAT KABOBS کباب کوبیده</a>
<a href="/recipe-index/">Recipe Index</a>
<a href="/category/kabobs/">Kabobs</a>
<a href="https://other.example/food/">Other</a>
</body></html>
'''


class RecipeIndexDiscoveryTests(unittest.TestCase):
    def test_extracts_only_same-domain_recipe_links(self):
        links = module.extract_recipe_links(HTML, 'https://persianmama.com/recipe-index/')
        self.assertEqual(len(links), 2)
        self.assertTrue(all(row['url'].startswith('https://persianmama.com/') for row in links))

    def test_matches_primary_persian_names_without_approval(self):
        links = module.extract_recipe_links(HTML, 'https://persianmama.com/recipe-index/')
        foods = [{
            'canon_id': 'IFKB-CANON-00008',
            'name_fa': 'قورمه‌سبزی',
            'name_en': 'Ghormeh sabzi',
            'aliases_fa': 'قورمه سبزی|قرمه سبزی',
        }]
        result = module.build_matches(foods, links, 'SRC-COLLECTION-PERSIAN-MAMA-INDEX')
        self.assertEqual(result['foodsWithStrongCandidates'], 1)
        self.assertEqual(result['approvedExactMatchCount'], 0)
        self.assertFalse(result['candidates'][0]['nutritionUseAllowed'])

    def test_low_token_overlap_is_not_returned(self):
        score, reason = module.score_match({
            'name_fa': 'فسنجان', 'name_en': 'Fesenjan walnut pomegranate stew', 'aliases_fa': ''
        }, {'title': 'Persian rice and tahdig', 'url': 'https://persianmama.com/rice/'})
        self.assertEqual(score, 0)
        self.assertEqual(reason, 'no_match')


if __name__ == '__main__':
    unittest.main()
