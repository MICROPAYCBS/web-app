/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Whole seconds remaining until forced sign-out (clamped at 0). */
export function remainingIdleWarningSeconds(deadlineMs: number, nowMs: number = Date.now()): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

export function formatIdleWarningDescription(secondsRemaining: number): string {
  const seconds = Math.max(0, Math.floor(secondsRemaining));
  const unit = seconds === 1 ? 'second' : 'seconds';
  return `You will be signed out in ${seconds} ${unit} due to inactivity.`;
}
