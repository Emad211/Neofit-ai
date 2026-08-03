# IFKB v0.12.1 Operational Capture Kit

This release converts image-coverage and split-readiness gaps into executable capture assignments.

## Contents

- 60 P0 class targets
- 130 independent capture assignments
- 100 consent-record slots
- 180 capture-session slots
- 540 image-shot slots
- 360 component-weight slots
- mobile capture payload schema
- privacy, identity, split-group and Nutrition Gold validator
- five passing validator tests

## Evidence boundary

This release contains no newly captured images and no Nutrition Gold records. Empty registries and targets are operational plans, not evidence.

Private consent and exact-location records must remain outside public/model exports. Every physical dish instance and all its views must remain in one split group. User-only labels cannot become Gold.

## Readiness tiers

- R0: fewer than three independent groups — reference only
- R1: at least three groups and two providers — prototype holdout only
- R2: at least five groups and three providers — provisional grouped split
- R3: at least ten groups and four providers — benchmark candidate after OOD and class-balance audit

## Next gate

Execute consented capture assignments, record measured servings/components and link accepted images to recipe batches and recipe versions.
