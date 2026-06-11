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
  FineractCurrencyOption
} from '@mifos/api-client';
import type { CreateFrequentPostingFormInput, JournalEntryLineInput } from '@mifos/validation';
import { toFineractDate } from '@/lib/fineract/dates';

export function formatFrequentPostingAccountLabel(account: FineractAccountingRuleGlAccountRef) {
  return account.glCode ? `${account.name} (${account.glCode})` : account.name;
}

export function defaultFrequentPostingFormValues(
  currencies: FineractCurrencyOption[],
  officeId?: number
): CreateFrequentPostingFormInput {
  return {
    officeId: officeId ?? 0,
    accountingRule: 0,
    currencyCode: currencies[0]?.code ?? '',
    transactionDate: toFineractDate(new Date()),
    debits: [],
    credits: [],
    referenceNumber: '',
    accountNumber: '',
    checkNumber: '',
    routingCode: '',
    receiptNumber: '',
    bankNumber: '',
    comments: ''
  };
}

export function emptyFrequentPostingLine(): JournalEntryLineInput {
  return { glAccountId: 0, amount: 0 };
}

export function frequentPostingLinesForRule(rule: FineractAccountingRuleListItem): {
  debits: JournalEntryLineInput[];
  credits: JournalEntryLineInput[];
  debitAccounts: FineractAccountingRuleGlAccountRef[];
  creditAccounts: FineractAccountingRuleGlAccountRef[];
  allowMultipleDebitEntries: boolean;
  allowMultipleCreditEntries: boolean;
} {
  return {
    debits: [emptyFrequentPostingLine()],
    credits: [emptyFrequentPostingLine()],
    debitAccounts: rule.debitAccounts ?? [],
    creditAccounts: rule.creditAccounts ?? [],
    allowMultipleDebitEntries: rule.allowMultipleDebitEntries === true,
    allowMultipleCreditEntries: rule.allowMultipleCreditEntries === true
  };
}
