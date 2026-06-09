'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientsPage } from '@mifos/api-client';
import { Can, resolvePermission } from '@mifos/auth';
import Link from 'next/link';
import { ClientsTable } from '@/components/clients/clients-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import type { ClientListSortColumn, ClientListSortOrder } from '@/lib/fineract/clients-list-query';
import { cn } from '@/lib/utils';

export function ClientsPageContent({
  initialPage,
  initialPageSize,
  initialQuery,
  initialIncludeClosed,
  initialSortColumn,
  initialSortOrder
}: {
  initialPage: FineractClientsPage;
  initialPageSize?: number;
  initialQuery?: string;
  initialIncludeClosed?: boolean;
  initialSortColumn?: ClientListSortColumn;
  initialSortOrder?: ClientListSortOrder;
}) {
  return (
    <ListPage
      title="Clients"
      description="Browse and manage clients."
      actions={
        <Can permission={resolvePermission('clients.create')}>
          <Link href="/clients/create" className={cn(buttonVariants())}>
            New client
          </Link>
        </Can>
      }
    >
      <ClientsTable
        initialPage={initialPage}
        initialPageSize={initialPageSize}
        initialQuery={initialQuery}
        initialIncludeClosed={initialIncludeClosed}
        initialSortColumn={initialSortColumn}
        initialSortOrder={initialSortOrder}
      />
    </ListPage>
  );
}
