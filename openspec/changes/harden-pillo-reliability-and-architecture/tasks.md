# План реализации

Архитектурное ядро реализовано 2026-09-13; непроверенные платформенные и оставшиеся UI-задачи открыты. Подробности и границы: [передача следующей модели](handoff.md). Порядок учитывает зависимости; готовность документов не закрывает задачи реализации. Обозначения Axx ссылаются на audit.md. Результаты этапа записывать рядом с задачами: команда, exit code, дата, среда, ссылка на доказательства.

## 0. Проверочная база и границы продукта — A25, A26

- [x] 0.1 Зафиксировать утверждённые решения design.md: точность чисел, дефицит остатков, сохранение истории, local-time/DST, unknown-периоды, backup policy, покрытие уведомлений. Изменение этих решений оформить в этой спеке до зависимого кода.
- [x] 0.2 Выполнить актуальные Expo compatibility/npm audit; обновить совместимые версии SDK 57 отдельным небольшим изменением. Для оставшихся advisory составить runtime/tooling triage с достижимостью, решением и датой повторной проверки. Доказательства: `evidence/dependency-triage.md`.
- [x] 0.3 Добавить минимальный lint с Rules of Hooks и ограничениями слоёв; выбрать RHF/schema и совместимое RN UI-тестирование, обосновать каждую новую зависимость. Сохранить работающие domain Vitest-тесты.
- [x] 0.4 Зафиксировать команды native debug/release build и минимальные ОС для iOS/Android. Локальная сборка допустима, EAS/CI не обязательны. Доказательство: `evidence/native-build-matrix.md`; native сборка и установка остаются задачами 7.2.

Выход: воспроизводимые команды и согласованный контракт, без автоматического downgrade ради npm audit.

## 1. Сохранение и восстановление — A01–A04, A17–A20

- [x] 1.1 Выделить контракты state/actions/repository/clock/IDs и последовательный application executor. Команды читают подтверждённое актуальное состояние внутри очереди.
- [x] 1.2 Ввести явные результаты команд, pending по операции и bootstrap state machine с retry. Отказ persistence не закрывает форму; ошибка Notifications не объявляется отказом записи.
- [x] 1.3 Добавить decoder unknown → валидированный snapshot, защиту newer schema, missing row и zero-row UPDATE. Не перезаписывать повреждённые данные пустым snapshot.
- [x] 1.4 Определить единственного владельца SQLite handle, корректный cleanup/cancellation/bootstrap retry.
- [x] 1.5 Исправить stale gesture callbacks и защитить повторное создание формы/сущности стабильным command ID.
- [x] 1.6 Проверить гонку двух команд, отказ первой записи, очередь после отказа, remount, missing/corrupt/future-version DB и ошибку init. Зафиксировать regression tests.

Выход: сохранение не теряет данные, ошибки видимы, интерфейс соответствует повторному чтению БД. Пока формат v1 не мигрировать необратимо ради одной перестановки файлов.

## 2. Валидация и учёт остатков — A05–A07, A11

- [x] 2.1 Реализовать общий decimal/date/time/domain validator, finite/range/precision/relations checks; формы используют тот же контракт. Удалить silent fallback/clamp ввода.
- [x] 2.2 Ввести точную арифметику количества и сохранённый applied stock effect для новых событий, идемпотентные переходы и явную отмену ручного факта.
- [x] 2.3 Подготовить транзакционную миграцию v1 с безопасной локальной recovery-копией; legacy effects/исторические metadata не выдумывать, маркировать unknown.
- [x] 2.4 Сделать ошибки полей доступными, pending безопасным, quick intake с видимой дозой; ввод не исчезает при отказе.
- [x] 2.5 Проверить `0,5`, `0.5`, `0`, отрицательные, пустое, Infinity/NaN, пределы точности; take/undo при 0.5 остатка и 1 дозе; несколько приёмов, пополнение/корректировка между ними и legacy undo.

Выход: ни одна команда не меняет введённую дозу молча и не создаёт запас при отмене; миграция сохраняет существующие факты.

## 3. Календарь и история — A08–A11

- [x] 3.1 Добавить один lifecycle coordinator: старт, foreground, полночь, timezone; сохранить материализованные экземпляры и интервалы доказанного покрытия, не выдумывая события в неизвестных периодах.
- [x] 3.2 Реализовать обновление/удаление только изменяемых будущих PENDING при правке/выключении правила, без переписывания завершённых фактов.
- [x] 3.3 Удаление правила сохраняет историю; отдельное уничтожение препарата/истории имеет точное подтверждение.
- [x] 3.4 Разделить SKIPPED, неотмеченные события и unknown-периоды. Сохранить контекст лекарства и фактическое время для новых фактов; legacy пометить честно.
- [x] 3.5 Проверить полночь без remount, несколько дней в фоне, leap day, границы курса, смену timezone и обе DST-границы, повторную материализацию и редактирование завершённого occurrence. Автоматические доказательства: `calendar-lifecycle.test.ts` и `reliability.test.ts`; native UI/device smoke остаётся в 5.6 и 7.3.

