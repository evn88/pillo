# Трассировка аудита

Дата: 2026-09-13. Документ сопоставляет исходные пункты `audit.md` с задачами, реализацией и доказательствами. Метка «автоматически покрыто» означает только код и тесты; она не заменяет native/device-приёмку.

| Пункт | Задачи | Реализация и автоматическое доказательство | Открытая приёмка |
| --- | --- | --- | --- |
| A01–A04 | 1.1–1.6 | `pillo-controller.test.ts`: очередь, отказ записи, bootstrap retry и dispose; `sqlite-repository.test.ts` | Native mount и swipe на устройстве: 5.6, 7.3 |
| A05–A06 | 2.1, 2.4–2.5 | `reliability.test.ts`, `form-schema.test.ts`, `medication-form.test.tsx` | Другие формы на устройствах: 5.6 |
| A07 | 2.2, 2.5 | `reliability.test.ts`: applied stock effect, undo, пополнение и legacy | Установка и migration fixture: 7.2 |
| A08–A10 | 3.1–3.3, 3.5 | `calendar-lifecycle.test.ts`, `reliability.test.ts`, `schedule.test.ts` | Отображение после foreground/timezone на устройстве: 5.6, 7.3 |
| A11 | 2.4, 3.4–3.5, 5.4 | Исторический контекст, unknown coverage и пагинация в `reliability.test.ts` и `history-pagination.test.ts` | Release-профиль 10 000 записей и UI: 5.4, 5.6 |
| A12 | 4.1–4.5 | Desired plan ограничен честной датой покрытия; `pillo-controller.test.ts` проверяет границу и unknown coverage | Реальная capacity, DST и 35 дней без запуска: 4.1, 7.3 |
| A13 | 4.2–4.3, 4.7 | `pillo-controller.test.ts`: частичный scheduling, restart, конкурирующая правка, dirty ACK | Offline/reboot/force-stop: 4.7, 7.3 |
| A14 | 4.4, 4.7 | `notification-handling.md`; adapter различает authorization, channel и exact `unknown` | Exact alarms, provisional/revoked и Settings на устройствах: 4.1, 4.7 |
| A15 | 4.2–4.5 | `pillo-controller.test.ts`: TAKEN/SKIPPED удаляет occurrence, undo возвращает актуальное | Доставка OS на устройствах: 4.1, 4.7 |
| A16 | 4.6 | `notification-response.test.ts`; `notification-handling.md` описывает cold/warm и stale payload | Native cold/warm interaction: 4.7, 7.3 |
| A17–A19 | 1.3–1.6, 2.3 | `sqlite-repository.test.ts`: shape, newer schema, missing row, rollback, recovery; controller dispose | Реальный upgrade/restore на устройстве: 6.1, 7.2 |
| A20 | 1.1, 5.1–5.2 | `architecture.test.ts`; `PilloShell` и четыре screen отделяют UI от application/storage | Native визуальный smoke: 5.6 |
| A21 | 5.3, 5.6 | Явные labels/actions, единая keyboard avoidance, native scroll insets и layout от контейнера; `swipeable-card.test.tsx` | VoiceOver/TalkBack, large text, keyboard, split view и rotation: 5.3, 5.6 |
| A22 | 5.4 | `history-pagination.test.ts` ограничивает первую страницу 100 элементами при 10 000 intake | Release measurement на устройстве: 5.4 |
| A23 | 6.1–6.2 | `app.json` и сгенерированный Android manifest отключают backup; `PilloDataPrivacy` исключает iOS SQLite/WAL/SHM при открытии и после записи; clear-data и delivered-notification retry покрыты `pillo-controller.test.ts` | Android/iOS backup/transfer restore на устройстве: 6.1 |
| A24 | 5.5, 6.3 | README, historical notice и asset cleanup; `native-build-matrix.md` отражает фактическую сборку | iPad fallback и device visual review: 5.6 |
| A25 | 0.2, 7.1 | `dependency-triage.md`; compatibility, audit, type-check, tests и lint пройдены | Следующий повтор audit до указанной даты и обновление SDK по совместимому патчу |
| A26 | 0.3–0.4, 7.1–7.5 | 71 автоматический тест, lint, exports, unsigned iOS Release compile-only; `native-build-matrix.md` | Подпись/установка, Android build, v1 migration, device matrix: 7.2, 7.3 |

Все 26 пунктов имеют задачу и текущее доказательство либо явно обозначенную незакрытую приёмку. Ни один пункт, требующий устройства, установки или системной доставки уведомления, не закрыт одной лишь автоматической проверкой.
