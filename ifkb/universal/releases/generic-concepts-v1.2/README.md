# IFKB Generic Concepts v1.2

This release adds a conservative Concept → Variant layer over the bundled USDA SR Legacy and FNDDS source records.

## Coverage

- generic source records: **13,225**
- generic concepts: **9,279**
- variant mappings: **13,225**
- mapping coverage: **100%**
- concepts with more than one variant: **1,321**
- concepts containing both SR Legacy and FNDDS records: **209**
- maximum variants in one concept: **76**

Every generic source record maps to exactly one concept. Records that cannot be safely decomposed remain identity-preserving one-record concepts; no source record is discarded.

## Identity refinement

The parser deliberately preserves identity-bearing segments before separating preparation variants. In particular:

- USDA meat-family marker `fresh` no longer collapses distinct cuts into a generic meat concept.
- `juice` and `concentrate` remain beverage identity terms and do not trigger an early variant split.
- cooking state, form, skin/bone state, and added-fat tags remain available on each source variant.

## Catalog artifact

- catalog version: **1.2.0**
- database size: **13,885,440 bytes**
- SHA-256: `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`

The generic concept audit must remain green before this layer is used as the app's grouped browse surface.
