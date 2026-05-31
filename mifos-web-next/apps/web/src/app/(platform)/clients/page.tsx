/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Suspense } from 'react';
import { ClientsPageContent } from '@/components/clients/clients-page-content';
import { getClientTemplate, listClients } from '@/lib/fineract/clients';

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const { create } = await searchParams;
  const [initialPage, template] = await Promise.all([
    listClients({ limit: 25, offset: 0, orderBy: 'id', sortOrder: 'DESC' }),
    getClientTemplate().catch(() => null)
  ]);

  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading clients…</p>}>
      <ClientsPageContent
        initialPage={initialPage}
        template={template}
        openCreate={create === '1'}
      />
    </Suspense>
  );
}
