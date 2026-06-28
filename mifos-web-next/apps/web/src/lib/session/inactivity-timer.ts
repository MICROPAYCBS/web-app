/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const INACTIVITY_ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart'
] as const;

export interface InactivityTimerOptions {
  timeoutMs: number;
  warningMs: number;
  onWarning: () => void;
  onTimeout: () => void;
  onReset?: () => void;
}

export interface InactivityTimerController {
  start: () => void;
  reset: () => void;
  dispose: () => void;
}

/**
 * Idle timer: resets on user activity until the warning is shown.
 * After the warning, the user must explicitly confirm presence via {@link reset}.
 */
export function createInactivityTimerController(
  options: InactivityTimerOptions
): InactivityTimerController {
  let warningTimer: ReturnType<typeof setTimeout> | undefined;
  let logoutTimer: ReturnType<typeof setTimeout> | undefined;
  let warningVisible = false;
  let listening = false;

  const clearTimers = () => {
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = undefined;
    }
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      logoutTimer = undefined;
    }
  };

  const scheduleTimers = () => {
    clearTimers();

    const warnDelay = Math.max(0, options.timeoutMs - options.warningMs);
    warningTimer = setTimeout(() => {
      warningVisible = true;
      options.onWarning();
    }, warnDelay);

    logoutTimer = setTimeout(() => {
      options.onTimeout();
    }, options.timeoutMs);
  };

  const handleActivity = () => {
    if (!warningVisible) {
      scheduleTimers();
    }
  };

  const addListeners = () => {
    if (listening) {
      return;
    }
    listening = true;
    for (const event of INACTIVITY_ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity);
    }
  };

  const removeListeners = () => {
    if (!listening) {
      return;
    }
    listening = false;
    for (const event of INACTIVITY_ACTIVITY_EVENTS) {
      window.removeEventListener(event, handleActivity);
    }
  };

  const reset = () => {
    warningVisible = false;
    options.onReset?.();
    scheduleTimers();
  };

  return {
    start: () => {
      addListeners();
      scheduleTimers();
    },
    reset,
    dispose: () => {
      removeListeners();
      clearTimers();
      warningVisible = false;
    }
  };
}
