/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { clientStandingInstructionsCreatePath } from '@/lib/fineract/client-secondary-list-paths';
import { getClient } from '@/lib/fineract/clients';
import { resolveClientOfficeId } from '@/lib/fineract/resolve-client-office-id';

/** Legacy create route — opens the list with the create side panel. */
export default async function ClientStandingInstructionsCreatePage({
  params,
  searchParams
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<never> {
  const { clientId } = await params;
  const query = await searchParams;
  const client = await getClient(clientId);
  const officeIdParam = typeof query.officeId === 'string' ? Number(query.officeId) : undefined;
  const fromOfficeId =
    officeIdParam && !Number.isNaN(officeIdParam) && officeIdParam > 0
      ? officeIdParam
      : await resolveClientOfficeId(clientId, client);

  redirect(clientStandingInstructionsCreatePath(clientId, fromOfficeId));
}
