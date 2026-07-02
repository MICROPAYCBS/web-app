/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { IndustriesPageContent } from '@/components/organization/industries-page-content';
import { getIndustryTemplate, listIndustries } from '@/lib/fineract/industries';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationIndustriesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.industries'))) {
    notFound();
  }

  const [industries, template] = await Promise.all([listIndustries(), getIndustryTemplate()]);

  return (
    <IndustriesPageContent
      industries={industries}
      template={template}
      canCreate={can(session, 'CREATE_INDUSTRY')}
      canEdit={can(session, 'UPDATE_INDUSTRY')}
      canDelete={can(session, 'DELETE_INDUSTRY')}
    />
  );
}