Выход: экран и история соответствуют календарной политике; прошлое не меняется от сегодняшнего редактирования.

## 4. Уведомления — A12–A16

- [ ] 4.1 Выполнить native spike повторяющихся/одноразовых триггеров: начало/окончание курса, однократный пропуск, DST, 10 событий в день и 35 дней без запуска/сети. Выбрать стратегию и задокументировать реальную capacity/coverage.
- [x] 4.2 Ввести notification gateway и чистое построение desired plan из правил, лекарств и статусов приёмов; стабильные occurrence IDs.
- [x] 4.3 Сохранять pending reconciliation с изменением данных, сериализовать diff/retry по ревизии, восстанавливать после прерывания без cancel-all-before-validation. Смена темы не запускает scheduling.
- [x] 4.4 Добавить статус requested/authorized/exact-capability/channel/sync/coverage, обработку denied/provisional/revoked, возврата из системных настроек. Настроить необходимые Android permissions только по проверенному контракту. Доказательство: `evidence/notification-handling.md`; точность Android остаётся честно `unknown` до native spike 4.1.
- [x] 4.5 Исключить TAKEN/SKIPPED occurrence из будущих уведомлений, поддержать undo и будущие повторения.
- [x] 4.6 Реализовать cold/warm notification response после bootstrap, валидировать payload, обработать устаревшие ссылки без изменения статуса приёма. Доказательство: `evidence/notification-handling.md` и `src/application/__tests__/notification-response.test.ts`.
- [ ] 4.7 Проверить fake gateway (автоматическая часть выполнена, см. handoff.md): ошибка на третьем событии, concurrent edit/delete/disable, restart до/после OS scheduling, повторы. На устройствах проверить offline, reboot, force-stop, энергосбережение, отзыв permission и окончание курса.

Выход: подтверждённое покрытие и честные ограничения, успешная запись не зависит от доступности уведомлений, очередь сходится к текущим данным.

## 5. Разделение UI и качество взаимодействия — A20–A22, A24

- [x] 5.1 Разнести screens/формы/common shell по ответственности; удалить зависимость UI-контракта от ReturnType большого hook; domain/application не импортируют React Native/Expo. `App.tsx` удалён: четыре route используют `PilloShell` и свои screens, каждый владеет только своими формами/модалями.
- [x] 5.2 Единый theme contract и варианты кнопок, актуальные callbacks, независимое владение диалогами. Убрать генерацию ID из render. Единый `usePilloTheme` не выводит тему из цвета; ID создаются при намерении открыть форму.
- [ ] 5.3 Исправить labels, accessibility actions, nested presses, safe area, keyboard avoidance, размеры от контейнера, большой шрифт и split view. Выполнены статические исправления labels/actions, scroll insets, keyboard avoidance и отказ от window-width/fixed tab offset; regression: `swipeable-card.test.tsx`. VoiceOver/TalkBack, большой шрифт, split view и rotation остаются device-приёмкой.
- [ ] 5.4 Убрать вычисления закрытой истории, измерить 10 000 событий в release. Добавить ограниченный render/пагинацию; нормализацию SQL и новую библиотеку вводить только с обоснованием измерениями.
- [x] 5.5 Удалить подтверждённые unused styles/components/assets, устранить импорт через незаявленную транзитивную зависимость; уменьшить header logo при измеримой пользе. Удалены `SectionHeading` и шесть неиспользуемых шаблонных PNG; `sf-symbols-typescript` объявлен напрямую. Уменьшение используемого logo не выполнялось: измеримой пользы пока нет.
- [ ] 5.6 Проверить четыре раздела, создание/редактирование/ошибки форм, VoiceOver/TalkBack, Android back, rotation, small phone/tablet, light/dark и старый iOS UI fallback.

Выход: разделённые слои и отсутствие регрессий текущего интерфейса; не проведённый визуальный тест остаётся незакрытым.

## 6. Приватность и документация — A23, A24

