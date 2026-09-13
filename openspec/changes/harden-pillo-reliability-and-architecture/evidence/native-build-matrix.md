# Native build matrix

Date: 2026-09-13. The project stays in Expo managed workflow and has no committed `ios/` or `android/` directories. The commands below are the reproducible acceptance procedure; running a JavaScript export does not replace a native build or device installation.

## Supported operating systems

Expo SDK 57 documents React Native 0.86 support from iOS 16.4 and Android 7 (API 24). These are Pillo's minimum supported systems. Release acceptance also includes a current iOS and Android device, plus Android 12, 13 and 14+ because notification and alarm behaviour changes across those releases.

| Platform | Minimum | Required acceptance devices |
| --- | --- | --- |
| iOS / iPadOS | 16.4 | minimum iPhone or iPad; current iOS; tablet split view |
| Android | 7 / API 24 | minimum Android; Android 12; Android 13; Android 14+ |

## Preconditions

- Node dependencies are installed with `npm ci`.
- The iOS machine has current Xcode, CocoaPods and a signing team. Android has Android Studio, the SDK/NDK selected by Expo prebuild, and a connected authorized device or emulator.
- Device builds use a development build; Expo Go is insufficient evidence for notification permissions and release behaviour.
- Before a native build, run `npx expo install --check` and retain its successful output with the build evidence.

## Debug build and installation

From the repository root, with a connected device:

```bash
npm ci
npx expo install --check
npx expo run:ios --device
npx expo run:android --device
```

`expo run:*` generates the native project when it is absent and installs a debug development build. If native project files need regeneration after an Expo config change, the reviewer must deliberately run `npx expo prebuild --clean` and inspect the generated diff before rebuilding; it is not part of routine JavaScript validation.

## Release build and installation

The release path intentionally has no unreviewed signing profile in the repository. Configure signing in the local Xcode/Android environment or an approved EAS project, then use one of these equivalent paths:

```bash
# Local native projects, after a reviewed prebuild
npx expo prebuild
npx expo run:ios --configuration Release --device
npx expo run:android --variant release --device

# Approved EAS project, after credentials and profiles are explicitly configured
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

Record the commit SHA, SDK/OS/device, signing profile identifier (without secrets), install result, and the output artifact checksum. Update from a v1 fixture with persisted history, relaunch after installation, and test recovery before declaring the release path accepted.

## Not yet evidenced

No device, signing credentials, generated native project, or release artifact was available in this workspace on this date. Therefore this document closes the reproducible-command and OS-contract part of task 0.4 only. Tasks 4.1, 4.7, 5.6, 6.1, 7.2 and 7.3 remain device acceptance work.
