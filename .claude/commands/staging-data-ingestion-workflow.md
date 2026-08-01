---
name: staging-data-ingestion-workflow
description: Workflow command scaffold for staging-data-ingestion-workflow in Neofit-ai.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /staging-data-ingestion-workflow

Use this workflow when working on **staging-data-ingestion-workflow** in `Neofit-ai`.

## Goal

Adds new or updated staging data files for a specific release version, including source observations, QA summaries, and projections.

## Common Files

- `mobile/data/ifkb/staging/{version}/source-observations.csv`
- `mobile/data/ifkb/staging/{version}/qa-issues.csv`
- `mobile/data/ifkb/staging/{version}/food-qa-summary.csv`
- `mobile/data/ifkb/staging/{version}/selected-foundation-foods.csv`
- `mobile/data/ifkb/staging/{version}/mobile-projection-candidates.csv`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Add or update source-observations.csv, qa-issues.csv, food-qa-summary.csv, selected-foundation-foods.csv, or mobile-projection-candidates.csv under staging/{version}/
- If corrective, use new sub-version (e.g., 0.2.1, 0.5.1)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.