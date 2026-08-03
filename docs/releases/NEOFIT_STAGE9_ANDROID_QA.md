# NeoFit Stage 9 — Android real-device QA

Status: **in progress**  
Scope: installable Android APK and field validation of the frozen Nutrition Release Candidate.

## Exact project position

Stages 7 and 8, IFKB-only AI meal-plan persistence, and the Schema/ID freeze are already integrated. The remaining critical work is real-device validation before the nutrition PR can become Ready for Review.

## AvalAI key contract

The app already supports the required key flow:

1. Open **Settings**.
2. Open **Configure AI and YouTube / تنظیم AvalAI و YouTube**.
3. Enter or replace the personal AvalAI key.
4. Save or run **Test connection**.
5. Remove the key when needed.

The key is stored with Expo SecureStore using `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. It is not stored in SQLite and is excluded from application backups. AvalAI requests read the key directly from SecureStore.

## Automated APK gate

The `Android QA APK` workflow must pass all of the following before an APK is accepted:

- locked dependency installation;
- AvalAI Settings → SecureStore → client contract checks;
- deterministic TypeScript and SQLite tests;
- Expo dependency compatibility;
- Expo Doctor;
- strict TypeScript;
- clean Expo Android prebuild;
- Gradle `assembleRelease`;
- embedded JavaScript/assets so the app starts without Metro;
- non-empty installable APK;
- directly usable SHA-256 file and build metadata.

The QA artifact uses the Android release variant so JavaScript and assets are embedded, but it is signed with the generated development/debug keystore. It is intended only for direct device testing and is not a Play Store production binary.

## Required physical devices

Record at least two devices before closing Stage 9.

| Device | Android version | Clean install | Upgrade install | Camera/Vision | Backup/Restore | RTL/Performance | Result |
|---|---|---:|---:|---:|---:|---:|---|
| Device A |  |  |  |  |  |  | pending |
| Device B |  |  |  |  |  |  | pending |

Prefer one mid-range Samsung-class phone and one device from another vendor or Android generation.

## Test sequence

### 1. Install and startup

- Install the APK directly, without Metro or development tools.
- Verify first launch, language selection, profile creation, and database seeding.
- Close and reopen the app twice; no duplicate seed or migration records may appear.

### 2. AvalAI Settings

- Enter a valid AvalAI key from Settings.
- Confirm the key field is masked.
- Save and reopen Settings; only stored/not-stored status should be shown, never the key.
- Test the connection and verify the credit response.
- Replace the key and retest.
- Remove the key and verify AI actions fail with a clear missing-key message.
- Export and restore a backup; the key must not be exported, replaced, or restored.

### 3. Vision and LLM

- Camera permission: deny once, then grant from system settings.
- Gallery permission and image selection.
- Single-food photo with strong local match.
- Mixed plate requiring explicit confirmation.
- Low-confidence or no-match image.
- Persian typo, colloquial name, and regional name through the LLM resolver.
- Verify that provider calories/macros are ignored and the final values come from IFKB/FNDDS/SR.

### 4. AI weekly nutrition plan

- Generate a complete seven-day plan.
- Verify every saved ingredient contains local catalog provenance.
- Log a resolved planned meal.
- Force an unresolved ingredient and verify the complete plan is rejected rather than partially saved.
- Verify a legacy pre-resolution plan remains readable but cannot be logged in one tap.

### 5. Offline and network failure

- Search and log local foods in airplane mode.
- Open images and placeholders offline.
- Trigger AI without a connection and verify a bounded error with no duplicate request.
- Interrupt a Vision request and verify no raw image or partial nutrition result is saved.

### 6. Backup and recovery

Test both Merge and Replace with a populated dataset:

- diary records;
- recipes, including nested valid recipes;
- goals and favorites;
- custom foods;
- workout and profile data.

Use one deliberately invalid backup and verify rollback leaves the existing database unchanged.

### 7. Migration and upgrade

- Install an older compatible APK containing a populated database.
- Install the current QA APK over it without uninstalling.
- Verify migration to version 5, one-time legacy meal import, preserved profile/data, and no duplicate records.
- Verify a future-version database is rejected rather than silently downgraded.

### 8. RTL, accessibility, and performance

- Persian RTL and English LTR navigation.
- Keyboard visibility on API key, search, quantity, and recipe forms.
- Screen-reader labels for key actions.
- Large text/font scaling.
- Scroll and search responsiveness with the complete catalog.
- Memory behavior during repeated image analysis.
- Startup time and database-seed time recorded on both devices.

## Stage 9 completion rule

Stage 9 is complete only when:

- the standalone APK workflow is green;
- the APK SHA-256 is recorded and verifies with `sha256sum -c neofit-stage9-qa.apk.sha256` from the artifact directory;
- both physical-device rows are completed;
- no release-blocking issue remains in AvalAI key handling, Vision/LLM, backup/restore, migration, RTL, accessibility, or performance.

Until then, PR #3 remains Draft even though the Nutrition implementation and dataset are frozen.
