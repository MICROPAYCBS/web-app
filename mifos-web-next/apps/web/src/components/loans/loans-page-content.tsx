'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoansPage } from '@mifos/api-client';
import { LoansTable } from '@/components/loans/loans-table';
import { ListPage } from '@/components/composites/list-page';
import type { PortfolioListQuery } from '@/lib/fineract/portfolio-list-query';

export function LoansPageContent({
  initialPage,
  initialQuery
}: {
  initialPage: LoansPage;
  initialQuery: PortfolioListQuery;
}) {
  return (
    <ListPage
      title="Loans"
      description="Browse loan accounts across customers and branches."
    >
      <LoansTable initialPage={initialPage} initialQuery={initialQuery} />
    </ListPage>
  );
}
