/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ContactTypesPageContent } from '@/components/organization/contact-types-page-content';
import { getContactTypeTemplate, listContactTypes } from '@/lib/fineract/contact-types';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationContactTypesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.contactTypes'))) {
    notFound();
  }

  const [contactTypes, template] = await Promise.all([
    listContactTypes(),
    getContactTypeTemplate()
  ]);

  return (
    <ContactTypesPageContent
      contactTypes={contactTypes}
      template={template}
      canCreate={can(session, 'CREATE_CONTACTTYPE')}
      canEdit={can(session, 'UPDATE_CONTACTTYPE')}
      canDelete={can(session, 'DELETE_CONTACTTYPE')}
    />
  );
}
