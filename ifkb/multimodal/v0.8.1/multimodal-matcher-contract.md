# IFKB Multimodal Matcher Contract v0.8.1

The model is a matcher and question selector, not a nutrition database.

## Inputs

- one or more food images;
- optional Persian/English food name entered by the user;
- optional meal context and region;
- optional reference object, plate diameter, depth or measured grams;
- candidate records retrieved from IFKB.

## Mandatory behaviour

1. Rank only the supplied IFKB candidates.
2. Treat the user-entered name as evidence, never as unquestioned ground truth.
3. Explicitly report image/text conflicts.
4. Abstain when the dish is unknown, outside the canon or visually insufficient.
5. Ask no more than four targeted questions, prioritising oil, included rice/bread, meat type, preparation method and portion.
6. Never invent calories, macros, ingredient quantities or recipe versions.
7. Set `nutrition_lookup_allowed=true` only after identity and recipe/portion inputs are sufficiently grounded for a KB calculation.
8. Return JSON matching `multimodal-food-match.schema.json`.

## Confidence governance

Identity, recipe and portion confidence are separate fields. A high-confidence identity does not imply a precise portion or a known recipe composition. Nutrition values must be calculated from a versioned IFKB recipe and ingredient graph.
