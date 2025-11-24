# ALAN - Android APK Build Instructions

## Prerequisites
1. Node.js (v18+)
2. Android Studio (latest)
3. Java JDK 17

## Setup
1. Open terminal in this folder.
2. Install dependencies:
   ```bash
   npm install
   ```

## Build Steps
1. Compile the web application:
   ```bash
   npm run build
   ```
   *This creates a `dist` folder with the compiled assets.*

2. Initialize Android project:
   ```bash
   npx cap add android
   ```

3. Sync web assets to Android native layer:
   ```bash
   npx cap sync
   ```

4. Open in Android Studio:
   ```bash
   npx cap open android
   ```

## Finalizing APK
1. In Android Studio, wait for Gradle Sync to finish.
2. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. The APK will be generated in `android/app/build/outputs/apk/debug/app-debug.apk`.

## Permissions
The `AndroidManifest.xml` has been pre-configured for:
- Camera (Vision Layer)
- Microphone (Voice Layer)
- GPS (World Model)
- Storage (Memory Core)
