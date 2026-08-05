# NeoFit Frontend Completion Plan

**Status:** Active implementation contract  
**Primary branch:** `revival/full-ui-front`  
**Current phase:** Phase 4 — Nutrition completion  
**Strategy:** complete the end-to-end frontend with simple backend-neutral local adapters first; connect Supabase, Nutrition Core and external APIs only after the frontend contract is complete.

## 1. Definition of frontend complete

A user must be able to enter, finish onboarding, receive and follow a visible plan, execute a workout, inspect and log nutrition, record body data, review progress, manage settings and use the NeoFit assistant without dead actions, untranslated primary flows, missing system states or broken routes.

Every primary route must support Persian RTL, mobile/tablet/desktop layouts, dark mode, accessible labels and appropriate loading, empty, error, offline and success states.

## 2. Current proven state

- Historical full Next.js UI remains the visual foundation.
- Firebase, Genkit and App Hosting runtime are absent from the active frontend.
- Phase 1 Onboarding is complete and browser-tested across all 15 steps.
- The injury step preserves the full old front/back SVG body selector with 73 clickable regions.
- Phase 2 App Shell, Today, Notification Center, Quick Add and offline/system states are complete.
- Fixed-width mobile, tablet and desktop gates prove correct navigation, Sidebar collapse and no horizontal overflow.
- Phase 3 Workout is complete: weekly plan, Day Details, persistent Player, guides, alternatives, completion feedback, History, previous performance, personal records and route states.
- Phase 4 Nutrition now has a Persian daily/weekly landing page, daily calorie status, initial macro targets, localized meal cards, ingredient/recipe details, equivalent meal replacement, persistent meal logging, shopping-list access and route loading/error states.
- The focused Nutrition gate proves landing hierarchy, details, recipe, replacement, logging, refresh persistence and shopping-list access without page or console errors.
- Nutrition History, manual portion-aware food logging, recent/saved food polish and supplement summary remain before Phase 4 closure.
- Progress, settings, coach and final PWA/accessibility hardening remain incomplete.

Remaining estimate before backend integration: **18–34 development hours**, or **30–54 hours including full responsive/accessibility/browser QA**.

## 3. Delivery order

1. ~~Complete Onboarding end-to-end.~~ **Completed**
2. ~~Complete App Shell and Today.~~ **Completed**
3. ~~Complete Workout and Workout Player.~~ **Completed**
4. **Complete Nutrition — active**
5. Build Progress and reports.
6. Complete Profile, Settings and Notifications.
7. Complete NeoFit Coach/Chat UI.
8. Complete system states, offline/PWA and accessibility.
9. Run the final responsive and interaction matrix.

## 4. Final route and feature map

### 4.1 Entry and authentication

- Splash/session resolution
- Login and registration
- Mobile/email verification
- Password recovery
- Terms, privacy and demo mode

### 4.2 Onboarding — implemented

1. Welcome and privacy reassurance
2. Primary/secondary goal and progress pace
3. Name, age, gender, height, weight, country and units
4. Waist, hip, neck, body-fat input, target weight and photo opt-in
5. Conditions, medication, pressure/diabetes/cardiac flags and physician restrictions
6. Full selectable front/back injury body map, severity, status, painful/forbidden movements and notes
7. Occupation, activity, sitting, steps, sleep, stress and smoking
8. Meals, diet, allergies, dislikes, Iranian foods, budget and cooking context
9. Level, training age, previous sports, break, familiar movements and experience
10. Home/gym, equipment, days, duration, preferred days/time and schedule notes
11. Intensity, cardio, training style, variety, nutrition strictness, coach tone and reminders
12. Editable grouped review
13. Staged local analysis
14. Explainable calories, macros, training structure, rationale and safety cautions
15. Start date, reminders, consent and activation into Today

### 4.3 Main App Shell — implemented

- Mobile sticky header and bottom navigation
- Desktop sticky header and right collapsible Sidebar
- Today, Workout, Nutrition, Progress and Profile navigation
- Coach and Notification entries
- Persistent unread count
- Theme control
- Offline banner and `/offline`
- Mobile, tablet and desktop browser evidence

### 4.4 Today — implemented

- Readiness and adherence
- Calories/protein/workout progress
- Workout and next-meal cards
- Persistent water, steps, sleep and weight
- Daily timeline and reminders
- Quick Add for meal, activity, weight, water and measurement
- Motivation
- Loading, error, empty and offline behavior

### 4.5 Workout — implemented

- Persian weekly overview, rest days and summary metrics
- Dedicated `/workout/[id]` Day Details
- Warm-up, ordered exercises, sets/reps/rest and safety notes
- Previous performance hints
- Explicit detail and start actions
- Persistent Workout Player, active-session resume and discard
- Rest timer, exercise guide and constraint-aware alternatives
- Completion duration, volume, sets and exercise count
- RPE, pain and notes
- Personal-record detection for max weight and exercise volume
- Recent PR cards and per-session PR badges
- Persistent History and repeat-session action
- Loading, empty and recoverable error states
- End-to-end browser evidence

