/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractGlAccountLedgerResponse } from '@mifos/api-client';
import { buildGlAccountEnquirySummaryFromLedger } from './gl-account-enquiry-summary';

function ledger(
  overrides: Partial<FineractGlAccountLedgerResponse> = {}
): FineractGlAccountLedgerResponse {
  return {
    glAccountId: 15,
    glCode: '100001',
    glAccountName: 'Cash',
    officeId: 1,
    officeName: 'Head Office',
    departmentId: 2,
    departmentName: 'IT',
    currencyCode: 'UGX',
    startDate: '2026-07-01',
    endDate: '2026-07-16',
    summary: {
      openingBalance: 1000,
      totalDebit: 0,
      totalCredit: 0,
      closingBalance: 1000,
      lastUpdated: null
    },
    entries: [],
    ...overrides
  };
}

describe('buildGlAccountEnquirySummaryFromLedger', () => {
  it('maps empty-period summary without inventing entries', () => {
    const summary = buildGlAccountEnquirySummaryFromLedger(ledger());
    assert.equal(summary.openingBalance, 1000);
    assert.equal(summary.closingBalance, 1000);
    assert.equal(summary.totalDebits, 0);
    assert.equal(summary.totalCredits, 0);
    assert.equal(summary.netMovement, 0);
    assert.equal(summary.entryCount, 0);
    assert.equal(summary.lastUpdated, null);
  });

  it('maps activity totals and lastUpdated from the API summary', () => {
    const summary = buildGlAccountEnquirySummaryFromLedger(
      ledger({
        summary: {
          openingBalance: 1000,
          totalDebit: 100,
          totalCredit: 0,
          closingBalance: 1100,
          lastUpdated: '2026-07-10T12:00:00Z'
        },
        entries: [
          {
            entryDate: '2026-07-10',
            transactionId: 'abc',
            source: 'Manual',
            debit: 100,
            credit: 0,
            runningBalance: 1100
          }
        ]
      })
    );
    assert.equal(summary.totalDebits, 100);
    assert.equal(summary.closingBalance, 1100);
    assert.equal(summary.netMovement, 100);
    assert.equal(summary.entryCount, 1);
    assert.equal(summary.lastUpdated, '2026-07-10T12:00:00Z');
  });
});