- [ ] 6.1 Реализовать выбранные backup/transfer rules для БД, проверить собранные manifest/настройки и реальный restore. Уточнить тексты local-only без необоснованных обещаний шифрования.
- [x] 6.2 Согласовать clear-data и recovery: прикладные записи, собственные backup-файлы, scheduled/delivered notifications, повторный запуск и retry при отказе OS API. `clear-data` атомарно очищает документ/recovery, reconciliation отменяет scheduled события, а adapter отдельно dismisses delivered notifications; отказ OS API виден и повторная очистка повторяет попытку.
- [x] 6.3 Обновить README под реальное приложение, поддерживаемые ОС, сборки, ограничения покрытия и очистки. Отдельно пометить прежнее описание историческим; не потерять перечисленные там идеи. README отражает local-only, версии ОС, builds, coverage и logical clear; `pillo-mini-app-description.md` сохранён как явно исторический архив.

Выход: поведение хранения и очистки совпадает с обещаниями интерфейса/документации.

## 7. Приёмка и выпуск — все пункты

- [x] 7.1 Выполнить `npm run type-check`, `npm test`, добавленную lint-команду, актуальную compatibility-проверку; npm audit с triage. Все команды и текущие ограничения зафиксированы в `evidence/dependency-triage.md`.
- [ ] 7.2 Exports iOS/Android и unsigned iOS Release compile-only выполнены; настоящие native release-сборки с подписью и установка остаются. Проверить обновление поверх v1 с историей, rollback/recovery и повторный запуск. Доказательство: `evidence/native-build-matrix.md`.
- [ ] 7.3 Пройти матрицу iOS/Android из design.md, включая устройства и длинный notification-сценарий; приложить доказательства. Ускоренные clock-тесты не заменяют длительный системный сценарий.
- [x] 7.4 Проверить трассировку каждого Axx → задача → тест/доказательство, не закрывать подтверждённые проблемы только переносом файлов. Доказательство: `evidence/traceability.md`; device/open acceptance явно остаётся открытой.
- [x] 7.5 Выполнить `openspec validate harden-pillo-reliability-and-architecture --strict` и `git diff --check`; синхронизировать документы с фактическими результатами. На 2026-09-13 также пройдены type-check, lint и 66 тестов. Архивировать изменение только после полной приёмки, отдельно от публикации приложения.

## Зависимости и возможность разделения

Этап 0 → 1 → 2 → 3 → 4. Этап 5 выполняется после стабильных контрактов этапа 1 с учётом форм/истории этапов 2–3. Этап 6 опирается на storage migration/recovery. Этап 7 завершает все предыдущие. Security triage и native notification spike можно проводить раньше, не начиная зависимые изменения поведения.

## Матрица трассировки

| Пункты | Основной этап | Требования spec.md |
| --- | --- | --- |
| A01, A02, A03, A04 | 1 | Recoverable startup; Reliable commands |
| A05, A06 | 2 | Validated inputs |
| A07 | 2 | Reversible inventory |
| A08, A09 | 3 | Calendar lifecycle; Schedule reconciliation |
| A10, A11 | 3 | Historical integrity |
| A12 | 4 | Honest notification coverage |
| A13, A15 | 4 | Recoverable notification projection |
| A14 | 4 | Effective notification permissions |
| A16 | 4 | Notification navigation |
| A17, A18, A19 | 1–2 | Safe persistence and migration |
| A20 | 1, 5 | Architectural boundaries |
| A21 | 5 | Accessible platform UI |
| A22 | 5 | Bounded history work |
| A23 | 6 | Local data privacy and erasure |
| A24 | 5–6 | Accurate product documentation |
| A25, A26 | 0, 7 | Verified cross-platform release |

## Результат архитектурного этапа — 2026-09-13

17 задач реализации закрыты. Автоматические проверки: `npm test` — 55 тестов в 6 файлах, включая Node SQLite transaction/rollback, controller failure injection, DST и import boundaries. Остальные команды и ограничения перечислены в handoff.md. Закрытие задач реализации не означает native/device acceptance.

Частично выполнены: 0.1 (зафиксированы решения ядра), 0.3 (import-boundary test, без lint/RHF), 2.4 (pending/error, десятичный ввод, явная quick dose, stock discrepancy warning и legacy undo; без RHF/schema field errors и RN UI-тестов), 3.5 (domain/lifecycle tests, без UI/device smoke), 4.4 (статусы и пассивная проверка разрешения, без native exact-access проверки), 4.7 (fake gateway пройден, устройства не проверены), 5.1–5.2 (контракты и stable actions/IDs, без разбивки App.tsx и темы), 5.4 (закрытая история не монтируется, без профиля), 6.2 (логическая очистка и recovery-транзакция, без delivered-notification/native acceptance).
