/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDatatableTemplate, FineractClientTemplate } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import {
  buildDatatableDataPayload,
  filterSystemColumns,
  getDatatableControlName,
  hasDatatablePayloadData,
  toDatatableDisplayLabel
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
  const legalFormId = g.legalFormId ?? LEGAL_FORM_PERSON;

  if (!g.officeId) {
    errors.officeId = 'Branch is required';
  }
  if (!g.legalFormId) {
    errors.legalFormId = 'Legal form is required';
  }
  if (!g.submittedOnDate?.trim()) {
    errors.submittedOnDate = 'Submitted on is required';
  }
  if (g.active && !g.activationDate?.trim()) {
    errors.activationDate = 'Activation date is required when the client is active';
  }
  if (g.addSavings && !g.savingsProductId) {
    errors.savingsProductId = 'Savings product is required when opening an account';
  }
  if (g.emailAddress?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.emailAddress.trim())) {
    errors.emailAddress = 'Enter a valid email address';
  }

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

  if (!g.staffId) {
    errors.staffId = 'Relationship officer is required';
  }
  if (!g.mobileNo?.trim()) {
    errors.mobileNo = 'Phone number is required';
  }
  if (!g.clientTypeId) {
    errors.clientTypeId = 'Client type is required';
  }

  return errors;
}

/** Next of kin entries are optional. */
export function validateFamilyStep(): StepErrors {
  return {};
}

export function validateAddressStep(draft: CreateClientDraft): StepErrors {
  if (draft.addresses.length === 0) {
    return { address: 'Add at least one address for this client' };
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
    if (column.isColumnNullable) {
      continue;
    }
    const controlName = getDatatableControlName(column);
    const raw = values[controlName];
    if (raw === '' || raw === undefined || raw === null) {
      errors[controlName] = `${toDatatableDisplayLabel(column.columnName)} is required`;
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
};

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
  if (stepId === 'family') {
    return validateFamilyStep();
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
