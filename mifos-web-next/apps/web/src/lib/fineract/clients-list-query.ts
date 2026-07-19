/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Client-safe helpers for the clients list toolbar and BFF query string. */

export const CLIENTS_LIST_DEBOUNCE_MS = 500;

export type ClientListSortColumn =
  | 'id'
  | 'accountNo'
  | 'displayName'
  | 'officeName'
  | 'status'
  | 'externalId';

export type ClientListSortOrder = 'ASC' | 'DESC';

const SORT_FIELD_BY_COLUMN: Record<ClientListSortColumn, string> = {
  id: 'id',
  accountNo: 'accountNumber',
  displayName: 'displayName',
  officeName: 'officeName',
  status: 'status',
  externalId: 'externalId'
};

export function clientListSortField(column: ClientListSortColumn): string {
  return SORT_FIELD_BY_COLUMN[column];
}

export function clientListSortColumnFromField(
  field: string | undefined
): ClientListSortColumn | undefined {
  if (!field) {
    return undefined;
  }
  const entry = Object.entries(SORT_FIELD_BY_COLUMN).find(([, value]) => value === field);
  return entry ? (entry[0] as ClientListSortColumn) : undefined;
}

export function buildClientsListApiQuery(params: {
  offset: number;
  limit: number;
  query?: string;
  includeClosed?: boolean;
  orderBy?: string;
  sortOrder?: ClientListSortOrder;
}): string {
  const search = new URLSearchParams({
    offset: String(params.offset),
    limit: String(params.limit)
  });
  const q = params.query?.trim();
  if (q) {
    search.set('query', q);
  }
  if (params.includeClosed) {
    search.set('includeClosed', 'true');
  }
  if (params.orderBy) {
    search.set('orderBy', params.orderBy);
  }
  if (params.sortOrder) {
    search.set('sortOrder', params.sortOrder);
  }
  return search.toString();
}
