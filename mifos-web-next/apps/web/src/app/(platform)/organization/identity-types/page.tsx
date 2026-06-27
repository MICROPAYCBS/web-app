/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { IdentityTypesPageContent } from '@/components/organization/identity-types-page-content';
import { getIdentityTypeTemplate, listIdentityTypes } from '@/lib/fineract/identity-types';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationIdentityTypesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.identityTypes'))) {
    notFound();
  }

  const [identityTypes, template] = await Promise.all([
    listIdentityTypes(),
    getIdentityTypeTemplate()
  ]);

  return (
    <IdentityTypesPageContent
      identityTypes={identityTypes}
      template={template}
      canCreate={can(session, 'CREATE_IDENTITYTYPE')}
      canEdit={can(session, 'UPDATE_IDENTITYTYPE')}
      canDelete={can(session, 'DELETE_IDENTITYTYPE')}
    />
  );
}
