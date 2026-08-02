/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CreateClientPayload,
  LegacyImportClientPayload,
  SaveDraftClientPayload
} from '@mifos/validation';
import { LEGAL_FORM_ENTITY } from '@mifos/validation';
import { buildOtherBankAccountsForApi } from '@/lib/fineract/compliance-profile-payload';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (value === '' || value === undefined) {
      delete next[key];
    }
  }
  return next;
}

type CreateClientBodyInput =
  | CreateClientPayload
  | SaveDraftClientPayload
  | LegacyImportClientPayload;

/** Maps validated form data to Fineract POST /clients body (draft or full create). */
export function buildCreateClientPayload(input: CreateClientBodyInput): Record<string, unknown> {
  const dateFormat = input.dateFormat ?? FINERACT_DATE_FORMAT;
  const locale = input.locale ?? FINERACT_LOCALE;

  const base: Record<string, unknown> = stripEmpty({
    ...input,
    dateFormat,
    locale
  });

  if ('emailAddress' in input && input.emailAddress === '') {
    delete base.emailAddress;
  }

  if ('taxIdentificationNumber' in input && input.taxIdentificationNumber === '') {
    delete base.taxIdentificationNumber;
  }

  if ('alternativeMobileNo' in input && input.alternativeMobileNo === '') {
    delete base.alternativeMobileNo;
  }

  if ('alternativeEmailAddress' in input && input.alternativeEmailAddress === '') {
    delete base.alternativeEmailAddress;
  }

  if ('familyMembers' in input && input.familyMembers?.length) {
    base.familyMembers = input.familyMembers.map((member) =>
      stripEmpty({ ...member, dateFormat, locale })
    );
  } else {
    delete base.familyMembers;
  }

  if ('incomeSources' in input && input.incomeSources?.length) {
    base.incomeSources = input.incomeSources.map((source) =>
      stripEmpty({ ...source, dateFormat, locale })
    );
  } else {
    delete base.incomeSources;
  }

  if ('clientIdentifiers' in input && input.clientIdentifiers?.length) {
    base.clientIdentifiers = input.clientIdentifiers.map((identifier) => stripEmpty(identifier));
  } else {
    delete base.clientIdentifiers;
  }

  if ('contacts' in input && input.contacts?.length) {
    base.contacts = input.contacts.map((contact) => stripEmpty({ ...contact }));
  } else {
    delete base.contacts;
  }

  if ('complianceProfile' in input && input.complianceProfile) {
    const profile = input.complianceProfile;
    const accounts = profile.hasOtherBankAccounts
      ? buildOtherBankAccountsForApi(profile.otherBankAccounts)
      : undefined;
    base.complianceProfile = stripEmpty({
      ...profile,
      hasOtherBankAccounts: profile.hasOtherBankAccounts ?? false,
      otherBankAccounts: accounts?.length ? accounts : undefined
    });
  } else {
    delete base.complianceProfile;
  }

  if (input.address?.length) {
    base.address = input.address.map((entry) => stripEmpty({ ...entry }));
  } else {
    delete base.address;
  }

  if ('datatables' in input && input.datatables?.length) {
    base.datatables = input.datatables;
  } else {
    delete base.datatables;
  }

  if ('active' in input && input.active === true) {
    base.active = true;
    if ('activationDate' in input && input.activationDate) {
      base.activationDate = input.activationDate;
    }
  }

  if (!input.savingsProductId) {
    delete base.savingsProductId;
  }

  if (input.legalFormId === LEGAL_FORM_ENTITY) {
    delete base.firstname;
    delete base.middlename;
    delete base.lastname;
    delete base.genderId;
    delete base.titleId;
    delete base.nationalityCountryId;
    delete base.maritalStatusId;
    delete base.isStaff;
    delete base.familyMembers;
  } else {
    delete base.fullname;
    delete base.clientNonPersonDetails;
  }

  return base;
}
