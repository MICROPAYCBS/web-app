/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const GROUPS_LIST_DEFAULT_LIMIT = 25;

export type GroupListSortColumn = 'name' | 'accountNo' | 'externalId' | 'status' | 'officeName';
export type GroupListSortOrder = 'ASC' | 'DESC';

const SORT_COLUMN_TO_FIELD: Record<GroupListSortColumn, string> = {
  name: 'name',
  accountNo: 'accountNo',
  externalId: 'externalId',
  status: 'status',
  officeName: 'officeName'
};

export function groupListSortField(column: GroupListSortColumn): string {
  return SORT_COLUMN_TO_FIELD[column];
}

export function groupListSortColumnFromField(field: string): GroupListSortColumn | undefined {
  const entry = Object.entries(SORT_COLUMN_TO_FIELD).find(([, value]) => value === field);
  return entry ? (entry[0] as GroupListSortColumn) : undefined;
}

export interface GroupsListQuery {
  offset: number;
  limit: number;
  name?: string;
  externalId?: string;
  includeClosed: boolean;
  orderBy?: string;
  sortOrder?: GroupListSortOrder;
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

export function parseGroupsListQuery(
  params: Record<string, string | string[] | undefined>
): GroupsListQuery {
  const pageIndex = Math.max(0, Number(readParam(params, 'page') ?? '0') || 0);
  const limit = Math.max(
    1,
    Number(readParam(params, 'limit') ?? String(GROUPS_LIST_DEFAULT_LIMIT)) ||
      GROUPS_LIST_DEFAULT_LIMIT
  );
  const orderBy = readParam(params, 'orderBy');
  const sortOrder =
    readParam(params, 'sortOrder') === 'ASC' || readParam(params, 'sortOrder') === 'DESC'
      ? (readParam(params, 'sortOrder') as GroupListSortOrder)
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

export function buildGroupsListApiQuery(query: GroupsListQuery): Record<string, string> {
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
