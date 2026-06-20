/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  LEGAL_FORM_ENTITY,
  LEGAL_FORM_PERSON,
  type UpdateClientPayload
} from '@mifos/validation';
import {
  fineractDateFieldsEqual,
  normalizeFineractDateField,
  resolveFineractDateContext
} from '@/lib/fineract/fineract-date-context';

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

/**
 * Maps validated edit form data to Fineract PUT /clients/{id}.
 * Fineract requires submittedOnDate (and activationDate when active) on every update.
 */
export function buildUpdateClientPayload(
  input: UpdateClientPayload,
  options?: { initial?: UpdateClientPayload }
): Record<string, unknown> {
  const dateCtx = resolveFineractDateContext(input);
  const initial = options?.initial;

  const base: Record<string, unknown> = stripEmpty({
    ...input,
    dateFormat: dateCtx.dateFormat,
    locale: dateCtx.locale
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

  const submitted = normalizeFineractDateField(input.submittedOnDate, dateCtx);
  if (submitted) {
    base.submittedOnDate = submitted;
  }

  if (input.active) {
    const activation = normalizeFineractDateField(input.activationDate, dateCtx);
    if (activation) {
      base.activationDate = activation;
    }
  } else {
    delete base.activationDate;
  }

  const dateOfBirth = normalizeFineractDateField(input.dateOfBirth, dateCtx);
  if (
    dateOfBirth &&
    (!initial || !fineractDateFieldsEqual(input.dateOfBirth, initial.dateOfBirth, dateCtx))
  ) {
    base.dateOfBirth = dateOfBirth;
  } else {
    delete base.dateOfBirth;
  }

  if (input.legalFormId === LEGAL_FORM_PERSON) {
    base.clientNonPersonDetails = {};
  } else if (input.clientNonPersonDetails) {
    const details = {
      ...input.clientNonPersonDetails,
      dateFormat: dateCtx.dateFormat,
      locale: dateCtx.locale
    };
    const incorpTill = details.incorpValidityTillDate;
    if (typeof incorpTill === 'string') {
      const normalized = normalizeFineractDateField(incorpTill, dateCtx);
      const initialIncorp =
        initial && initial.legalFormId === LEGAL_FORM_ENTITY
          ? initial.clientNonPersonDetails.incorpValidityTillDate
          : undefined;
      if (
        initial &&
        fineractDateFieldsEqual(incorpTill, initialIncorp, dateCtx)
      ) {
        delete details.incorpValidityTillDate;
      } else if (normalized) {
        details.incorpValidityTillDate = normalized;
      }
    }
    base.clientNonPersonDetails = stripEmpty(details);
  }

  return base;
}
