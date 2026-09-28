/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsAccountListItem } from '@mifos/api-client';

function readText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function readAmount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : undefined;
  }
  return undefined;
}

/** Map a savings account list row. Product, balance, and branch use the names the account list returns. */
export function normalizeSavingsListItem(raw: unknown): SavingsAccountListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const accountNo = typeof row.accountNo === 'string' ? row.accountNo : '';
  if (!Number.isFinite(id) || !accountNo) {
    return null;
  }

  const clientId = Number(row.clientId);
  const depositType =
    row.depositType && typeof row.depositType === 'object'
      ? (row.depositType as SavingsAccountListItem['depositType'])
      : undefined;

  if (depositType?.value && depositType.value !== 'Savings') {
    return null;
  }

  const summary =
    row.summary && typeof row.summary === 'object'
      ? (row.summary as Record<string, unknown>)
      : undefined;

  return {
    id,
    accountNo,
    clientId: Number.isFinite(clientId) ? clientId : undefined,
    clientName: readText(row.clientName),
    productName: readText(row.savingsProductName) ?? readText(row.productName),
    status:
      row.status && typeof row.status === 'object'
        ? (row.status as SavingsAccountListItem['status'])
        : undefined,
    currency:
      row.currency && typeof row.currency === 'object'
        ? (row.currency as SavingsAccountListItem['currency'])
        : undefined,
    accountBalance: readAmount(row.accountBalance) ?? readAmount(summary?.accountBalance),
    depositType,
    officeName: readText(row.officeName) ?? readText(row.clientOfficeName)
  };
}
