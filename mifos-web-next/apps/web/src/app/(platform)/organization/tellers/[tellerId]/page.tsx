/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { TellerDetailView } from '@/components/organization/teller-detail-view';
import { TellerEditUrlPanel } from '@/components/organization/teller-edit-url-panel';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationTeller } from '@/lib/fineract/tellers';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationTellerDetailPage({
  params
}: {
  params: Promise<{ tellerId: string }>;
}) {
  const { tellerId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.tellers'))) {
    notFound();
  }

  const canEdit = can(session, 'UPDATE_TELLER');
  const canDelete = can(session, 'DELETE_TELLER');

  let teller;
  try {
    teller = await getOrganizationTeller(tellerId);
  } catch {
    notFound();
  }

  const offices = canEdit ? await listOfficeOptions() : [];

  return (
    <>
      <TellerDetailView teller={teller} canEdit={canEdit} canDelete={canDelete} />
      {canEdit ? (
        <Suspense fallback={null}>
          <TellerEditUrlPanel teller={teller} offices={offices} />
        </Suspense>
      ) : null}
    </>
  );
}
