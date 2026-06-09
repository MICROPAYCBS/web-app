/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail, FineractDatatableDefinition } from '@mifos/api-client';
import { can } from '@mifos/auth';
import type { ServerSession } from '@/lib/session/types';
import {
  clientLegalFormId,
  datatablePermissionPrefix,
  formatDatatableTableTitle,
  listClientNavDatatables
} from '@/lib/fineract/client-datatables';

export interface ClientDatatableNavItem {
  id: string;
  label: string;
  href: string;
}

export async function buildClientDatatableNavItems(
  clientId: string | number,
  client: FineractClientDetail,
  session: ServerSession | null
): Promise<ClientDatatableNavItem[]> {
  const legalFormId = clientLegalFormId(client);
  const datatables = await listClientNavDatatables(legalFormId);

  return datatables
    .filter(({ registration }) =>
      can(session, datatablePermissionPrefix(registration.registeredTableName, 'READ'))
    )
    .map(({ registration }) => ({
      id: `datatable-${registration.registeredTableName}`,
      label: formatDatatableTableTitle(registration.registeredTableName),
      href: `/clients/${clientId}/datatables/${encodeURIComponent(registration.registeredTableName)}`
    }));
}

export function findClientDatatable(
  datatables: { registration: { registeredTableName: string }; definition: FineractDatatableDefinition }[],
  tableName: string
) {
  return datatables.find((entry) => entry.registration.registeredTableName === tableName) ?? null;
}
