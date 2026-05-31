/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';
import { notFound } from 'next/navigation';
import { ClientGeneralSections } from '@/components/clients/detail/client-general-sections';
import { getClient } from '@/lib/fineract/clients';

export default async function ClientGeneralPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let client;
  try {
    client = await getClient(clientId);
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return <ClientGeneralSections client={client} />;
}
