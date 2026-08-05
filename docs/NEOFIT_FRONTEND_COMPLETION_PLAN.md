# NeoFit Frontend Completion Plan

**Status:** Active implementation contract  
**Primary branch:** `revival/full-ui-front`  
**Current phase:** Phase 7 — final hardening  
**Strategy:** complete and prove the frontend with backend-neutral local adapters; connect Supabase, Nutrition Core and external APIs only after the frontend contract is stable.

## 1. Definition of frontend complete

A user must be able to enter, complete Onboarding, inspect the generated plan, execute workouts, follow and log nutrition, record body data, review progress, manage local settings and use the NeoFit Coach without dead actions, misleading promises, untranslated primary flows or broken routes.

Primary routes must be Persian RTL, usable on mobile/tablet/desktop, dark-mode compatible, keyboard accessible and equipped with suitable loading, empty, error, offline and success states.

## 2. Proven current state

- Historical complete Next.js UI remains the visual foundation.
- Firebase, Genkit and App Hosting runtime are absent.
- Phase 1 Onboarding is complete across 15 steps, including the original 73-region front/back injury map.
- Phase 2 App Shell, Today, Quick Add, Notifications and shared offline feedback are complete.
- Phase 3 Workout is complete: weekly plan, Day Details, persistent Player, guides, alternatives, Completion, History and personal records.
- Phase 4 Nutrition is complete: daily/weekly plan, details/recipe, alternatives, trusted portion logging, History, saved/recent foods, Shopping List and hydration.
- Phase 5 Progress is complete: overview, five charts, exercise progression, milestones, 7/30-day reports and private temporary photo previews.
- Phase 6 Profile/Settings/Notifications/Coach is complete:
  - Persian profile summary, read-only details and functional editing;
  - local account-name management without fake email/password actions;
  - persistent per-category notification preferences;
  - JSON export, confirmed local-data deletion, privacy boundary, FAQ and diagnostics;
  - local Rule-based Coach using current browser data, persistent history, action links and medical safety boundary.
- Browser gates currently prove all completed phases with zero page/console errors.

Remaining estimate before backend integration: **4–10 development hours**, or **8–16 hours including final browser/accessibility QA**.

## 3. Delivery order

1. ~~Onboarding end-to-end.~~ **Completed**
2. ~~App Shell and Today.~~ **Completed**
3. ~~Workout and Workout Player.~~ **Completed**
4. ~~Nutrition.~~ **Completed**
5. ~~Progress and reports.~~ **Completed**
6. ~~Profile, Settings, Notifications and Coach.~~ **Completed**
7. **System states, PWA, accessibility and final matrix — active**

## 4. Route and feature map

### 4.1 Entry and authentication

Frontend preview currently exposes a demo/local account boundary. Real login, registration, verification, password recovery and multi-device sessions belong to the later Supabase Auth integration.

### 4.2 Onboarding — implemented

- Persistent 15-step Wizard
- Goal, identity/body, health and lifestyle
- Complete injury Body Map and movement limitations
- Nutrition/training preferences and availability
- Editable review, local analysis, explainable result and activation

### 4.3 App Shell and Today — implemented

- Mobile header/bottom navigation and desktop collapsible Sidebar
- Coach, Notifications, unread count and theme control
- Readiness, adherence, workout/meal cards and timeline
- Persistent water, steps, sleep, weight and measurements
- Quick Add and shared offline feedback

### 4.4 Workout — implemented

- Weekly overview and `/workout/[id]` Day Details
- Warm-up, sets/reps/rest, safety and previous performance
- Persistent Player and exact refresh resume
- Rest Timer, guide and alternatives
- Completion with duration, volume, RPE, pain and notes
- Personal records and `/workout/history`

### 4.5 Nutrition — implemented

- Daily/weekly plan, calorie target and target macros
- Ingredients, recipe and equivalent alternatives
- Planned-meal and trusted-food logging
- Daily History and target variance
- Portion scaling, recent/saved foods and Shopping List
- Hydration and safe supplement empty state

