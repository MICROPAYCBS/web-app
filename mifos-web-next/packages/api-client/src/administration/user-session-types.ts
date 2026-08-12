/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Why a two-factor session ended. `null` means still live or expired naturally. */
export type UserSessionRevocationReason = 'SUPERSEDED_BY_NEW_LOGIN' | 'REVOKED_BY_ADMIN';

/**
 * Staff two-factor session. Token values are never returned.
 * `validFrom` / `validTo` match `POST /twofactor/validate` (date arrays or ISO strings).
 */
export interface FineractUserSession {
  id: number;
  userId: number;
  username: string;
  validFrom: string | number[];
  validTo: string | number[];
  ipAddress: string | null;
  userAgent: string | null;
  active: boolean;
  revocationReason: UserSessionRevocationReason | null;
}

/** Alias used by the backend UI contract. */
export type UserSession = FineractUserSession;

export interface FineractUserSessionsPage {
  totalFilteredRecords: number;
  pageItems: FineractUserSession[];
}
