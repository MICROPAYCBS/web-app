/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  loanAccountRepaymentTransferDefaults,
  loanPaymentDefaultAmount
} from '@/lib/fineract/loan-account-repayment-transfer';

function account(
  overrides: Partial<FineractLoanAccountDetail> = {}
): FineractLoanAccountDetail {
  return {
    id: 1,
    accountNo: '000000001',
    status: { value: 'Active', code: 'loanStatusType.active', active: true },
    currency: { code: 'UGX' },
    summary: { totalOutstanding: 10000, totalOverdue: 0 },
    repaymentSchedule: {
      periods: [
        { principalDisbursed: 10000 },
        { period: 1, complete: true, totalOutstandingForPeriod: 0, totalDueForPeriod: 2000 },
        { period: 2, complete: false, totalOutstandingForPeriod: 2500, totalDueForPeriod: 2500 }
      ]
    },
    ...overrides
  } as FineractLoanAccountDetail;
}

describe('loan payment default amount', () => {
  it('uses the overdue total when the loan is in arrears', () => {
    const loan = account({ summary: { totalOutstanding: 10000, totalOverdue: 4200 } });
    assert.equal(loanPaymentDefaultAmount(loan, 2500), 4200);
  });

  it('uses the amount due when nothing is overdue', () => {
    assert.equal(loanPaymentDefaultAmount(account(), 2500), 2500);
  });

  it('uses the next unpaid installment when the template has no amount', () => {
    assert.equal(loanPaymentDefaultAmount(account()), 2500);
  });

  it('caps a savings repayment at the available balance', () => {
    const loan = account({ summary: { totalOutstanding: 10000, totalOverdue: 4200 } });
    const defaults = loanAccountRepaymentTransferDefaults(loan, 1000);
    assert.equal(defaults.transferAmount, '1000');
  });
});
