/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { redirect } from 'next/navigation';
import { CreateClientWizard } from '@/components/clients/create/create-client-wizard';
import type { FineractClientIdentifierTemplate } from '@mifos/api-client';
import { getClientIncomeSourceTemplate } from '@/lib/fineract/client-income-source';
import { getClientIdentifierTemplate } from '@/lib/fineract/client-identifiers';
import { getAddressFieldConfiguration, getClientTemplate } from '@/lib/fineract/clients';
import { listEntityDatatableChecks } from '@/lib/fineract/entity-datatable-checks';
import { getServerSession } from '@/lib/session/server';

export default async function CreateClientPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    redirect('/forbidden');
  }

  const defaultOfficeId = session.officeId > 0 ? session.officeId : undefined;

  const [template, addressFieldConfig, entityDatatableChecks, incomeSourceOptions, identifierTemplate] =
    await Promise.all([
    getClientTemplate(defaultOfficeId),
    getAddressFieldConfiguration().catch(() => [] as Awaited<ReturnType<typeof getAddressFieldConfiguration>>),
    listEntityDatatableChecks()
      .then((page) => page.pageItems ?? [])
      .catch(() => []),
    getClientIncomeSourceTemplate(1).catch(() => ({})),
    getClientIdentifierTemplate(1).catch(
      (): FineractClientIdentifierTemplate => ({ allowedDocumentTypes: [], identityTypeOptions: [] })
    )
  ]);

  const identifierDocumentTypes =
    identifierTemplate.allowedDocumentTypes?.map((type) => ({
      id: type.id,
      name: type.name
    })) ?? [];

  const identifierIdentityTypeOptions =
    identifierTemplate.identityTypeOptions?.map((option) => ({
      codeValueId: option.codeValueId,
      codeValueName: option.codeValueName,
      example: option.example,
      formatDescription: option.formatDescription,
      validationMessage: option.validationMessage,
      validationRegex: option.validationRegex,
      status: option.status
    })) ?? [];

  return (
    <CreateClientWizard
      initialTemplate={template}
      defaultOfficeId={defaultOfficeId}
      addressFieldConfig={addressFieldConfig}
      entityDatatableChecks={entityDatatableChecks}
      incomeSourceOptions={incomeSourceOptions}
      identifierDocumentTypes={identifierDocumentTypes}
      identifierIdentityTypeOptions={identifierIdentityTypeOptions}
    />
  );
}
