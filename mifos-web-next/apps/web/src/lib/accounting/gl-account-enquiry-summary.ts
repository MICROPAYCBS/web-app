/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountLedgerResponse } from '@mifos/api-client';
import {
  GL_ACCOUNT_TYPE_ASSET,
  GL_ACCOUNT_TYPE_EQUITY,
  GL_ACCOUNT_TYPE_EXPENSE,
  GL_ACCOUNT_TYPE_INCOME,
  GL_ACCOUNT_TYPE_LIABILITY
} from '@/lib/accounting/gl-account-display';

/** UI summary for GL enquiry details (bound from ledger API `summary` + entry count). */
export type GlAccountEnquirySummary = {
  entryCount: number;
  totalDebits: number;
  totalCredits: number;
  netMovement: number;
  openingBalance: number;
  closingBalance: number;
  /** ISO-8601 UTC; null when no entries. */
  lastUpdated: string | null;
  /** Report is always scoped to a branch hierarchy. */
  balanceScope: 'office';
};

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

/** Maps `GET /glaccounts/{id}/ledger` into the enquiry details summary view-model. */
export function buildGlAccountEnquirySummaryFromLedger(
  ledger: FineractGlAccountLedgerResponse
): GlAccountEnquirySummary {
  const { summary, entries } = ledger;
  return {
    entryCount: entries.length,
    totalDebits: summary.totalDebit,
    totalCredits: summary.totalCredit,
    netMovement: summary.closingBalance - summary.openingBalance,
    openingBalance: summary.openingBalance,
    closingBalance: summary.closingBalance,
    lastUpdated: summary.lastUpdated,
    balanceScope: 'office'
  };
}
