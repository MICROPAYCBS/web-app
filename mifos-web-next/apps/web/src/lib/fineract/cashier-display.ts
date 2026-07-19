/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  OrganizationCashierListItem,
  OrganizationCashierSummary,
  OrganizationCashierTransaction
} from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import {
  coerceFineractDateTime,
  formatFineractDateArray,
  parseFineractDateString,
  toLocalCalendarDate
} from '@/lib/fineract/dates';

export type CashierAssignmentStatus = 'active' | 'scheduled' | 'ended';

export type AccountCashierKind = 'loan' | 'savings';

export interface AccountCashierSnapshot {
  tellerId: number;
  tellerName?: string;
  cashier: OrganizationCashierListItem;
  assignmentStatus: CashierAssignmentStatus;
  currencyCode: string;
  summary: OrganizationCashierSummary;
  accountTransactions: OrganizationCashierTransaction[];
  sessionTransactions: OrganizationCashierTransaction[];
  canOpenCashierDetail: boolean;
}

/** Net cash per organization currency — shown inline on account detail nav. */
export interface CashierCurrencyBalance {
  currencyCode: string;
  netCash?: number;
}

export interface CashierNavBalance {
  tellerId: number;
  cashierId: number;
  canOpenCashierDetail: boolean;
  balances: CashierCurrencyBalance[];
}

function assignmentBoundaryDate(value: number[] | string | undefined): Date | null {
  const coerced = coerceFineractDateTime(value);
  if (coerced == null) {
    return null;
  }
  if (Array.isArray(coerced)) {
    const [year, month, day] = coerced;
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }
    return new Date(year, month - 1, day);
  }
  if (typeof coerced === 'number') {
    return toLocalCalendarDate(new Date(coerced));
  }
  return parseFineractDateString(coerced);
}

export function cashierAssignmentStatus(
  cashier: Pick<OrganizationCashierListItem, 'startDate' | 'endDate'>,
  referenceDate: Date = new Date()
): CashierAssignmentStatus {
  const today = toLocalCalendarDate(referenceDate);
  const start = assignmentBoundaryDate(cashier.startDate);
  const end = assignmentBoundaryDate(cashier.endDate);

  if (start && today < start) {
    return 'scheduled';
  }
  if (end && today > end) {
    return 'ended';
  }
  return 'active';
}

export function cashierAssignmentStatusLabel(status: CashierAssignmentStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'scheduled':
      return 'Scheduled';
    case 'ended':
      return 'Ended';
  }
}

export function cashierAssignmentStatusVariant(
  status: CashierAssignmentStatus
): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'scheduled':
      return 'outline';
    case 'ended':
      return 'secondary';
  }
}

export function formatCashierAssignmentPeriod(
  cashier: Pick<OrganizationCashierListItem, 'startDate' | 'endDate'>
): string {
  const start = formatFineractDateArray(cashier.startDate) ?? '—';
  const end = formatFineractDateArray(cashier.endDate);
  return end ? `${start} – ${end}` : `${start} – ongoing`;
}

export function cashierTransactionMatchesAccount(
  transaction: OrganizationCashierTransaction,
  accountId: number,
  accountKind: AccountCashierKind
): boolean {
  if (Number(transaction.entityId) !== accountId) {
    return false;
  }
  const entityType = (transaction.entityType ?? '').toLowerCase();
  if (accountKind === 'savings') {
    return entityType.includes('saving');
  }
  return entityType.includes('loan');
}

export function sortCashierTransactions(
  transactions: OrganizationCashierTransaction[]
): OrganizationCashierTransaction[] {
  return [...transactions].sort((left, right) => {
    const leftTime = Date.parse(formatFineractDateArray(left.txnDate) ?? '') || 0;
    const rightTime = Date.parse(formatFineractDateArray(right.txnDate) ?? '') || 0;
    return rightTime - leftTime;
  });
}

export function filterCashierTransactionsForAccount(
  transactions: OrganizationCashierTransaction[],
  accountId: number,
  accountKind: AccountCashierKind
): OrganizationCashierTransaction[] {
  return sortCashierTransactions(
    transactions.filter((transaction) =>
      cashierTransactionMatchesAccount(transaction, accountId, accountKind)
    )
  );
}

export const CASHIER_TXN_TYPE_ALLOCATE = 101;
export const CASHIER_TXN_TYPE_SETTLE = 102;
export const CASHIER_TXN_TYPE_CASH_IN = 103;
export const CASHIER_TXN_TYPE_CASH_OUT = 104;

export function cashierTransactionHasLegalTenderBreakdown(
  transaction: OrganizationCashierTransaction
): boolean {
  return (transaction.legalTenderLines?.length ?? 0) > 0;
}

export function cashierTransactionCurrencyCode(
  transaction: OrganizationCashierTransaction,
  fallbackCurrencyCode: string
): string {
  return transaction.currencyCode ?? transaction.currency?.code ?? fallbackCurrencyCode;
}

/** Stable list key — Fineract may reuse `id` across txn types (e.g. allocate vs loan). */
export function cashierTransactionRowKey(
  transaction: OrganizationCashierTransaction,
  index: number
): string {
  const txnTypePart = transaction.txnType?.id ?? transaction.txnType?.code ?? 'unknown';
  const datePart = Array.isArray(transaction.txnDate)
    ? transaction.txnDate.join('.')
    : String(transaction.txnDate ?? '');
  return [
    index,
    transaction.id,
    txnTypePart,
    datePart,
    transaction.txnAmount ?? '',
    transaction.entityId ?? '',
    transaction.entityType ?? ''
  ].join(':');
}

export function formatCashierNavBalanceLines(balance: CashierNavBalance): string[] {
  return balance.balances.map(
    (row) => formatMoney(row.netCash ?? 0, row.currencyCode) ?? row.currencyCode
  );
}

export function formatCashierNavBalanceLabel(balance: CashierNavBalance): string {
  return formatCashierNavBalanceLines(balance).join(' · ');
}
