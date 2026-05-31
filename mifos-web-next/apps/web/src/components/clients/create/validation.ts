/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDatatableTemplate, FineractClientTemplate } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '@mifos/validation';
import {
  filterSystemColumns,
  getDatatableControlName,
  toDatatableDisplayLabel
} from '@/lib/fineract/datatables';
import type { CreateClientDraft } from './types';

export type StepErrors = Record<string, string>;

export function validateGeneralStep(draft: CreateClientDraft): StepErrors {
  const errors: StepErrors = {};
  const g = draft.general;
  const legalFormId = g.legalFormId ?? LEGAL_FORM_PERSON;

  if (!g.officeId) {
    errors.officeId = 'Office is required';
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
  } else if (legalFormId === LEGAL_FORM_ENTITY) {
    if (!g.fullname?.trim()) {
      errors.fullname = 'Entity name is required';
    }
    if (!g.clientNonPersonDetails?.constitutionId) {
      errors.constitutionId = 'Constitution is required';
    }
  }

  return errors;
}

/** Family members are optional. */
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

export function datatablesForLegalForm(
  template: FineractClientTemplate,
  legalFormId: number
): FineractClientDatatableTemplate[] {
  const subtype = legalFormId === LEGAL_FORM_ENTITY ? 'entity' : 'person';
  return (
    template.datatables?.filter(
      (dt) => (dt.entitySubType ?? 'person').toLowerCase() === subtype
    ) ?? []
  );
}

export function validateStep(
  stepId: string,
  draft: CreateClientDraft,
  template: FineractClientTemplate
): StepErrors {
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
    const datatable = datatablesForLegalForm(template, draft.general.legalFormId ?? LEGAL_FORM_PERSON).find(
      (dt) => dt.registeredTableName === tableName
    );
    if (!datatable) {
      return {};
    }
    return validateDatatableStep(datatable, draft.datatables[tableName] ?? {});
  }
  return {};
}
