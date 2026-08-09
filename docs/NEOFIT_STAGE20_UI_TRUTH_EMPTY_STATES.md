# NeoFit Stage 20 — UI Truth, Empty States and Data-Safety Polish

Status: **code/CI complete, Preview-only**; stacked on Stage 19. Hosted rendered/browser QA remains open.

## Goal

Make every visible control, label, metric and destructive action tell the same truth as the real data architecture. Stage 20 targets stale copy, decorative controls, unsupported inference, metric/date mismatch and destructive actions broader than their apparent scope.

## Fixes

### Today — stale Nutrition Plan copy removed

Today no longer says the Account Nutrition Plan is fixture-backed. Account copy now reflects the real versioned active plan, versioned catalog and explicit plan-meal logging. Guest remains clearly Demo-only.

### Nutrition catalog — fake filters removed

The old `اخیر / محبوب‌ها / ایرانی` chips did not have real corresponding sources/actions. They were removed instead of faked.

The filter row now contains only real current catalog categories:

- همه
- خورش
- برنج
- کباب
- آش و سوپ
- صبحانه

Every chip has actual state, `aria-pressed`, a real category predicate and truthful result count. Text search and category filter compose together. Empty results state says the catalog is still limited/versioned.

### Nutrition meal dialog — keyboard behavior

The meal sheet now focuses its close control when opened, closes with Escape, restores focus to its opener, exposes `aria-modal`/title/description and keeps mutation controls disabled while saving.

### Workout — unsupported `بعدی` inference removed

The first plan item is no longer labelled `بعدی`. The route does not yet have a separate schedule/history source that can prove which session is next. Account copy explicitly says the list is active-plan order only.

### Progress — metric/date binding fixed

Weight, waist and body-fat cards now each resolve their own latest measurement row. A newer weight-only measurement can no longer make the waist/body-fat card show a false date.

### Nutrition State — destructive reset and date-scope hardening

The Account `resetDiary()` path previously deleted **all** `nutrition_entries` rows for the user. Stage 20 scopes it to `user_id + local_date`.

Current contract:

- Account reset deletes only the current local date;
- other-day history is preserved;
- Guest reset replaces only current-day Demo entries;
- Today receives only `currentDiary` for the active local date;
- the local date refreshes on focus, visibility change and a one-minute timer;
- manual food logging uses UUID-backed client mutation ids instead of timestamp-only ids.

This is a data-safety fix, not cosmetic polish.

### App Shell — keyboard skip link

The shell now provides a visible-on-focus `رفتن به محتوای اصلی` link targeting a programmatically focusable `#screen-content`.

### Route-placeholder audit

Stage 20 CI recursively scans app routes and rejects any user-facing route still rendered through the historical generic `RoutePlaceholder` implementation.

## Important next gap discovered — Onboarding self-report semantics

`createEmptyOnboardingDraft()` currently contains several values that are valid user answers before the user explicitly chooses them, for example:

- activityLevel=`sedentary`
- sleepQuality=`average`
- stressLevel=`medium`
- smoking=`never`
- dietType=`balanced`
- trainingLevel=`beginner`
- location=`gym`
- daysPerWeek=`3`

Gender UI can also visually fall back to `prefer-not-to-say` while the stored value is still null.

Because Coach consumes Onboarding context, UI defaults must not silently become claimed self-report. Live Supabase inspection during Stage 20 found **zero `user_onboarding` rows**, so Stage 21 can redesign this contract before hosted user data exists instead of applying a superficial one-field patch.

## Final validation

Final Stage 20 implementation head before this documentation sync:

`7dc6aa82dbeff130df981036ab19fc3c19b1e471`

`UI Truth Audit CI` run `31323084673`: **success**

Passed:

- UI truth contracts;
- existing UI/accessibility regression;
- Nutrition Core adapter regression;
- Workout Player regression;
- full Supabase app regression;
- TypeScript;
- Next production build;
- hard UI-truth boundary gate.

CI now rejects stale fixture-backed Today copy, decorative Recent/Popular filters, fake next-workout labels, date-unscoped Nutrition reset, missing skip link and RoutePlaceholder-backed routes.

## Hosted proof still required

After the next single Preview deployment, perform rendered desktop/mobile QA of Today, Nutrition, Workout, Progress and App Shell keyboard behavior and confirm the latest stacked UI has no spacing/card-density regressions.

## Release rule

Preview only. Stage 20 fixes do not replace hosted E2E. Stage 21 should fix Onboarding self-report/default semantics before Onboarding becomes an authoritative input to Agent proposal/write workflows.
