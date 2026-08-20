# Play Store release guide — Hotspot Messenger

Step-by-step guide to publish the Android app on Google Play.

## Prerequisites

- Google Play Developer account ($25 one-time fee)
- [Android Studio](https://developer.android.com/studio) installed
- JDK 21 (bundled with Android Studio)

## Step 1 — Create a signing key (one time)

Run in PowerShell from the project root:

```powershell
keytool -genkeypair -v `
  -keystore android/hotspot-messenger-release.jks `
  -alias hotspot `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storetype JKS
```

**Important:** Back up `hotspot-messenger-release.jks` and your passwords somewhere safe. You cannot update the app on Play Store without this file.

## Step 2 — Configure signing

```powershell
copy android\keystore.properties.example android\keystore.properties
```

Edit `android/keystore.properties` with your passwords. This file is gitignored.

## Step 3 — Build the release AAB

```powershell
npm run cap:sync
npm run android:release
```

Output AAB:

```
android/app/build/outputs/bundle/release/app-release.aab
```

## Step 4 — Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. **Create app** → name: Hotspot Messenger
3. Complete **App content**:
   - Privacy policy URL: host your `privacy.html` or link to GitHub `docs/PRIVACY-POLICY.md`
   - Data safety: declare local network use, camera (QR), notifications
4. **Store listing** — copy text from `store-listing/`:
   - `short-description.txt` (80 chars)
   - `full-description.txt`
5. **Graphics** (required):
   - App icon: 512×512 PNG (use `public/icons/icon-512.png`)
   - Feature graphic: 1024×500 PNG
   - Phone screenshots: at least 2 (1080×1920 or similar)
6. **Release → Testing → Internal testing**
   - Create release → upload `app-release.aab`
   - Add testers by email
7. After testing, promote to **Production**

## Step 5 — Version updates

Before each new release, bump in `android/app/build.gradle`:

```gradle
versionCode 2        // integer, must increase every upload
versionName "1.0.1"  // user-visible version
```

## Screenshots tips

Capture on a real phone or emulator:

1. Connect screen (server URL)
2. Group chat with messages
3. DM conversation
4. Settings / QR join
5. Dark mode (optional)

## Checklist

- [ ] Signing key created and backed up
- [ ] `keystore.properties` configured (not committed)
- [ ] AAB builds without errors
- [ ] Privacy policy URL live
- [ ] Store listing text pasted
- [ ] Icon + screenshots uploaded
- [ ] Internal test passed
- [ ] Production release submitted

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `keystore.properties not found` | Copy from `.example` and fill in |
| `SDK location not found` | Open project in Android Studio once |
| Upload rejected (version) | Increase `versionCode` |
| Cleartext HTTP warning | Expected — app connects to LAN `http://` servers |
