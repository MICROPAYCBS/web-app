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
  'validation.msg.client.identifiers.required':
    'At least one identification document is required for individual customers.',
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
    'FATCA registration is required on the compliance profile for the assigned customer class.',
  'error.msg.not.authorized': 'You do not have permission to perform this action.',
  'validation.msg.domain.rule.violation':
    'This change was rejected by a business rule.',
  'validation.msg.ComplianceProfile.otherBankAccounts.cannot.exceed.max.of.two':
    'You can add at most two other bank accounts.',
  'validation.msg.ComplianceProfile.otherBankAccounts.required.when.has.other.bank.accounts.is.true':
    'Add at least one complete other bank account when this option is selected.',
  'validation.msg.ComplianceProfile.bankName.cannot.be.blank': 'Bank name is required.',
  'validation.msg.ComplianceProfile.accountNumber.cannot.be.blank': 'Account number is required.',
  'validation.msg.ComplianceProfile.displayOrder.cannot.be.blank': 'Account order is required.',
  'validation.msg.ComplianceProfile.displayOrder.is.not.within.expected.range':
    'Account order must be 1 or 2.',
  'validation.msg.ComplianceProfile.bankName.exceeds.max.length':
    'Bank name must be 200 characters or fewer.',
  'validation.msg.ComplianceProfile.branchName.exceeds.max.length':
    'Branch name must be 200 characters or fewer.',
  'validation.msg.ComplianceProfile.accountNumber.exceeds.max.length':
    'Account number must be 50 characters or fewer.',
  'validation.msg.ComplianceProfile.pepPosition.cannot.be.blank':
    'PEP position is required when the customer is a PEP.',
  'validation.msg.ComplianceProfile.fatcaRegistrationNo.cannot.be.blank':
    'FATCA registration number is required when FATCA registered is selected.',
  'error.msg.cashier.insufficient.amount.exception':
    'The cashier does not have enough cash for this transaction.',
  'error.msg.cashier.active.session.required.exception':
    'An active cashier session is required for cash transactions.',
  'error.msg.cashier.legal.tender.lines.required':
    'Enter at least one note or coin count.',
  'error.msg.cashier.legal.tender.duplicate':
    'Each denomination can only appear once.',
  'error.msg.cashier.legal.tender.not.found':
    'One or more denominations are no longer available. Refresh and try again.',
  'error.msg.cashier.legal.tender.inactive':
    'One or more denominations are inactive. Choose active notes or coins.',
  'error.msg.cashier.legal.tender.currency.mismatch':
    'Selected denominations do not match the transaction currency.',
  'error.msg.cashier.legal.tender.sum.mismatch':
    'The denomination total must match the transaction amount.',
  'error.msg.cashier.legal.tender.lines.not.allowed':
    'Denomination breakdown is not enabled for cash transactions.',
  'error.msg.legal.tender.not.found': 'Legal tender not found.',
  'error.msg.legal.tender.duplicate':
    'A denomination with this face value and type already exists for this currency.'
};

export function translateFineractCode(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? code;
}
