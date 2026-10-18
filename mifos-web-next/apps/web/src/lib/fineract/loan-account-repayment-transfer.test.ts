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
  loanAccountDueBalance,
  loanAccountRepaymentTransferDefaults,
  loanPaymentDefaultAmount,
  loanRepaymentOverpaymentError,
  loanRepaymentRejectsOverpayment,
  loanRepaymentSavingsSources,
  LOAN_REPAYMENT_EXCEEDS_OUTSTANDING_MESSAGE,
  LOAN_REPAYMENT_OUTSTANDING_UNAVAILABLE_MESSAGE
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

describe('loanAccountDueBalance', () => {
  it('uses the overdue balance when the loan is in arrears', () => {
    const due = loanAccountDueBalance(
      account({ summary: { totalOutstanding: 10000, totalOverdue: 4200 } })
    );
    assert.deepEqual(due, { label: 'Overdue', amount: 4200 });
  });

  it('uses the next unpaid installment when nothing is overdue', () => {
    assert.deepEqual(loanAccountDueBalance(account()), { label: 'Due', amount: 2500 });
  });

  it('shows a zero overdue balance when nothing is payable', () => {
    const due = loanAccountDueBalance(
      account({
        summary: { totalOutstanding: 0, totalOverdue: 0 },
        repaymentSchedule: { periods: [{ period: 1, complete: true, totalOutstandingForPeriod: 0 }] }
      })
    );
    assert.deepEqual(due, { label: 'Overdue', amount: 0 });
  });
});

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

  it('caps a savings repayment at the outstanding balance', () => {
    const loan = account({ summary: { totalOutstanding: 800, totalOverdue: 4200 } });
    const defaults = loanAccountRepaymentTransferDefaults(loan, 5000);
    assert.equal(defaults.transferAmount, '800');
  });
});

describe('loan repayment overpayment', () => {
  it('allows an amount equal to the outstanding balance', () => {
    assert.equal(loanRepaymentOverpaymentError(10000, 10000), null);
    assert.equal(loanRepaymentOverpaymentError('0.30', 0.3), null);
  });

  it('rejects an amount above the outstanding balance', () => {
    assert.equal(
      loanRepaymentOverpaymentError('10000.01', 10000),
      LOAN_REPAYMENT_EXCEEDS_OUTSTANDING_MESSAGE
    );
    assert.equal(loanRepaymentOverpaymentError(1, 0), LOAN_REPAYMENT_EXCEEDS_OUTSTANDING_MESSAGE);
  });

  it('rejects a payment when the outstanding balance is missing', () => {
    assert.equal(
      loanRepaymentOverpaymentError(1, undefined),
      LOAN_REPAYMENT_OUTSTANDING_UNAVAILABLE_MESSAGE
    );
  });

  it('leaves an empty amount for the form', () => {
    assert.equal(loanRepaymentOverpaymentError('', 10000), null);
    assert.equal(loanRepaymentOverpaymentError('  ', 10000), null);
  });

  it('keeps active savings accounts in the loan currency', () => {
    const sources = loanRepaymentSavingsSources(
      [
        {
          id: 1,
          accountNo: 'SA1',
          productName: 'Wallet',
          statusCode: 'savingsAccountStatusType.active',
          currencyCode: 'UGX'
        },
        {
          id: 2,
          accountNo: 'SA2',
          statusCode: 'savingsAccountStatusType.active',
          currencyCode: 'USD'
        },
        {
          id: 3,
          accountNo: 'SA3',
          statusCode: 'savingsAccountStatusType.approved',
          currencyCode: 'ugx'
        },
        {
          id: 4,
          accountNo: 'FD1',
          statusCode: 'savingsAccountStatusType.active',
          currencyCode: 'UGX',
          depositType: 'Fixed Deposit'
        }
      ],
      'UGX'
    );
    assert.deepEqual(
      sources.map((account) => account.id),
      [1]
    );
  });

  it('does not apply the outstanding cap to a written-off loan', () => {
    assert.equal(loanRepaymentRejectsOverpayment('loanStatusType.active'), true);
    assert.equal(loanRepaymentRejectsOverpayment('loanStatusType.closed.written.off'), false);
    assert.equal(loanRepaymentRejectsOverpayment(undefined), true);
  });
});
