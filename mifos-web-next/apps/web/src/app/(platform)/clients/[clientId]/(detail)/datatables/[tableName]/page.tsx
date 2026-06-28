/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ClientDatatableView } from '@/components/clients/detail/client-datatable-view';
import { ClientManyToOneDatatableView } from '@/components/clients/detail/client-many-to-one-datatable-view';
import { findClientDatatable } from '@/lib/fineract/client-datatable-nav';
import {
  asManyToOneRows,
  clientLegalFormId,
  datatablePermissionPrefix,
  datatableRowToFormValues,
  getClientDatatableRows,
  listClientNavDatatables,
  normalizeSingleRowDatatableRecord,
  shouldUseSingleRowClientDatatableView,
  singleRowDatatableRowExists
} from '@/lib/fineract/client-datatables';
import { getClient } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export default async function ClientDatatablePage({
  params
}: {
  params: Promise<{ clientId: string; tableName: string }>;
}) {
  const { clientId, tableName } = await params;
  const registeredTableName = decodeURIComponent(tableName);
  const session = await getServerSession();
  const client = await getClient(clientId);
  const legalFormId = clientLegalFormId(client);
  const datatables = await listClientNavDatatables(legalFormId);
  const entry = findClientDatatable(datatables, registeredTableName);

  if (!entry) {
    notFound();
  }

  if (!can(session, datatablePermissionPrefix(registeredTableName, 'READ'))) {
    notFound();
  }

  const rowData = await getClientDatatableRows(clientId, registeredTableName);
  const useSingleRowView = shouldUseSingleRowClientDatatableView(entry.definition, rowData);

  if (!useSingleRowView) {
    return (
      <ClientManyToOneDatatableView
        clientId={clientId}
        registeredTableName={registeredTableName}
        columns={entry.definition.columnHeaderData ?? []}
        rows={asManyToOneRows(rowData)}
        canCreate={can(session, datatablePermissionPrefix(registeredTableName, 'CREATE'))}
        canDelete={can(session, datatablePermissionPrefix(registeredTableName, 'DELETE'))}
      />
    );
  }

  const row = normalizeSingleRowDatatableRecord(rowData);
  const columns = entry.definition.columnHeaderData ?? [];
  const values = row ? datatableRowToFormValues(columns, row) : {};
  const hasEntry = singleRowDatatableRowExists(rowData);

  return (
    <ClientDatatableView
      clientId={clientId}
      registeredTableName={registeredTableName}
      columns={entry.definition.columnHeaderData ?? []}
      values={values}
      hasEntry={hasEntry}
      canCreate={can(session, datatablePermissionPrefix(registeredTableName, 'CREATE'))}
      canDelete={can(session, datatablePermissionPrefix(registeredTableName, 'DELETE'))}
    />
  );
}
