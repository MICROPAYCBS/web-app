/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SystemDatatableEditForm } from '@/components/system/system-datatable-form-view';
import { getDatatableDefinition, listSystemCodes } from '@/lib/fineract/system-datatables';
import { getServerSession } from '@/lib/session/server';

function toCodeOptions(codes: Awaited<ReturnType<typeof listSystemCodes>>) {
  return codes.map((code) => ({
    value: code.name,
    label: code.name
  }));
}

export default async function SystemDataTableEditPage({
  params
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const registeredTableName = decodeURIComponent(name);
  const session = await getServerSession();

  if (!can(session, 'UPDATE_DATATABLE')) {
    notFound();
  }

  const [definition, codes] = await Promise.all([
    getDatatableDefinition(registeredTableName),
    listSystemCodes()
  ]);

  if (!definition) {
    notFound();
  }

  return (
    <SystemDatatableEditForm
      definition={definition}
      codeOptions={toCodeOptions(codes)}
    />
  );
}
