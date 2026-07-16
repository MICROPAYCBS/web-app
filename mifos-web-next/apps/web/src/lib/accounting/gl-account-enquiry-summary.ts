/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  GL_ACCOUNT_TYPE_ASSET,
  GL_ACCOUNT_TYPE_EQUITY,
  GL_ACCOUNT_TYPE_EXPENSE,
  GL_ACCOUNT_TYPE_INCOME,
  GL_ACCOUNT_TYPE_LIABILITY
} from '@/lib/accounting/gl-account-display';
import type { GlAccountEnquiryLine } from '@/lib/fineract/gl-account-enquiry-query';

export type GlAccountEnquirySummary = {
  entryCount: number;
  totalDebits: number;
  totalCredits: number;
  netMovement: number;
  openingBalance: number | null;
  closingBalance: number | null;
  /** Report is always scoped to a branch hierarchy. */
  balanceScope: 'office';
  truncated: boolean;
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

/**
 * Builds enquiry summary from GeneralLedgerReport Table rows (newest-first).
 * Opening is repeated on every line; closing is cumulative_sum on the first (newest) row.
 */
export function buildGlAccountEnquirySummaryFromReport(input: {
  lines: GlAccountEnquiryLine[];
  glAccountTypeId: number;
}): GlAccountEnquirySummary {
  let totalDebits = 0;
  let totalCredits = 0;
  for (const line of input.lines) {
    totalDebits += Math.abs(line.debitAmount) || 0;
    totalCredits += Math.abs(line.creditAmount) || 0;
  }

  const newest = input.lines[0];
  const openingBalance = newest ? newest.openingBalance : null;
  const closingBalance = newest ? newest.cumulativeSum : null;
  const netMovement =
    openingBalance != null && closingBalance != null ? closingBalance - openingBalance : 0;

  return {
    entryCount: input.lines.length,
    totalDebits,
    totalCredits,
    netMovement,
    openingBalance,
    closingBalance,
    balanceScope: 'office',
    truncated: false
  };
}
