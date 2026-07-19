/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CashiersPageContent } from '@/components/organization/cashiers-page-content';
import { listOrganizationCashiers } from '@/lib/fineract/cashiers';
import { getOrganizationTeller } from '@/lib/fineract/tellers';
import { listStaffByOffice } from '@/lib/fineract/staff';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationTellerCashiersPage({
  params
}: {
  params: Promise<{ tellerId: string }>;
}) {
  const { tellerId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.tellers'))) {
    notFound();
  }

  const canAssign = can(session, 'ALLOCATECASHIER_TELLER');
  const canUpdate = can(session, 'UPDATECASHIERALLOCATION_TELLER');
  const canDelete = can(session, 'DELETECASHIERALLOCATION_TELLER');

  let teller;
  try {
    teller = await getOrganizationTeller(tellerId);
  } catch {
    notFound();
  }

  const [cashiers, staff] = await Promise.all([
    listOrganizationCashiers(tellerId),
    canAssign ? listStaffByOffice(teller.officeId) : Promise.resolve([])
  ]);

  return (
    <CashiersPageContent
      teller={teller}
      cashiers={cashiers}
      staff={staff}
      canAssign={canAssign}
      canUpdate={canUpdate}
      canDelete={canDelete}
    />
  );
}