Long-term load/volume charts are intentionally deferred to Progress rather than duplicated in Workout.

### 4.6 Nutrition — active

Implemented:

- Persian daily/weekly landing hierarchy
- Daily calorie target, logged calories, remaining calories and meal adherence
- Initial protein, carbohydrate and fat targets from the completed Onboarding plan
- Clear weekly cards with Persian dates, Today marker and daily adherence
- Ingredient quantities and recipe/preparation sheet
- Equivalent local meal alternatives
- Persistent planned-meal logging
- Persian Meal Cards with Details, Alternative and Log actions
- Removed the dead Remove-from-plan action
- Existing local Food Library and Camera preview retained
- Shopping list access
- Loading, empty and recoverable error states
- Focused browser evidence for details, replacement, logging, refresh persistence and shopping list

Remaining:

- Nutrition History and actual-vs-plan daily grouping
- Simple manual/library logging with portion selection
- Saved/recent food presentation
- Water and supplement summary
- Final Nutrition browser coverage and responsive review

Actual food macro totals must come from Nutrition Core later; the frontend must not invent protein, carbohydrate or fat values for meals that lack a trusted source.

### 4.7 Progress

- Weight, target delta, adherence and workout count
- Weight/body-measurement charts and entry flow
- Training volume, PRs, load progression and muscle coverage
- Calories/protein/adherence analytics
- Progress photos
- Milestones, streaks and achievements
- Weekly/monthly reports

### 4.8 NeoFit Coach

- Chat route and suggested prompts
- Text and action cards
- Meal/exercise changes from conversation
- Program/progress summaries
- Conversation history
- Medical safety boundaries
- Loading, retry and offline states

### 4.9 Notifications

Implemented:

- Workout, meal, water and report notifications
- Persistent read/unread, delete and mark-all-read
- Shared unread counter

Remaining:

- Measurement, program and account notification types
- Per-category settings

### 4.10 Profile and settings

- Profile summary and read-only Onboarding data
- Edit body, health, lifestyle, nutrition, training, equipment and schedule
- Account identity and sessions
- Theme, language, units, week start and notifications
- Data export/delete, account deletion and consent history
- FAQ, support, issue report, version, terms and privacy

### 4.11 System states

Implemented for Onboarding, Today, Shell, Workout and Nutrition:

- Route-specific loading
- Recoverable error/retry
- Empty states where applicable
- Offline feedback through the shared shell

Remaining globally:

- Progress, Profile and Coach states
- Maintenance and expired session
- PWA install and Service Worker integration
- Final keyboard and screen-reader audit

## 5. Phase checklist

### Phase 1 — Onboarding

- [x] Full 15-step persistent Wizard
- [x] Full legacy injury body map and limitations
- [x] Analysis, result and confirmation
- [x] Browser route, interaction, refresh-resume and medical validation evidence

### Phase 2 — App Shell and Today

- [x] Mobile/desktop App Shell
- [x] Header, Notifications and Quick Add
- [x] Today hierarchy and persistent metrics
- [x] Loading, empty, error and offline states
- [x] Mobile/tablet/desktop evidence

### Phase 3 — Workout

- [x] Persian weekly overview and active-session banner
- [x] Dedicated Day Details
- [x] Persistent Workout Player and rest timer
- [x] Exercise guide and alternatives
- [x] Completion and pain/RPE/note capture
- [x] History and repeat session
- [x] Previous-performance hints and personal records
- [x] Workout-specific loading, empty and error states
- [x] End-to-end browser evidence

### Phase 4 — Nutrition

- [x] Daily/weekly hierarchy and initial macro summary
- [x] Details, alternatives and recipes
- [x] Planned-meal logging and shopping-list access
- [x] Nutrition loading/error/empty states
- [x] First focused browser flow
- [ ] Nutrition History and actual-vs-plan grouping
- [ ] Portion-aware manual/library logging and saved/recent foods
- [ ] Water/supplement summary and final Nutrition gate

### Phase 5 — Progress and reports

- [ ] Weight and measurement charts
- [ ] Training volume, PR and exercise progression
- [ ] Nutrition analytics
- [ ] Photos, milestones and reports

### Phase 6 — Profile, Notifications and Coach

- [ ] Profile/settings/privacy/support
- [ ] Per-category notification settings
- [ ] Coach UI/history/action cards

### Phase 7 — Hardening

- [ ] Remaining route states
- [ ] Responsive QA for remaining areas
- [ ] Accessibility QA
- [ ] PWA and final browser matrix

## 6. Exact continuation point

1. Add `/nutrition/history` by grouping the existing `MealLog` records by day; do not create another store.
2. Show daily logged calories, planned target, variance and individual meals.
3. Link the Nutrition landing page to History.
4. Reuse the current Food Library for a minimal portion-aware manual logging path rather than building a new library architecture.
5. Add recent/saved food presentation only if the existing local data contract can support it directly.
6. Keep actual meal macros explicitly unavailable until Nutrition Core supplies trusted values.
7. Extend the focused Nutrition gate and then decide whether Phase 4 can close.
