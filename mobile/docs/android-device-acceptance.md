# NeoFit Android Device Acceptance

Run this checklist on a real Android phone before merging the mobile rebuild or producing a release build. Record the device model, Android version, build type, date, and result for every case.

## Test environment

- [ ] Fresh install test completed
- [ ] Upgrade/migration test completed from an older NeoFit local database
- [ ] Persian test completed
- [ ] English test completed
- [ ] Wi-Fi test completed
- [ ] Mobile-data test completed when available
- [ ] Airplane-mode/offline test completed

## 1. First launch and language

- [ ] Fresh install opens the language screen instead of guessing silently
- [ ] Persian immediately applies RTL and natural Persian copy
- [ ] English immediately applies LTR
- [ ] Force-closing and reopening preserves the selected language
- [ ] Changing language later updates tabs, forms, cards, and generated-content requests
- [ ] No clipping occurs around the status bar, navigation bar, keyboard, or display cutout

**Release blocker:** wrong direction, inaccessible controls, unreadable text, or first-launch loop.

## 2. Six-step onboarding

- [ ] Every step validates impossible numeric values
- [ ] Optional measurements can remain empty
- [ ] Preferred training-day count matches selected training days
- [ ] Allergies, dislikes, health flags, pain, injury, medication, cooking, budget, and schedule are preserved
- [ ] Force-close on every step and verify the draft resumes on the same step
- [ ] Final review matches entered data
- [ ] Saving creates one local profile and routes to Today
- [ ] Editing an existing profile does not erase fields that were not changed

**Release blocker:** lost health constraints, broken draft recovery, or profile values changing silently.

## 3. Local database and migration

- [ ] Fresh database reaches the latest `PRAGMA user_version`
- [ ] WAL and foreign keys are enabled
- [ ] Built-in food seed count is at least 83
- [ ] An older v1 database migrates without losing profile, plans, meals, activity, weight, workouts, or set logs
- [ ] Old workout plans load with safe default exercise metadata
- [ ] Database health check reports success

**Release blocker:** migration failure, data loss, foreign-key failure, or corrupted database.

## 4. AvalAI configuration and requests

- [ ] Personal key saves to SecureStore and is not shown again
- [ ] Connection test returns the selected endpoint and available credit when provided by the service
- [ ] Invalid key, no network, timeout, rate limit, malformed JSON, and invalid structured output show distinct recoverable errors
- [ ] Timeout does not silently issue a duplicate billable generation
- [ ] Removing the key disables AvalAI features without deleting local data
- [ ] Plan generation clearly informs the tester that entered profile/health constraints are sent to AvalAI for that request

**Release blocker:** key leakage, duplicate paid requests, silent invalid output, or saving a plan that failed validation.

## 5. Workout generation quality

Use at least these profiles:

- [ ] beginner, home, bodyweight only
- [ ] intermediate, full gym
- [ ] user with knee pain and disliked squats
- [ ] user with a relevant health flag
- [ ] Persian and English output

For every generated plan:

- [ ] exact requested day count and unique day indexes
- [ ] plausible duration and total working sets
- [ ] only available equipment
- [ ] no disliked exercise
- [ ] pain/health constraints reflected conservatively
- [ ] canonical Persian/English exercise names present
- [ ] movement pattern, muscles, equipment, level, tempo, RIR, rest, cues, mistakes, and video queries present
- [ ] no instruction to push through pain or claim medical clearance
- [ ] a failed quality check does not replace the previously active plan

## 6. YouTube tutorial agent

- [ ] Missing key shows configuration and direct-search fallback
- [ ] Valid personal key passes the test search
- [ ] Exercise lookup returns only public embeddable videos
- [ ] Title, channel, thumbnail, duration, and selected result render correctly
- [ ] Inline playback starts only after the user taps Play
- [ ] Fullscreen playback works
- [ ] Next result changes selection and persists it
- [ ] Open in YouTube launches the correct video
- [ ] A cached result appears without a new search after app restart
- [ ] Regenerating a plan with the same canonical exercise reuses the cache
- [ ] Quota exhaustion preserves cached playback and shows a useful message
- [ ] Wrong exercise variation can be replaced by cycling or direct search
- [ ] Profile, health, meal, and workout-history data are not present in YouTube requests

**Release blocker:** unplayable embedded player, leaking personal data, or repeatedly consuming search quota for the same cached exercise.

## 7. Iranian food catalog

- [ ] Persian and English aliases find the same item
- [ ] Category filtering works
- [ ] `100 گرم`, `دو پرس`, `نصف`, `1.5`, Persian digits, and Arabic digits scale correctly
- [ ] Base calories, likely range, and macros update with serving multiplier
- [ ] Logging a catalog item updates Today and Progress locally
- [ ] Custom food can be created, found, logged, exported, and deleted
- [ ] Built-in/custom foods cannot be overwritten by an imported dataset
- [ ] A valid `neofit-food-catalog` JSON file imports transactionally
- [ ] Invalid JSON, wrong format/version, duplicate IDs, invalid nutrients, more than 10,000 foods, and files above 25 MB are rejected without changing the current imported dataset
- [ ] A second import replaces only the previous imported dataset
- [ ] Catalog export round-trips without duplicating built-in/custom entries
- [ ] Removing imported data leaves built-in/custom entries intact

**Release blocker:** incorrect serving scaling, partial import after validation failure, or loss of custom/built-in foods.

## 8. Manual and AvalAI food logging

- [ ] Manual meal logging works in airplane mode
- [ ] Text lookup uses a strong local catalog match before AvalAI
- [ ] Weak/no local match uses AvalAI only when configured
- [ ] User can compare a local match with an AvalAI estimate
- [ ] Camera permission denial is handled
- [ ] Gallery cancellation is handled
- [ ] Raw food photo is not retained in SQLite
- [ ] Photo result states serving assumptions and confidence
- [ ] Major calorie/macro inconsistency downgrades confidence
- [ ] Logged result updates Today and Progress

## 9. Workout player and idempotent completion

- [ ] Current exercise shows cues, mistakes, tempo, RIR, rest, and tutorial card
- [ ] Reps and weight validation rejects impossible values
- [ ] Bodyweight value `0` is accepted
- [ ] Every completed set is added to the resumable draft
- [ ] Force-close during a set, between sets, and during rest; verify correct recovery
- [ ] Rest countdown and final haptics work
- [ ] Final session and set rows commit transactionally
- [ ] Simulate dashboard-refresh failure after commit; completion still reports the session saved
- [ ] Simulate draft-cleanup failure and retry; the same stable session ID updates instead of creating a duplicate
- [ ] Today and Progress totals refresh after reload

**Release blocker:** duplicate sessions, lost completed sets, or false “save failed” after a committed transaction.

## 10. Backup, restore, and reset

- [ ] Exported `.db` opens through Android sharing UI
- [ ] API keys are absent from the database backup
- [ ] Valid backup restores all local tables and passes `integrity_check`
- [ ] Invalid/non-SQLite file is rejected
- [ ] Corrupted backup triggers rollback to the previous live database
- [ ] Restored custom/imported foods and video cache appear
- [ ] Full reset removes profile, plans, logs, drafts, caches, catalog additions, AvalAI key, YouTube key, and language-selected flag
- [ ] Built-in food seed is recreated after reset

**Release blocker:** failed rollback, secrets in backup, or incomplete reset.

## Acceptance record

- Device:
- Android version:
- Build/commit:
- Tester:
- Date:
- Passed cases:
- Failed cases:
- Release blockers:
- Notes/screenshots:
