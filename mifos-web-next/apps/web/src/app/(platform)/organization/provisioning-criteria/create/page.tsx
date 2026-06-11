/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ProvisioningCriteriaFormPage } from '@/components/organization/provisioning-criteria-form-page';
import { getProvisioningCriteriaCreateTemplate } from '@/lib/fineract/provisioning-criteria';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationProvisioningCriteriaCreatePage() {
  const session = await getServerSession();
  if (!can(session, 'CREATE_PROVISIONING_CRITERIA')) {
    notFound();
  }

  const template = await getProvisioningCriteriaCreateTemplate();

  return (
    <ProvisioningCriteriaFormPage
      mode="create"
      loanProductOptions={template.loanProducts ?? []}
      glAccounts={template.glAccounts ?? []}
      initialDefinitions={(template.definitions ?? []).map((definition) => ({
        categoryId: definition.categoryId,
        categoryName: definition.categoryName
      }))}
    />
  );
}
