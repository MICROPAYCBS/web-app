/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Map Fineract globalisation codes to create-client form field names. */
export const CREATE_CLIENT_ERROR_FIELD_BY_CODE: Record<string, string> = {
  'validation.msg.client.officeId.not.greater.than.zero': 'officeId',
  'validation.msg.client.id.no.name.details.passed': 'fullname',
  'error.msg.clients.constitutionid.is.null': 'constitutionId',
  'error.msg.clients.incorpValidityTill.after.incorp.date': 'incorpValidityTillDate',
  'validation.msg.client.customerClassId.legalForm.mismatch': 'customerClassId',
  'validation.msg.client.mobileNo.invalid.format': 'mobileNo',
  'error.msg.client.duplicate.taxIdentificationNumber': 'taxIdentificationNumber',
  'error.msg.client.duplicate.mobileNo': 'mobileNo',
  'error.msg.client.duplicate.externalId': 'externalId',
  'error.msg.client.duplicate.accountNo': 'accountNo'
};

export function resolveCreateClientErrorField(
  code: string | undefined,
  parameterName: string | undefined
): string {
  const trimmedParameter = parameterName?.trim();
  if (trimmedParameter) {
    if (trimmedParameter === 'clientNonPersonDetails.constitutionId') {
      return 'constitutionId';
    }
    if (trimmedParameter === 'clientNonPersonDetails.incorpValidityTillDate') {
      return 'incorpValidityTillDate';
    }
    return trimmedParameter;
  }
  if (code && CREATE_CLIENT_ERROR_FIELD_BY_CODE[code]) {
    return CREATE_CLIENT_ERROR_FIELD_BY_CODE[code];
  }
  return '_form';
}
