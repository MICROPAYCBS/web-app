/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const USER_SESSION_HISTORY_DEFAULT_LIMIT = 50;
export const USER_SESSION_HISTORY_MAX_LIMIT = 200;

export type UserSessionHistoryQuery = {
  userId?: number;
  fromDate?: string;
  toDate?: string;
  offset: number;
  limit: number;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function parseIsoDate(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  return value;
}

export function parseUserSessionHistoryQuery(
  params: Record<string, string | string[] | undefined>
): UserSessionHistoryQuery {
  const limitRaw = Number(readParam(params, 'limit') ?? String(USER_SESSION_HISTORY_DEFAULT_LIMIT));
  const limit = Math.min(
    USER_SESSION_HISTORY_MAX_LIMIT,
    Math.max(1, Number.isFinite(limitRaw) ? limitRaw : USER_SESSION_HISTORY_DEFAULT_LIMIT)
  );
  const pageIndex = Math.max(0, Number(readParam(params, 'page') ?? '0') || 0);
  const userIdRaw = Number(readParam(params, 'userId'));

  return {
    offset: pageIndex * limit,
    limit,
    userId: Number.isFinite(userIdRaw) && userIdRaw > 0 ? userIdRaw : undefined,
    fromDate: parseIsoDate(readParam(params, 'fromDate')),
    toDate: parseIsoDate(readParam(params, 'toDate'))
  };
}

export function countActiveUserSessionHistoryFilters(query: UserSessionHistoryQuery): number {
  return [query.userId, query.fromDate, query.toDate].filter(Boolean).length;
}
