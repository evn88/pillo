import { afterEach, expect, it, vi } from 'vitest';
import { createCalendarLifecycle } from '../calendar-lifecycle';

afterEach(() => vi.useRealTimers());
it('обновляет полночь, timezone и foreground, прекращает таймеры после dispose', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 13, 23, 59, 59));
  let zone = 'Europe/Belgrade';
  const refresh = vi.fn();
  const lifecycle = createCalendarLifecycle({ now: () => new Date(), timezone: () => zone, refresh,
    setTimer: setTimeout, clearTimer: clearTimeout });
  lifecycle.resume(); expect(refresh).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(1000); expect(refresh).toHaveBeenCalledTimes(2);
  zone = 'Europe/London';
  vi.advanceTimersByTime(60_000); expect(refresh).toHaveBeenCalledTimes(3);
  lifecycle.pause(); vi.advanceTimersByTime(3 * 86400_000); expect(refresh).toHaveBeenCalledTimes(3);
  lifecycle.resume(); expect(refresh).toHaveBeenCalledTimes(4);
  lifecycle.dispose(); expect(vi.getTimerCount()).toBe(0);
});
