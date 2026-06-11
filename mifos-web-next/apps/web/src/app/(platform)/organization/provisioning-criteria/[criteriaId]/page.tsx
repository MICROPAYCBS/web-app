/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ProvisioningCriteriaDetailView } from '@/components/organization/provisioning-criteria-detail-view';
import { getProvisioningCriteria } from '@/lib/fineract/provisioning-criteria';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationProvisioningCriteriaDetailPage({
  params
}: {
  params: Promise<{ criteriaId: string }>;
}) {
  const { criteriaId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.provisioning'))) {
    notFound();
  }

  const canEdit = can(session, 'UPDATE_CRITERIA');
  const canDelete = can(session, 'DELETE_CRITERIA');

  let criteria;
  try {
    criteria = await getProvisioningCriteria(criteriaId);
  } catch {
    notFound();
  }

  return (
    <ProvisioningCriteriaDetailView
      criteria={criteria}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
