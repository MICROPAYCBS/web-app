/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  validateCreateJournalEntryForm,
  type CreateJournalEntryFormInput,
  type CreateJournalEntryValidationContext
} from '@mifos/validation';
import type { StepErrors } from './types';

const DETAILS_ROOT_KEYS = new Set([
  'officeId',
  'accountingRule',
  'currencyCode',
  'transactionDate',
  'referenceNumber'
]);

const LINES_ROOT_KEYS = new Set(['debits', 'credits', 'balance', 'departmentId']);

function issueKey(path: (string | number)[]): string {
  return path.map(String).join('.') || 'form';
}

function issueRootKey(path: (string | number)[]): string {
  return String(path[0] ?? '');
}

function collectFilteredErrors(
  issues: { path: (string | number)[]; message: string }[],
  predicate: (rootKey: string, key: string) => boolean
): StepErrors {
  const errors: StepErrors = {};
  for (const issue of issues) {
    const key = issueKey(issue.path);
    const rootKey = issueRootKey(issue.path);
    if (predicate(rootKey, key)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateJournalEntryStep(
  stepId: string,
  form: CreateJournalEntryFormInput,
  context: CreateJournalEntryValidationContext
): StepErrors {
  const parsed = validateCreateJournalEntryForm(form, context);
  if (parsed.success) {
    return {};
  }

  if (stepId === 'details') {
    return collectFilteredErrors(
      parsed.error.issues,
      (rootKey) => DETAILS_ROOT_KEYS.has(rootKey) || rootKey === 'departmentId'
    );
  }

  if (stepId === 'lines') {
    return collectFilteredErrors(
      parsed.error.issues,
      (rootKey, key) =>
        LINES_ROOT_KEYS.has(rootKey) || key.startsWith('debits.') || key.startsWith('credits.')
    );
  }

  return {};
}

export function validateJournalEntryDraft(
  form: CreateJournalEntryFormInput,
  context: CreateJournalEntryValidationContext
): StepErrors {
  const parsed = validateCreateJournalEntryForm(form, context);
  if (parsed.success) {
    return {};
  }
  const errors: StepErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issueKey(issue.path);
    errors[key] = issue.message;
  }
  return errors;
}

export function stepForField(fieldKey: string): 'details' | 'lines' | 'review' {
  const rootKey = fieldKey.split('.')[0] ?? '';
  if (rootKey === 'departmentId' || DETAILS_ROOT_KEYS.has(rootKey)) {
    return 'details';
  }
  if (
    LINES_ROOT_KEYS.has(rootKey) ||
    fieldKey.startsWith('debits.') ||
    fieldKey.startsWith('credits.')
  ) {
    return 'lines';
  }
  return 'review';
}
