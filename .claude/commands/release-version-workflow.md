---
name: release-version-workflow
description: Workflow command scaffold for release-version-workflow in Neofit-ai.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /release-version-workflow

Use this workflow when working on **release-version-workflow** in `Neofit-ai`.

## Goal

Creates and documents a new data release version, including manifest, status, and release notes.

## Common Files

- `mobile/data/ifkb/releases/{version}/manifest.json`
- `mobile/data/ifkb/releases/{version}/README.md`
- `mobile/data/ifkb/releases/{version}/RELEASE_NOTES.md`
- `mobile/data/ifkb/releases/{version}/STATUS.md`
- `mobile/data/ifkb/releases/{version}/SUPERSEDED.md`
- `mobile/data/ifkb/README.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create new manifest.json under releases/{version}/
- Add or update README.md, RELEASE_NOTES.md, and/or STATUS.md under releases/{version}/
- Optionally, add SUPERSEDED.md if superseding a previous release
- Update main project README.md to reflect new release

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.