# NeoFit Frontend Completion Plan

**Status:** Active implementation contract  
**Primary branch:** `revival/full-ui-front`  
**Current phase:** Phase 3 — Workout details and record intelligence  
**Strategy:** complete the end-to-end product journey using backend-neutral local adapters first; connect Supabase, Nutrition Core and external APIs only after the frontend contract is complete.

## 1. Definition of frontend complete

A user must be able to enter/authenticate, finish onboarding, receive a visible plan, execute a workout, inspect and log nutrition, record body data, review progress, manage settings and use the NeoFit assistant without encountering dead actions, untranslated primary flows, missing states or broken routes.

Every route must support Persian RTL, mobile/tablet/desktop layouts, dark mode, accessible labels and appropriate loading, empty, error, offline and success states.

## 2. Current proven state

- Historical full Next.js UI is retained as the visual base.
- Obsolete Firebase, Genkit and App Hosting runtime is absent from the active frontend.
- Phase 1 onboarding is complete, persistent and browser-tested across all 15 steps.
- The injury step preserves the complete old front/back SVG body selector with 73 independently clickable regions.
- Phase 2 application shell, Today, Notification Center, Quick Add and system states are complete.
- Fixed-width mobile, tablet and desktop gates prove the shared shell, Sidebar collapse, no horizontal overflow and correct mobile/desktop navigation behavior.
- Workout now has a Persian weekly overview, active-session resume, autosaved sets and navigation, exercise guide, alternatives, explicit completion feedback and persistent history.
- The Workout end-to-end gate proves resume after refresh, exercise replacement, completion, RPE/pain/note persistence, active-session cleanup and history rendering.
- Dedicated Workout day details and automatic personal-record detection remain before Phase 3 closure.
- Nutrition and Profile retain useful historical foundations.
- Progress, nutrition history, settings, coach and final PWA/accessibility hardening remain incomplete.

Remaining estimate before backend integration: **28–50 development hours**, or **45–75 hours including full responsive/accessibility/browser QA**.

## 3. Delivery order

1. ~~Complete onboarding end-to-end.~~ **Completed**
2. ~~Complete application shell and Today.~~ **Completed**
3. **Complete Workout and Workout Player — active**
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

### 4.3 Main application shell — implemented

- Mobile sticky header and bottom navigation
- Desktop sticky header and right collapsible Sidebar
- Navigation: Today, Workout, Nutrition, Progress, Profile
- NeoFit Coach and Notification entries
- Persistent unread notification counter
- Theme control
- Offline banner and `/offline` destination
- Mobile, tablet and desktop browser evidence

### 4.4 Today — implemented

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

### 4.5 Workout — active implementation

Implemented:

- Persian weekly overview, rest days and summary metrics
- Active-session banner and resume action
- Persistent Workout Player session, set logs, current exercise/set and start time
- Exit while preserving session or explicit discard
- Rest timer
- Exercise guide and constraint-aware alternatives
- Explicit completion summary with duration, volume, sets and exercise count
- RPE, pain scale and session notes
- Persistent Workout history and repeat-session action
- End-to-end browser evidence

Remaining:

- Dedicated day-detail route with warm-up, exercise order, targets, rest and safety notes
- Previous-performance hints for each exercise/set
- Personal-record detection and badges
- Workout history filtering and exercise-level progression views
- Final Workout-specific loading, empty and error states

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

Implemented now:

- Workout, meal, water and report notifications
- Persistent read/unread, delete and mark-all-read
- Shared unread counter in the shell

Remaining:

- Measurement, program and account notification types
- Per-category notification settings

### 4.10 Profile and settings

- Profile summary and read-only onboarding data
- Edit goal/body/health/lifestyle/nutrition/training/equipment/schedule
- Account identity and sessions
- Theme, language, units, week start and notifications
- Data export/delete, account deletion and consent history
- FAQ, support, issue report, version, terms and privacy

### 4.11 System states

Implemented for Today/shell:

- Route-specific skeleton
- Recoverable error/retry
- Empty timeline
- Offline banner and route

Remaining globally:

- Route-specific states across Workout, Nutrition, Progress, Profile and Coach
- Maintenance and expired session
- Confirmations, undo and unified toasts
- PWA install and Service Worker integration
- Keyboard and screen-reader final audit

## 5. Phase checklist

### Phase 1 — Onboarding

- [x] Full 15-step persistent wizard
- [x] Full legacy injury body map and limitations
- [x] Analysis, result and confirmation
- [x] Route, interaction, refresh-resume and medical validation evidence

### Phase 2 — App shell and Today

- [x] Mobile/desktop application shell
- [x] Header, notification entry and Quick Add
- [x] Today readiness, adherence, workout, meal and metric hierarchy
- [x] Water, steps, sleep, weight and measurement persistence
- [x] Timeline and daily progress
- [x] Loading, empty, error and offline states
- [x] Mobile browser interaction evidence
- [x] Fixed-width tablet and desktop visual/interaction evidence

### Phase 3 — Workout

- [x] Persian weekly overview and active-session banner
- [ ] Dedicated day-detail hierarchy
- [x] Persistent Workout Player state and rest timer
- [x] Exercise guide and constraint-aware alternatives
- [x] Completion summary and pain/RPE/note capture
- [x] History and repeat session
- [ ] Personal-record detection and exercise progression views
- [ ] Workout-specific system-state hardening

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
- [ ] Responsive QA for remaining product areas
- [ ] Accessibility QA
- [ ] PWA and final browser matrix

## 6. Exact continuation point

1. Add `/workout/[id]` as the dedicated Workout day-details route.
2. Show warm-up, ordered exercise cards, sets/reps/rest, movement guide access, previous logged performance and safety/injury notes.
3. Change weekly-plan cards and Today workout action to open day details first; keep an explicit Start Workout action.
4. Detect personal records during completion by comparing the current session with previous Workout logs and persist PR metadata.
5. Extend Workout history with PR badges and exercise-level progression summaries.
6. Add Workout loading/empty/error states and expand the Workout browser gate.
7. After Phase 3 closure, continue to Phase 4 Nutrition without changing the completed Onboarding or Shell contracts except for verified defects.
