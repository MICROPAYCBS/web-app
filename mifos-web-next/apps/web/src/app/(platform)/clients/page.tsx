/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ClientsPageContent } from '@/components/clients/clients-page-content';
import { fetchClientsList } from '@/lib/fineract/clients-list';
import {
  clientListSortColumnFromField,
  type ClientListSortColumn,
  type ClientListSortOrder
} from '@/lib/fineract/clients-list-query';

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (params.create === '1') {
    redirect('/clients/create');
  }

  const pageIndex = Math.max(0, Number(params.page ?? '0') || 0);
  const limit = Math.max(1, Number(params.limit ?? '25') || 25);
  const query = typeof params.query === 'string' ? params.query.trim() : '';
  const includeClosed = params.includeClosed === 'true';
  const orderBy = typeof params.orderBy === 'string' ? params.orderBy : 'id';
  const sortOrder: ClientListSortOrder =
    params.sortOrder === 'ASC' || params.sortOrder === 'DESC' ? params.sortOrder : 'DESC';
  const sortColumn: ClientListSortColumn =
    clientListSortColumnFromField(orderBy) ?? 'id';

  const initialPage = await fetchClientsList({
    offset: pageIndex * limit,
    limit,
    query: query || undefined,
    includeClosed,
    orderBy,
    sortOrder
  });

  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading clients…</p>}>
      <ClientsPageContent
        initialPage={initialPage}
        initialPageSize={limit}
        initialQuery={query}
        initialIncludeClosed={includeClosed}
        initialSortColumn={sortColumn}
        initialSortOrder={sortOrder}
      />
    </Suspense>
  );
}
