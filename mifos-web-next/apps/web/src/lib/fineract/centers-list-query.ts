/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const CENTERS_LIST_DEFAULT_LIMIT = 25;

export type CenterListSortColumn = 'name' | 'accountNo' | 'externalId' | 'status' | 'officeName';
export type CenterListSortOrder = 'ASC' | 'DESC';

const SORT_COLUMN_TO_FIELD: Record<CenterListSortColumn, string> = {
  name: 'name',
  accountNo: 'accountNo',
  externalId: 'externalId',
  status: 'status',
  officeName: 'officeName'
};

export function centerListSortField(column: CenterListSortColumn): string {
  return SORT_COLUMN_TO_FIELD[column];
}

export function centerListSortColumnFromField(field: string): CenterListSortColumn | undefined {
  const entry = Object.entries(SORT_COLUMN_TO_FIELD).find(([, value]) => value === field);
  return entry ? (entry[0] as CenterListSortColumn) : undefined;
}

export interface CentersListQuery {
  offset: number;
  limit: number;
  name?: string;
  externalId?: string;
  includeClosed: boolean;
  orderBy?: string;
  sortOrder?: CenterListSortOrder;
}

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

export function parseCentersListQuery(
  params: Record<string, string | string[] | undefined>
): CentersListQuery {
  const pageIndex = Math.max(0, Number(readParam(params, 'page') ?? '0') || 0);
  const limit = Math.max(
    1,
    Number(readParam(params, 'limit') ?? String(CENTERS_LIST_DEFAULT_LIMIT)) ||
      CENTERS_LIST_DEFAULT_LIMIT
  );
  const orderBy = readParam(params, 'orderBy');
  const sortOrder =
    readParam(params, 'sortOrder') === 'ASC' || readParam(params, 'sortOrder') === 'DESC'
      ? (readParam(params, 'sortOrder') as CenterListSortOrder)
      : undefined;

  return {
    offset: pageIndex * limit,
    limit,
    name: readParam(params, 'name'),
    externalId: readParam(params, 'externalId'),
    includeClosed: readParam(params, 'includeClosed') === 'true',
    orderBy,
    sortOrder
  };
}

export function buildCentersListUrl(query: CentersListQuery): string {
  const params = new URLSearchParams();
  const page = Math.floor(query.offset / query.limit);
  if (page > 0) {
    params.set('page', String(page));
  }
  if (query.limit !== CENTERS_LIST_DEFAULT_LIMIT) {
    params.set('limit', String(query.limit));
  }
  if (query.name) {
    params.set('name', query.name);
  }
  if (query.externalId) {
    params.set('externalId', query.externalId);
  }
  if (query.includeClosed) {
    params.set('includeClosed', 'true');
  }
  if (query.orderBy) {
    params.set('orderBy', query.orderBy);
  }
  if (query.sortOrder) {
    params.set('sortOrder', query.sortOrder);
  }
  const qs = params.toString();
  return qs ? `/centers?${qs}` : '/centers';
}

export function buildCentersListApiQuery(query: CentersListQuery): Record<string, string> {
  const params: Record<string, string> = {
    offset: String(query.offset),
    limit: String(query.limit),
    paged: 'true'
  };
  if (query.name) {
    params.name = query.name;
  }
  if (query.externalId) {
    params.externalId = query.externalId;
  }
  if (query.orderBy) {
    params.orderBy = query.orderBy;
    params.sortOrder = query.sortOrder ?? 'ASC';
  }
  return params;
}
