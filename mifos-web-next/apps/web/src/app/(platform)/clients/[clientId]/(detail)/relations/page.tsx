/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/fineract/clients';
import {
  clientLegalFormId,
  datatablePermissionPrefix,
  listClientManyToOneDatatables
} from '@/lib/fineract/client-datatables';
import { getServerSession } from '@/lib/session/server';

/** Legacy route — redirects to the first accessible many-to-one datatable page. */
export default async function ClientRelationsPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const client = await getClient(clientId);
  const legalFormId = clientLegalFormId(client);
  const datatables = await listClientManyToOneDatatables(legalFormId);

  for (const { registration } of datatables) {
    if (can(session, datatablePermissionPrefix(registration.registeredTableName, 'READ'))) {
      return redirect(
        `/clients/${clientId}/datatables/${encodeURIComponent(registration.registeredTableName)}`
      );
    }
  }

  return redirect(`/clients/${clientId}/general`);
}
