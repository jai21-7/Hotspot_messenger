# Build signed release AAB for Google Play
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Syncing Capacitor..."
npm run cap:sync

$props = Join-Path $PSScriptRoot "..\android\keystore.properties"
if (-not (Test-Path $props)) {
    Write-Host ""
    Write-Host "Missing android/keystore.properties"
    Write-Host "Copy android/keystore.properties.example and fill in your signing key."
    Write-Host "See docs/PLAY-STORE.md"
    exit 1
}

Write-Host "Building release AAB..."
Set-Location android
.\gradlew.bat bundleRelease

Write-Host ""
Write-Host "Done! Upload this file to Google Play:"
Write-Host "android/app/build/outputs/bundle/release/app-release.aab"
