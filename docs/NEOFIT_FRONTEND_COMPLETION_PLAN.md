# NeoFit Frontend Completion Plan

**Status:** Active implementation contract  
**Primary branch:** `revival/full-ui-front`  
**Current phase:** Phase 2 — application shell and Today  
**Strategy:** finish the complete product journey with backend-neutral local adapters first; replace those adapters with Supabase, Nutrition Core and API integrations only after frontend completion.

## 1. Definition of frontend complete

A user must be able to enter/authenticate, finish onboarding, receive a visible plan, execute a workout, inspect and log nutrition, record body data, review progress, manage settings and use the NeoFit assistant without encountering dead actions, untranslated primary flows, missing states or broken routes.

Every route must support Persian RTL, mobile/tablet/desktop layouts, dark mode, accessible labels and appropriate loading, empty, error, offline and success states.

## 2. Current proven state

- Historical full Next.js UI is retained as the visual base.
- Obsolete Firebase, Genkit and App Hosting runtime is absent from the active frontend.
- The complete 15-step onboarding journey is implemented on one persistent local draft model.
- The injury step restores the full legacy front/back SVG body selector with 73 independently clickable regions.
- Onboarding includes review, staged analysis, explainable initial result, reminder/start confirmation and activation into Today.
- Draft resume after refresh and required medical acknowledgement are browser-tested.
- Today, Nutrition, Workout and Profile retain usable foundations.
- Progress, notification center, histories, complete system states and assistant UX remain incomplete.

Remaining estimate before backend integration: **45–70 development hours**, or **70–100 hours including full responsive/accessibility/browser QA**.

## 3. Delivery order

1. ~~Complete onboarding end-to-end.~~ **Completed**
2. Normalize design system and application shell.
3. Complete Today.
4. Complete Workout and Workout Player.
5. Complete Nutrition.
6. Build Progress and reports.
7. Complete Profile, Settings and Notifications.
8. Complete NeoFit Coach/Chat UI.
9. Complete system states, offline/PWA and accessibility.
10. Run full responsive and interaction QA.

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
10. Home/gym, equipment, days, session duration, preferred days/time and schedule notes
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

### 4.3 Main application shell

Bottom navigation: Today, Workout, Nutrition, Progress, Profile.  
Shared header: user identity, date, notifications, Quick Add and NeoFit Coach.  
Required: mobile-first responsive layout, RTL, dark mode and consistent page width/spacing.

### 4.4 Today

- Greeting/date and readiness score
- Calories/macros summary
- Today workout and start action
- Next meal
- Water, steps, sleep and weight
- Daily timeline and adherence
- Reminders/warnings
- Quick Add: meal, activity, weight, water and measurement
- Daily insight and end-of-day summary

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
- Per-category settings

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
- [x] Welcome
- [x] Goal
- [x] Basic details
- [x] Body measurements
- [x] Medical history
- [x] Full legacy injury body map and limitations
- [x] Lifestyle
- [x] Nutrition profile
- [x] Training history
- [x] Availability/equipment
- [x] Program preferences
- [x] Review
- [x] Analysis
- [x] Result
- [x] Confirmation
- [x] Browser route coverage, injury interaction, refresh resume and medical validation

### Phase 2 — App shell and Today

- [ ] Normalize responsive application shell
- [ ] Header, notification entry and Quick Add
- [ ] Today readiness, calorie/macro and workout/meal hierarchy
- [ ] Water, steps, sleep, weight and measurement cards
- [ ] Timeline, reminders, adherence and end-of-day summary
- [ ] Loading, empty, error and offline states
- [ ] Browser interaction and responsive evidence

### Phase 3 — Workout

- [ ] Plan/day details/player
- [ ] Alternatives/details/completion
- [ ] History and PR views

### Phase 4 — Nutrition

- [ ] Daily/weekly plans
- [ ] Details/alternatives/recipes
- [ ] Logging/library/shopping/water/history

### Phase 5 — Progress and reports

- [ ] Charts and measurements
- [ ] Training/nutrition analytics
- [ ] Photos, milestones and reports

### Phase 6 — Profile, notifications and coach

- [ ] Profile/settings/privacy/support
- [ ] Notification center/settings
- [ ] Coach UI/history/action cards

### Phase 7 — Hardening

- [ ] Loading/empty/error/offline states across all routes
- [ ] Responsive QA
- [ ] Accessibility QA
- [ ] PWA and final browser matrix

## 6. Exact continuation point

Begin Phase 2 from the current historical `AppShell` and Today route. First define one normalized responsive shell contract for desktop and mobile, then refactor Today into the agreed hierarchy without removing existing useful cards. Add notification entry and Quick Add behavior before extending daily metrics. Keep the finished onboarding contract unchanged except for defect fixes or documented product decisions.
