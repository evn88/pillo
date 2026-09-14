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


## Раздельные группы Liquid Glass и свайп-действия — 2026-09-14

Видимая системная панель iOS 26+ заменена на собственную компоновку из настоящих SwiftUI glass surfaces: четыре вкладки в общей капсуле, отдельная кнопка ＋ справа. NativeTabs продолжает обслуживать маршруты и состояние экранов с `hidden`; сворачивание системной панели не воспроизводится. Верхний аксессуар со строкой приёма удалён. На остальных платформах сохранена прежняя системная панель.

Проверено на iPhone 17 Pro / iOS 26.5 Simulator Release: все четыре перехода и selected-state; контекстные подписи кнопки добавления; ручной лист через ＋ без автоматической записи; раскрытие трёх кнопок строки через accessibility action; открытие редактора дозы и закрытие без сохранения; скрытая галочка не появляется в accessibility tree раскрытой строки. Скриншот: `/private/tmp/pillo-swipe-actions-20260914.png`.

Физический свайп через CUA drag не удалось надёжно подтвердить: инструмент открывал редактор как при нажатии либо не сдвигал строку. Это остаётся ручным device gate; программное раскрытие не считается доказательством работы жеста. Компонентные тесты проверяют отклонение вертикального движения, раскрытие при полном свайпе без выполнения команды, вызов выбранной кнопки и блокировку accessibility actions во время сохранения.

TypeScript, ESLint, 103 теста, строгая OpenSpec-валидация и iOS Release build проходят. iOS 27, Android, Reduce Transparency/Reduce Motion и крупный текст на устройстве не проверены. Изучены Apple WWDC25 «Build a SwiftUI app with the new design» (группы ToolbarSpacer, нативные glass effects), актуальные HIG toolbars и официальный выпуск design kits iOS 27; Expo API сверены с документацией SDK 57.


## Полировка свайпа и размера добавления — 2026-09-14

Из строки удалено действие «Вручную»: остаются только «Доза» и «Пропустить». Внешний контейнер задаёт скругление всей строки, движущаяся поверхность прямоугольная — стык с действиями не имеет выреза. Круг добавления и капсула навигации имеют одинаковую высоту 64 pt. На экране настроек кнопки добавления нет, группа вкладок занимает всю ширину панели.

iPhone 17 Pro / iOS 26.5 Simulator Release: визуально подтверждены равные размеры, отсутствие выреза при раскрытии через accessibility action, две кнопки и отсутствие третьей, отсутствие плюса в настройках, возврат плюса на «Сегодня», открытие ручной формы увеличенной кнопкой и закрытие без сохранения. Скриншот: `/private/tmp/pillo-toolbar-polish-20260914.png`. Физический свайп в этой итерации не перепроверялся. TypeScript, ESLint, 105 тестов, дополнительный целевой прогон 5 тестов TodayScreen, OpenSpec strict и iOS Release build проходят.


## Общая геометрия карточек и glass morph — 2026-09-14

У препаратов и расписания движущиеся поверхности и футеры прямоугольные, внешний контейнер сохраняет скругление. Низкий остаток препарата сохраняет предупреждающую рамку на внешнем контейнере. Добавлено безопасное accessibility-действие раскрытия, покрыто проверкой отсутствия редактирования/удаления при раскрытии.

Навигация iOS 26+ целиком использует SwiftUI Button/Image без видимых подписей; доступные имена и selected-state сохранены. Namespace + GlassEffectContainer + glassEffectId связывают капсулу и отдельный плюс; изменение состава и ширины сопровождается native spring. Reduce Motion и Reduce Transparency задают нулевую длительность.

Проверено на iPhone 17 Pro / iOS 26.5 Release: прямой стык раскрытых карточек препаратов и расписания через accessibility action, все четыре вкладки, отсутствие плюса в настройках и возврат на сегодня. Снимки: `/private/tmp/pilldan-medications-seam-20260914.png`, `/private/tmp/pilldan-schedule-seam-20260914.png`. Плавность промежуточных кадров morph, физический свайп и системные accessibility-предпочтения требуют проверки на устройстве; статичные снимки не подтверждают качество анимации. TypeScript, ESLint, 105 тестов и iOS Release build проходят.


## Сброс вкладок и ревизия кнопок/форм — 2026-09-14

Проверено временное содержимое всех вкладок: при blur размонтируется UI, при возврате состояние чистое; доменные данные остаются в провайдере. В симуляторе iPhone 17 Pro / iOS 26.5 подтверждено закрытие раскрытых карточек сегодня, препаратов и расписания после переключения. Компонентный тест проверяет сброс без выполнения команды.

