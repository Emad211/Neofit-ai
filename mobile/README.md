# NeoFit AI Mobile

NeoFit AI is now a **personal, mobile-only, local-first** Expo application.

## Architecture

- **UI:** Expo Router + React Native
- **Local database:** `expo-sqlite` (`neofit.db`)
- **Sensitive secret:** personal AvalAI API key in `expo-secure-store`
- **AI requests:** sent directly from the phone to AvalAI only when the user explicitly triggers an AI feature
- **Cloud backend:** none
- **Firebase:** none
- **Accounts / sign-in:** none
- **Subscriptions / billing:** none

Profile data, plans, meals, weight, activity, workout sessions, set logs, AI metadata, and cache are stored on the device. Raw meal photos are not stored in SQLite.

## Run with Expo Go

Requirements:

- Node.js 22.13 or newer
- Android phone with Expo Go

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. SQLite, SecureStore, ImagePicker, DocumentPicker, and Sharing are supported in Expo Go.

## First use

1. Choose Persian or English.
2. Create the local fitness profile.
3. Open Settings → AvalAI connection.
4. Enter a personal AvalAI API key and test the connection.
5. Generate workout and nutrition plans.

The AvalAI key is not bundled into the app, is not stored in SQLite, and is not included in backups.

## Data durability

The database uses:

- schema migrations with `PRAGMA user_version`
- WAL journal mode
- foreign keys
- transactional workout/session writes
- validated backup import with SQLite `integrity_check`
- automatic rollback when restore fails

Use Settings → Export backup to save a `.db` file outside the app. Removing the application may delete its local database, so backups are important.

## Validation

```bash
npm run typecheck
npm run doctor
npx expo export --platform android
```

The `Mobile CI` GitHub Action runs the same validation on every branch update and pull request.
