# Build

## Requirements

- Node.js 22+
- For Android builds: JDK 21 + Android SDK (handled automatically on the
  GitHub Actions runner — see below for why local Android builds don't work
  in this development environment).

## Local development

```bash
npm install
npm run dev
```

Opens a Vite dev server with hot reload.

## Type-check, lint, test

```bash
npx tsc -p tsconfig.app.json --noEmit   # strict type-check (noUnusedLocals, etc.)
npm run lint                             # oxlint
npm run test                             # Vitest — the full suite in src/**/*.test.ts
```

All three must pass cleanly before a change is considered done — this
mirrors the project's own "fix compilation errors before proceeding" rule.

## Web production build

```bash
npm run build     # tsc -b && vite build → dist/
npm run preview   # serve dist/ locally to sanity-check the production bundle
```

## Android

### Why the APK isn't built locally

This project was developed in a remote sandbox whose network policy doesn't
allow reaching Google's Maven repository, which the Android Gradle plugin
needs. The Android project itself (`android/`) is fully set up and committed;
the actual APK compilation happens on GitHub Actions, where that repository
is reachable.

### Building the APK

The workflow `.github/workflows/racing-dynasty-android-apk.yml` (at the repo
root, not inside `racing-dynasty/`) runs automatically on every push that
touches `racing-dynasty/**`, and can also be triggered manually
(`workflow_dispatch`). It:

1. Installs dependencies (`npm ci`)
2. Type-checks and runs the test suite
3. Builds the web assets (`npm run build`)
4. Syncs them into the Capacitor Android project (`npx cap sync android`)
5. Builds a debug APK with Gradle
6. Uploads it as a workflow artifact (`racing-dynasty-debug-apk`)

To get the APK: open the workflow run on GitHub → Artifacts →
`racing-dynasty-debug-apk`.

### Building locally (on a machine with Android SDK + network access)

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/app-debug.apk
```

### Opening in Android Studio

```bash
npm run android:open   # npx cap open android
```

### Icon / splash

`resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732) are
the source images — an original "speed chevron + checkered flag" mark, no
copyrighted or downloaded art. The full per-density Android resource set was
generated from them with `@capacitor/assets` (`npx capacitor-assets generate
--android`) and is committed under `android/app/src/main/res/`. If you change
the source images, regenerate with:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
npm uninstall @capacitor/assets   # it's a one-shot generator, not a runtime dep
```

### Release build

A release build needs a signing key, which this repository does not include
(and shouldn't — never commit a keystore). To produce one:

1. Generate a keystore: `keytool -genkey -v -keystore release.keystore -alias racing-dynasty -keyalg RSA -keysize 2048 -validity 10000`
2. Configure signing in `android/app/build.gradle` (a `signingConfigs` block
   referencing the keystore via environment variables / Gradle properties,
   never hardcoded).
3. `./gradlew assembleRelease` (or `bundleRelease` for an `.aab` for Play
   Store submission).

Keep the keystore and its passwords out of version control (CI secrets or a
local, gitignored file).
