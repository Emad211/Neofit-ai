# NeoFit Frontend Completion Plan

**Status:** Active implementation contract  
**Primary branch:** `revival/full-ui-front`  
**Frontend strategy:** complete the full product journey with a backend-neutral local adapter first; replace adapters with Supabase/Nutrition Core/API integrations only after the UI is end-to-end complete.

## 1. Definition of frontend complete

A user must be able to move from entry/authentication through onboarding, receive a visible plan, execute a workout, inspect and log nutrition, record body data, review progress, manage profile/settings, and use the NeoFit assistant without encountering a dead button, empty placeholder, broken route, missing state, or untranslated primary flow.

Every route must include appropriate loading, empty, error, offline and success states; support Persian RTL, mobile/tablet/desktop layouts, dark mode, keyboard navigation and accessible labels.

## 2. Current proven state

- Historical full Next.js UI is restored as the visual base.
- Obsolete Firebase/Genkit/App Hosting runtime is removed from the active frontend.
- Today, Nutrition, Workout and Profile have usable visual foundations.
- Local demo adapters currently provide profile, plans, logs and deterministic helpers.
- Progress remains mostly incomplete.
- Onboarding is fragmented, partly English, URL-query based and does not form one reliable product journey.
- Notifications, reports, histories, system states and assistant UX are incomplete.

Estimated completion before backend integration: **60–90 development hours**, or **90–120 hours including full responsive/accessibility/browser QA**.

## 3. Delivery order

1. Complete onboarding end-to-end.
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

### 4.2 Onboarding — 15 steps

1. **Welcome:** product promise, expected completion time, privacy reassurance.
2. **Goal:** primary and secondary goals; weight loss, muscle gain, maintenance, readiness and lifestyle.
3. **Basic details:** name, age, gender, height, weight, country and units.
4. **Body measurements:** waist, hip, neck, optional body-fat estimate, target weight and optional photos.
5. **Medical history:** conditions, medication, blood pressure, diabetes, cardiac risk and medical warnings.
6. **Injuries and limitations:** affected area, severity, forbidden movements and free notes.
7. **Lifestyle:** occupation, sitting time, daily steps, sleep, stress, smoking and routine.
8. **Nutrition profile:** meals per day, Iranian food preferences, allergies, diet, exclusions, budget and cooking ability.
9. **Training history:** level, previous sports, training age, recent break and known movements.
10. **Availability and equipment:** home/gym, equipment, days, duration and preferred schedule.
11. **Program preferences:** intensity, cardio, resistance/functional preference, variety and nutrition strictness.
12. **Review:** grouped summary with edit links for every section.
13. **Analysis:** staged analysis feedback instead of a blank spinner.
14. **Initial result:** calorie target, macros, weekly training structure, health cautions and program rationale.
15. **Confirmation:** start date, reminders, final consent and entry into Today.

Onboarding requirements:

- Persistent draft in local storage now; backend-neutral adapter later.
- Shared shell, progress, step title, helper copy, back/continue actions.
- Validation and conditional questions.
- Safe medical copy without diagnostic claims.
- Resume after refresh and explicit reset/restart.

### 4.3 Main application shell

Bottom navigation: Today, Workout, Nutrition, Progress, Profile.  
Shared header: user identity, date, notifications, Quick Add and NeoFit Coach.  
Required: RTL, dark mode, mobile-first responsive behavior and consistent page width/spacing.

### 4.4 Today

- Greeting/date and readiness score
- Calories/macros summary
- Today workout and start action
- Next meal
- Water, steps, sleep and weight
- Daily timeline
- Daily adherence score
- Reminders and warnings
- Quick Add: meal, activity, weight, water, measurement
- Daily insight and end-of-day summary

### 4.5 Workout

- Weekly plan and rest days
- Workout day details: warm-up, exercises, sets/reps/rest/intensity
- Workout Player: active exercise, media, technique, sets, load/reps, rest timer, previous/next/pause
- Exercise details: target muscles, execution, errors, safety, equipment and difficulty
- Alternative exercise flow with reason and constraint matching
- Workout completion summary: duration, volume, estimated calories, PRs, RPE, pain and notes
- Workout history, records and repeat-session action

### 4.6 Nutrition

- Daily meals, calories and macros
- Weekly meal plan and adherence
- Meal details with exact portions
- Equivalent Iranian meal alternatives
- Recipe steps, time, servings and portion scaling
- Food logging: search, library, manual entry, image flow and portion selection
- Food library: categories, Iranian foods, saved, recent and popular
- Shopping list aggregation and check-off
- Water and supplement schedule
- Nutrition history and actual-vs-plan comparison

### 4.7 Progress

- Overview: weight, target delta, adherence and workout count
- Weight/body measurement charts and new-entry flow
- Training performance: volume, PRs, load progression and muscle coverage
- Nutrition performance: calories, protein and adherence averages
- Private progress photos and date comparison
- Milestones, streaks and achievements
- Weekly/monthly reports with strengths, risks and recommended next actions

### 4.8 NeoFit Coach

- Independent chat route
- Suggested prompts
- Text and action cards
- Change meal/exercise from conversation
- Program/progress summaries
- Conversation history
- Medical safety boundaries
- Loading, retry and offline states

### 4.9 Notifications

- Workout, meals, water, measurements, weekly report, program changes and account alerts
- Read/unread state, delete, mark all read
- Per-category notification settings

### 4.10 Profile and settings

- Profile summary
- Read-only onboarding data
- Edit goals, measurements, health, lifestyle, nutrition, training, equipment and schedule
- Account identity and active sessions
- Theme, language, units, week start and notification settings
- Privacy: export/delete data, delete account and consent history
- Support, FAQ, report issue, version, terms and privacy

### 4.11 System states

- Route-specific skeletons
- Empty states
- Error/retry states
- Offline page
- 404 and maintenance
- Expired session
- Confirmations, undo and consistent toasts
- PWA install
- Keyboard/screen-reader support

## 5. Phase checklist

### Phase 1 — Onboarding

- [ ] Shared onboarding data model and persistent state
- [ ] Shared wizard shell and progress
- [ ] Welcome
- [ ] Goal
- [ ] Basic details
- [ ] Body measurements
- [ ] Medical history
- [ ] Injuries
- [ ] Lifestyle
- [ ] Nutrition profile
- [ ] Training history
- [ ] Availability/equipment
- [ ] Program preferences
- [ ] Review
- [ ] Analysis
- [ ] Result
- [ ] Confirmation
- [ ] Browser tests for refresh/resume/back/forward/validation

### Phase 2 — App shell and Today

- [ ] Shared responsive shell
- [ ] Header/notifications/quick add
- [ ] Today cards and states
- [ ] Daily logging interactions

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

- [ ] Loading/empty/error/offline states
- [ ] Responsive QA
- [ ] Accessibility QA
- [ ] PWA and final browser matrix

## 6. Exact continuation point

Start with Phase 1. Replace the current query-string onboarding with one persistent onboarding context and shared wizard shell. Implement steps 1–4 first, retain compatibility redirects from legacy onboarding routes, then continue steps 5–15 without changing the agreed route/feature map unless a documented product decision requires it.
