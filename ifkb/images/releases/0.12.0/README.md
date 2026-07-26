# IFKB image research release v0.12.0

The packaged image count remains **58**. Source pages, candidate URLs and failed downloads are not counted as possessed image assets.

## Results

- prepared-food canon: 261
- P0 image classes: 60
- Openverse candidates visually reviewed: 9
- Openverse candidates promoted: 0
- exact Wikimedia Commons sources independently verified: 5
- high-resolution exact assets pending acquisition: 3
- exact low-resolution references excluded from train/eval: 2
- field-capture fallback plans: 17
- Nutrition Gold images: 0

## Exact sources

Source identity, creator, licence and dimensions were confirmed for Gheimeh Bademjan, Adasi, Ahvazi Sambooseh, Persian Salad Olivieh and Kuku Sibzamini. The Adasi, Sambooseh and Olivieh source files satisfy the project dimension threshold but Wikimedia bulk/CDN requests returned HTTP 429, so their bytes are not counted. The Gheimeh Bademjan and Kuku Sibzamini files are exact but remain reference-only because one dimension is below 500 px.

## Openverse policy

Openverse metadata is a discovery aid, not sufficient final licence evidence. Every candidate requires visual identity review and independent landing-page verification. No v0.12 Openverse candidate passed both gates.

## Dataset readiness

The existing 58-image seed contains no exact byte duplicates or conservative perceptual near-duplicate pairs. Only two current classes have at least three independent split groups; broad accuracy claims remain prohibited.

## Next gate

1. Acquire the three high-resolution exact Commons files when the source rate limit clears.
2. Complete the 17 consented field-capture plans.
3. Increase independent providers and split groups for existing classes.
4. Link measured servings and locked recipe versions before creating Nutrition Gold labels.
