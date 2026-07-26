import unittest
from digital_consensus import (
    SourceValue, digital_evidence_tier, ingredient_presence_probability,
    robust_interval, simulate_nutrient_interval, validate_synthetic_record
)

class DigitalConsensusTests(unittest.TestCase):
    def test_weighted_interval(self):
        result = robust_interval([
            SourceValue(10,1,"a"), SourceValue(20,1,"b"), SourceValue(30,1,"c")
        ])
        self.assertEqual(result["p50"], 20)

    def test_digital_tiers(self):
        self.assertEqual(digital_evidence_tier(0,False), "DS0")
        self.assertEqual(digital_evidence_tier(1,False), "DS1")
        self.assertEqual(digital_evidence_tier(3,True), "DS2")
        self.assertEqual(digital_evidence_tier(3,True,True), "DS3")
        self.assertEqual(digital_evidence_tier(0,False,False,True), "DS4")

    def test_presence_probability(self):
        result = ingredient_presence_probability(
            [{"rice","oil"},{"rice","meat"},{"rice","oil"}]
        )
        self.assertEqual(result["rice"], 1.0)
        self.assertAlmostEqual(result["oil"], 2/3)

    def test_monte_carlo_interval_is_ordered(self):
        result = simulate_nutrient_interval(
            {"rice":(100,150,220)}, {"rice":1.3}, samples=1000, seed=1
        )
        self.assertLessEqual(result["p10"], result["p50"])
        self.assertLessEqual(result["p50"], result["p90"])

    def test_synthetic_policy(self):
        errors = validate_synthetic_record({
            "dataset_split":"test",
            "nutrition_label_allowed":True,
            "parent_image_id":"",
            "split_group_id":"A",
            "parent_split_group_id":"B",
        })
        self.assertEqual(len(errors), 4)

if __name__ == "__main__":
    unittest.main()
