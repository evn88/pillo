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

## Local iOS compile-only evidence

On 2026-09-13, the ignored `ios/` project was regenerated from the current Expo SDK 57 dependency graph with `npx expo prebuild --clean --platform ios`. CocoaPods installed 98 pods and did not autolink the stale `RNWorklets` pod that had existed in an earlier generated project.

The following unsigned compile-only command completed with `** BUILD SUCCEEDED **` for the generic iPhoneOS arm64 destination:

```bash
SDKROOT=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX26.5.sdk \
  xcodebuild -workspace ios/Pillo.xcworkspace -scheme Pillo \
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  CODE_SIGNING_ALLOWED=NO build
```

The host had Xcode 26.6 and CocoaPods 1.17.0. The `SDKROOT` override was local to the commands: without it, the stub-framework script selected an incompatible Command Line Tools macOS 27.0 SDK and failed before Pod installation. It is a workstation workaround, not an application setting.

This evidence proves that the regenerated native dependency graph compiles. It has no signing profile, install, physical device, migration fixture, or release artifact checksum; it therefore does not close device or release acceptance.

## Generated Android backup evidence

On 2026-09-13, `npx expo prebuild --clean --platform android --no-install` generated the ignored Android project from the current app config. Its `android/app/src/main/AndroidManifest.xml` contains `android:allowBackup="false"`; this confirms the selected Android no-backup/no-restore policy is carried into the manifest.

The generated iOS `Info.plist` has no equivalent global backup exclusion. Expo SDK 57 exposes Android `allowBackup` in app config, but does not expose a matching SQLite-file policy for iOS. Apple requires the backup-exclusion resource value to be applied to the actual support file.

## iOS SQLite backup adapter

On 2026-09-13, the local `modules/pillo-data-privacy` Expo module was generated with Expo's SDK 57-aware generator. Its Swift implementation applies `URLResourceValues.isExcludedFromBackup = true` to the opened SQLite file and its `-wal`/`-shm` companions when they exist. `src/storage/vault.native.ts` applies it after schema/WAL setup and the repository wrapper repeats it after every successful write, because OS file operations may reset the resource value. If a repeat fails after the transaction committed, the controller retains the confirmed change and exposes a distinct backup-protection warning; it does not invite a duplicate command.

`npx expo-modules-autolinking resolve --platform ios` resolved `PilloDataPrivacy`; the regenerated Pod install included `PilloDataPrivacy (1.0.0)`. The unsigned generic-device Release build completed successfully after this change, producing `Pillo.app/Pillo`. This proves source compilation and native registration only. It does not inspect the resource value on a physical device or establish backup/transfer behavior.

## iOS Simulator Release evidence

On 2026-09-13, an unsigned `Release-iphonesimulator` build was created in isolated DerivedData, installed and launched on the booted **iPhone 17 Pro, iOS 26.5** simulator (`11183056-54C5-4613-844B-8B33AA336F1F`):

```bash
xcodebuild -quiet -workspace ios/Pillo.xcworkspace -scheme Pillo \
  -configuration Release -sdk iphonesimulator \
  -destination 'id=11183056-54C5-4613-844B-8B33AA336F1F' \
  -derivedDataPath /private/tmp/pillo-ios-simulator-derived-20260913 \
  CODE_SIGNING_ALLOWED=NO build
xcrun simctl install 11183056-54C5-4613-844B-8B33AA336F1F \
  /private/tmp/pillo-ios-simulator-derived-20260913/Build/Products/Release-iphonesimulator/Pillo.app
xcrun simctl launch 11183056-54C5-4613-844B-8B33AA336F1F com.vershkov.pillo
```

The simulator container contained `pillo.db`, `pillo.db-wal` and `pillo.db-shm`; `xattr -l` reported `com.apple.metadata:com_apple_backup_excludeItem: com.apple.MobileBackup` on all three files. The Release app rendered its four tabs and exposed the medication, schedule, notification switch, retry, history and destructive-clear controls in the accessibility tree. The Today, Medications and Schedule primary actions were exercised after moving them into each screen's scroll flow; the final Settings destructive action was visually clear of the iOS 26 floating tab bar after scrolling. At `accessibility-extra-extra-extra-large`, portrait and landscape layouts used vertically reflowed headers, cards, history rows and modal headings without clipping their accessible controls.

This is runtime evidence for the iOS file-level adapter and a simulator visual smoke. A simulator has no signed artifact, physical backup service, iCloud/iTunes restore or device-to-device transfer, so it does not close the physical-device portion of tasks 6.1, 7.2 or 7.3.

## Not yet evidenced

The iOS and Android projects are generated locally and ignored by Git. No Android SDK/adb, Android device, signing credentials, physical-device installation or release artifact was available in this workspace. The iOS simulator evidence above does not exercise system notification delivery, physical backup/transfer, signing or Android behaviour. Tasks 4.1, 4.7, 5.4, 5.6, 6.1, 7.2 and 7.3 remain acceptance work.

