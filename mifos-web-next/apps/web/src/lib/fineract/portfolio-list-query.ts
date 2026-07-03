/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const PORTFOLIO_LIST_DEFAULT_LIMIT = 25;

export type PortfolioListSortOrder = 'ASC' | 'DESC';

export type PortfolioListSortColumn =
  | 'accountNo'
  | 'clientName'
  | 'productName'
  | 'status'
  | 'officeName'
  | 'balance';

const LOAN_SORT_COLUMN_TO_FIELD: Record<PortfolioListSortColumn, string> = {
  accountNo: 'accountNo',
  clientName: 'clientName',
  productName: 'loanProductName',
  status: 'status',
  officeName: 'clientOfficeName',
  balance: 'loanBalance'
};

const SAVINGS_SORT_COLUMN_TO_FIELD: Record<PortfolioListSortColumn, string> = {
  accountNo: 'accountNo',
  clientName: 'clientName',
  productName: 'productName',
  status: 'status',
  officeName: 'clientOfficeName',
  balance: 'accountBalance'
};

export function loanListSortField(column: PortfolioListSortColumn): string {
  return LOAN_SORT_COLUMN_TO_FIELD[column];
}

export function loanListSortColumnFromField(
  field: string
): PortfolioListSortColumn | undefined {
  const entry = Object.entries(LOAN_SORT_COLUMN_TO_FIELD).find(([, value]) => value === field);
  return entry ? (entry[0] as PortfolioListSortColumn) : undefined;
}

export function savingsListSortField(column: PortfolioListSortColumn): string {
  return SAVINGS_SORT_COLUMN_TO_FIELD[column];
}

export function savingsListSortColumnFromField(
  field: string
): PortfolioListSortColumn | undefined {
  const entry = Object.entries(SAVINGS_SORT_COLUMN_TO_FIELD).find(([, value]) => value === field);
  return entry ? (entry[0] as PortfolioListSortColumn) : undefined;
}

export interface PortfolioListQuery {
  offset: number;
  limit: number;
  accountNo?: string;
  includeClosed: boolean;
  orderBy?: string;
  sortOrder?: PortfolioListSortOrder;
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

export function parsePortfolioListQuery(
  params: Record<string, string | string[] | undefined>
): PortfolioListQuery {
  const pageIndex = Math.max(0, Number(readParam(params, 'page') ?? '0') || 0);
  const limit = Math.max(
    1,
    Number(readParam(params, 'limit') ?? String(PORTFOLIO_LIST_DEFAULT_LIMIT)) ||
      PORTFOLIO_LIST_DEFAULT_LIMIT
  );
  const orderBy = readParam(params, 'orderBy');
  const sortOrder =
    readParam(params, 'sortOrder') === 'ASC' || readParam(params, 'sortOrder') === 'DESC'
      ? (readParam(params, 'sortOrder') as PortfolioListSortOrder)
      : undefined;

  return {
    offset: pageIndex * limit,
    limit,
    accountNo: readParam(params, 'accountNo'),
    includeClosed: readParam(params, 'includeClosed') === 'true',
    orderBy,
    sortOrder
  };
}

export function buildPortfolioListApiQuery(query: PortfolioListQuery): Record<string, string> {
  const params: Record<string, string> = {
    offset: String(query.offset),
    limit: String(query.limit),
    paged: 'true'
  };
  if (query.accountNo) {
    params.accountNo = query.accountNo;
  }
  if (query.orderBy) {
    params.orderBy = query.orderBy;
    params.sortOrder = query.sortOrder ?? 'ASC';
  }
  return params;
}
