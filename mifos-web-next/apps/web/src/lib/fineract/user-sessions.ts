import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCommandProcessingResult,
  FineractUserSession,
  FineractUserSessionsPage
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  normalizeUserSessionList
} from '@/lib/fineract/user-session-normalize';
import type { UserSessionHistoryQuery } from '@/lib/fineract/user-session-query';

export async function listUserSessions(userId: number): Promise<FineractUserSession[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/users/${userId}/sessions`);
  return normalizeUserSessionList(raw);
}

export async function revokeUserSession(
  userId: number,
  sessionId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/users/${userId}/sessions/${sessionId}/revoke`,
    {}
  );
}

export async function listUserSessionHistory(
  query: UserSessionHistoryQuery
): Promise<FineractUserSessionsPage> {
  const fineract = await createFineractClient();
  const searchParams: Record<string, string> = {
    offset: String(query.offset),
    limit: String(query.limit)
  };
  if (query.userId != null) {
    searchParams.userId = String(query.userId);
  }
  if (query.fromDate) {
    searchParams.fromDate = query.fromDate;
  }
  if (query.toDate) {
    searchParams.toDate = query.toDate;
  }
  const raw = await fineract.get<unknown>('/usersessions/history', searchParams);
  if (!raw || typeof raw !== 'object') {
    return { totalFilteredRecords: 0, pageItems: [] };
  }
  const page = raw as Record<string, unknown>;
  const pageItems = normalizeUserSessionList(page.pageItems);
  const total = Number(page.totalFilteredRecords);
  return {
    totalFilteredRecords: Number.isFinite(total) ? total : pageItems.length,
    pageItems
  };
}