Actual nutrition values for unknown foods must come from Nutrition Core; the frontend does not invent them.

### 4.6 Progress — implemented

- Weight, target delta, waist and weekly workout summary
- Weight, waist, workout-volume, calorie and exercise-progression charts
- Personal records and derived milestones
- 7-day and 30-day summaries
- Temporary local progress-photo previews without upload or persistent image bytes

### 4.7 Profile, Settings and Notifications — implemented

- Profile summary and Persian read-only details
- Functional editing of current local profile
- Local display-name management
- Clear boundaries for unavailable real account actions
- Per-category notification preferences
- Theme control
- JSON export and confirmed deletion of local NeoFit data
- Privacy explanation, FAQ, diagnostics and version information
- Loading/error states and focused browser evidence

### 4.8 NeoFit Coach — implemented local contract

- Suggested prompts and manual text input
- Today, Workout, Nutrition and Progress summaries from existing local records
- Action links to relevant routes
- Persistent local history capped at 50 messages
- Confirmed clear-history action
- Explicit offline/local badge and no-online-model disclosure
- Medical safety response and link to health limitations
- Loading/error states and focused browser evidence

The later online Coach must replace only the response adapter while preserving the current UI, safety boundary and action-card contract.

### 4.9 Phase 7 hardening — active

Required:

- custom 404 and global recoverable error boundary;
- maintenance and expired-session states;
- Skip Link and consistent visible keyboard focus;
- reduced-motion support and landmark checks;
- Web App Manifest and simple Service Worker without API/Auth/non-GET caching;
- install prompt only when the browser exposes it;
- final mobile/tablet/desktop route and interaction matrix;
- final document synchronization and exact continuation point for backend integration.

## 5. Phase checklist

### Phase 1 — Onboarding
- [x] 15-step persistent Wizard
- [x] Legacy 73-region injury selector
- [x] Analysis, result and confirmation
- [x] Browser evidence

### Phase 2 — Shell and Today
- [x] Mobile/desktop shell
- [x] Today hierarchy and Quick Add
- [x] Notifications and offline feedback
- [x] Responsive evidence

### Phase 3 — Workout
- [x] Overview, Day Details and persistent Player
- [x] Guide, alternatives and Completion
- [x] History and personal records
- [x] Route states and browser evidence

### Phase 4 — Nutrition
- [x] Plans, details, alternatives and logging
- [x] History, trusted portions and saved/recent foods
- [x] Shopping List, hydration and safe supplement state
- [x] Route states and browser evidence

### Phase 5 — Progress
- [x] Overview and five data charts
- [x] Exercise progression and records
- [x] Milestones and 7/30-day reports
- [x] Temporary private photo previews
- [x] Responsive/browser evidence

### Phase 6 — Profile, Settings, Notifications and Coach
- [x] Profile summary, details and functional edit flow
- [x] Local account/settings/privacy/support
- [x] Per-category notification preferences
- [x] JSON export and confirmed local deletion
- [x] Profile route states and browser gate
- [x] Local Coach prompts, history, action links and safety boundary
- [x] Coach route states and browser gate

### Phase 7 — Hardening
- [ ] 404/global error/maintenance/session-expired states
- [ ] Skip Link, focus and reduced-motion hardening
- [ ] Manifest, Service Worker and install prompt
- [ ] Final accessibility checks
- [ ] Final route/interaction matrix
- [ ] Backend-integration handoff

## 6. Exact continuation point

1. Add custom `not-found`, `global-error`, `/maintenance` and `/session-expired` pages without introducing a new state framework.
2. Add one root Skip Link, a focus target and global `:focus-visible`/reduced-motion rules.
3. Add a simple manifest, SVG application icon, Service Worker and registration component; do not add a PWA dependency.
4. Cache only safe same-origin GET navigation/static assets; bypass API, Auth/Authorization and non-GET requests.
5. Extend the existing browser workflows rather than creating overlapping CI.
6. Run final mobile/tablet/desktop and keyboard checks before declaring the frontend complete.
7. Keep all completed product contracts unchanged except for proven defects.
