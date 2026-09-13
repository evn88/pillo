# Notification handling contract

Date: 2026-09-13.

`NotificationGateway` is the only Expo Notifications adapter boundary. Its access report distinguishes authorization (`granted`, `quiet`, `denied`), whether a permission request was attempted, whether the OS may show it again, Android channel state, exact-delivery capability, synchronization state, and confirmed coverage.

- Android creates the named channel before reading/requesting permissions. Android 13 permission is therefore eligible for the system prompt. A disabled channel is reported separately from the app permission.
- Returning from device settings triggers the existing foreground lifecycle refresh. The settings screen exposes the system-settings action only after a denial.
- The settings screen does not expose a manual refresh in the healthy state. It offers a permission request while the OS can still show it, a system-settings link after a final denial or blocked Android channel, and a retry only after a synchronization error. Foreground refresh automatically rechecks access and converges the plan after returning from settings.
- The current one-off `DATE` strategy does **not** request `SCHEDULE_EXACT_ALARM`. Expo SDK 57 documents that Android 12+ needs that permission for exact alarms, but the present adapter cannot verify the effective exact-alarm grant. It reports `exact: unknown` rather than making a false delivery promise. The native spike in task 4.1 decides whether an exact-alarm permission is necessary.
- Android's current contract requires `canScheduleExactAlarms()`, a dedicated `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` settings flow, and rescheduling after access changes. Adding the manifest permission alone would be incomplete; Pillo keeps approximate delivery until that native adapter and an Android 12+ device test exist. `USE_EXACT_ALARM` is not selected because its automatic grant is Play-policy restricted.
- Cold start reads and clears the most recent notification response through `getLastNotificationResponseAsync`; warm start uses `addNotificationResponseReceivedListener`. The payload parser accepts only a bounded nonempty `intakeId`. After bootstrap it navigates only if that exact ID remains in the saved snapshot. It never emits a status command, so a stale/deleted occurrence cannot become TAKEN, SKIPPED, or PENDING.

Verification: `src/application/__tests__/notification-response.test.ts` covers accepted and rejected payloads plus stale references. Adapter and lifecycle/device behaviours still require the native acceptance items 4.1 and 4.7.
