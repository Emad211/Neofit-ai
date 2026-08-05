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
- Phase 3 Workout is complete at frontend level: weekly plan, day details, persistent Player, guides, alternatives, completion feedback, history, previous performance, personal records and Workout route states.
- The Workout gate proves Day Details, refresh resume, exercise replacement, RPE/pain/note persistence, PR detection, active-session cleanup and History rendering.
- Exercise-level long-term charts belong to Phase 5 Progress rather than expanding the Workout area further.
- Nutrition and Profile retain useful historical foundations but still need product-flow completion.
- Progress, settings, coach and final PWA/accessibility hardening remain incomplete.

Remaining estimate before backend integration: **22–40 development hours**, or **36–62 hours including full responsive/accessibility/browser QA**.

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
- Dedicated `/workout/[id]` day details
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

Target contract:

- Daily and weekly meal-plan hierarchy
- Day totals and remaining calories/macros
- Exact portions and ingredient details
- Equivalent Iranian meal alternatives
- Recipe and preparation view
- Search/library/manual food logging and portion selection
- Saved and recent foods
- Shopping list
- Water and supplement summary
- Nutrition history and actual-vs-plan comparison
- Nutrition-specific loading, empty and recoverable error states

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

Implemented for Onboarding, Today, Shell and Workout:

- Route-specific loading
- Recoverable error/retry
- Empty states where applicable
- Offline feedback

Remaining globally:

- Nutrition, Progress, Profile and Coach states
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
- [x] Dedicated day-detail hierarchy
- [x] Persistent Workout Player and rest timer
- [x] Exercise guide and alternatives
- [x] Completion and pain/RPE/note capture
- [x] History and repeat session
- [x] Previous-performance hints and personal records
- [x] Workout-specific loading, empty and error states
- [x] End-to-end browser evidence

### Phase 4 — Nutrition

- [ ] Final daily/weekly hierarchy and macro summary
- [ ] Details, alternatives and recipes
- [ ] Logging, library, shopping list and history
- [ ] Nutrition-specific states and browser gate

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

1. Read the existing Nutrition page and components before changing them.
2. Preserve useful historical visuals and existing meal-details, alternatives, library and shopping-list work.
3. First normalize the Nutrition landing page into daily totals, remaining macros and a clear daily/weekly plan hierarchy.
4. Then close meal details, alternatives/recipes and logging flows without introducing a second data layer.
5. Reuse the current local User Data context; do not build a new store until a demonstrated limitation requires it.
6. Add only the Nutrition-specific loading/error/empty states and one focused browser flow.
7. Keep completed Onboarding, Shell and Workout contracts unchanged except for verified defects.
