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
import { listClients } from '@/lib/fineract/clients';

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const { create } = await searchParams;
  if (create === '1') {
    redirect('/clients/create');
  }

  const initialPage = await listClients({
    limit: 25,
    offset: 0,
    orderBy: 'id',
    sortOrder: 'DESC'
  });

  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading clients…</p>}>
      <ClientsPageContent initialPage={initialPage} />
    </Suspense>
  );
}
