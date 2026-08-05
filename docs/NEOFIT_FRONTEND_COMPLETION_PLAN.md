# NeoFit Frontend Completion Plan

**Status:** Active implementation contract  
**Primary branch:** `revival/full-ui-front`  
**Current phase:** Phase 6 — Profile, Settings and Notifications  
**Strategy:** finish the frontend contract with simple backend-neutral local adapters first; connect Supabase, Nutrition Core and external APIs only after the product flows and browser gates are complete.

## 1. Definition of frontend complete

A user must be able to enter, finish Onboarding, receive and follow a visible plan, execute a workout, inspect and log nutrition, record body data, review progress, manage account/settings and use the NeoFit assistant without dead actions, untranslated primary flows, missing route states or broken navigation.

Every primary route must support Persian RTL, mobile/tablet/desktop layouts, dark mode, accessible labels and appropriate loading, empty, error, offline and success states.

## 2. Current proven state

- The historical full Next.js UI remains the visual foundation.
- Firebase, Genkit and App Hosting runtime are absent from the active frontend.
- Phase 1 Onboarding is complete across all 15 steps, including the original 73-region front/back injury map.
- Phase 2 App Shell, Today, Notification Center, Quick Add and shared offline behavior are complete.
- Phase 3 Workout is complete: weekly plan, Day Details, persistent Player, guide/alternatives, Completion, History, previous performance and personal records.
- Phase 4 Nutrition is complete: daily/weekly plan, details/recipe, alternatives, trusted portion logging, History, saved/recent foods, Shopping List, hydration and safe supplement state.
- Phase 5 Progress is complete: overview metrics, weight/waist/workout/calorie charts, exercise-specific progression, milestones, 7/30-day reports and private temporary photo previews.
- Progress reads existing `WeightLog`, `WorkoutLog`, `MealLog`, measurement, personal-record and Onboarding data. No Progress store or analytics service exists.
- Mobile, tablet and desktop gates prove Progress has no horizontal overflow and exposes all completed sections.
- Profile/Settings, notification preferences, Coach and final PWA/accessibility hardening remain incomplete.

Remaining estimate before backend integration: **8–18 development hours**, or **14–30 hours including full responsive/accessibility/browser QA**.

## 3. Delivery order

1. ~~Complete Onboarding end-to-end.~~ **Completed**
2. ~~Complete App Shell and Today.~~ **Completed**
3. ~~Complete Workout and Workout Player.~~ **Completed**
4. ~~Complete Nutrition.~~ **Completed**
5. ~~Complete Progress and reports.~~ **Completed**
6. **Complete Profile, Settings and Notifications — active**
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

- Full 15-step persistent Wizard
- Goal, identity/body, medical history and lifestyle
- Complete injury body map and limitations
- Nutrition/training preferences and availability
- Editable review, local analysis, explainable result and activation

### 4.3 Main App Shell and Today — implemented

- Mobile header and bottom navigation
- Desktop header and collapsible right Sidebar
- Today, Workout, Nutrition, Progress and Profile navigation
- Coach and Notification entries
- Persistent unread count and theme control
- Offline banner and `/offline`
- Readiness, adherence, workout/meal cards and timeline
- Persistent water, steps, sleep, weight and measurements
- Quick Add and route-specific states

### 4.4 Workout — implemented

- Persian weekly overview and rest days
- Dedicated `/workout/[id]` Day Details
- Warm-up, exercise order, sets/reps/rest and safety
- Previous performance hints
- Persistent Player and exact refresh resume
- Rest Timer, guide and constraint-aware alternatives
- Explicit Completion with duration, volume, RPE, pain and notes
- Personal-record detection and `/workout/history`
- Loading, empty and recoverable error states

### 4.5 Nutrition — implemented

- Persian daily/weekly hierarchy
- Daily calories, remaining calories and target macros
- Meal ingredients, recipe and equivalent alternatives
- Persistent planned-meal logging
- Daily History with target variance
- Trusted Food Library and portion scaling
- Recent/saved foods, Shopping List and hydration
- Safe supplement empty state
- Loading, empty and recoverable error states

Actual food macro totals must come from Nutrition Core; the frontend does not invent values for unknown foods.

### 4.6 Progress — implemented

- Current weight, change and target delta
- Latest waist and body-measurement count
- Weekly workout sessions and volume
- Weight, waist, workout-volume and daily-calorie charts
- Exercise selector with max-weight progression and session-volume summary
- Personal records and six derived milestones
- 7-day and 30-day summaries for workout, nutrition and weight
- Private temporary progress-photo preview with no upload or persistent image storage
- Loading, meaningful empty charts and recoverable error state
- Mobile/tablet/desktop browser evidence

### 4.7 Profile, Settings and Notifications — active

Target contract:

- Profile summary and read-only Onboarding data
- Edit body, health, lifestyle, nutrition, training, equipment and schedule
- Account identity and local session controls
- Theme, language, units and week-start settings
- Per-category notification preferences
- Data export/delete and account deletion boundaries
- Consent history, terms and privacy
- FAQ, support, issue report and version information
- Profile/Settings loading, empty and recoverable error states

### 4.8 NeoFit Coach

- Chat route and suggested prompts
- Text and action cards
- Meal/exercise changes from conversation
- Program/progress summaries
- Conversation history
- Medical safety boundaries
- Loading, retry and offline states

### 4.9 System hardening

Implemented through Progress:

- Route-specific loading
- Recoverable error/retry
- Meaningful empty states
- Shared offline feedback
- Responsive browser evidence

Remaining globally:

- Profile and Coach route states
- Maintenance and expired-session states
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

- [x] Weekly overview and Day Details
- [x] Persistent Player and rest timer
- [x] Guide and alternatives
- [x] Completion, pain/RPE/notes and personal records
- [x] History and repeat session
- [x] Workout route states and browser evidence

### Phase 4 — Nutrition

- [x] Daily/weekly plan and target summary
- [x] Details, alternatives and recipes
- [x] Planned and trusted-food logging
- [x] History, saved/recent foods and Shopping List
- [x] Hydration and safe supplement state
- [x] Nutrition route states and browser evidence

### Phase 5 — Progress and reports

- [x] Overview metrics
- [x] Weight and body-measurement trends
- [x] Workout-volume, personal records and exercise progression
- [x] Nutrition analytics
- [x] Milestones and achievements
- [x] Weekly/monthly reports
- [x] Private temporary progress photos
- [x] Progress route states and mobile/tablet/desktop gates

### Phase 6 — Profile, Settings, Notifications and Coach

- [ ] Profile summary and edit flows
- [ ] Account/settings/privacy/support
- [ ] Per-category notification settings
- [ ] Profile/Settings route states and browser gate
- [ ] Coach UI/history/action cards

### Phase 7 — Hardening

- [ ] Remaining route states
- [ ] Responsive QA for remaining areas
- [ ] Accessibility QA
- [ ] PWA and final browser matrix

## 6. Exact continuation point

1. Read `/profile`, `/profile/view`, `/profile/edit` and `/profile/account` before changing them.
2. Preserve useful existing profile/account UI and remove only verified dead actions.
3. First normalize the Profile landing page into a clear summary with direct Edit, Account, Settings, Privacy and Support entries.
4. Reuse the existing User Data context and Onboarding draft; do not create another profile store.
5. Complete the smallest functional edit/account/settings flows before adding notification preferences.
6. Add Profile-specific loading/error/empty states and one focused browser gate.
7. Keep completed Onboarding, Shell, Workout, Nutrition and Progress contracts unchanged except for verified defects.
