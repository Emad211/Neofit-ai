# NeoFit Nutrition Core

Pure TypeScript domain logic for IFKB food concepts, deterministic nutrient calculations, Persian search, diary aggregation, recipes, goals and provider-agnostic Vision API recognition.

The module deliberately does not depend on React Native or Expo APIs, so it can be tested with Node and reused by the Expo repository layer.

## Active runtime v3

The Expo application now installs the Nutrition Core schema through database migration version 3 and exposes SQLite repositories for food concepts and variants, diary entries, recipes, goals and Vision-response caching.

Legacy catalog records are migrated as `per_serving` variants. When a serving weight is unknown, it remains `null`; the runtime never fabricates a gram weight. Custom and imported foods are synchronized into the concept/variant tables so the legacy and new search paths cannot silently diverge.

Aggregations are missing-aware: a missing nutrient is not converted to zero, and recipe or diary totals retain that uncertainty. The standalone schema validator tests the real SQLite constraints and uses a portable table substitute only when the host Node SQLite binary was compiled without FTS5. Expo SQLite continues to use the native FTS5 virtual table.

## Bundled catalog v1.1

The read-only universal catalog contains official USDA calories, macronutrients and household portions plus calcium, iron, potassium and vitamin C. Catalog nutrients remain nullable; a source that lacks a nutrient never becomes a zero-valued observation.

## Goal semantics

Daily energy and macronutrients use target semantics. Sugars, sodium and cholesterol use maximum semantics. Fiber, calcium, iron, potassium and vitamin C use minimum semantics. NeoFit stores user-entered boundaries only and does not create medical targets automatically.

## Safety boundary

Vision results are observations only. `sanitizeVisionObservation` accepts only labels, confidence, visible components, preparation hints and warnings. Calories and nutrients returned by a provider are ignored because nutrition is resolved locally from IFKB.
