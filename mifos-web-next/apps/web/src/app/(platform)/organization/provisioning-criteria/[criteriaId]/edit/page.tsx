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
import { getProvisioningCriteriaEditTemplate } from '@/lib/fineract/provisioning-criteria';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationProvisioningCriteriaEditPage({
  params
}: {
  params: Promise<{ criteriaId: string }>;
}) {
  const { criteriaId } = await params;
  const session = await getServerSession();

  if (!can(session, 'UPDATE_CRITERIA')) {
    notFound();
  }

  let template;
  try {
    template = await getProvisioningCriteriaEditTemplate(criteriaId);
  } catch {
    notFound();
  }

  return (
    <ProvisioningCriteriaFormPage
      mode="edit"
      criteriaId={template.criteriaId}
      initialCriteriaName={template.criteriaName}
      initialLoanProducts={template.selectedLoanProducts ?? []}
      loanProductOptions={template.loanProducts ?? []}
      glAccounts={template.glAccounts ?? []}
      initialDefinitions={template.definitions ?? []}
    />
  );
}
