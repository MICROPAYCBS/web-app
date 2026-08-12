/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserSession, UserSessionRevocationReason } from '@mifos/api-client';

const DEVICE_TRUNCATE_LENGTH = 48;

export function truncateUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent?.trim()) {
    return '—';
  }
  const trimmed = userAgent.trim();
  if (trimmed.length <= DEVICE_TRUNCATE_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, DEVICE_TRUNCATE_LENGTH - 1)}…`;
}

export function userSessionStatusLabel(
  session: Pick<FineractUserSession, 'active' | 'revocationReason'>
): string {
  if (session.active) {
    return 'Active';
  }
  return revocationReasonLabel(session.revocationReason) ?? 'Expired';
}

export function revocationReasonLabel(
  reason: UserSessionRevocationReason | null | undefined
): string | null {
  if (reason === 'SUPERSEDED_BY_NEW_LOGIN') {
    return 'Signed in on another device';
  }
  if (reason === 'REVOKED_BY_ADMIN') {
    return 'Revoked';
  }
  return null;
}

export function userSessionStatusVariant(
  session: Pick<FineractUserSession, 'active' | 'revocationReason'>
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (session.active) {
    return 'default';
  }
  if (session.revocationReason === 'REVOKED_BY_ADMIN') {
    return 'destructive';
  }
  if (session.revocationReason === 'SUPERSEDED_BY_NEW_LOGIN') {
    return 'outline';
  }
  return 'secondary';
}
