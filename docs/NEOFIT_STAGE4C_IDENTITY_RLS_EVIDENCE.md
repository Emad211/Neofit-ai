# NeoFit Stage 4C — Identity Schema and RLS Evidence

**Status:** implementation and remote verification complete; Draft PR remains unmerged  
**Date:** 5 Aug 2026  
**Issue:** #25  
**PR:** #33  
**Branch:** `stage4c/identity-schema-rls`  
**Validated head:** `c5cface86f46134a4a0afcfc3c980f7ce613ee7a`  
**Project ref:** `rjwrobltmjodfarnltal`

## 1. Scope completed

Stage 4C adds only the identity-owned database foundation:

```text
supabase/migrations/20260804232149_identity_foundation.sql
web/lib/supabase/database.types.ts
web/tests/supabase-identity-schema.test.ts
.github/workflows/supabase-identity-ci.yml
```

The existing Stage 4B foundation regression was updated so later versioned migrations are allowed while secret material and permissive RLS remain forbidden.

Stage 4C does not add Nutrition persistence, Auth UI, AI/Vision, Service Role Browser use, private storage or Production promotion.

## 2. Migration authority and drift correction

The migration was applied remotely through the Supabase migration API as:

```text
remote version: 20260804232149
remote name: identity_foundation
```

An earlier repository draft used the planned filename:

```text
20260805000100_identity_foundation.sql
```

The SQL content matched, but the filename did not match remote migration history. The repository migration was renamed to the exact remote version:

```text
20260804232149_identity_foundation.sql
```

No DDL was re-applied during this correction.

## 3. Schema contract

Remote `public` Application tables:

```text
profiles       RLS enabled
user_settings  RLS enabled
```

Ownership:

- `profiles.id` references `auth.users(id)` with cascade deletion.
- `user_settings.user_id` references `auth.users(id)` with cascade deletion.

Bounded fields:

- profile display name: trimmed length `1..80` or null;
- locale: `fa | en`;
- timezone: trimmed length `1..64`;
- theme: `system | light | dark`;
- units: `metric | imperial`.

Both tables include `created_at` and `updated_at`. A shared `security invoker` trigger function updates `updated_at`, uses an empty `search_path`, and is revoked from `public`.

## 4. RLS and grants

Remote policy introspection returned exactly eight own-row policies:

```text
profiles_select_own
profiles_insert_own
profiles_update_own
profiles_delete_own
user_settings_select_own
user_settings_insert_own
user_settings_update_own
user_settings_delete_own
```

All policies target `authenticated` only.

- SELECT/DELETE policies use `auth.uid()` ownership predicates.
- INSERT policies use `WITH CHECK`.
- UPDATE policies use both `USING` and `WITH CHECK`.
- no `USING (true)` or `WITH CHECK (true)` policy exists.

Remote grants:

- `authenticated`: SELECT, INSERT, UPDATE, DELETE on both tables;
- `anon`: no table grant;
- `PUBLIC`: no table grant.

## 5. Runtime denial proof

The Project had zero Auth users, so runtime RLS was tested with temporary UUID-owned rows inside a single SQL execution. Foreign-key triggers were bypassed only for temporary seed/cleanup by session-local replication mode. No Auth account was created.

Passed scenarios:

```text
anon_read_denied              permission denied before row visibility
user_a_reads_own              visible own rows = 1
user_a_cannot_read_b          visible cross-user rows = 0
user_a_cannot_update_b        affected rows = 0
user_a_cannot_delete_b        affected rows = 0
user_a_cannot_insert_as_b     RLS WITH CHECK denied insert
ownership_change_denied       RLS WITH CHECK denied ownership change
```

Post-test cleanup verification:

```text
profiles_count: 0
user_settings_count: 0
auth_user_count: 0
```

No temporary test row or user remained.

## 6. Generated database types

`web/lib/supabase/database.types.ts` was generated directly from the live Project schema.

It contains:

- `profiles` Row/Insert/Update types;
- `user_settings` Row/Insert/Update types;
- no Nutrition table type.

The file was not manually approximated.

## 7. Advisors

Supabase Advisors after migration and policy verification:

```text
Security lints: 0
Performance lints: 0
```

## 8. CI evidence

Supabase Identity Schema CI:

```text
Run: 30996283909 — success
Artifact: 8926287946
Digest: sha256:192ae440dfb98fb2329249fb3b1f0c881841b5774d2ec642c63efdd6f34fcfe9
```

Supabase Foundation regression:

```text
Run: 30996283993 — success
Artifact: 8926292359
Digest: sha256:528deb7235762d631751f5a6d8b469fe6a7291e49900b6e2f30c7c4f0ee9b549
```

Web CI:

```text
Run: 30996283899 — success
Artifact: 8926312456
Digest: sha256:60064bab80150fcb72c0952d29a2466625d4b11d1dcd667ee2d628d617deecc2
```

Vercel Build Contract:

```text
Run: 30996283903 — success
```

Proven in CI:

- identity migration contract `7/7`;
- Stage 4B foundation regression;
- strict Web TypeScript;
- Shared Nutrition Core regression;
- no key material or permissive policy;
- Next.js production build and existing Web/PWA gates.

## 9. Security boundary

- no publishable or privileged key value is committed;
- no Service Role credential is used in Browser code;
- both exposed User-owned tables have RLS enabled;
- anon has no table grant;
- migration is the schema authority;
- generated types reflect the live schema;
- Nutrition arithmetic remains outside SQL and inside Shared Nutrition Core.

## 10. Exact continuation point

1. Keep PR #33 unmerged until explicit approval.
2. Synchronize Master Plan, Progress Log, Stage 4 Plan, Handoff and Issue #25 with this evidence.
3. After merge, mark Stage 4C complete and Stage 4D active-next.
4. Stage 4D must start with migrations/RLS tests for Nutrition persistence before new remote DDL.
5. The complete frontend on PR #34 must be integrated through a dedicated branch from the current Web architecture; do not merge the two divergent branches directly.
6. Preserve the local frontend adapter as a deterministic demo while replacing persistence incrementally.
