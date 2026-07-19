/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate } from '@mifos/api-client';
import {
  createClientSchema,
  LEGAL_FORM_PERSON,
  sanitizeComplianceProfileForSubmit,
  type CreateClientPayload
} from '@mifos/validation';
import { buildOnboardingCreateClientContacts } from '@/lib/clients/onboarding-client-contacts';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { buildCreateClientDatatablePayloads } from './datatable-payloads';
import type { CreateClientDraft } from './types';

export function buildCreateClientRaw(
  draft: CreateClientDraft,
  template: FineractClientTemplate,
  legalFormId: number,
  contactTypeOptions: Array<{ id: number; typeCode: string; typeName: string }> = []
): Record<string, unknown> {
  const {
    general,
    familyMembers,
    clientIdentifiers,
    incomeSources,
    contacts,
    complianceProfile,
    addresses,
    datatables,
    multiRowDatatables
  } = draft;

  const dateFormat = general.dateFormat ?? FINERACT_DATE_FORMAT;
  const locale = general.locale ?? FINERACT_LOCALE;
  const datatablePayloads = buildCreateClientDatatablePayloads(
    template,
    legalFormId,
    datatables,
    multiRowDatatables,
    dateFormat,
    locale
  );

  const contactsPayload = buildOnboardingCreateClientContacts(
    {
      mobileNo: general.mobileNo,
      alternativeMobileNo: general.alternativeMobileNo,
      emailAddress: general.emailAddress,
      alternativeEmailAddress: general.alternativeEmailAddress
    },
    contacts,
    contactTypeOptions
  );

  return {
    officeId: general.officeId,
    staffId: general.staffId,
    legalFormId,
    externalId: general.externalId,
    firstname: general.firstname,
    middlename: general.middlename,
    lastname: general.lastname,
    fullname: general.fullname,
    clientNonPersonDetails: general.clientNonPersonDetails,
    genderId: general.genderId,
    isStaff: general.isStaff,
    mobileNo: general.mobileNo,
    emailAddress: general.emailAddress,
    taxIdentificationNumber: general.taxIdentificationNumber,
    alternativeMobileNo: general.alternativeMobileNo,
    alternativeEmailAddress: general.alternativeEmailAddress,
    subIndustryId: general.subIndustryId,
    customerClassId: general.customerClassId,
    titleId: general.titleId,
    nationalityCountryId: general.nationalityCountryId,
    maritalStatusId: general.maritalStatusId,
    customerRiskProfileId: general.customerRiskProfileId,
    dateOfBirth: general.dateOfBirth,
    clientTypeId: general.clientTypeId,
    submittedOnDate: general.submittedOnDate,
    savingsProductId: general.savingsProductId,
    dateFormat,
    locale,
    familyMembers: familyMembers.length ? familyMembers : undefined,
    clientIdentifiers: clientIdentifiers.length ? clientIdentifiers : undefined,
    incomeSources: incomeSources.length ? incomeSources : undefined,
    contacts: contactsPayload.length ? contactsPayload : undefined,
    complianceProfile: sanitizeComplianceProfileForSubmit(complianceProfile),
    address: template.isAddressEnabled && addresses.length ? addresses : undefined,
    datatables: datatablePayloads.length ? datatablePayloads : undefined
  };
}

export function parseCreateClientPayload(
  draft: CreateClientDraft,
  template: FineractClientTemplate,
  legalFormId: number = draft.general.legalFormId ?? LEGAL_FORM_PERSON,
  contactTypeOptions: Array<{ id: number; typeCode: string; typeName: string }> = []
): { ok: true; data: CreateClientPayload } | { ok: false; issues: import('zod').ZodIssue[] } {
  const parsed = createClientSchema.safeParse(
    buildCreateClientRaw(draft, template, legalFormId, contactTypeOptions)
  );
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues };
  }
  return { ok: true, data: parsed.data };
}

export function createClientIssueStepId(path: (string | number)[]): string {
  const root = String(path[0] ?? '');

  const biodataFields = new Set([
    'legalFormId',
    'externalId',
    'firstname',
    'middlename',
    'lastname',
    'fullname',
    'genderId',
    'titleId',
    'nationalityCountryId',
    'maritalStatusId',
    'dateOfBirth',
    'constitutionId',
    'clientNonPersonDetails'
  ]);
  const contactFields = new Set([
    'mobileNo',
    'alternativeMobileNo',
    'emailAddress',
    'alternativeEmailAddress',
    'contacts'
  ]);
  const profilingFields = new Set([
    'clientTypeId',
    'subIndustryId',
    'customerClassId',
    'taxIdentificationNumber',
    'customerRiskProfileId'
  ]);
  const generalFields = new Set([
    'officeId',
    'staffId',
    'submittedOnDate',
    'savingsProductId',
    'isStaff'
  ]);

  if (root === 'address') {
    return 'address';
  }
  if (root === 'complianceProfile') {
    return 'compliance';
  }
  if (root === 'incomeSources') {
    return 'income-sources';
  }
  if (root === 'clientIdentifiers') {
    return 'identifiers';
  }
  if (root === 'familyMembers') {
    return 'family';
  }
  if (root === 'contacts') {
    return 'contact';
  }
  if (biodataFields.has(root)) {
    return 'biodata';
  }
  if (contactFields.has(root)) {
    return 'contact';
  }
  if (profilingFields.has(root)) {
    return 'customer-profiling';
  }
  if (generalFields.has(root)) {
    return 'general';
  }
  if (root.startsWith('datatables')) {
    return 'general';
  }
  return 'general';
}
