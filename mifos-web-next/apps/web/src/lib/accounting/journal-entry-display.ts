/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountingRuleGlAccountRef,
  FineractAccountingRuleListItem,
  FineractCurrencyOption,
  FineractJournalEntryGlAccountOption,
  FineractJournalEntryListItem
} from '@mifos/api-client';
import type { CreateJournalEntryFormInput, JournalEntryLineInput } from '@mifos/validation';
import { formatGlAccountLabel } from '@/lib/accounting/gl-account-display';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { FINERACT_LOCALE, formatFineractDateArray, toFineractDate } from '@/lib/fineract/dates';

export function formatJournalEntryGlAccountLabel(account: FineractJournalEntryGlAccountOption) {
  return formatGlAccountLabel(account);
}

export function formatJournalEntryDate(value: string | number[] | undefined) {
  return formatFineractDateArray(value, FINERACT_LOCALE) ?? '—';
}

export function formatJournalEntryDateTime(value: string | number[] | undefined) {
  if (typeof value === 'string') {
    return value;
  }
  if (!Array.isArray(value) || value.length < 3) {
    return '—';
  }
  const [year, month, day, hour = 0, minute = 0, second = 0] = value;
  const date = new Date(year, month - 1, day, hour, minute, second);
  return new Intl.DateTimeFormat(FINERACT_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function formatJournalEntryDepartment(
  entry: Pick<FineractJournalEntryListItem, 'departmentId' | 'departmentName'>
): string | null {
  const name = entry.departmentName?.trim();
  if (name) {
    return name;
  }
  if (entry.departmentId != null) {
    return String(entry.departmentId);
  }
  return null;
}

export function formatJournalEntrySideLabel(entry: FineractJournalEntryListItem) {
  switch (entry.entryType.value) {
    case 'DEBIT':
      return 'Debit';
    case 'CREDIT':
      return 'Credit';
    default:
      return entry.entryType.value ?? '—';
  }
}

export function formatJournalEntryLineAmount(entry: FineractJournalEntryListItem) {
  return formatAccountMoney(entry.amount, entry.currency.code);
}

export function formatJournalEntryAmount(entry: FineractJournalEntryListItem, side: 'DEBIT' | 'CREDIT') {
  if (entry.entryType.value !== side) {
    return '—';
  }
  return formatJournalEntryLineAmount(entry);
}

export function defaultCreateJournalEntryFormValues(
  currencies: FineractCurrencyOption[],
  officeId?: number,
  transactionDate?: string
): CreateJournalEntryFormInput {
  const branchId = officeId ?? 0;
  return {
    debitOfficeId: branchId,
    creditOfficeId: branchId,
    currencyCode: currencies[0]?.code ?? '',
    transactionDate: transactionDate ?? toFineractDate(new Date()),
    debits: [{ glAccountId: 0, amount: 0 }],
    credits: [{ glAccountId: 0, amount: 0 }],
    referenceNumber: '',
    accountNumber: '',
    checkNumber: '',
    routingCode: '',
    receiptNumber: '',
    bankNumber: '',
    comments: ''
  };
}

export function currencySelectOptions(currencies: FineractCurrencyOption[]) {
  return currencies
    .filter((currency): currency is FineractCurrencyOption & { code: string } =>
      Boolean(currency.code?.trim())
    )
    .map((currency) => ({
      value: currency.code,
      label: currency.name ? `${currency.name} (${currency.code})` : currency.code
    }));
}

export function ruleAccountToGlOption(
  account: FineractAccountingRuleGlAccountRef
): FineractJournalEntryGlAccountOption {
  return {
    id: account.id,
    name: account.name,
    glCode: account.glCode ?? ''
  };
}

function journalEntryLinesFromRuleAccounts(
  accounts: FineractAccountingRuleGlAccountRef[]
): JournalEntryLineInput[] {
  if (accounts.length === 0) {
    return [{ glAccountId: 0, amount: 0 }];
  }
  return accounts.map((account) => ({
    glAccountId: account.id,
    amount: 0
  }));
}

export function postingTemplateLinesForRule(rule: FineractAccountingRuleListItem): {
  debits: JournalEntryLineInput[];
  credits: JournalEntryLineInput[];
  debitAccounts: FineractJournalEntryGlAccountOption[];
  creditAccounts: FineractJournalEntryGlAccountOption[];
  allowMultipleDebitEntries: boolean;
  allowMultipleCreditEntries: boolean;
} {
  const debitAccounts = (rule.debitAccounts ?? []).map(ruleAccountToGlOption);
  const creditAccounts = (rule.creditAccounts ?? []).map(ruleAccountToGlOption);

  return {
    debits: journalEntryLinesFromRuleAccounts(rule.debitAccounts ?? []),
    credits: journalEntryLinesFromRuleAccounts(rule.creditAccounts ?? []),
    debitAccounts,
    creditAccounts,
    allowMultipleDebitEntries: rule.allowMultipleDebitEntries === true,
    allowMultipleCreditEntries: rule.allowMultipleCreditEntries === true
  };
}

export const MANUAL_JOURNAL_ENTRY_TEMPLATE_VALUE = '__manual__';

export function isManualJournalEntry(
  form: Pick<CreateJournalEntryFormInput, 'accountingRule'>
): boolean {
  return form.accountingRule == null;
}

export function isManualJournalEntryTemplateValue(value: string | undefined): boolean {
  return value == null || value === '' || value === MANUAL_JOURNAL_ENTRY_TEMPLATE_VALUE;
}

export function postingTemplateSelectValue(accountingRule: number | undefined): string {
  return accountingRule != null
    ? String(accountingRule)
    : MANUAL_JOURNAL_ENTRY_TEMPLATE_VALUE;
}

export function postingTemplateSelectOptions(accountingRules: FineractAccountingRuleListItem[]) {
  return [
    { value: MANUAL_JOURNAL_ENTRY_TEMPLATE_VALUE, label: 'Manual entry' },
    ...accountingRules.map((rule) => ({
      value: String(rule.id),
      label: rule.name
    }))
  ];
}

export function resolveJournalEntryLineConstraints({
  form,
  accountingRules,
  glAccounts
}: {
  form: Pick<CreateJournalEntryFormInput, 'accountingRule'>;
  accountingRules: FineractAccountingRuleListItem[];
  glAccounts: FineractJournalEntryGlAccountOption[];
}) {
  if (isManualJournalEntry(form)) {
    return {
      debitGlAccounts: glAccounts,
      creditGlAccounts: glAccounts,
      allowMultipleDebitEntries: true,
      allowMultipleCreditEntries: true
    };
  }

  const rule = accountingRules.find((entry) => entry.id === form.accountingRule);
  if (!rule) {
    return {
      debitGlAccounts: glAccounts,
      creditGlAccounts: glAccounts,
      allowMultipleDebitEntries: true,
      allowMultipleCreditEntries: true
    };
  }

  const lineState = postingTemplateLinesForRule(rule);
  return {
    debitGlAccounts: lineState.debitAccounts,
    creditGlAccounts: lineState.creditAccounts,
    allowMultipleDebitEntries: lineState.allowMultipleDebitEntries,
    allowMultipleCreditEntries: lineState.allowMultipleCreditEntries
  };
}

export function createJournalEntryFormValuesForRule(
  rule: FineractAccountingRuleListItem,
  currencies: FineractCurrencyOption[],
  officeId?: number,
  transactionDate?: string
): CreateJournalEntryFormInput {
  const lineState = postingTemplateLinesForRule(rule);
  return {
    ...defaultCreateJournalEntryFormValues(currencies, officeId, transactionDate),
    accountingRule: rule.id,
    debits: lineState.debits,
    credits: lineState.credits
  };
}
