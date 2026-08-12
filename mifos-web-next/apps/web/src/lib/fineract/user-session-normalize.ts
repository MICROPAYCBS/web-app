/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserSession, UserSessionRevocationReason } from '@mifos/api-client';
import { coerceFineractDateTime } from '@/lib/fineract/dates';

function revocationReason(raw: unknown): UserSessionRevocationReason | null {
  if (raw === 'SUPERSEDED_BY_NEW_LOGIN' || raw === 'REVOKED_BY_ADMIN') {
    return raw;
  }
  return null;
}

function nullableString(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

export function normalizeUserSession(raw: unknown): FineractUserSession | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const userId = Number(row.userId);
  if (!Number.isFinite(id) || !Number.isFinite(userId)) {
    return null;
  }
  const validFrom = coerceFineractDateTime(row.validFrom);
  const validTo = coerceFineractDateTime(row.validTo);
  if (
    validFrom == null ||
    validTo == null ||
    typeof validFrom === 'number' ||
    typeof validTo === 'number'
  ) {
    return null;
  }
  return {
    id,
    userId,
    username: typeof row.username === 'string' ? row.username.trim() : '',
    validFrom,
    validTo,
    ipAddress: nullableString(row.ipAddress),
    userAgent: nullableString(row.userAgent),
    active: row.active === true,
    revocationReason: revocationReason(row.revocationReason)
  };
}

export function normalizeUserSessionList(raw: unknown): FineractUserSession[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeUserSession(item))
    .filter((item): item is FineractUserSession => item !== null);
}
