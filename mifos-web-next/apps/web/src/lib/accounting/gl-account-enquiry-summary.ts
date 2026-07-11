/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import {
  GL_ACCOUNT_TYPE_ASSET,
  GL_ACCOUNT_TYPE_EQUITY,
  GL_ACCOUNT_TYPE_EXPENSE,
  GL_ACCOUNT_TYPE_INCOME,
  GL_ACCOUNT_TYPE_LIABILITY
} from '@/lib/accounting/gl-account-display';

export type GlAccountEnquirySummary = {
  entryCount: number;
  totalDebits: number;
  totalCredits: number;
  netMovement: number;
  openingBalance: number | null;
  closingBalance: number | null;
  balanceScope: 'office' | 'organization';
  truncated: boolean;
};

function isDebitEntry(entry: Pick<FineractJournalEntryListItem, 'entryType'>): boolean {
  return entry.entryType.value === 'DEBIT' || entry.entryType.id === 1;
}

export function glAccountEntryIncreasesBalance(
  glAccountTypeId: number,
  entry: Pick<FineractJournalEntryListItem, 'entryType'>
): boolean {
  const debit = isDebitEntry(entry);
  switch (glAccountTypeId) {
    case GL_ACCOUNT_TYPE_ASSET:
    case GL_ACCOUNT_TYPE_EXPENSE:
      return debit;
    case GL_ACCOUNT_TYPE_LIABILITY:
    case GL_ACCOUNT_TYPE_EQUITY:
    case GL_ACCOUNT_TYPE_INCOME:
      return !debit;
    default:
      return debit;
  }
}

export function glAccountEntrySignedAmount(
  glAccountTypeId: number,
  entry: Pick<FineractJournalEntryListItem, 'entryType' | 'amount'>
): number {
  const magnitude = Math.abs(entry.amount);
  return glAccountEntryIncreasesBalance(glAccountTypeId, entry) ? magnitude : -magnitude;
}

function readRunningBalance(
  entry: FineractJournalEntryListItem,
  balanceScope: 'office' | 'organization'
): number | null {
  const value =
    balanceScope === 'office' ? entry.officeRunningBalance : entry.organizationRunningBalance;
  return value != null && Number.isFinite(value) ? value : null;
}

export function openingBalanceBeforeEntry(
  glAccountTypeId: number,
  entry: FineractJournalEntryListItem,
  balanceScope: 'office' | 'organization'
): number | null {
  const runningBalance = readRunningBalance(entry, balanceScope);
  if (runningBalance == null) {
    return null;
  }
  return runningBalance - glAccountEntrySignedAmount(glAccountTypeId, entry);
}

export function buildGlAccountEnquirySummary(input: {
  entries: FineractJournalEntryListItem[];
  glAccountTypeId: number;
  balanceScope: 'office' | 'organization';
  openingBalanceBeforePeriod?: number | null;
  totalFilteredRecords?: number;
}): GlAccountEnquirySummary {
  const activeEntries = input.entries.filter((entry) => entry.reversed !== true);
  let totalDebits = 0;
  let totalCredits = 0;

  for (const entry of activeEntries) {
    if (isDebitEntry(entry)) {
      totalDebits += entry.amount;
    } else {
      totalCredits += entry.amount;
    }
  }

  let netMovement = 0;
  for (const entry of activeEntries) {
    netMovement += glAccountEntrySignedAmount(input.glAccountTypeId, entry);
  }

  const chronological = [...activeEntries].sort((left, right) => {
    const leftDate = String(left.transactionDate);
    const rightDate = String(right.transactionDate);
    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }
    return left.id - right.id;
  });

  const firstEntry = chronological[0];
  const lastEntry = chronological[chronological.length - 1];

  const openingBalance =
    input.openingBalanceBeforePeriod ??
    (firstEntry
      ? openingBalanceBeforeEntry(input.glAccountTypeId, firstEntry, input.balanceScope)
      : null);

  const closingBalance = lastEntry
    ? readRunningBalance(lastEntry, input.balanceScope)
    : openingBalance;

  const totalFilteredRecords = input.totalFilteredRecords ?? activeEntries.length;

  return {
    entryCount: totalFilteredRecords,
    totalDebits,
    totalCredits,
    netMovement,
    openingBalance,
    closingBalance,
    balanceScope: input.balanceScope,
    truncated: totalFilteredRecords > activeEntries.length
  };
}

export function glAccountBalanceLabel(glAccountTypeId: number): string {
  switch (glAccountTypeId) {
    case GL_ACCOUNT_TYPE_ASSET:
    case GL_ACCOUNT_TYPE_EXPENSE:
      return 'Debit balance';
    case GL_ACCOUNT_TYPE_LIABILITY:
    case GL_ACCOUNT_TYPE_EQUITY:
    case GL_ACCOUNT_TYPE_INCOME:
      return 'Credit balance';
    default:
      return 'Balance';
  }
}
