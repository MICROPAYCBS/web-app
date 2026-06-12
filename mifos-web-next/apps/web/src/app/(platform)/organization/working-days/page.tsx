/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { WorkingDaysPageContent } from '@/components/organization/working-days-page-content';
import { getWorkingDaysConfiguration } from '@/lib/fineract/working-days';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationWorkingDaysPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.workingDays'))) {
    notFound();
  }

  const configuration = await getWorkingDaysConfiguration();
  const canUpdate = can(session, 'UPDATE_WORKINGDAYS');

  return <WorkingDaysPageContent configuration={configuration} canUpdate={canUpdate} />;
}