Общие кнопки получили toolbar-стиль и семантическую отмену, второстепенные панели используют native glass, подтверждение — glassProminent. Кнопка отмены отметки перенесена в правую часть строки, добавлен компонентный тест вызова отмены для выбранного приёма. Формы блокируют закрытие и редактирование во время сохранения. Проверены добавление препарата, расписание, вложенный выбор, ручной приём, история и фактическая доза; формы закрыты без записи. Лист возврата старого остатка проверен только статически. Инвентаризация и ограничения: `docs/ios-controls-audit.md`.

TypeScript, ESLint, 107 тестов / 24 файла, OpenSpec strict и iOS Release build проходят. Снимки: `/private/tmp/pilldan-schedule-controls-20260914.png`, `/private/tmp/pilldan-dose-controls-20260914.png`. Полный прогон Dynamic Type, клавиатуры, VoiceOver, Reduce Motion/Transparency, светлой темы и других платформ остаётся отдельным device gate.


## Упаковка и раскрываемое количество — 2026-09-14

Из препаратов удалён отдельный ручной приём. Круглый плюс справа от остатка добавляет упаковку и находится вне области редактирования карточки. DoseInput, общий для ручного приёма, расписания и фактической дозы, скрывает свободный ввод за «Другое»; сохранённое нестандартное количество сразу видно без автофокуса. Возврат к пресету скрывает поле.

109 тестов, TypeScript, ESLint, OpenSpec strict и iOS Release build проходят. На iPhone 17 Pro / iOS 26.5 визуально проверены карточки с плюсом, отсутствие «Отметить», компактный выбор дозы, раскрытие «Другое» и скрытие поля при выборе 1. Данные для проверки не менялись. Снимки: `/private/tmp/pilldan-package-plus-20260914.png`, `/private/tmp/pilldan-dose-presets-20260914.png`. Сохранение упаковки проверено компонентным тестом; все три потребителя используют общий DoseInput, ранее сохранённая нестандартная доза покрыта тестом.
## Компактные препараты, фото и непрерывный запуск — 2026-09-14

Сохранены все прежние изменения (`1a68b03`), затем отдельными этапами: компактные строки без chevron, настройки и safe area встроенных Host (`66f8518`); локальные фото с камерой, галереей, системным кадрированием и исключением из iOS backup (`f869829`); тёмная нативная заставка до готовности состояния/layout (`749c224`).

TypeScript, ESLint и 115 тестов в 26 файлах проходят. Тесты подтверждают совместимость старого документа без фото, запрет внешних URI/обхода пути, отмену нового фото, замену после успешной команды, сохранение при размонтировании во время записи и отказ камеры. OpenSpec strict проходит.

Prebuild подтверждает описания доступа к камере/галерее без микрофона, тёмный launch screen и корневой фон. Локальный config plugin снимает ненужный `aps-environment` для подписи Personal Team; после prebuild entitlements пустой. CocoaPods завершился с явным macOS SDK Xcode, обходящим несовместимость установленных Command Line Tools.

Финальная iOS Release сборка НЕ завершена: во время компиляции пропал заголовок SDK `__locale_dir/time.h`, затем весь `/Applications/Xcode.app`. Пользователь подтвердил, что переустанавливает Xcode. Новая версия в симулятор не установлена. Поэтому визуальное устранение смещения при прокрутке и белой вспышки, системное кадрирование и native backup exclusion остаются непроверенными на этой версии. Не смешивать с успешными проверками предыдущих сборок выше.

После установки Xcode: повторить Release build/install поверх приложения, проверить настройки после прокрутки и переключения вкладок, компактные препараты, галерею/кадрирование/отмену и холодный запуск. Камеру, напоминания при закрытом приложении и подпись проверить на физическом iPhone. Инструкция: `docs/iphone-installation.md`.
## Возобновление сборки после установки Xcode 27 — 2026-09-14

Xcode 27.0 (27A266a), SDK iPhoneSimulator 27.0: Release для arm64 успешно собран с `-jobs 4 ONLY_ACTIVE_ARCH=YES ARCHS=arm64`. Первая сборка обеих архитектур выдала сбой SwiftCompile в RNScreens без полезной диагностики и была остановлена; повторная ограниченная сборка завершилась кодом 0.

Артефакт: `/private/tmp/pilldan-xcode27-simulator/Build/Products/Release-iphonesimulator/PillDan.app`. Установлен поверх существующего приложения на iPhone 17 Pro / iOS 26.5 (`11183056-54C5-4613-844B-8B33AA336F1F`), simctl launch успешен, последующая проверка launchctl подтвердила работающий процесс. Metro не требуется.

Визуальная приёмка остаётся открытой: CUA обращается к отсутствующему старому пути Simulator.app, а новый Device Hub не ответил на запрос интерфейса. Успех сборки и запуска не подтверждает исправление геометрии при прокрутке, отсутствие белого кадра или работу системного кадрирования.
