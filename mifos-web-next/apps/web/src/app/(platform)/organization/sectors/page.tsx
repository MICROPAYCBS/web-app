/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SectorsPageContent } from '@/components/organization/sectors-page-content';
import { getSectorTemplate, listSectors } from '@/lib/fineract/sectors';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationSectorsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.sectors'))) {
    notFound();
  }

  const [sectors, template] = await Promise.all([listSectors(), getSectorTemplate()]);

  return (
    <SectorsPageContent
      sectors={sectors}
      template={template}
      canCreate={can(session, 'CREATE_SECTOR')}
      canEdit={can(session, 'UPDATE_SECTOR')}
      canDelete={can(session, 'DELETE_SECTOR')}
    />
  );
}
