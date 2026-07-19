/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SystemDataTablesPageContent } from '@/components/system/system-data-tables-page-content';
import { listSystemDatatables } from '@/lib/fineract/system-datatables';
import { getServerSession } from '@/lib/session/server';

export default async function SystemDataTablesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.dataTables'))) {
    notFound();
  }

  const datatables = await listSystemDatatables();

  return <SystemDataTablesPageContent datatables={datatables} />;
}
