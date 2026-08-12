/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type SessionTerminatedLoginReason = 'superseded' | 'expired';

/**
 * Decide whether a 401 should force sign-out, and which login message to show.
 * Relies on status + `Fineract-Platform-Reason` only — never the 401 body.
 * Only applies when a two-factor token was sent on the request.
 */
export function sessionTerminatedLoginReason(
  status: number,
  platformReason: string | null | undefined,
  hadTfaToken: boolean
): SessionTerminatedLoginReason | null {
  if (status !== 401 || !hadTfaToken) {
    return null;
  }
  if (platformReason === 'session-superseded') {
    return 'superseded';
  }
  return 'expired';
}

export const SESSION_SUPERSEDED_LOGIN_MESSAGE =
  'You were signed out because your account signed in on another device.';

export const SESSION_EXPIRED_LOGIN_MESSAGE = 'Your sign-in session expired. Sign in again.';

export function sessionTerminatedLoginMessage(
  reason: SessionTerminatedLoginReason
): string {
  return reason === 'superseded'
    ? SESSION_SUPERSEDED_LOGIN_MESSAGE
    : SESSION_EXPIRED_LOGIN_MESSAGE;
}

export function sessionTerminatedLogoutPath(reason: SessionTerminatedLoginReason): string {
  return reason === 'superseded'
    ? '/api/auth/logout?reason=sessionSuperseded'
    : '/api/auth/logout?reason=sessionExpired';
}