## UX redesign — 2026-09-13

По запросу пользователя интерфейс всех четырёх разделов, форм и истории согласован с розовой public-палитрой vershkov.com. Нормативные решения и ссылки на Apple HIG/Expo SDK 57: `DESIGN.md` в корне проекта.

В iPhone 17 Pro / iOS 26.5 Simulator Release проверены light/dark, переключение контекстных действий между вкладками, открытие форм препарата/расписания/ручной отметки, история, отмена, системный popup времени и прокрутка к последнему действию настроек. Данные препаратов и приёмов не менялись. При максимальном Dynamic Type системный accessory заменяется прокручиваемыми действиями без ограничения числа строк.

Дополнительные регрессии `screen-actions.test.tsx`: актуальный callback при неизменной подписи, выбор действий по маршруту, disabled и очистка регистрации. TypeScript, ESLint и 73 теста проходят. Android, физические устройства, VoiceOver и полный сценарий программной клавиатуры не подтверждены этим проходом.

## Ревью ручного приёма — 2026-09-13

Найдены две причины невозможности выбора: initialMedicationId фильтровал список и отключал onPress, а Pressable карточки перехватывал нажатие вложенной SwiftUI-кнопки и открывал редактирование вместо ручного приёма. Предвыбор теперь не ограничивает список; действия вынесены в footer вне Pressable редактирования.

Форма использует «Закрыть» без заливки и «Записать приём» с главным акцентом, явные radio-индикаторы и поиск. Общий вход не выбирает первый препарат автоматически. Регрессии проверяют смену предвыбранного препарата, передачу выбранного ID и дробной дозы, отсутствие неявного выбора, поиск, закрытие без записи и разделение областей нажатия. TypeScript, ESLint и 76 тестов пройдены.

Итоговый iOS Simulator Release: общий вход показывает два доступных препарата без предвыбора; выбор переключается и активирует сохранение. Кнопка карточки теперь отдельно присутствует в accessibility tree и открывает ручной приём; из предвыбранной записи можно выбрать другую. «Закрыть» возвращает на экран без записи. Неактивная подпись сохранения остаётся читаемой. Новые приёмы при визуальной проверке не создавались.

## Ревью добавления препарата — 2026-09-13

Форма создания разделена на блоки «Основное» и «Запас». iPhone 17 Pro / iOS 26.5 Simulator Release подтвердил нативный menu Picker с вариантами формы и отдельным вводом «Другая…», понятные строки текущего остатка, размера упаковки и порога, доступную верхнюю панель при появлении клавиатуры и полевую ошибку пустого названия. Данные не сохранялись. TypeScript, ESLint и 85 тестов проходят; Android, iPad и успешное сохранение остаются отдельной device-приёмкой.

## Дробная и фактическая доза — 2026-09-14

iPhone 17 Pro / iOS 26.5 Simulator Release подтвердил общий выбор ¼, ½, 1, 2 и произвольного количества в форме расписания и ручного приёма; форма расписания также использует отдельный searchable medication picker. Оба листа закрыты без сохранения. Карточка ожидающего приёма и редактор отличающейся фактической дозы покрыты компонентными и domain/controller regression tests, но не были визуально вызваны на сохранённых данных симулятора. TypeScript, ESLint и 94 теста проходят. Android, iPad, VoiceOver и физические устройства остаются device-приёмкой.


## Компактный экран «Сегодня» — 2026-09-14

На iPhone 17 Pro / iOS 26.5 Simulator Release визуально воспроизведена поломка: растягиваемый SwiftUI Host кнопки «Пропустить» увеличивал высоту карточки. После замены набора кнопок на круглое действие справа карточка компактна. Нижняя системная accessory-панель показывает конкретный препарат, время и дозу; круглая кнопка целиком помещается в её границах. История перенесена вправо от заголовка. Нажатие на подпись нижней панели открывает редактор фактической дозы, лист закрыт без записи. Итоговый скриншот: `/private/tmp/pillo-today-20260914.png`.

TypeScript, ESLint, 100 тестов и строгая OpenSpec-валидация пройдены. Компонентные регрессии проверяют смену ожидающего приёма, актуальные callback меню, переход к ручному вводу и независимость редактирования от быстрой отметки. SwiftUI Menu использует документированный SDK 57 `onPrimaryAction` (tap — команда, hold — меню); сам жест удержания на устройстве, сохранение реальной записи, Android, крупный текст и VoiceOver в этой итерации визуально не проверены.

Ограничение: системный NativeTabs позволяет произвольное действие в BottomAccessory над вкладками; боковой Search из референса является навигационной вкладкой. Навигация сохранена, фиктивная Search-вкладка для команды не добавлена.
