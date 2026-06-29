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
  type UpdateClientInput,
  type UpdateClientPayload
} from '@mifos/validation';
import {
  fineractDateFieldsEqual,
  normalizeFineractDateField,
  resolveFineractDateContext,
  type FineractDateContext
} from '@/lib/fineract/fineract-date-context';
import {
  booleansEqual,
  EmptyUpdatePayloadError,
  optionalIdsEqual,
  optionalStringsEqual,
  trimOptionalString
} from '@/lib/fineract/partial-update-payload';

type EntityNonPersonDetails = Extract<
  UpdateClientPayload,
  { legalFormId: typeof LEGAL_FORM_ENTITY }
>['clientNonPersonDetails'];

function putOptionalString(
  payload: Record<string, unknown>,
  key: string,
  current: string | undefined,
  initial: string | undefined
): void {
  if (optionalStringsEqual(current, initial)) {
    return;
  }
  payload[key] = trimOptionalString(current);
}

function putOptionalId(
  payload: Record<string, unknown>,
  key: string,
  current: number | undefined,
  initial: number | undefined
): void {
  if (optionalIdsEqual(current, initial)) {
    return;
  }
  payload[key] = current ?? null;
}

function putDateIfChanged(
  payload: Record<string, unknown>,
  key: string,
  current: string | undefined,
  initial: string | undefined,
  dateCtx: FineractDateContext
): boolean {
  if (fineractDateFieldsEqual(current, initial, dateCtx)) {
    return false;
  }
  const normalized = normalizeFineractDateField(current, dateCtx);
  if (normalized) {
    payload[key] = normalized;
    return true;
  }
  return false;
}

function buildEntityNonPersonDetailsDiff(
  current: EntityNonPersonDetails,
  initial: EntityNonPersonDetails,
  dateCtx: FineractDateContext
): Record<string, unknown> | undefined {
  const details: Record<string, unknown> = {};
  let includesDateField = false;

  if (!optionalIdsEqual(current.constitutionId, initial.constitutionId)) {
    details.constitutionId = current.constitutionId;
  }

  putOptionalString(details, 'incorpNumber', current.incorpNumber, initial.incorpNumber);
  putOptionalString(details, 'remarks', current.remarks, initial.remarks);

  if (!optionalIdsEqual(current.mainBusinessLineId, initial.mainBusinessLineId)) {
    details.mainBusinessLineId = current.mainBusinessLineId ?? null;
  }

  if (
    putDateIfChanged(
      details,
      'incorpValidityTillDate',
      current.incorpValidityTillDate,
      initial.incorpValidityTillDate,
      dateCtx
    )
  ) {
    includesDateField = true;
  }

  if (Object.keys(details).length === 0) {
    return undefined;
  }

  if (includesDateField) {
    details.dateFormat = dateCtx.dateFormat;
    details.locale = dateCtx.locale;
  }

  return details;
}

/**
 * Maps validated edit form data to a Fineract patch-style PUT /clients/{id} body.
 * Only fields that differ from `initial` are included (Fineract partial update).
 * Returns `null` when there is nothing to send.
 */
