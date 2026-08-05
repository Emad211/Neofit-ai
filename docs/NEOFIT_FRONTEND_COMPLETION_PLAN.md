# NeoFit Frontend Completion Plan

**Status:** Frontend contract complete and browser-proven  
**Primary branch:** `revival/full-ui-front`  
**Active PR:** `#34` — Draft, not merged  
**Next program:** backend and production integration

## 1. Frontend Definition of Done

The frontend is considered complete when a user can:

- finish the full Onboarding flow;
- inspect the resulting program;
- execute and resume a workout;
- inspect, replace and log meals;
- record body and daily metrics;
- review progress and reports;
- manage local profile/settings/privacy controls;
- use the NeoFit Coach contract;
- recover from loading, empty, error, offline, missing-page and expired-session states;
- use the primary experience on mobile, tablet, desktop and keyboard.

All of these conditions are now implemented and covered by browser gates.

## 2. Completed product areas

### Phase 1 — Onboarding

- [x] Persistent 15-step Persian RTL Wizard
- [x] Goal, body, medical, lifestyle, nutrition and training inputs
- [x] Original front/back SVG injury map with 73 selectable regions
- [x] Review, staged analysis, explainable result and activation
- [x] Refresh-resume and medical acknowledgement validation

### Phase 2 — App Shell and Today

- [x] Mobile header and bottom navigation
- [x] Desktop collapsible right Sidebar
- [x] Readiness, adherence, workout, meal and timeline hierarchy
- [x] Quick Add for food, activity, weight, water and measurements
- [x] Persistent daily metrics and Notification Center
- [x] Shared offline feedback

### Phase 3 — Workout

- [x] Persian weekly overview and Day Details
- [x] Warm-up, exercise order, sets/reps/rest and safety notes
- [x] Persistent Workout Player with exact refresh resume
- [x] Rest Timer, guides and alternatives
- [x] Completion with duration, volume, RPE, pain and notes
- [x] History, repeat-session action and personal records

### Phase 4 — Nutrition

- [x] Daily/weekly plan and target summary
- [x] Ingredients, preparation, recipe and equivalent alternatives
- [x] Planned-meal and trusted-food logging
- [x] Portion scaling and meal-type selection
- [x] Daily History and target variance
- [x] Recent/saved foods, Shopping List and hydration
- [x] Safe supplement empty state

Unknown-food values are intentionally not invented. Real values must later come from Shared Nutrition Core.

### Phase 5 — Progress

- [x] Weight, target delta, waist and weekly workout summary
- [x] Weight, waist, workout-volume, calorie and exercise charts
- [x] Personal records and derived milestones
- [x] Seven-day and 30-day reports
- [x] Temporary private photo preview without upload or persistent image bytes

### Phase 6 — Profile, Settings, Notifications and Coach

- [x] Profile summary, Persian details and functional editing
- [x] Local display-name management
- [x] Removal of fake email/password and AI-regeneration actions
- [x] Persistent per-category notification preferences
- [x] JSON export and confirmed local-data deletion
- [x] Privacy boundary, FAQ, diagnostics and version information
- [x] Local Rule-based Coach with suggested prompts and manual input
- [x] Today, Workout, Nutrition and Progress action cards
- [x] Persistent local conversation history
- [x] Explicit no-online-model disclosure and medical safety boundary

### Phase 7 — Hardening

- [x] Custom Persian 404
- [x] Global recoverable error boundary
- [x] Maintenance and expired-session pages
- [x] Root Skip Link and focusable main target
- [x] Consistent three-pixel `focus-visible` outline
- [x] Reduced-motion support
- [x] Persian RTL Web App Manifest and scalable icon
- [x] Dependency-free Service Worker registration
- [x] Safe cache boundaries for API/Auth/Authorization/non-GET requests
- [x] Real Service Worker activation/control and offline reload test
- [x] Final mobile/tablet/desktop and regression matrix

## 3. Final validation evidence

```text
validated runtime head: fd717f49a3f7ee5afd0a2669a0f2ffdd575db237
UI Revival CI: 30994281464 — success
artifact: 8925545367
artifact digest: sha256:452b0847bb32894044ed4a797b5468dce14628e753ef6cdd63babed0ed4f1b76
static pages generated: 42/42
TypeScript: success
Production build: success
Mobile gate: success
Tablet/Desktop responsive gate: success
Workout regression gate: success
Nutrition regression gate: success
Progress regression gate: success
Profile/Settings regression gate: success
Coach safety/history/action gate: success
Manifest and icon: success
Service Worker registered, activated and controlling page: success
Offline reload: success
Skip Link and focus target: success
Visible keyboard focus: 3 px
Reduced motion: success
404/Maintenance/Session Expired: success
Unexpected page errors: 0
Unexpected console errors: 0
```

Expected browser messages generated intentionally while simulating offline mode and requesting a 404 are recorded separately and do not hide unexpected errors.

## 4. Scope boundary

This completion refers to the **frontend product contract and local preview adapter**. The following are not yet production-connected:

- Supabase Auth and real sessions;
- Supabase Postgres/RLS persistence;
- real multi-device synchronization;
- Shared Nutrition Core food resolution and macro totals;
- online Coach/API execution;
- private object storage for progress photos;
- real push notifications;
- final public production deployment/domain.

The current local data remains in browser storage by design.

## 5. Exact continuation point

1. Keep PR `#34` Draft and unmerged until the integration strategy is approved.
2. Create a dedicated integration branch from `revival/full-ui-front`; do not modify the proven frontend contract directly.
3. Replace the local adapters incrementally, in this order:
   1. Supabase Auth/session resolution;
   2. profile and Onboarding persistence with RLS;
   3. daily metrics, WorkoutLog, MealLog and WeightLog persistence;
   4. workout/nutrition plan persistence;
   5. Shared Nutrition Core food resolution;
   6. online Coach adapter while preserving the current UI/safety contract;
   7. private photo storage and push-notification delivery.
4. Preserve the current local adapter as a deterministic demo and fallback fixture.
5. Run the same browser gates after every adapter replacement.
6. Do not promote Production until the public URL, authentication, RLS and destructive-data flows are verified end-to-end.
