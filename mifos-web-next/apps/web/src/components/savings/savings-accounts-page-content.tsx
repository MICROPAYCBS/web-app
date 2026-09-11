'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsAccountsPage } from '@mifos/api-client';
import { Can, resolvePermission } from '@mifos/auth';
import { Upload } from 'lucide-react';
import Link from 'next/link';
import { SavingsAccountsTable } from '@/components/savings/savings-accounts-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import type { PortfolioListQuery } from '@/lib/fineract/portfolio-list-query';
import { SAVINGS_TRANSACTIONS_IMPORT_PATH } from '@/lib/savings/savings-transactions-import';
import { cn } from '@/lib/utils';

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
      actions={
        <Can permission={resolvePermission('savings.importTransactions')}>
          <Link
            href={SAVINGS_TRANSACTIONS_IMPORT_PATH}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            <Upload className="mr-2 size-4" />
            Import
          </Link>
        </Can>
      }
    >
      <SavingsAccountsTable initialPage={initialPage} initialQuery={initialQuery} />
    </ListPage>
  );
}
