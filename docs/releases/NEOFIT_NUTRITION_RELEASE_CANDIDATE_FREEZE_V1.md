# NeoFit Nutrition Release Candidate Freeze v1

**Status:** nutrition release candidate frozen; application PR remains Draft until real-device release QA is complete  
**Freeze date:** 2026-08-03  
**Code baseline:** `6effaabd5d132a8e78732fca522cb54b3b890d76`  
**Official validation:** Mobile CI run 570 (`30773875994`) — success

## 1. Frozen nutrition scope

This freeze closes NeoFit Nutrition stages 1–10 for the app-ready release candidate. The following behavior is now part of the product contract:

- 13,225 USDA/FNDDS/SR Legacy generic food records are available locally.
- 9,279 stable generic concepts and 36,494 official portions are bundled.
- 13,224 generic records have complete calories and macros; the single incomplete record is excluded from selectable runtime results.
- All 261 Iranian canonical food identities have one-to-one app-profile mappings and usable local nutrition profiles.
- Stage 5 archetype estimates, Stage 6 controlled generic analogs, and Stage 7 legacy portion corrections are applied in deterministic order.
- The 30 Stage 7 portion corrections update only bundled `seeded` rows. Imported and custom user foods remain authoritative and are never overwritten.
- Text, LLM, Vision, and Vision+LLM routes may propose food identity, but nutrition is always calculated from the local catalog.
- AI-generated weekly meal plans must resolve every ingredient through IFKB/FNDDS/SR before persistence. If one ingredient remains unresolved after one controlled repair attempt, the entire plan is rejected and nothing is saved.
- Legacy AI nutrition plans remain readable, but one-tap meal logging is disabled until the plan is regenerated under the IFKB-resolved contract.
- Nutrition Diary, recipes, goals, history, export, backup, Merge restore, and Replace restore remain local-first.

## 2. Frozen catalog contract

| Field | Frozen value |
|---|---:|
| IFKB mobile catalog version | `1.2.0` |
| Database size | `13,885,440` bytes |
| Database SHA-256 | `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247` |
| Generic foods | `13,225` |
| Generic concepts | `9,279` |
| Generic portions | `36,494` |
| Iranian canonical identities | `261` |
| App-profile → canonical mappings | `261 / 261` |
| Unresolved mappings | `0` |
| Ambiguous mappings | `0` |
| App-profile mapping SHA-256 | `ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71` |
| Iranian Canon ID-set SHA-256 | `6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c` |

The 261 Iranian profiles are app-ready estimates with explicit evidence and confidence labels. This freeze does **not** claim laboratory or clinical-grade validation for every regional recipe.

## 3. Frozen personal database contract

| Field | Frozen value |
|---|---:|
| Latest migration | `5` |
| Migration count | `5` |
| Application tables | `23` |
| Audited SQLite objects | `43` |
| Schema fingerprint SHA-256 | `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf` |

Any future schema change requires a new migration, updated tests, and a new freeze version. Existing migrations must never be edited in place.

## 4. Frozen runtime image contract

| Field | Frozen value |
|---|---:|
| Image release | `0.19.0-stage8-runtime` |
| Licensed primary images | `24` |
| Explicit category placeholders | `9` |
| Built-in Iranian display coverage | `261 / 261` |
| Runtime image catalog SHA-256 | `c4516388846d31e7c9a9012132a1b1ed3c63bc95ce0074cad410d8b1732812b7` |
| Context/training images included | `0` |
| Nutrition Gold images | `0` |

Images are display-only identity references. Primary images retain creator, licence, source page, processing disclosure, and SHA-256 metadata. Foods without a primary image show an explicit `PHOTO PENDING` category placeholder rather than a misleading substitute.

## 5. Release evidence

The official run on the frozen Stage 8 baseline passed:

- deterministic TypeScript and SQLite tests;
- IFKB Python contracts;
- fail-closed DS2 normalization gate;
- complete 13,486-record catalog audit;
- Iranian source-discovery generation;
- app-ready Iranian dataset generation;
- Schema/ID freeze candidate generation;
- Expo package compatibility;
- Expo Doctor;
- strict TypeScript;
- Android export including Metro resolution of all bundled images.

Official artifacts from Mobile CI run 570:

| Artifact | ID | SHA-256 digest |
|---|---:|---|
| Schema/ID freeze candidate | `8841380964` | `eabef1e9e5bad5adf18936c5e4b380f2932e2e209c1f46ce6ef68a52435b6609` |
| App-ready Iranian dataset | `8841380711` | `6dedbf25ad083f634463bbcb6b6122ae19f2c85815c6b935272715df728a6ee4` |
| Full nutrition catalog audit | `8841379410` | `430429e662153afbe567cb007ca4c276d5aa4abccea8e81ea6f6d57cec73d754` |
| DS2 normalization report | `8841379082` | `d4e78e04a3e0b051867b331ccfb977339b7a30231967dc10bc7c12066c43a2d6` |

## 6. Change-control rules after this freeze

- Schema or ID changes require a versioned migration/freeze update.
- Nutrition-value refinements require preserved provenance, confidence, and source precedence; they must not silently overwrite imported or custom data.
- Image replacements may update the Stage 8 image release without changing nutrition values, Schema, or IDs.
- Vision and LLM provider output must never become stored nutrition evidence.
- A plan may be persisted only when its complete nutrition payload is derived from resolved local catalog records.

## 7. Remaining work before public release

These are release-validation tasks, not missing Nutrition implementation:

1. Real-device Android testing of camera/gallery consent, Vision, mixed plates, low-confidence confirmation, and offline recovery.
2. Real-device Backup Merge/Replace/rollback testing with large personal datasets.
3. Clean-install and upgrade testing from older app databases.
4. RTL/LTR, accessibility, performance, and privacy review on representative devices.
5. Final product-level decision to mark PR #3 Ready for Review and merge the mobile application branch.

Until those checks pass, the nutrition subsystem is a **frozen release candidate**, not a public production release.
