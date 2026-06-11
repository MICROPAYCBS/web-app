/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCurrencyOption,
  FineractJournalEntryGlAccountOption,
  FineractJournalEntryListItem
} from '@mifos/api-client';
import type { CreateJournalEntryFormInput } from '@mifos/validation';
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

export function formatJournalEntryAmount(entry: FineractJournalEntryListItem, side: 'DEBIT' | 'CREDIT') {
  if (entry.entryType.value !== side) {
    return '—';
  }
  const symbol = entry.currency.displaySymbol || entry.currency.code;
  return `${symbol} ${formatAccountMoney(entry.amount).replace(/^[^ ]+\s/, '')}`;
}

export function defaultCreateJournalEntryFormValues(
  currencies: FineractCurrencyOption[],
  officeId?: number
): CreateJournalEntryFormInput {
  return {
    officeId: officeId ?? 0,
    currencyCode: currencies[0]?.code ?? '',
    transactionDate: toFineractDate(new Date()),
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
