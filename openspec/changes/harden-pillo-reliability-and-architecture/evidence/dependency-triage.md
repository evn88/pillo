# Dependency triage — 2026-09-13

## Выполненные обновления

Совместимые patch-версии Expo SDK 57 обновлены без изменения major-версий: `expo` 57.0.22, `@expo/ui` и `expo-notifications` 57.0.18, `expo-router` 57.0.21, `expo-crypto` и `expo-sqlite` 57.0.3, `react-native` 0.86.3. Прямая dev-зависимость `vitest` обновлена до 4.1.11. Онлайн-проверка `npx expo install --check` завершилась с exit 0 и сообщением `Dependencies are up to date`.

## Оставшийся npm audit

`npm audit --json` после обновлений: 17 advisories, 4 high, 13 moderate, 0 critical. Это inventory зависимостей, а не доказательство эксплуатации в приложении.

| Цепочка | Среда и достижимость | Решение |
| --- | --- | --- |
| `image-size` → `metro` → `metro-config`/`metro-transform-worker` (4 high) | Metro обрабатывает исходники и ассеты только во время локальной разработки или bundling; в опубликованный Hermes bundle не входит. Входные данные разработчика остаются недоверенными. | Не подменять транзитивный Metro вручную: обновить с ближайшим SDK 57 patch или SDK 58, повторить audit до 2026-10-13. |
| `query-string` → `decode-uri-component` → `expo-router` | Маршрутизатор разбирает входящие deep links в runtime, поэтому путь условно достижим. Предложенный audit «fix» откатывает Router до 5.1.11 и несовместим с SDK 57. | Не применять. Проверить release notes Expo Router при следующем SDK patch; до 2026-10-13 повторить audit и добавить regression для malformed deep link, если Expo не выпустит совместимое исправление. |
| `@expo/cli`, config, config-plugins, inline/prebuild, `uuid`, `xcode` | CLI/prebuild/build-time путь на машине разработчика; нет сетевого endpoint приложения. | Оставить под контролем обновлений Expo. Предложенный audit downgrade к Expo 46.0.21 неприемлем. Повторить при следующем SDK обновлении или до 2026-10-13. |
| `expo` и `expo-router` aggregate advisories | Прямые runtime зависимости, но единственный предложенный audit fix — несовместимый downgrade. | Сохранять текущие совместимые SDK 57 patch-версии, мониторить advisories и не применять `npm audit fix --force`. |

`npm audit fix --dry-run --json` завершился внутренней ошибкой npm 10.9.4 (`Cannot read properties of null (reading 'edgesOut')`) и не использовался как основание для изменения lock-файла. Точечное обновление Vitest потребовало `--legacy-peer-deps` из-за той же ошибки peer-resolver; после него тесты, type-check и lint проходят.
