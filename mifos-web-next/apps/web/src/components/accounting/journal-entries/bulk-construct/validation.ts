/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  validateBulkConstructJournalEntriesForm,
  type BulkConstructJournalEntriesFormInput,
  type CreateJournalEntryValidationContext
} from '@mifos/validation';
import type { FineractAccountingRuleListItem, FineractCurrencyOption } from '@mifos/api-client';
import { expandBulkConstructRowToJournalEntry } from '@/lib/accounting/bulk-journal-construct';
import type { StepErrors } from './types';

const TEMPLATE_ROOT_KEYS = new Set([
  'accountingRuleId',
  'variationMode',
  'defaultOfficeId',
  'departmentId',
  'currencyCode',
  'transactionDate',
  'referenceNumber'
]);

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

function buildExpandEntry(
  accountingRules: FineractAccountingRuleListItem[],
  currencies: FineractCurrencyOption[]
) {
  const ruleById = new Map(accountingRules.map((rule) => [rule.id, rule]));
  return (template: BulkConstructJournalEntriesFormInput['template'], row: BulkConstructJournalEntriesFormInput['rows'][number]) => {
    const rule = ruleById.get(template.accountingRuleId);
    if (!rule) {
      return null;
    }
    return expandBulkConstructRowToJournalEntry(template, row, rule, currencies);
  };
}

export function validateBulkConstructStep(
  stepId: string,
  form: BulkConstructJournalEntriesFormInput,
  context: CreateJournalEntryValidationContext,
  accountingRules: FineractAccountingRuleListItem[],
  currencies: FineractCurrencyOption[]
): StepErrors {
  const parsed = validateBulkConstructJournalEntriesForm(form, {
    ...context,
    expandEntry: buildExpandEntry(accountingRules, currencies)
  });
  if (parsed.success) {
    return {};
  }

  if (stepId === 'template') {
    return collectFilteredErrors(
      parsed.error.issues,
      (rootKey, key) =>
        rootKey === 'template' ||
        TEMPLATE_ROOT_KEYS.has(key.replace(/^template\./, '')) ||
        key.startsWith('template.')
    );
  }

  if (stepId === 'variations') {
    return collectFilteredErrors(
      parsed.error.issues,
      (rootKey, key) => rootKey === 'rows' || key.startsWith('rows.')
    );
  }

  return {};
}

export function validateBulkConstructDraft(
  form: BulkConstructJournalEntriesFormInput,
  context: CreateJournalEntryValidationContext,
  accountingRules: FineractAccountingRuleListItem[],
  currencies: FineractCurrencyOption[]
): StepErrors {
  const parsed = validateBulkConstructJournalEntriesForm(form, {
    ...context,
    expandEntry: buildExpandEntry(accountingRules, currencies)
  });
  if (parsed.success) {
    return {};
  }
  const errors: StepErrors = {};
  for (const issue of parsed.error.issues) {
    errors[issueKey(issue.path)] = issue.message;
  }
  return errors;
}

export function stepForBulkConstructField(fieldKey: string): 'template' | 'variations' | 'review' {
  if (fieldKey.startsWith('template.') || TEMPLATE_ROOT_KEYS.has(fieldKey.split('.').pop() ?? '')) {
    return 'template';
  }
  if (fieldKey.startsWith('rows.')) {
    return 'variations';
  }
  return 'review';
}
