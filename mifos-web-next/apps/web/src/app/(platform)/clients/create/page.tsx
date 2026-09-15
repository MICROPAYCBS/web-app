/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { LEGAL_FORM_ENTITY } from '@mifos/validation';
import { redirect } from 'next/navigation';
import { CreateClientWizard } from '@/components/clients/create/create-client-wizard';
import { getClientIncomeSourceTemplate } from '@/lib/fineract/client-income-source';
import { getClientIdentifierTemplate } from '@/lib/fineract/client-identifiers';
import { getAddressFieldConfiguration, getClientTemplate } from '@/lib/fineract/clients';
import { listContactTypes } from '@/lib/fineract/contact-types';
import {
  emptyCreateClientWizardLookups,
  mapIdentifierTemplateForCreateWizard,
  type CreateClientWizardLookupErrors,
  type CreateClientWizardLookups
} from '@/lib/fineract/create-client-wizard-lookups';
import { listEntityDatatableChecks } from '@/lib/fineract/entity-datatable-checks';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function CreateClientPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const profileParam = typeof params.profile === 'string' ? params.profile : undefined;
  const defaultLegalFormId =
    profileParam === 'entity' ? LEGAL_FORM_ENTITY : undefined;

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

  const [
    template,
    addressResult,
    entityDatatableChecks,
    incomeResult,
    identifierResult,
    contactResult
  ] = await Promise.all([
    getClientTemplate(defaultOfficeId),
    tryFineractLoad(() => getAddressFieldConfiguration(), 'Could not load address fields.'),
    listEntityDatatableChecks()
      .then((page) => page.pageItems ?? [])
      .catch(() => []),
    tryFineractLoad(
      () => getClientIncomeSourceTemplate(1),
      'Could not load income source options.'
    ),
    tryFineractLoad(
      () => getClientIdentifierTemplate(1),
      'Could not load identifier options.'
    ),
    tryFineractLoad(() => listContactTypes(), 'Could not load contact types.')
  ]);

  const emptyLookups = emptyCreateClientWizardLookups();
  const mappedIdentifiers = identifierResult.ok
    ? mapIdentifierTemplateForCreateWizard(identifierResult.data)
    : {
        identifierDocumentTypes: emptyLookups.identifierDocumentTypes,
        identifierIdentityTypeOptions: emptyLookups.identifierIdentityTypeOptions
      };

  const initialLookups: CreateClientWizardLookups = {
    addressFieldConfig: addressResult.ok ? addressResult.data : emptyLookups.addressFieldConfig,
    incomeSourceOptions: incomeResult.ok ? incomeResult.data : emptyLookups.incomeSourceOptions,
    identifierDocumentTypes: mappedIdentifiers.identifierDocumentTypes,
    identifierIdentityTypeOptions: mappedIdentifiers.identifierIdentityTypeOptions,
    contactTypeOptions: contactResult.ok ? contactResult.data : emptyLookups.contactTypeOptions
  };

  const initialLookupErrors: CreateClientWizardLookupErrors = {};
  if (!addressResult.ok) {
    initialLookupErrors.address = addressResult.message;
  }
  if (!incomeResult.ok) {
    initialLookupErrors.income = incomeResult.message;
  }
  if (!identifierResult.ok) {
    initialLookupErrors.identifiers = identifierResult.message;
  }
  if (!contactResult.ok) {
    initialLookupErrors.contact = contactResult.message;
  }

  return (
    <CreateClientWizard
      initialTemplate={template}
      defaultOfficeId={defaultOfficeId}
      defaultLegalFormId={defaultLegalFormId}
      entityDatatableChecks={entityDatatableChecks}
      initialLookups={initialLookups}
      initialLookupErrors={initialLookupErrors}
    />
  );
}
