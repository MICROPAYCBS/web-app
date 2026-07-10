/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountingRuleListItem, FineractCurrencyOption } from '@mifos/api-client';
import type {
  BulkConstructJournalEntriesFormInput,
  BulkConstructJournalEntriesTemplateInput,
  BulkConstructJournalEntryRowInput,
  BulkConstructVariationMode,
  CreateJournalEntryFormInput
} from '@mifos/validation';
import {
  createJournalEntryFormValuesForRule,
  postingTemplateLinesForRule
} from '@/lib/accounting/journal-entry-display';
import { toFineractDate } from '@/lib/fineract/dates';

export function isBulkConstructEligibleRule(rule: FineractAccountingRuleListItem): boolean {
  const debitAccounts = rule.debitAccounts ?? [];
  const creditAccounts = rule.creditAccounts ?? [];
  const hasDebitTags = (rule.debitTags?.length ?? 0) > 0;
  const hasCreditTags = (rule.creditTags?.length ?? 0) > 0;

  if (debitAccounts.length === 0 || creditAccounts.length === 0) {
    return false;
  }
  if (hasDebitTags || hasCreditTags) {
    return false;
  }
  if (rule.allowMultipleDebitEntries === true || rule.allowMultipleCreditEntries === true) {
    return false;
  }
  return true;
}

export function bulkConstructRuleIneligibilityReason(
  rule: FineractAccountingRuleListItem
): string | null {
  if (isBulkConstructEligibleRule(rule)) {
    return null;
  }

  const debitAccounts = rule.debitAccounts ?? [];
  const creditAccounts = rule.creditAccounts ?? [];
  if (debitAccounts.length === 0 || creditAccounts.length === 0) {
    return 'Rule must have fixed debit and credit GL accounts.';
  }
  if ((rule.debitTags?.length ?? 0) > 0 || (rule.creditTags?.length ?? 0) > 0) {
    return 'Tag-based rules are not supported for bulk construct.';
  }
  if (rule.allowMultipleDebitEntries === true || rule.allowMultipleCreditEntries === true) {
    return 'Rules with multiple debit or credit lines are not supported yet.';
  }
  return 'This rule cannot be used for bulk construct.';
}

export function partitionBulkConstructRules(rules: FineractAccountingRuleListItem[]) {
  const eligible: FineractAccountingRuleListItem[] = [];
  const ineligible: FineractAccountingRuleListItem[] = [];
  for (const rule of rules) {
    if (isBulkConstructEligibleRule(rule)) {
      eligible.push(rule);
    } else {
      ineligible.push(rule);
    }
  }
  return { eligible, ineligible };
}

export function defaultBulkConstructTemplate(
  currencies: FineractCurrencyOption[],
  defaultOfficeId?: number,
  transactionDate?: string,
  accountingRuleId?: number
): BulkConstructJournalEntriesTemplateInput {
  return {
    accountingRuleId: accountingRuleId ?? 0,
    variationMode: 'branch',
    defaultOfficeId: defaultOfficeId ?? 0,
    departmentId: undefined,
    currencyCode: currencies[0]?.code ?? '',
    transactionDate: transactionDate ?? toFineractDate(new Date()),
    referenceNumber: '',
    accountNumber: '',
    checkNumber: '',
    routingCode: '',
    receiptNumber: '',
    bankNumber: '',
    comments: ''
  };
}

export function defaultBulkConstructRow(
  variationMode: BulkConstructVariationMode
): BulkConstructJournalEntryRowInput {
  return {
    officeId: variationMode === 'branch' ? undefined : undefined,
    departmentId: variationMode === 'department' ? undefined : undefined,
    amount: 0
  };
}

export function defaultBulkConstructForm(
  currencies: FineractCurrencyOption[],
  defaultOfficeId?: number,
  transactionDate?: string,
  accountingRuleId?: number
): BulkConstructJournalEntriesFormInput {
  const template = defaultBulkConstructTemplate(
    currencies,
    defaultOfficeId,
    transactionDate,
    accountingRuleId
  );
  return {
    template,
    rows: [defaultBulkConstructRow(template.variationMode)]
  };
}

export function expandBulkConstructRowToJournalEntry(
  template: BulkConstructJournalEntriesTemplateInput,
  row: BulkConstructJournalEntryRowInput,
  rule: FineractAccountingRuleListItem,
  currencies: FineractCurrencyOption[]
): CreateJournalEntryFormInput | null {
  if (!isBulkConstructEligibleRule(rule)) {
    return null;
  }

  const officeId =
    template.variationMode === 'branch'
      ? (row.officeId ?? template.defaultOfficeId)
      : template.defaultOfficeId;
  if (!Number.isFinite(officeId) || officeId <= 0) {
    return null;
  }

  const departmentId =
    template.variationMode === 'department'
      ? row.departmentId
      : template.departmentId;

  const base = createJournalEntryFormValuesForRule(
    rule,
    currencies,
    officeId,
    template.transactionDate
  );

  const amount = row.amount;
  return {
    ...base,
    officeId,
    departmentId,
    currencyCode: template.currencyCode,
    transactionDate: template.transactionDate,
    referenceNumber: template.referenceNumber,
    paymentTypeId: template.paymentTypeId,
    accountNumber: template.accountNumber,
    checkNumber: template.checkNumber,
    routingCode: template.routingCode,
    receiptNumber: template.receiptNumber,
    bankNumber: template.bankNumber,
    comments: template.comments,
    debits: base.debits.map((line) => ({ ...line, amount })),
    credits: base.credits.map((line) => ({ ...line, amount }))
  };
}

export function bulkConstructRuleLineSummary(rule: FineractAccountingRuleListItem) {
  const lines = postingTemplateLinesForRule(rule);
  return {
    debits: lines.debitAccounts,
    credits: lines.creditAccounts
  };
}
