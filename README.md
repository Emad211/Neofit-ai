# NeoFit AI

NeoFit AI is a personal, bilingual, mobile-only fitness and nutrition application.

The active application lives in [`mobile/`](mobile/README.md).

## Current architecture

- Expo SDK 57 / React Native
- Persian and English
- SQLite database on the phone
- SecureStore for the personal AvalAI API key
- No Firebase
- No cloud backend
- No accounts or sign-in
- No subscription or billing system

All profile data, generated plans, meals, activities, weights, workouts, completed sets, and application settings stay on the device. Only AI requests explicitly started by the user are sent to AvalAI.

## Run

```bash
cd mobile
npm install
npx expo start
```

Use Expo Go on an Android phone to scan the QR code.

## Validate

```bash
cd mobile
npm run typecheck
npm run doctor
npx expo export --platform android
```

See [`mobile/README.md`](mobile/README.md) for database, backup, and AvalAI setup details.
