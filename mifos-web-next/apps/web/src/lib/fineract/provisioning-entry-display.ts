/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractProvisioningJournalEntry } from '@mifos/api-client';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function formatProvisioningAmount(
  value: string | number | undefined,
  currencyCode?: string
): string {
  if (value == null || value === '') {
    return '—';
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(numeric)) {
    return formatAccountMoney(numeric, currencyCode);
  }
  return String(value);
}

export function formatProvisioningJournalDate(
  value: string | number[] | undefined
): string {
  if (value == null || value === '') {
    return '—';
  }
  return formatFineractDateArray(value) ?? '—';
}

export function formatJournalDebitCredit(entry: FineractProvisioningJournalEntry): {
  debit: string;
  credit: string;
} {
  const symbol = entry.currency.displaySymbol || entry.currency.code;
  const formatted = `${symbol} ${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(entry.amount)}`;
  if (entry.entryType.value === 'DEBIT') {
    return { debit: formatted, credit: '' };
  }
  if (entry.entryType.value === 'CREDIT') {
    return { debit: '', credit: formatted };
  }
  return { debit: '', credit: '' };
}
