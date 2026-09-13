import { getLocalDateKey } from '../domain/schedule';

type TimerHandle = ReturnType<typeof setTimeout>;
type LifecycleDependencies = {
  now: () => Date;
  timezone: () => string;
  refresh: () => void;
  setTimer: (callback: () => void, milliseconds: number) => TimerHandle;
  clearTimer: (handle: TimerHandle) => void;
};

/** Один таймер до полуночи, с проверкой timezone не чаще раза в минуту. */
export const createCalendarLifecycle = ({ now, timezone, refresh, setTimer, clearTimer }: LifecycleDependencies) => {
  const context = () => `${getLocalDateKey(now())}:${timezone()}:${now().getTimezoneOffset()}`;
  let previous = context();
  let handle: TimerHandle | null = null;
  let active = false;
  const schedule = () => {
    if (!active) return;
    const date = now();
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    handle = setTimer(() => {
      handle = null;
      const next = context();
      if (next !== previous) { previous = next; refresh(); }
      schedule();
    }, Math.max(1, Math.min(60_000, midnight.getTime() - date.getTime())));
  };
  const pause = () => {
    active = false;
    if (handle !== null) clearTimer(handle);
    handle = null;
  };
  return {
    resume: (refreshImmediately = true) => { pause(); active = true; previous = context(); if (refreshImmediately) refresh(); schedule(); },
    pause,
    dispose: pause
  };
};
