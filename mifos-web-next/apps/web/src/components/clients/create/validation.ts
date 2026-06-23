/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDatatableTemplate, FineractClientTemplate } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON, UGANDA_MOBILE_INTERNATIONAL_MESSAGE, UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER, complianceProfileSchema, incomeSourceSchema, isValidUgandaMobileInternational, validateClientIdentifier } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import {
  buildDatatableDataPayload,
  filterSystemColumns,
  getDatatableControlName,
  hasDatatablePayloadData,
  toDatatableDisplayLabel,
  validateDatatableColumnValue
} from '@/lib/fineract/datatables';
import {
  mandatoryDatatableError,
  multiRowDatatablesForLegalForm,
  singleRowDatatablesForLegalForm
} from './datatable-payloads';
import type { CreateClientDraft } from './types';

export type StepErrors = Record<string, string>;

export function validateGeneralStep(draft: CreateClientDraft): StepErrors {
  const errors: StepErrors = {};
  const g = draft.general;

  if (!g.officeId) {
    errors.officeId = 'Branch is required';
  }
  if (!g.legalFormId) {
    errors.legalFormId = 'Profile type is required';
  }
  if (!g.submittedOnDate?.trim()) {
    errors.submittedOnDate = 'Submitted on is required';
  }
  if (!g.staffId) {
    errors.staffId = 'Relationship officer is required';
  }

  return errors;
}

export function validateBiodataStep(draft: CreateClientDraft): StepErrors {
  const errors: StepErrors = {};
  const g = draft.general;
  const legalFormId = g.legalFormId ?? LEGAL_FORM_PERSON;

  if (legalFormId === LEGAL_FORM_PERSON) {
    if (!g.firstname?.trim()) {
      errors.firstname = 'First name is required';
    }
    if (!g.lastname?.trim()) {
      errors.lastname = 'Last name is required';
    }
    if (!g.dateOfBirth?.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    if (!g.genderId) {
      errors.genderId = 'Gender is required';
    }
  } else if (legalFormId === LEGAL_FORM_ENTITY) {
    if (!g.fullname?.trim()) {
      errors.fullname = 'Entity name is required';
    }
    if (!g.clientNonPersonDetails?.constitutionId) {
      errors.constitutionId = 'Constitution is required';
    }
    if (!g.dateOfBirth?.trim()) {
      errors.dateOfBirth = 'Incorporation date is required';
    }
  }

  return errors;
}

export function validateContactStep(draft: CreateClientDraft): StepErrors {
  const errors: StepErrors = {};
  const g = draft.general;

  if (!g.mobileNo?.trim()) {
    errors.mobileNo = 'Phone number is required';
  } else if (!isValidUgandaMobileInternational(g.mobileNo)) {
    errors.mobileNo = UGANDA_MOBILE_INTERNATIONAL_MESSAGE;
  }
  if (g.alternativeMobileNo?.trim() && !isValidUgandaMobileInternational(g.alternativeMobileNo.trim())) {
    errors.alternativeMobileNo = UGANDA_MOBILE_INTERNATIONAL_MESSAGE;
  }
  if (g.emailAddress?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.emailAddress.trim())) {
    errors.emailAddress = 'Enter a valid email address';
  }
  if (g.alternativeEmailAddress?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.alternativeEmailAddress.trim())) {
    errors.alternativeEmailAddress = 'Enter a valid email address';
  }

  return errors;
}

export function validateCustomerProfilingStep(draft: CreateClientDraft): StepErrors {
  const errors: StepErrors = {};
  const g = draft.general;

  if (!g.clientTypeId) {
    errors.clientTypeId = 'Customer type is required';
  }
  if (g.taxIdentificationNumber && g.taxIdentificationNumber.trim().length > 50) {
    errors.taxIdentificationNumber = 'TIN must be at most 50 characters';
  }

  return errors;
}

export function validateIncomeSourcesStep(draft: CreateClientDraft): StepErrors {
  const errors: StepErrors = {};
  draft.incomeSources.forEach((source, index) => {
    const parsed = incomeSourceSchema.safeParse(source);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid income source';
      errors[`incomeSources.${index}`] = message;
    }
  });
  return errors;
}

/** Next of kin entries are optional. */
export function validateFamilyStep(): StepErrors {
  return {};
}

export function validateAddressStep(draft: CreateClientDraft): StepErrors {
  if (draft.addresses.length === 0) {
    return { address: 'Add at least one address for this customer' };
  }
  const primaryCount = draft.addresses.filter((entry) => entry.isPrimary).length;
  if (primaryCount !== 1) {
    return { address: 'Mark exactly one address as the primary address' };
  }
  if (draft.addresses.some((entry) => entry.isPrimary && entry.isActive === false)) {
    return { address: 'Primary address must be active' };
  }
  return {};
}

export function validateDatatableStep(
  datatable: FineractClientDatatableTemplate,
  values: Record<string, unknown>
): StepErrors {
  const errors: StepErrors = {};
  const columns = filterSystemColumns(datatable.columnHeaderData ?? []);

  for (const column of columns) {
    const controlName = getDatatableControlName(column);
    const validationError = validateDatatableColumnValue(column, values[controlName]);
    if (validationError) {
      errors[controlName] = validationError;
    }
  }

  return errors;
}

