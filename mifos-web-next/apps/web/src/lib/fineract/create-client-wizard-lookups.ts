/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ContactType,
  FineractAddressFieldConfig,
  FineractClientIdentifierTemplate,
  FineractIncomeSourceOptions
} from '@mifos/api-client';
import type { ClientIdentifierIdentityTypeOption } from '@mifos/validation';

export const CREATE_CLIENT_WIZARD_ID = 'create-client';
export const CREATE_CLIENT_WIZARD_SESSION_VERSION = 1;

export type CreateClientWizardLookups = {
  addressFieldConfig: FineractAddressFieldConfig[];
  incomeSourceOptions: FineractIncomeSourceOptions;
  identifierDocumentTypes: { id: number; name: string }[];
  identifierIdentityTypeOptions: ClientIdentifierIdentityTypeOption[];
  contactTypeOptions: ContactType[];
};

export type CreateClientWizardLookupKey = 'address' | 'income' | 'identifiers' | 'contact';

export type CreateClientWizardLookupErrors = Partial<Record<CreateClientWizardLookupKey, string>>;

export function emptyCreateClientWizardLookups(): CreateClientWizardLookups {
  return {
    addressFieldConfig: [],
    incomeSourceOptions: {},
    identifierDocumentTypes: [],
    identifierIdentityTypeOptions: [],
    contactTypeOptions: []
  };
}

export function mapIdentifierTemplateForCreateWizard(
  template: FineractClientIdentifierTemplate
): Pick<CreateClientWizardLookups, 'identifierDocumentTypes' | 'identifierIdentityTypeOptions'> {
  return {
    identifierDocumentTypes:
      template.allowedDocumentTypes?.map((type) => ({
        id: type.id,
        name: type.name
      })) ?? [],
    identifierIdentityTypeOptions: template.identityTypeOptions ?? []
  };
}

export function lookupErrorForCreateClientStep(
  stepId: string,
  errors: CreateClientWizardLookupErrors
): string | undefined {
  if (stepId === 'address') {
    return errors.address;
  }
  if (stepId === 'income-sources') {
    return errors.income;
  }
  if (stepId === 'identifiers') {
    return errors.identifiers;
  }
  if (stepId === 'contact') {
    return errors.contact;
  }
  return undefined;
}
