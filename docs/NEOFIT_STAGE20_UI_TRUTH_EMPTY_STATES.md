# NeoFit Stage 20 — UI Truth, Empty States and Data-Safety Polish

Status: implementation / Preview-only; stacked on Stage 19. This stage removes user-facing claims and controls that looked more complete than the actual data source.

## Goal

Make the UI tell the same truth as the backend architecture.

Stage 20 is not a redesign for aesthetics alone. It targets five classes of product debt:

1. stale copy after a backend gap was already fixed;
2. decorative controls with no working source/action;
3. UI labels that infer user state without evidence;
4. metric/date mismatches;
5. destructive state operations broader than their apparent scope.

## Today — stale Nutrition Plan copy

The Today screen still told users that Nutrition Plan was `fixture-backed`, even though Stage 17/18 replaced the account source with versioned persistence and deterministic plan-to-diary logging.

Stage 20 removes the stale implementation note.

Current copy is account-aware:

- Account: versioned active plan + versioned catalog + explicit plan-meal logging.
- Guest: clearly labeled Demo only.

This prevents the product from looking unfinished after the underlying gap was already solved.

## Nutrition catalog — dead filters removed

The previous UI rendered these chips:

- همه
- اخیر
- محبوب‌ها
- ایرانی

Only `همه` had any effective behavior. `اخیر` and `محبوب‌ها` had no real history/popularity source, and `ایرانی` was not wired to a meaningful category predicate.

Stage 20 does **not** fake these features.

The filter row now uses only real current catalog categories:

- همه
- خورش
- برنج
- کباب
- آش و سوپ
- صبحانه

Every chip has real state, `aria-pressed`, a category predicate and a truthful result count. Text search and category filter compose together.

The empty state explicitly says that the current catalog is still limited/versioned rather than pretending broad coverage.

## Nutrition meal dialog accessibility

The meal sheet now:

- focuses its close control when opened;
- closes with Escape;
- restores focus to the food result that opened it;
- exposes `aria-modal`, labelled title and evidence description;
- keeps save/close controls disabled while an account write is pending.

This improves keyboard behavior without changing the Nutrition Core authority.

## Workout — fake “next session” label removed

The Workout screen previously styled the first plan day as `بعدی` even though the route did not load a schedule or completion history capable of proving what session was actually next.

Stage 20 removes that inference.

For authenticated plans, the screen now explicitly says that the order is the active plan order and NeoFit does not guess a “next” session until a separate schedule/history source exists.

## Progress — metric date truth

The screen correctly found the latest waist measurement, but rendered the date from the latest **overall** measurement. A newer weight-only row could therefore make the waist card display a false date.

Stage 20 now resolves separate rows for:

- latest weight;
- latest waist;
- latest body-fat percentage.

Each metric's date comes from the same row as its value.

## Nutrition State — date scope and destructive reset

A more serious state-layer issue was found during the UI audit.

The Account `resetDiary()` path deleted every `nutrition_entries` row for the user. This was much broader than a day-level UI reset should ever be.

Stage 20 changes the contract:

- Account reset is scoped to `user_id + local_date`;
- other-day history is preserved;
- Guest reset only resets Demo entries for the current local day;
- the state value exposed to Today is filtered to the current local date;
- local date updates on focus/visibility/one-minute timer so an open browser does not keep showing the previous day's Timeline indefinitely;
- manual food logging uses a UUID-backed client mutation id rather than a timestamp-only identifier.

This is data-safety hardening, not just UI polish.

## App Shell — keyboard skip link

Stage 20 adds a visible-on-focus `رفتن به محتوای اصلی` skip link targeting `#screen-content`.

The destination is programmatically focusable with `tabIndex=-1`.

The Stage 19 global focus-visible/reduced-motion baseline remains active.

## Route-placeholder audit

Stage 20 CI recursively scans app route source and rejects any route still rendered through the old generic `RoutePlaceholder` component.

The component file can remain as dead historical code until cleanup, but it must not be a user-facing route implementation.

## Onboarding data-truth gap discovered — deliberately moved to Stage 21

The Stage 20 audit found a deeper issue in Onboarding that should not be hidden by a cosmetic patch.

`createEmptyOnboardingDraft()` currently supplies several valid categorical values before the user explicitly chooses them, for example:

- `activityLevel = sedentary`
- `sleepQuality = average`
- `stressLevel = medium`
- `smoking = never`
- `dietType = balanced`
- `trainingLevel = beginner`
- `location = gym`
- `daysPerWeek = 3`

The Gender step also visually falls back to `prefer-not-to-say` while the stored value is still null.

These defaults can blur the boundary between UI defaults and actual self-report, especially because Coach later consumes Onboarding context.

Live Supabase audit during Stage 20 found **zero `user_onboarding` rows**, so the next stage can redesign the draft/version/validation contract without migrating real hosted user data.

Stage 20 therefore records this as a dedicated next-stage data-truth problem instead of silently changing meanings in-place.

## Validation contract

`UI Truth Audit CI` runs:

- Stage 20 UI-truth source contracts;
- existing accessibility/UI regression;
- Nutrition Core adapter regression;
- Workout Player regression;
- complete Supabase app regression;
- TypeScript;
- Next production build;
- hard truth-boundary grep checks.

The new audit rejects:

- stale `fixture-backed` copy in Today;
- dead Recent/Popular Nutrition chips;
- fake `بعدی` Workout label;
- Nutrition reset without local-date scoping;
- missing skip link;
- app routes using `RoutePlaceholder`.

## Release rule

Preview only. UI truth fixes do not replace hosted E2E. Stage 21 should address Onboarding defaults/self-report semantics before Agent proposal/write flows use Onboarding as authoritative user intent.