export function validateMultiRowDatatableStep(
  datatable: FineractClientDatatableTemplate,
  rows: Record<string, unknown>[],
  options?: { mandatory?: boolean }
): StepErrors {
  if (options?.mandatory && rows.length === 0) {
    return { _form: mandatoryDatatableError(datatable.registeredTableName) };
  }

  const errors: StepErrors = {};
  rows.forEach((row, index) => {
    const rowErrors = validateDatatableStep(datatable, row);
    for (const [key, message] of Object.entries(rowErrors)) {
      errors[`${index}.${key}`] = `Row ${index + 1}: ${message}`;
    }
  });
  return errors;
}

export type CreateClientValidationContext = {
  mandatoryDatatableNames?: Set<string>;
  dateFormat?: string;
  locale?: string;
  firstDocumentTypeId?: number;
};

export function validateIdentifiersStep(
  draft: CreateClientDraft,
  context: CreateClientValidationContext = {}
): StepErrors {
  const errors: StepErrors = {};
  draft.clientIdentifiers.forEach((identifier, index) => {
    const parsed = validateClientIdentifier(identifier, {
      firstDocumentTypeId: context.firstDocumentTypeId
    });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid identifier';
      errors[`clientIdentifiers.${index}`] = message;
    }
  });
  return errors;
}

function validateSingleRowDatatableStep(
  datatable: FineractClientDatatableTemplate,
  values: Record<string, unknown>,
  mandatory: boolean
): StepErrors {
  const fieldErrors = validateDatatableStep(datatable, values);
  if (Object.keys(fieldErrors).length > 0) {
    return fieldErrors;
  }
  if (!mandatory) {
    return {};
  }
  const columns = filterSystemColumns(datatable.columnHeaderData ?? []);
  const data = buildDatatableDataPayload(
    columns,
    values,
    FINERACT_DATE_FORMAT,
    FINERACT_LOCALE
  );
  if (!hasDatatablePayloadData(data)) {
    return { _form: mandatoryDatatableError(datatable.registeredTableName) };
  }
  return {};
}

export function validateComplianceStep(draft: CreateClientDraft): StepErrors {
  const parsed = complianceProfileSchema.safeParse(draft.complianceProfile);
  if (parsed.success) {
    return {};
  }
  const errors: StepErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.');
    errors[key || '_form'] = issue.message;
  }
  return errors;
}

export function validateStep(
  stepId: string,
  draft: CreateClientDraft,
  template: FineractClientTemplate,
  context: CreateClientValidationContext = {}
): StepErrors {
  const legalFormId = draft.general.legalFormId ?? LEGAL_FORM_PERSON;
  const mandatoryNames = context.mandatoryDatatableNames;

  if (stepId === 'general') {
    return validateGeneralStep(draft);
  }
  if (stepId === 'biodata') {
    return validateBiodataStep(draft);
  }
  if (stepId === 'contact') {
    return validateContactStep(draft);
  }
  if (stepId === 'identifiers') {
    return validateIdentifiersStep(draft, context);
  }
  if (stepId === 'family') {
    return validateFamilyStep();
  }
  if (stepId === 'income-sources') {
    return validateIncomeSourcesStep(draft);
  }
  if (stepId === 'compliance') {
    return validateComplianceStep(draft);
  }
  if (stepId === 'customer-profiling') {
    return validateCustomerProfilingStep(draft);
  }
  if (stepId === 'address') {
    return validateAddressStep(draft);
  }
  if (stepId.startsWith('datatable:')) {
    const tableName = stepId.replace('datatable:', '');
    const datatable = singleRowDatatablesForLegalForm(template, legalFormId).find(
      (dt) => dt.registeredTableName === tableName
    );
    if (!datatable) {
      return {};
    }
    return validateSingleRowDatatableStep(
      datatable,
      draft.datatables[tableName] ?? {},
      mandatoryNames?.has(tableName) ?? false
    );
  }
  if (stepId.startsWith('multi-row-datatable:')) {
    const tableName = stepId.replace('multi-row-datatable:', '');
    const datatable = multiRowDatatablesForLegalForm(template, legalFormId).find(
      (dt) => dt.registeredTableName === tableName
    );
    if (!datatable) {
      return {};
    }
    return validateMultiRowDatatableStep(
      datatable,
      draft.multiRowDatatables[tableName] ?? [],
      { mandatory: mandatoryNames?.has(tableName) ?? false }
    );
  }
  return {};
}

/** Validates every wizard step except preview; returns the first step with errors. */
export function findFirstInvalidCreateClientStep(
  steps: { id: string }[],
  draft: CreateClientDraft,
  template: FineractClientTemplate,
  context: CreateClientValidationContext = {}
): { stepId: string; errors: StepErrors } | null {
  for (const step of steps) {
    if (step.id === 'preview') {
      continue;
    }
    const errors = validateStep(step.id, draft, template, context);
    if (Object.keys(errors).length > 0) {
      return { stepId: step.id, errors };
    }
  }
  return null;
}
