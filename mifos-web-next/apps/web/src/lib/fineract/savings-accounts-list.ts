import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsAccountListItem, SavingsAccountsPage } from '@mifos/api-client';
import type { PortfolioListQuery } from '@/lib/fineract/portfolio-list-query';
import { buildPortfolioListApiQuery } from '@/lib/fineract/portfolio-list-query';
import { isClosedSavingsAccount } from '@/lib/fineract/client-accounts';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeSavingsListItem(raw: unknown): SavingsAccountListItem | null {
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

  return {
    id,
    accountNo,
    clientId: Number.isFinite(clientId) ? clientId : undefined,
    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,
    productName: typeof row.productName === 'string' ? row.productName : undefined,
    status:
      row.status && typeof row.status === 'object'
        ? (row.status as SavingsAccountListItem['status'])
        : undefined,
    currency:
      row.currency && typeof row.currency === 'object'
        ? (row.currency as SavingsAccountListItem['currency'])
        : undefined,
    accountBalance:
      typeof row.accountBalance === 'number'
        ? row.accountBalance
        : row.accountBalance != null
          ? Number(row.accountBalance)
          : undefined,
    depositType,
    officeName:
      typeof row.clientOfficeName === 'string'
        ? row.clientOfficeName
        : typeof row.officeName === 'string'
          ? row.officeName
          : undefined
  };
}

export async function fetchSavingsAccountsList(
  query: PortfolioListQuery
): Promise<SavingsAccountsPage> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<SavingsAccountsPage>(
    '/savingsaccounts',
    buildPortfolioListApiQuery(query)
  );
  let pageItems = Array.isArray(raw.pageItems)
    ? raw.pageItems
        .map((item) => normalizeSavingsListItem(item))
        .filter((item): item is SavingsAccountListItem => item !== null)
    : [];

  if (!query.includeClosed) {
    pageItems = pageItems.filter((account) => !isClosedSavingsAccount(account.status?.code));
  }

  return {
    totalFilteredRecords: Number.isFinite(Number(raw.totalFilteredRecords))
      ? Number(raw.totalFilteredRecords)
      : pageItems.length,
    pageItems
  };
}
