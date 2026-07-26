# NeoFit Nutrition Core

Pure TypeScript domain logic for IFKB food concepts, deterministic nutrient calculations, Persian search, diary aggregation, recipes, goals and provider-agnostic Vision API recognition.

The module deliberately does not depend on React Native or Expo APIs, so it can be tested with Node and reused by the Expo repository layer.

## Safety boundary

Vision results are observations only. `sanitizeVisionObservation` accepts only labels, confidence, visible components, preparation hints and warnings. Calories and nutrients returned by a provider are ignored because nutrition is resolved locally from IFKB.
