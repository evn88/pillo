# Передача следующего этапа

Дата: 2026-09-13. Исходная база аудита: `219a1df`; архитектурный этап зафиксирован коммитом `44dd3bb`.

## Что завершено

Основное архитектурное ядро реализовано и подключено к существующему UI. В tasks.md закрыты 33 из 41 задач; восемь оставшихся требуют Android, физического устройства, подписи или системного поведения. Приложение остаётся Expo / React Native, без сервера, аккаунта и новых зависимостей.

| Область | Реализация | Проверка |
| --- | --- | --- |
| Контракты | `src/application/contracts.ts`, `src/domain/command-types.ts` | TypeScript, import-boundary test |
| Команды | `src/application/pillo-controller.ts`, `src/domain/commands.ts` | Queue, отказ первой записи, повтор command ID, отсутствие optimistic state |
| React bridge | `src/hooks/use-pillo.ts`, `src/providers/pillo-provider.tsx` | TypeScript/exports; iOS Simulator Release mount и UI smoke пройдены, Android и physical-device acceptance ещё нужны |
| Валидация | `src/domain/validation.ts`, `document-validation.ts` | Decimal, даты, связи, shape, precision, legacy |
| SQLite и приватность | `src/storage/sqlite-repository.ts`, `vault.native.ts`, `modules/pillo-data-privacy` | Настоящие Node SQLite transactions, rollback, newer-version, missing row, CAS, recovery; iOS SQLite/WAL/SHM backup exclusion после открытия и записи, native autolinking, unsigned Release compile и Simulator xattr на всех трёх файлах |
| Учёт | Stock effect в Intake, команды переходов | 0.5 → take 1 → undo, независимое пополнение, идемпотентность, legacy unknown |
| Календарь | `src/domain/calendar.ts`, `schedule.ts`, `src/application/calendar-lifecycle.ts` | Изменение будущего плана, история, DST, полночь, foreground, неизвестные интервалы |
| Уведомления | `src/application/notification-plan.ts`, controller, `src/services/notifications.native.ts` | Fake gateway: частичный отказ, restart, concurrent delete, отказ ACK, denied, take/undo |
| Формы | `src/hooks/use-form-command.ts` и три существующие формы | Общий parser, явный CommandResult, pending-ref, сохранение ввода и command ID при повторе; RN UI-тесты ещё нужны |
| История/ошибки | Минимальные изменения App и HistorySheet | Видимый bootstrap/retry, ошибки сохранения/уведомлений, фактическое время, legacy marker и unknown-периоды |

## Следующий UI-инкремент

После архитектурного коммита выполнена прикладная часть задачи 2.4 вокруг учёта остатков:

- «Принять сейчас» открывает форму с выбранным препаратом и требует видимую фактическую дозу вместо скрытого значения `1`;
- форма заранее показывает расхождение, если учётный остаток меньше введённой дозы;
- карточка запланированного приёма показывает то же предупреждение до отметки;
- отмена legacy-приёма с неизвестным `stockEffectUnits` открывает кроссплатформенную форму явного возврата от `0` до записанной дозы;
- повтор сохранения legacy-возврата использует стабильный command ID, поэтому ошибка persistence не приводит к двойному применению.

Проверены `npm test` (55 тестов), `npm run type-check` и `git diff --check`. Задача 2.4 остаётся открытой до RHF/schema field errors и RN UI-тестов.

## Важные контракты для продолжения

