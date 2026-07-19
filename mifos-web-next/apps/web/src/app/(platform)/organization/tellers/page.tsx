/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { TellersPageContent } from '@/components/organization/tellers-page-content';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { listOrganizationTellers } from '@/lib/fineract/tellers';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationTellersPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.tellers'))) {
    notFound();
  }

  const canCreate = can(session, 'CREATE_TELLER');
  const [tellers, offices] = await Promise.all([
    listOrganizationTellers(),
    canCreate ? listOfficeOptions() : Promise.resolve([])
  ]);

  return (
    <TellersPageContent tellers={tellers} offices={offices} canCreate={canCreate} />
  );
}
