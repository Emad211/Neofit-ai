# NeoFit Frontend Completion Plan

**Status:** Active implementation contract  
**Primary branch:** `revival/full-ui-front`  
**Current phase:** Phase 2 responsive verification, then Phase 3 Workout  
**Strategy:** complete the end-to-end product journey using backend-neutral local adapters first; connect Supabase, Nutrition Core and external APIs only after the frontend contract is complete.

## 1. Definition of frontend complete

A user must be able to enter/authenticate, finish onboarding, receive a visible plan, execute a workout, inspect and log nutrition, record body data, review progress, manage settings and use the NeoFit assistant without encountering dead actions, untranslated primary flows, missing states or broken routes.

Every route must support Persian RTL, mobile/tablet/desktop layouts, dark mode, accessible labels and appropriate loading, empty, error, offline and success states.

## 2. Current proven state

- Historical full Next.js UI is retained as the visual base.
- Obsolete Firebase, Genkit and App Hosting runtime is absent from the active frontend.
- The complete 15-step onboarding journey is implemented on one persistent local draft model.
- The injury step preserves the complete old front/back SVG body selector with 73 independently clickable regions.
- Onboarding review, staged analysis, explainable result, confirmation and activation into Today are complete.
- The shared mobile/desktop application shell is normalized.
- Today contains readiness, adherence, workout, meal, daily metrics, progress and timeline hierarchy.
- Quick Add supports meal, activity, weight, water and body measurements.
- Notification Center supports persistent read/unread state, mark-all-read and delete.
- Today has loading, error, empty and offline behavior.
- Mobile route and interaction QA is proven; explicit fixed-width tablet/desktop visual evidence remains before Phase 2 closure.
- Workout, Nutrition and Profile retain useful historical foundations.
- Progress, workout history/completion, nutrition history, settings, coach and final hardening remain incomplete.

Remaining estimate before backend integration: **35–60 development hours**, or **55–85 hours including full responsive/accessibility/browser QA**.

## 3. Delivery order

1. ~~Complete onboarding end-to-end.~~ **Completed**
2. **Application shell and Today — functional work completed; responsive evidence pending**
3. Complete Workout and Workout Player.
4. Complete Nutrition.
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

Onboarding contract:

- One versioned backend-neutral data model
- Persistent local draft and refresh resume
- Shared Persian RTL shell and 15-step progress
- Validation and conditional fields
- Full legacy injury-body visual preserved
- Medical safety copy without diagnostic claims
- Explicit restart support

### 4.3 Main application shell — functional implementation present

- Mobile sticky header and bottom navigation
- Desktop sticky header and right collapsible sidebar
- Navigation: Today, Workout, Nutrition, Progress, Profile
- NeoFit Coach and Notification entries
- Persistent unread notification counter
- Theme control
- Offline banner and `/offline` destination

### 4.4 Today — functional implementation present

- Greeting/date and readiness score
- Daily adherence summary
- Calories/protein/workout progress
- Today workout and direct start action
- Next meal and Nutrition action
- Persistent water, steps and sleep controls
- Current weight and Progress action
- Daily timeline
- Notification/reminder entry
- Quick Add: meal, activity, weight, water and measurement
- Daily motivation
- Route skeleton, recoverable error, empty timeline and offline feedback

### 4.5 Workout

- Weekly plan and rest days
- Day details: warm-up, exercises, sets/reps/rest/intensity
- Workout Player: media, technique, sets, load/reps, timer, previous/next/pause
- Exercise details, errors, safety, equipment and difficulty
- Constraint-aware alternatives
- Completion summary: duration, volume, calories, PRs, RPE, pain and notes
- History, records and repeat session

### 4.6 Nutrition

- Daily and weekly meal plans
- Calories, macros and exact portions
- Equivalent Iranian alternatives
- Recipes, serving scaling and preparation
- Search/library/manual/image food logging and portion selection
- Saved/recent/popular food library
- Shopping list
- Water and supplements
- Nutrition history and actual-vs-plan comparison

### 4.7 Progress

- Weight, target delta, adherence and workout count
- Weight/body measurement charts and entry flow
- Training volume, PRs, load progression and muscle coverage
- Calories/protein/adherence analytics
- Private progress photos
- Milestones, streaks and achievements
- Weekly/monthly reports

### 4.8 NeoFit Coach

- Independent chat route and suggested prompts
- Text and action cards
- Meal/exercise changes from conversation
- Program/progress summaries
- Conversation history
- Medical safety boundaries
- Loading, retry and offline states

### 4.9 Notifications

- Workout, meal, water, measurement, weekly report, program and account notifications
- Read/unread, delete and mark-all-read
- Per-category notification settings

### 4.10 Profile and settings

- Profile summary and read-only onboarding data
- Edit goal/body/health/lifestyle/nutrition/training/equipment/schedule
- Account identity and sessions
- Theme, language, units, week start and notifications
- Data export/delete, account deletion and consent history
- FAQ, support, issue report, version, terms and privacy

### 4.11 System states

- Route-specific skeletons and empty states
- Error/retry and offline
- 404, maintenance and expired session
- Confirmations, undo and unified toasts
- PWA install
- Keyboard and screen-reader support

## 5. Phase checklist

### Phase 1 — Onboarding

- [x] Shared onboarding data model and persistent state
- [x] Shared wizard shell and progress
- [x] Welcome, Goal, Basic details and Body measurements
- [x] Medical history
- [x] Full legacy injury body map and limitations
- [x] Lifestyle and Nutrition profile
- [x] Training history and Availability/equipment
- [x] Program preferences and Review
- [x] Analysis, Result and Confirmation
- [x] Route coverage, injury interaction, refresh resume and medical validation

### Phase 2 — App shell and Today

- [x] Normalize mobile/desktop application shell
- [x] Header, notification entry and Quick Add
- [x] Today readiness, calorie/macro and workout/meal hierarchy
- [x] Water, steps, sleep, weight and measurement cards
- [x] Timeline, reminders, adherence and daily summary
- [x] Loading, empty, error and offline states
- [x] Mobile browser route and interaction evidence
- [ ] Fixed-width tablet and desktop visual/interaction evidence

### Phase 3 — Workout

- [ ] Weekly plan and day-detail hierarchy
- [ ] Workout Player state and timer
- [ ] Exercise details and constraint-aware alternatives
- [ ] Completion summary and pain/RPE capture
- [ ] History, records and repeat session

### Phase 4 — Nutrition

- [ ] Daily/weekly plans
- [ ] Details/alternatives/recipes
- [ ] Logging/library/shopping/water/history

### Phase 5 — Progress and reports

- [ ] Weight and measurement charts using current local records
- [ ] Training/nutrition analytics
- [ ] Photos, milestones and reports

### Phase 6 — Profile, notifications and coach

- [ ] Profile/settings/privacy/support
- [ ] Per-category notification settings
- [ ] Coach UI/history/action cards

### Phase 7 — Hardening

- [ ] Loading/empty/error/offline states across remaining routes
- [ ] Responsive QA
- [ ] Accessibility QA
- [ ] PWA and final browser matrix

## 6. Exact continuation point

1. Add explicit Chromium evidence at tablet and desktop widths for AppShell, Today and Notification Center.
2. Verify sidebar visibility/collapse, desktop header, card grids, fixed Quick Add placement and absence of mobile bottom navigation at desktop width.
3. Correct any spacing or overflow defects and then mark Phase 2 complete.
4. Begin Phase 3 from the current Workout plan and Workout Player, preserving useful historical visuals while adding persistent session state, completion summary, alternatives and history.
5. Do not change the finished onboarding contract except for verified defects or documented product decisions.
