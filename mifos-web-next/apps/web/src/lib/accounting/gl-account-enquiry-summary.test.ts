/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GL_ACCOUNT_TYPE_ASSET } from '@/lib/accounting/gl-account-display';
import { buildGlAccountEnquirySummaryFromReport } from '@/lib/accounting/gl-account-enquiry-summary';
import type { GlAccountEnquiryLine } from '@/lib/fineract/gl-account-enquiry-query';

function line(overrides: Partial<GlAccountEnquiryLine> = {}): GlAccountEnquiryLine {
  return {
    entryDate: '2026-07-04',
    debitAmount: 0,
    creditAmount: 0,
    openingBalance: 5_000_000,
    source: 'Manual',
    transactionId: 'abc',
    cumulativeSum: 5_000_000,
    ...overrides
  };
}

describe('buildGlAccountEnquirySummaryFromReport', () => {
  it('sums debits/credits and uses newest-row balances', () => {
    const summary = buildGlAccountEnquirySummaryFromReport({
      glAccountTypeId: GL_ACCOUNT_TYPE_ASSET,
      lines: [
        line({
          transactionId: 'newer',
          debitAmount: 30_000,
          cumulativeSum: 3_000
        }),
        line({
          transactionId: 'older',
          creditAmount: 5_027_000,
          cumulativeSum: -27_000
        })
      ]
    });

    assert.equal(summary.totalDebits, 30_000);
    assert.equal(summary.totalCredits, 5_027_000);
    assert.equal(summary.openingBalance, 5_000_000);
    assert.equal(summary.closingBalance, 3_000);
    assert.equal(summary.netMovement, 3_000 - 5_000_000);
    assert.equal(summary.entryCount, 2);
    assert.equal(summary.truncated, false);
    assert.equal(summary.balanceScope, 'office');
  });

  it('returns empty totals when there are no lines', () => {
    const summary = buildGlAccountEnquirySummaryFromReport({
      glAccountTypeId: GL_ACCOUNT_TYPE_ASSET,
      lines: []
    });
    assert.equal(summary.entryCount, 0);
    assert.equal(summary.totalDebits, 0);
    assert.equal(summary.totalCredits, 0);
    assert.equal(summary.openingBalance, null);
    assert.equal(summary.closingBalance, null);
  });
});
