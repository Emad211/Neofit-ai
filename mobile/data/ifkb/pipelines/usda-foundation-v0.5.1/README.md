# IFKB USDA Foundation ingestion pipeline v0.5.1

This corrective pipeline has been executed against the official USDA Foundation Foods archive dated 2026-04-30.

## Source

- Archive SHA-256: `d6d4f41dcd19a46abcdd67775379cb6f0292ff08daa7e0680fdd0982830bf57b`
- Archive size: 3,825,517 bytes
- Safe ZIP members: 25
- Licence: CC0 / United States public domain

## Official integration result

- exact Foundation matches: 34 / 34
- aggregate nutrient observations: 1,071
- source/sample links: 253
- sub-sample laboratory results: 6,766
- food attributes: 528
- conversion-factor records: 60
- automated critical QA issues: 0
- source-complete projection candidates: 27
- evidence candidates: 18 B / 9 C
- verified records: 0

## Corrective change from v0.5.0

v0.5.0 hardcoded `B-candidate` for all complete projection rows. v0.5.1 exposes and tests `candidate_evidence_grade(match_quality)`:

- `A` → `B-candidate`
- all non-exact match classes, including `C`, cannot exceed `C-candidate`

Five automated tests pass. No source food, FDC ID, nutrient value, sample/laboratory result or QA finding changed.

All records remain `in_review` pending independent scientific sign-off.
