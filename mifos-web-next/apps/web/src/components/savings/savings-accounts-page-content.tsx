'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsAccountsPage } from '@mifos/api-client';
import { SavingsAccountsTable } from '@/components/savings/savings-accounts-table';
import { ListPage } from '@/components/composites/list-page';
import type { PortfolioListQuery } from '@/lib/fineract/portfolio-list-query';

export function SavingsAccountsPageContent({
  initialPage,
  initialQuery
}: {
  initialPage: SavingsAccountsPage;
  initialQuery: PortfolioListQuery;
}) {
  return (
    <ListPage
      title="Savings accounts"
      description="Browse standard savings accounts across customers and branches."
    >
      <SavingsAccountsTable initialPage={initialPage} initialQuery={initialQuery} />
    </ListPage>
  );
}
