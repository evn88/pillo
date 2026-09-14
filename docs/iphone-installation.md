# Установка PillDan на личный iPhone

Проверено по документации Apple и Expo 14 сентября 2026 года. Нужна отдельная сборка: приложение содержит локальный нативный модуль защиты данных, поэтому Expo Go для него не подходит.

## Через Xcode с бесплатным Apple Account

1. Подключите iPhone к Mac кабелем, разблокируйте его и подтвердите доверие компьютеру.
2. Откройте Xcode → Settings → Accounts и добавьте свой Apple Account.
3. Подготовьте проект из терминала:

   ```sh
   cd /Users/egor/projects/pillo
   npx expo prebuild --platform ios --no-install
   DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer SDKROOT="$(xcrun --sdk macosx --show-sdk-path)" npx pod-install ios
   open ios/PillDan.xcworkspace
   ```

   Указание SDK требуется на текущем Mac: установленные Command Line Tools выбирают несовместимый macOS SDK при подготовке ExpoModulesJSI. Системные настройки менять не нужно. `prebuild` пересоздаёт генерируемый каталог iOS; ручные изменения там нужно переносить в app config/plugins.

4. В Xcode выберите target PillDan → Signing & Capabilities → Automatically manage signing и свою Personal Team. Если bundle identifier занят другой командой, задайте уникальный `expo.ios.bundleIdentifier` в `app.json` и повторите подготовку. Это установит отдельное приложение со своим хранилищем.
5. Выберите подключённый iPhone как устройство запуска. Включите на нём Settings → Privacy & Security → Developer Mode; после перезапуска подтвердите включение. При необходимости подтвердите доверие разработчику в Settings → General → VPN & Device Management.
6. Чтобы приложение работало без Mac и Metro, выберите Product → Scheme → Edit Scheme → Run → Build Configuration → Release. Нажмите Run. После установки кабель можно отключить.

После настройки подписи можно собирать из терминала:

```sh
cd /Users/egor/projects/pillo
npx expo run:ios --device --configuration Release
```

Xcode должен поддерживать установленную на iPhone версию iOS. Liquid Glass доступен на iOS 26 и новее; более старые системы используют предусмотренные приложением варианты управления.

Бесплатная Personal Team подходит для личной проверки. Профиль подписи действует 7 дней — затем нужно пересобрать и установить приложение поверх существующего. Не удаляйте приложение перед обновлением: данные хранятся локально.

Приложение использует локальные уведомления, для них APNs не требуется. `plugins/with-local-notifications.cjs` убирает автоматически добавленную Push Notifications capability при prebuild. При переходе на серверные push-уведомления эту настройку потребуется пересмотреть.

## TestFlight для удобных обновлений

Для распространения через TestFlight нужна Apple Developer Program (99 USD в год или местная цена). После подключения программы можно настроить EAS Build/Submit либо архивировать Release в Xcode и загрузить в App Store Connect. Это отдельный этап настройки распространения; аккаунт, сертификаты и TestFlight в текущей задаче не создавались.

## Проверить на телефоне

- Холодный запуск в светлой и тёмной теме.
- Камера, галерея, кадрирование, отмена редактора и сохранение фото после перезапуска.
- Напоминание при закрытом приложении после выдачи разрешения.
- Прокрутка настроек/форм, крупный текст и клавиатура.

## Источники

- [Expo: локальная сборка и физическое устройство](https://docs.expo.dev/guides/local-app-development/)
- [Apple: Personal Team и срок профилей](https://developer.apple.com/help/account/basics/about-your-developer-account/)
- [Apple: Developer Mode](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device)
- [Apple Developer Program](https://developer.apple.com/programs/enroll/)
