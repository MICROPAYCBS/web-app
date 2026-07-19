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
import { CUSTOMER_IDENTIFIER_CODE_NAME } from '@/lib/fineract/customer-identifier-code';
import { getIdentityTypeTemplate, listIdentityTypes } from '@/lib/fineract/identity-types';
import { listCodes } from '@/lib/fineract/system-codes';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationIdentityTypesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.identityTypes'))) {
    notFound();
  }

  const [identityTypes, template, codes] = await Promise.all([
    listIdentityTypes(),
    getIdentityTypeTemplate(),
    listCodes().catch(() => [])
  ]);

  const customerIdentifierCodeId = codes.find(
    (code) => code.name === CUSTOMER_IDENTIFIER_CODE_NAME
  )?.id;

  return (
    <IdentityTypesPageContent
      identityTypes={identityTypes}
      template={template}
      customerIdentifierCodeId={customerIdentifierCodeId}
      canCreate={can(session, 'CREATE_IDENTITYTYPE')}
      canEdit={can(session, 'UPDATE_IDENTITYTYPE')}
      canDelete={can(session, 'DELETE_IDENTITYTYPE')}
    />
  );
}
