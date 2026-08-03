# IFKB Food Profile Promotion Contract v1

This contract defines the controlled path for replacing an app-continuity profile, including a DS0 broad fallback, with a stronger food-specific profile.

## Purpose

A promotion bundle overlays an existing stable food id without changing that identity. The runtime keeps `imported > seeded` precedence, stores record-level provenance and rebuilds the canonical Nutrition Core representation after the overlay is accepted.

Deleting or replacing an imported overlay restores the bundled profile for the same id when one exists and refreshes the canonical index from the final catalog state.

## Required provenance

Every bundle declares:

- a source label;
- a source version;
- either `verified_source` or `digital_consensus` evidence;
- a source-record id for every promoted food;
- a stable IFKB/app food id;
- a non-null serving weight;
- medium or high confidence;
- calories and macronutrients for that declared serving.

The bundle format is validated by both the TypeScript runtime contract and `food-profile-promotion.schema.json`.

## Safety rules

- `broad_fallback` and `user_entered` cannot be submitted as promoted evidence.
- A source labelled DS0 or broad fallback is rejected by the promotion parser.
- A promoted profile cannot remain low confidence.
- A promoted profile cannot omit serving weight.
- Duplicate food ids in one bundle are rejected.
- Promotion is merge-only; applying one bundle does not delete records from another source.
- Custom user foods cannot be overwritten by seeded or imported records.
- A later built-in reseed cannot downgrade an imported profile.
- Direct SQLite writes with invalid source/evidence combinations are rejected by migration-v5 triggers.

## Scientific interpretation

Passing this schema proves structural completeness and provenance linkage. It does **not** by itself prove that the cited source is scientifically adequate, that the serving is representative, or that the nutrition values are correct.

Source acquisition, extraction, unit normalization, recipe matching, uncertainty assignment and independent review remain separate IFKB governance steps. Only after those checks should a bundle use `verified_source` or `digital_consensus`.

## Runtime entry point

The internal service is:

`mobile/src/services/food-profile-promotion.ts`

It parses or accepts a versioned bundle, imports the records without deleting unrelated imports, writes each external `sourceRecordId`, and reseeds the canonical Nutrition Core from the final catalog.

This is an internal data-governance interface and is intentionally not exposed as a consumer control that could self-assign verified evidence.
