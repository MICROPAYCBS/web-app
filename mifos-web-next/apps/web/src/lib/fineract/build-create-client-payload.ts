/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateClientPayload } from '@mifos/validation';
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

/** Maps validated form data to Fineract POST /clients body. */
export function buildCreateClientPayload(input: CreateClientPayload): Record<string, unknown> {
  const dateFormat = input.dateFormat ?? FINERACT_DATE_FORMAT;
  const locale = input.locale ?? FINERACT_LOCALE;

  const base: Record<string, unknown> = stripEmpty({
    ...input,
    dateFormat,
    locale
  });

  if (input.emailAddress === '') {
    delete base.emailAddress;
  }

  if (input.taxIdentificationNumber === '') {
    delete base.taxIdentificationNumber;
  }

  if (input.alternativeMobileNo === '') {
    delete base.alternativeMobileNo;
  }

  if (input.alternativeEmailAddress === '') {
    delete base.alternativeEmailAddress;
  }

  if (input.familyMembers?.length) {
    base.familyMembers = input.familyMembers.map((member) =>
      stripEmpty({ ...member, dateFormat, locale })
    );
  } else {
    delete base.familyMembers;
  }

  if (input.incomeSources?.length) {
    base.incomeSources = input.incomeSources.map((source) =>
      stripEmpty({ ...source, dateFormat, locale })
    );
  } else {
    delete base.incomeSources;
  }

  if (input.clientIdentifiers?.length) {
    base.clientIdentifiers = input.clientIdentifiers.map((identifier) => stripEmpty(identifier));
  } else {
    delete base.clientIdentifiers;
  }

  if (input.contacts?.length) {
    base.contacts = input.contacts.map((contact) => stripEmpty({ ...contact }));
  } else {
    delete base.contacts;
  }

  if (input.complianceProfile) {
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

  if (input.datatables?.length) {
    base.datatables = input.datatables;
  } else {
    delete base.datatables;
  }

  if (!input.savingsProductId) {
    delete base.savingsProductId;
  }

  return base;
}
