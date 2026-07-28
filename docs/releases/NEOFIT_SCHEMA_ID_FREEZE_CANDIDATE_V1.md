# NeoFit Schema and ID Freeze Candidate v1.1

## Status

**Candidate only — not the final release freeze.**

This document records the deterministic schema and identifier snapshot produced by Mobile CI after migration v5, catalog provenance, DS0 promotion controls and app-profile-to-canonical mapping were implemented.

Final freeze remains blocked by the source-reviewed replacement of DS0 profiles, the independent natural-query corpus, real-device recovery/Vision QA and final release governance.

## Reproducible build reference

- repository: `Emad211/Neofit-ai`
- pull request: `#3`
- head commit: `39bb3b00384354a7d8f20a22a91e88fdf6ebfd77`
- Mobile CI run: `30359903362` (`#463`)
- artifact: `neofit-schema-id-freeze-candidate`
- artifact id: `8688350258`
- artifact digest: `sha256:6e0ba52f79952a51679a967a58464e64af64e6d0be8d168ee898583deb9862a3`
- candidate format: `neofit-schema-id-freeze-candidate`
- candidate version: `1.1.0`
- candidate status: `candidate-not-final`

## Personal database schema candidate

- latest migration version: **5**
- migration count: **5**
- audited application tables: **23**
- audited SQLite objects: **43**
- schema fingerprint SHA-256:
  `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`

The fingerprint includes normalized migration SQL, tables, columns, primary-key positions, defaults, hidden-column flags, foreign keys, indexes and application triggers. Node CI uses a portable table substitute only when its SQLite build lacks FTS5; Expo/Android continues to use the production FTS virtual tables.

## Bundled catalog artifact

- IFKB catalog version: **1.2.0**
- SQLite bytes: **13,885,440**
- SQLite SHA-256:
  `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`

The actual asset hash and byte size matched both the bundled manifest and the runtime catalog-release contract.

## Generic source identifiers

- generic food ids: **13,225**
- generic food id-set SHA-256:
  `8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d`
- generic concept ids: **9,279**
- generic concept id-set SHA-256:
  `23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8`
- generic source-to-concept mappings: **13,225**
- generic mapping-set SHA-256:
  `6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9`

Mapping coverage is 13,225 / 13,225. The candidate records the exact set, not only the count.

## Iranian identifier namespaces

NeoFit currently has three related but distinct identifier namespaces:

1. **IFKB canonical ids** — `IFKB-CANON-*`
2. **83 legacy app-profile ids** — human-readable starter ids such as `ghormeh-sabzi`
3. **178 generated fallback app-profile ids** — ids such as `iranian-fallback-ifkb-canon-00084`

Direct string overlap with IFKB canonical ids is intentionally zero for both app-profile namespaces. Stability is therefore governed by an explicit one-to-one mapping, not by pretending the strings are identical.

### IFKB canonical ids

- count: **261**
- id-set SHA-256:
  `6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c`

### App profile ids

- total count: **261**
- combined id-set SHA-256:
  `0f86759cd45e9d3456cddb090e9ebd5a75c46f44a2fa9c6dc8b9fadd5c215f4a`

Legacy profile namespace:

- count: **83**
- id-set SHA-256:
  `b35f8936a5effab341775c3b7864aeaa5a190da8604e88c6b6e72b431b673e01`

Fallback profile namespace:

- count: **178**
- id-set SHA-256:
  `8dcd4aeaa07331043eeb25e47999e43956d9c78e640f220b0831fca805bf7560`

### App-profile → canonical mapping

- mapping count: **261**
- unresolved profiles: **0**
- ambiguous profiles: **0**
- mapping-set SHA-256:
  `ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71`

The mapping algorithm uses encoded fallback ids first, then exact normalized primary Persian names, then aliases only when no primary-name match exists. This prevents broad aliases such as «دیزی» or «دمی گوجه» from overriding a more specific primary identity.

## Persian alias registry

- alias rows: **218**
- alias-to-target mapping SHA-256:
  `9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e`

## Nutrient contract

The candidate also records the ordered Nutrition Core nutrient-key contract:

- `energyKcal`
- `proteinG`
- `carbsG`
- `fatG`
- `fiberG`
- `sugarsG`
- `sodiumMg`
- `cholesterolMg`
- `calciumMg`
- `ironMg`
- `potassiumMg`
- `vitaminCMg`

Changing order, names, migrations, schema objects, catalog ids, aliases or mappings changes the generated candidate fingerprint and must be reviewed as an explicit release-governance event.

## Conditions for final freeze

This candidate may be promoted to a final release freeze only after:

1. the 178 DS0 profiles are replaced or explicitly accepted through independently reviewed Promotion Bundles;
2. the real independent 500-query Persian corpus is collected, sanitized, annotated, adjudicated, frozen and evaluated;
3. real-device Android Vision and backup/recovery QA passes;
4. accessibility, RTL/LTR, performance and privacy review passes;
5. all accepted post-candidate schema or identifier changes are intentionally incorporated into a new candidate and reviewed.

Until then, these hashes are an auditable baseline, not a compatibility promise for a public stable release.
