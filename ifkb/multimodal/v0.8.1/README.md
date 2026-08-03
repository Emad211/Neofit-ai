# IFKB Multimodal Iranian Food Canon v0.8.1

## Scope

This release defines the canonical food universe, image-record schema, capture protocol, user-assisted matching contract, portion-evidence hierarchy, evaluation plan and acquisition backlog for Iranian food recognition.

## Current counts

- canonical prepared-food concepts: **261**
- new regional/cultural candidates: **178**
- duplicate normalized primary Persian names: **0**
- alias collisions: **0**
- P0 image classes: **60**
- P1 image classes: **115**
- P2 image classes: **86**
- seed image target: **17,544**
- production image target: **61,480**
- weighed recipe-grounded dish instances: **3,396**
- verified image classes: **0**

## Product flow

1. The user captures a food image. A second angle or scale reference is requested when portion confidence is low.
2. The user may enter the food name using Persian autocomplete.
3. Image and text retrieve IFKB candidates.
4. The system shows up to three candidates and asks for confirmation when needed.
5. It asks only high-impact recipe/portion questions.
6. Nutrition is calculated from a versioned IFKB recipe and ingredient graph.

The user-entered name is evidence, not ground truth. The LLM is a matcher and question selector; it must not invent calorie or macro values.

## Release gate

No production release until image rights/consent, leakage-safe splits, recipe/weight ground truth, calibrated confidence, OOD testing, portion-error reporting and independent review are complete.