export function diffUpdateClientPayload(
  input: UpdateClientPayload,
  options: { initial: UpdateClientPayload }
): Record<string, unknown> | null {
  const { initial } = options;
  const dateCtx = resolveFineractDateContext(input);
  const payload: Record<string, unknown> = {};
  let includesTopLevelDateField = false;

  if (input.legalFormId !== initial.legalFormId) {
    payload.legalFormId = input.legalFormId;
  }

  if (!booleansEqual(input.active, initial.active)) {
    payload.active = input.active;
    if (input.active) {
      const activation =
        normalizeFineractDateField(input.activationDate, dateCtx) ??
        normalizeFineractDateField(initial.activationDate, dateCtx);
      if (activation) {
        payload.activationDate = activation;
        includesTopLevelDateField = true;
      }
    }
  } else if (
    putDateIfChanged(payload, 'activationDate', input.activationDate, initial.activationDate, dateCtx)
  ) {
    includesTopLevelDateField = true;
  }

  putOptionalId(payload, 'staffId', input.staffId, initial.staffId);
  putOptionalString(payload, 'externalId', input.externalId, initial.externalId);
  putOptionalString(payload, 'mobileNo', input.mobileNo, initial.mobileNo);
  putOptionalString(payload, 'emailAddress', input.emailAddress, initial.emailAddress);
  putOptionalString(payload, 'taxIdentificationNumber', input.taxIdentificationNumber, initial.taxIdentificationNumber);
  putOptionalString(payload, 'alternativeMobileNo', input.alternativeMobileNo, initial.alternativeMobileNo);
  putOptionalString(
    payload,
    'alternativeEmailAddress',
    input.alternativeEmailAddress,
    initial.alternativeEmailAddress
  );

  putOptionalId(payload, 'subIndustryId', input.subIndustryId, initial.subIndustryId);
  putOptionalId(payload, 'customerClassId', input.customerClassId, initial.customerClassId);
  putOptionalId(payload, 'titleId', input.titleId, initial.titleId);
  putOptionalId(payload, 'nationalityCountryId', input.nationalityCountryId, initial.nationalityCountryId);
  putOptionalId(payload, 'customerRiskProfileId', input.customerRiskProfileId, initial.customerRiskProfileId);
  putOptionalId(payload, 'maritalStatusId', input.maritalStatusId, initial.maritalStatusId);
  putOptionalId(payload, 'clientTypeId', input.clientTypeId, initial.clientTypeId);
  putOptionalId(payload, 'genderId', input.genderId, initial.genderId);

  if (!booleansEqual(input.isStaff, initial.isStaff)) {
    payload.isStaff = input.isStaff ?? false;
  }

  if (putDateIfChanged(payload, 'dateOfBirth', input.dateOfBirth, initial.dateOfBirth, dateCtx)) {
    includesTopLevelDateField = true;
  }

  if (putDateIfChanged(payload, 'submittedOnDate', input.submittedOnDate, initial.submittedOnDate, dateCtx)) {
    includesTopLevelDateField = true;
  }

  if (input.legalFormId === LEGAL_FORM_PERSON && initial.legalFormId === LEGAL_FORM_PERSON) {
    putOptionalString(payload, 'firstname', input.firstname, initial.firstname);
    putOptionalString(payload, 'middlename', input.middlename, initial.middlename);
    putOptionalString(payload, 'lastname', input.lastname, initial.lastname);
  } else if (input.legalFormId === LEGAL_FORM_ENTITY && initial.legalFormId === LEGAL_FORM_ENTITY) {
    putOptionalString(payload, 'fullname', input.fullname, initial.fullname);
    const nonPersonDetails = buildEntityNonPersonDetailsDiff(
      input.clientNonPersonDetails,
      initial.clientNonPersonDetails,
      dateCtx
    );
    if (nonPersonDetails) {
      payload.clientNonPersonDetails = nonPersonDetails;
    }
  }

  if (includesTopLevelDateField) {
    payload.dateFormat = dateCtx.dateFormat;
    payload.locale = dateCtx.locale;
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

/** True when `input` differs from `initial` in at least one Fineract-updatable field. */
export function hasUpdateClientChanges(
  input: UpdateClientInput,
  options: { initial: UpdateClientInput }
): boolean {
  return (
    diffUpdateClientPayload(input as UpdateClientPayload, {
      initial: options.initial as UpdateClientPayload
    }) !== null
  );
}

export function buildUpdateClientPayload(
  input: UpdateClientPayload,
  options: { initial: UpdateClientPayload }
): Record<string, unknown> {
  const payload = diffUpdateClientPayload(input, options);
  if (!payload) {
    throw new EmptyUpdatePayloadError('No customer fields were modified.');
  }

  return payload;
}
