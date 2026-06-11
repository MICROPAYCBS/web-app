/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ProvisioningCriteriaPageContent } from '@/components/organization/provisioning-criteria-page-content';
import { listProvisioningCriteria } from '@/lib/fineract/provisioning-criteria';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationProvisioningCriteriaPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.provisioning'))) {
    notFound();
  }

  const criteria = await listProvisioningCriteria();

  return <ProvisioningCriteriaPageContent criteria={criteria} />;
}
