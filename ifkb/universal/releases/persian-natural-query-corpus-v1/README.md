# IFKB Independent Persian Natural-Query Corpus v1

## Current status

**Contract and validator ready; frozen corpus not yet released.**

No 500-row corpus is included here yet. The existing generated alias benchmark must not be copied, expanded or relabelled as this independent corpus.

## Purpose

This release gate measures search behaviour on sanitized Persian food queries that were not generated from the controlled alias registry. It is the evidence surface for the locked product thresholds:

- Top-1 accuracy at least 90%;
- Top-5 accuracy at least 97%;
- explicit evaluation of abstention and ambiguity.

The controlled 500-query alias benchmark remains a separate deterministic regression test.

## Accepted source kinds

- `consented_user_query` — query collected with a documented research/QA basis;
- `support_transcript_sanitized` — a support or testing query after privacy sanitization;
- `expert_authored_challenge` — a manually authored edge case, capped at 100 rows in the final 500.

Generated aliases, model-generated queries and paraphrases produced from the alias registry are not accepted source kinds.

## Annotation requirements

Every row requires:

- a stable `case_id`;
- the sanitized query text;
- expected route: `iranian_canon`, `generic` or `abstain`;
- expected target for non-abstain cases;
- phenomenon tags;
- ambiguity class;
- source batch and collection basis;
- `privacy_reviewed=true`;
- two different annotators;
- one adjudicator;
- `annotation_status=adjudicated`.

Raw names, phone numbers, email addresses, URLs, account identifiers and unreviewed transcript context must never be committed.

## Locked release distribution

A frozen release contains exactly 500 rows and must include at least:

- 400 rows from natural source kinds;
- 250 Iranian-canon routes;
- 100 generic routes;
- 50 abstain routes;
- 50 typo cases;
- 50 colloquial or regional cases;
- 100 preparation or portion cases;
- 50 ambiguous or negative cases.

These are product-governance coverage gates, not claims about population prevalence.

## Files

- `template.csv` — header-only collection template;
- `../../natural_query_corpus.py` — validator, privacy checks and deterministic fingerprint;
- `../../test_natural_query_corpus.py` — validator regression tests.

The future frozen release should add:

- `queries.csv`;
- `validation-report.json`;
- an evaluation report tied to the exact IFKB catalog version/SHA and app commit;
- a manifest containing the corpus fingerprint and reviewer sign-off.

## Validation

Draft validation:

```bash
python ifkb/universal/natural_query_corpus.py \
  --input path/to/draft.csv \
  --report build/natural-query-draft-report.json
```

Frozen release validation:

```bash
python ifkb/universal/natural_query_corpus.py \
  --input ifkb/universal/releases/persian-natural-query-corpus-v1/queries.csv \
  --report ifkb/universal/releases/persian-natural-query-corpus-v1/validation-report.json \
  --release \
  --expected-count 500
```

A valid structural report does not establish search accuracy. The frozen corpus must then be evaluated against the production search route and the exact bundled catalog artifact.
