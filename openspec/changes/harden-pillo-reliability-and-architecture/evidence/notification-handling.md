# Notification handling contract

Date: 2026-09-13.

`NotificationGateway` is the only Expo Notifications adapter boundary. Its access report distinguishes authorization (`granted`, `quiet`, `denied`), whether a permission request was attempted, whether the OS may show it again, Android channel state, exact-delivery capability, synchronization state, and confirmed coverage.

- Android creates the named channel before reading/requesting permissions. Android 13 permission is therefore eligible for the system prompt. A disabled channel is reported separately from the app permission.
- Returning from device settings triggers the existing foreground lifecycle refresh. The settings screen exposes the system-settings action only after a denial.
- The current one-off `DATE` strategy does **not** request `SCHEDULE_EXACT_ALARM`. Expo SDK 57 documents that Android 12+ needs that permission for exact alarms, but the present adapter cannot verify the effective exact-alarm grant. It reports `exact: unknown` rather than making a false delivery promise. The native spike in task 4.1 decides whether an exact-alarm permission is necessary.
- Cold start reads and clears the most recent notification response through `getLastNotificationResponseAsync`; warm start uses `addNotificationResponseReceivedListener`. The payload parser accepts only a bounded nonempty `intakeId`. After bootstrap it navigates only if that exact ID remains in the saved snapshot. It never emits a status command, so a stale/deleted occurrence cannot become TAKEN, SKIPPED, or PENDING.

Verification: `src/application/__tests__/notification-response.test.ts` covers accepted and rejected payloads plus stale references. Adapter and lifecycle/device behaviours still require the native acceptance items 4.1 and 4.7.
