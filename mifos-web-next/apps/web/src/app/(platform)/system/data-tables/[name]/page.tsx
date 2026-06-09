/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SystemDataTableDetailView } from '@/components/system/system-data-table-detail-view';
import { getDatatableDefinition } from '@/lib/fineract/system-datatables';
import { getServerSession } from '@/lib/session/server';

export default async function SystemDataTableDetailPage({
  params
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const registeredTableName = decodeURIComponent(name);
  const session = await getServerSession();

  if (!can(session, resolvePermission('system.dataTables'))) {
    notFound();
  }

  const definition = await getDatatableDefinition(registeredTableName);
  if (!definition) {
    notFound();
  }

  return (
    <SystemDataTableDetailView
      definition={definition}
      canEdit={can(session, 'UPDATE_DATATABLE')}
      canDelete={can(session, 'DELETE_DATATABLE')}
    />
  );
}
