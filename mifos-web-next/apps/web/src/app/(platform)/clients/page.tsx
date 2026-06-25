/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { ClientsPageContent } from '@/components/clients/clients-page-content';
import { fetchClientsForTable } from '@/lib/fineract/clients-list';
import { listOfficeOptions } from '@/lib/fineract/offices';

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (params.create === '1') {
    redirect('/clients/create');
  }

  const [{ clients, totalRecords, truncated }, offices] = await Promise.all([
    fetchClientsForTable(),
    listOfficeOptions()
  ]);

  return (
    <ClientsPageContent
      clients={clients}
      offices={offices}
      truncated={truncated}
      totalRecords={totalRecords}
    />
  );
}
