# NeoFit AI Mobile

NeoFit AI is a **personal, mobile-only, local-first** Expo application.

## Architecture

- **UI:** Expo Router + React Native
- **Local database:** `expo-sqlite` (`neofit.db`)
- **Sensitive secrets:** personal AvalAI and optional YouTube Data API keys in `expo-secure-store`
- **AI requests:** sent directly from the phone to AvalAI only when the user explicitly triggers an AI feature
- **Exercise tutorials:** official YouTube Data API search for public embeddable videos, ranked on-device and cached in SQLite
- **Iranian food data:** versioned on-device catalog with Persian/English search, serving ranges, custom foods, and local-first matching
- **Cloud backend:** none
- **Firebase:** none
- **Accounts / sign-in:** none
- **Subscriptions / billing:** none

Profile data, plans, meals, custom foods, weight, activity, workout sessions, set logs, AI request metadata, tutorial search results, and caches are stored on the device. Raw meal photos are not stored in SQLite.

## Run with Expo Go

Requirements:

- Node.js 22.13 or newer
- Android phone with Expo Go

```bash
cd mobile
npm ci
npx expo start
```

Scan the QR code with Expo Go. SQLite, SecureStore, ImagePicker, DocumentPicker, Sharing, Expo Image, and React Native WebView are used by the app.

## First use

1. Choose Persian or English.
2. Complete the six-step local profile: body and goal, training, nutrition, routine, health limitations, and review.
3. Open Settings → AI and video settings.
4. Enter a personal AvalAI API key and test the connection.
5. Optionally enter a personal YouTube Data API v3 key to enable ranked in-app tutorial search and playback.
6. Generate validated workout and nutrition plans.
7. Use the offline Iranian-food catalog or manual logging for daily nutrition.

API keys are not bundled into the app, are not stored in SQLite, and are not included in backups.

## Local food catalog

The first catalog version contains 83 common Iranian foods and can be extended with user-entered foods. Each mixed dish stores:

- Persian and English names and aliases
- a declared standard serving
- calories and macronutrients
- an uncertainty percentage and likely calorie range
- source and recipe-variability notes

Text meal lookup checks this local catalog before AvalAI. The catalog deliberately does not claim that every regional recipe has one exact calorie value.

## Workout tutorial agent

Each generated exercise stores canonical Persian/English names, movement pattern, muscles, equipment, tempo, RIR, form cues, common mistakes, and YouTube search queries. The tutorial agent:

- searches only on explicit exercise display/playback
- requests public, embeddable, syndicated videos
- retrieves duration, channel, publication, and view metadata
- ranks likely form-tutorial content on the phone
- displays the selected video below the exercise
- lets the user cycle results or open YouTube directly
- caches results locally to reduce repeated quota use

The app sends only the exercise search phrase to YouTube, not profile, health, workout history, or meal data.

## AI plan quality controls

Workout and nutrition generation use strict structured schemas and post-generation checks. Nutrition targets are calculated on-device before requesting a meal plan. The generated result is checked for issues such as:

- wrong day or meal count
- duplicate workout days
- unavailable equipment
- excessive session volume
- disliked exercises or foods
- allergy terms
- calorie-target deviation
- calorie/macronutrient inconsistency
- excessive meal repetition

A repair pass is requested only when quality checks find defects. Plans that still fail validation are not saved.

## Data durability

The database uses:

- schema migrations with `PRAGMA user_version`
- WAL journal mode
- foreign keys
- transactional workout/session writes
- resumable onboarding and workout drafts
- validated backup import with SQLite `integrity_check`
- automatic rollback when restore fails

Use Settings → Export backup to save a `.db` file outside the app. Removing the application may delete its local database, so backups are important. The exported SQLite file is not encrypted and must be kept private.

## Validation

```bash
npm test
npm run typecheck
npm run doctor
npx expo export --platform android
```

The `Mobile CI` GitHub Action runs package checks, deterministic tests, strict TypeScript, Expo Doctor, and Android export on every branch update and pull request.
