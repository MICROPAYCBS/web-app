/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Fineract userMessageGlobalisationCode → human-readable message.
 * Extend from reference web-app translations and Fineract properties files.
 */
const ERROR_MESSAGES: Record<string, string> = {
  'error.msg.data.integrity.issue': 'A data integrity issue occurred.',
  'error.msg.data.integrity.issue.entity.duplicated': 'This record already exists.',
  'validation.msg.validation.errors.exist': 'Please correct the validation errors.',
  'validation.msg.client.customerClass.requirements.not.met':
    'This customer does not meet the assigned customer class requirements.',
  'validation.msg.client.customerClassId.photo.required':
    'A profile photo is required for the assigned customer class.',
  'validation.msg.client.customerClassId.signature.required':
    'A customer signature is required for the assigned customer class.',
  'validation.msg.client.customerClassId.document.required':
    'At least one identification document is required for the assigned customer class.',
  'validation.msg.client.customerClassId.legalForm.required':
    'Legal form is required to assign the selected customer class.',
  'validation.msg.client.customerClassId.legalForm.mismatch':
    "The customer's legal form does not match the assigned customer class.",
  'validation.msg.client.customerClassId.kyc.not.met':
    'KYC requirements for the assigned customer class are not met.',
  'validation.msg.client.customerClassId.riskProfile.required':
    'Select a customer risk profile for the assigned customer class.',
  'validation.msg.client.customerClassId.riskLevel.mismatch':
    "The customer's risk profile does not match the assigned customer class risk level.",
  'validation.msg.client.customerClassId.dateOfBirth.required':
    'Date of birth is required for the assigned customer class.',
  'validation.msg.client.customerClassId.edd.profile.required':
    'A compliance profile is required for the assigned customer class.',
  'validation.msg.client.customerClassId.edd.pep.incomplete':
    'PEP details on the compliance profile are incomplete for the assigned customer class.',
  'validation.msg.client.customerClassId.edd.fatca.required':
    'FATCA registration is required on the compliance profile for the assigned customer class.'
};

export function translateFineractCode(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? code;
}
