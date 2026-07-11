/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GL_ACCOUNT_TYPE_ASSET,
  GL_ACCOUNT_TYPE_INCOME
} from '@/lib/accounting/gl-account-display';
import {
  buildGlAccountEnquirySummary,
  glAccountEntryIncreasesBalance,
  glAccountEntrySignedAmount,
  openingBalanceBeforeEntry
} from '@/lib/accounting/gl-account-enquiry-summary';

function entry(
  overrides: Partial<{
    id: number;
    amount: number;
    entryType: 'DEBIT' | 'CREDIT';
    transactionDate: string;
    organizationRunningBalance: number;
    reversed: boolean;
  }> = {}
) {
  const entryTypeValue = overrides.entryType ?? 'DEBIT';
  return {
    id: overrides.id ?? 1,
    officeName: 'Head Office',
    transactionId: 'J1',
    transactionDate: overrides.transactionDate ?? '01 July 2026',
    glAccountType: { id: GL_ACCOUNT_TYPE_ASSET, value: 'ASSET' },
    glAccountCode: '110001',
    glAccountName: 'Cash',
    currency: { code: 'UGX', displaySymbol: 'UGX' },
    entryType: { id: entryTypeValue === 'DEBIT' ? 1 : 2, value: entryTypeValue },
    amount: overrides.amount ?? 100,
    organizationRunningBalance: overrides.organizationRunningBalance,
    reversed: overrides.reversed
  };
}

describe('glAccountEntrySignedAmount', () => {
  it('treats debits as positive for asset accounts', () => {
    assert.equal(
      glAccountEntrySignedAmount(GL_ACCOUNT_TYPE_ASSET, entry({ entryType: 'DEBIT', amount: 50 })),
      50
    );
    assert.equal(
      glAccountEntrySignedAmount(GL_ACCOUNT_TYPE_ASSET, entry({ entryType: 'CREDIT', amount: 50 })),
      -50
    );
  });

  it('treats credits as positive for income accounts', () => {
    assert.equal(
      glAccountEntrySignedAmount(GL_ACCOUNT_TYPE_INCOME, entry({ entryType: 'CREDIT', amount: 75 })),
      75
    );
  });
});

describe('buildGlAccountEnquirySummary', () => {
  it('computes totals and opening/closing balances from running balances', () => {
    const summary = buildGlAccountEnquirySummary({
      glAccountTypeId: GL_ACCOUNT_TYPE_ASSET,
      balanceScope: 'organization',
      entries: [
        entry({
          id: 1,
          amount: 100,
          entryType: 'DEBIT',
          transactionDate: '01 July 2026',
          organizationRunningBalance: 100
        }),
        entry({
          id: 2,
          amount: 40,
          entryType: 'CREDIT',
          transactionDate: '02 July 2026',
          organizationRunningBalance: 60
        })
      ],
      totalFilteredRecords: 2
    });

    assert.equal(summary.totalDebits, 100);
    assert.equal(summary.totalCredits, 40);
    assert.equal(summary.netMovement, 60);
    assert.equal(summary.openingBalance, 0);
    assert.equal(summary.closingBalance, 60);
    assert.equal(summary.entryCount, 2);
    assert.equal(summary.truncated, false);
  });

  it('uses a supplied opening balance when the period starts after prior activity', () => {
    const summary = buildGlAccountEnquirySummary({
      glAccountTypeId: GL_ACCOUNT_TYPE_ASSET,
      balanceScope: 'organization',
      openingBalanceBeforePeriod: 250,
      entries: [
        entry({
          id: 3,
          amount: 50,
          entryType: 'DEBIT',
          organizationRunningBalance: 300
        })
      ]
    });

    assert.equal(summary.openingBalance, 250);
    assert.equal(summary.closingBalance, 300);
  });
});

describe('openingBalanceBeforeEntry', () => {
  it('backs out the first entry amount from the running balance', () => {
    const first = entry({ amount: 100, organizationRunningBalance: 100 });
    assert.equal(openingBalanceBeforeEntry(GL_ACCOUNT_TYPE_ASSET, first, 'organization'), 0);
    assert.equal(glAccountEntryIncreasesBalance(GL_ACCOUNT_TYPE_ASSET, first), true);
  });
});
