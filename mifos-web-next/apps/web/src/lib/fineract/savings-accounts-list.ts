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
import { normalizeSavingsListItem } from '@/lib/fineract/savings-accounts-list-item';

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
