/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SystemDatatableCreateForm } from '@/components/system/system-datatable-form-view';
import { listSystemCodes } from '@/lib/fineract/system-datatables';
import { getServerSession } from '@/lib/session/server';

function toCodeOptions(codes: Awaited<ReturnType<typeof listSystemCodes>>) {
  return codes.map((code) => ({
    value: code.name,
    label: code.name
  }));
}

export default async function SystemDataTableCreatePage() {
  const session = await getServerSession();
  if (!can(session, 'CREATE_DATATABLE')) {
    notFound();
  }

  const codes = await listSystemCodes();

  return <SystemDatatableCreateForm codeOptions={toCodeOptions(codes)} />;
}