1. **Нельзя снова писать snapshot из React callback.** Все изменения проходят через `controller.execute(commandId, command)`; актуальное состояние читается внутри последовательной очереди. `usePillo` только связывает lifecycle, native adapters и стабильные actions.
2. `CommandResult.ok=false` означает отсутствие подтверждённого изменения. Ошибка уведомлений после записи показывается отдельно в `notificationStatus/notificationError`; повторять создание сущности из-за неё нельзя.
3. ID команды хранится в последних 128 receipts. Формы сохраняют ID одной попытки для неизменённого ввода; новый ввод создаёт новое намерение. У ручной записи ID дополнительно детерминирован от command ID, поэтому повтор существующего ручного факта не списывает запас ещё раз. Не использовать один ID для разных намерений.
4. `PilloDocument` — schemaVersion 2. `revision` меняется при каждом сохранении, SQL UPDATE проверяет expectedRevision и changes=1. Revision уведомлений отдельная: theme change не делает план dirty.
5. Payload v1 сохраняется в `pillo_recovery` в той же транзакции миграции. Это локальная копия для восстановления преобразования, не защита от потери/повреждения всего файла. Не удалять её при старте. Только явная clear-data-команда очищает её атомарно с прикладными данными.
6. Не запускать старый v1-бинарник поверх БД v2 и не менять `PRAGMA user_version` ради обхода decoder. Старый бинарник не умеет защищать newer schema. Реальный upgrade/restore должен проверяться на копии данных и затем на устройстве.
7. Domain использует тысячные единицы, диапазон 0…1 000 000 000. Доза >0, упаковка >0 для пополнения; legacy нулевая упаковка допускается при чтении, но действие требует исправления. Недопустимые legacy значения не исправляются молча: база остаётся нетронутой и показывается ошибка.
8. `Intake.stockEffectUnits=null` — неизвестное старое списание. `setIntakeStatus(id, status, legacyStockReturnUnits)` уже поддерживает явно подтверждённый возврат. До UI подтверждения обычный undo такой записи возвращает понятную ошибку, а не выдумывает количество.
9. История хранит контекст названия/дозировки и время отметки. Материализованные прошлые события не переписываются при правке/удалении правила. Не добавлять в decoder обязательную ссылку исторического Intake на существующее ScheduleRule: правило может быть удалено намеренно.
10. Календарь сохраняет сегодня +35 дней и объединённые интервалы покрытия. При долгом отсутствии промежутки вне покрытия неизвестны. Не восстанавливать их задним числом сегодняшними правилами. Отдельное поле исторической timezone ещё не реализовано; этот подпункт design.md остаётся открытым.
11. Notification worker один; OS API выполняется вне очереди записи. ACK записывается через тот же writer и проверяет desiredRevision. После отказа следующее обновление сравнивает фактическую очередь со стабильными ID/fingerprint, не выполняя cancel-all.
12. Временная стратегия — максимум 60 одноразовых уведомлений с честной датой покрытия. Это не доказанная автономность 35 дней и не измеренный лимит каждой платформы. При неизвестном календарном покрытии дата не объявляется подтверждённой. Android exact capability пока `unknown`; iOS quiet/denied отличены. Устаревшие события отменяются даже при denied, новые в таком состоянии не создаются.

## Оставшаяся приёмка

1. **4.1 и 4.7.** На iOS и Android проверить capacity/coverage уведомлений: начало и окончание курса, один пропуск, DST, 10 событий в день 35 дней без запуска, offline, reboot, force-stop, энергосбережение и отзыв permission. Если 60 DATE-событий не дают продуктовый сценарий, только тогда выбирать recurring triggers или маленький Swift/Kotlin adapter.
2. **5.3–5.6.** iPhone 17 Pro iOS 26.5 Simulator Release уже покрывает четыре tabs, доступность экранных действий над floating tab bar, accessibility tree, max Dynamic Type и portrait/landscape. На реальных small phone/tablet пройти VoiceOver/TalkBack, keyboard, split view, Android Back и light/dark; полный набор forms и 10 000-event release profile остаются обязательными.
3. **6.1.** Simulator подтвердил exclusion xattr для iOS SQLite/WAL/SHM после записи. На физическом устройстве всё ещё нужны Android/iOS cloud backup и device-to-device transfer/restore. Android manifest уже имеет `allowBackup=false`.
4. **7.2–7.3.** Создать подписанные release builds, установить и обновить v1 → v2 с историей, проверить recovery/restart и заполнить матрицу минимальных/актуальных ОС. В текущем workspace нет Android SDK/adb и физического устройства; unsigned iOS Simulator Release install/launch уже подтверждён.

## Проверки этого этапа

| Проверка | Результат |
| --- | --- |
| `npm test` | PASS, 71 тест / 12 файлов, exit 0 |
| `npm run type-check` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform all` | PASS, iOS Hermes около 3 MB, Android около 3.2 MB |
| `npx expo-modules-autolinking resolve --platform ios` | PASS, `PilloDataPrivacy` resolved |
| `npx expo prebuild --clean --platform ios` + unsigned generic-device Release build | PASS, `PilloDataPrivacy` Pod и Swift-модуль скомпилированы |
| SQLite migration/rollback | PASS на настоящем SQLite через `node:sqlite`, не на Expo native SQLite |
| Import boundaries | PASS в составе тестов |
| `git diff --check` | PASS |
| `openspec validate harden-pillo-reliability-and-architecture --strict` | PASS, exit 0 |
| iOS Simulator Release smoke / OS backup-transfer / реальные долгие уведомления / signed install | Simulator smoke PASS; остальные проверки НЕ ВЫПОЛНЕНЫ |

Предупреждение Node об экспериментальном SQLite API и Metro о NO_COLOR не приводят к отказу проверок. Native rendering, Expo SQLite bridge и доставка системой не доказаны этими тестами.

## Рабочее дерево

Все изменения архитектурного и UI этапов уже закоммичены. Следующее действие — выделить физические устройства и signing для оставшейся native-приёмки; переключение модели не требует сброса или переноса рабочего дерева.
