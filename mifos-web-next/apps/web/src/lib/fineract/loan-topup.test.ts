/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  activeLoansForTopup,
  amountCoversPayoff,
  buildLoanTopupFieldErrors,
  earliestDisbursementTranche,
  estimateApplicationDisbursementCharges,
  isTopupUserTransaction,
  lastTopupUserTransactionDate,
  filterTopupProductOptions,
  loanTemplateAllowsTopup,
  loanTopupSectionVisible,
  normalizeClientActiveLoanOptions,
  topupCashToClient
} from '@/lib/fineract/loan-topup';

describe('loan top-up visibility', () => {
  it('shows the section only when the product allows top-up and a client is present', () => {
    assert.equal(loanTopupSectionVisible(true, 15), true);
    assert.equal(loanTopupSectionVisible(false, 15), false);
    assert.equal(loanTopupSectionVisible(true, undefined), false);
    assert.equal(loanTopupSectionVisible(true, 0), false);
  });

  it('treats a product template isTopup copy as the product flag, not a saved loan', () => {
    assert.equal(loanTemplateAllowsTopup({ isTopup: true }), true);
    assert.equal(loanTemplateAllowsTopup({ id: 88, isTopup: true }), false);
    assert.equal(loanTemplateAllowsTopup({ id: 88, canUseForTopup: true, isTopup: false }), true);
  });
});

describe('products offered when starting from a loan', () => {
  const options = [
    { id: 1, name: 'Top-up UGX' },
    { id: 2, name: 'Ordinary' },
    { id: 3, name: 'Top-up USD' },
    { id: 4, name: 'Unknown flag' }
  ];
  const products = [
    { id: 1, canUseForTopup: true, currencyCode: 'UGX' },
    { id: 2, canUseForTopup: false, currencyCode: 'UGX' },
    { id: 3, canUseForTopup: true, currencyCode: 'USD' },
    { id: 4, currencyCode: 'USD' }
  ];

  it('keeps top-up products in the loan currency and rows that omit the flag', () => {
    assert.deepEqual(
      filterTopupProductOptions(options, products, 'UGX').map((option) => option.id),
      [1, 4]
    );
  });
});

describe('loans the client can close', () => {
  it('shows a null balance as zero and keeps only the product currency', () => {
    const options = normalizeClientActiveLoanOptions([
      {
        id: 88,
        accountNo: '000000088',
        productName: 'Agricultural',
        loanBalance: null,
        currency: { code: 'UGX' }
      },
      {
        id: 89,
        accountNo: '000000089',
        productName: 'Dollar loan',
        loanBalance: 10,
        currency: { code: 'USD' }
      }
    ]);
    assert.equal(options[0]?.loanBalance, 0);
    const matching = activeLoansForTopup(options, 'ugx');
    assert.deepEqual(
      matching.map((option) => option.id),
      [88]
    );
  });
});

describe('top-up payoff rules', () => {
  it('allows a principal equal to the payoff and computes cash after disbursement charges', () => {
    assert.equal(amountCoversPayoff(42500, 42500), true);
    assert.equal(amountCoversPayoff(42499.99, 42500), false);
    assert.equal(topupCashToClient(150000, 42500, 0), 107500);
    assert.equal(topupCashToClient(42500, 42500, 0), 0);
  });

  it('estimates flat and percent-of-amount disbursement charges', () => {
    const estimate = estimateApplicationDisbursementCharges(
      [
        { amount: 500, chargeTimeTypeId: 1, calculationTypeId: 1 },
        { amount: 2, chargeTimeTypeId: 1, calculationTypeId: 2 },
        { amount: 1, chargeTimeTypeId: 8, calculationTypeId: 1 },
        { amount: 3, chargeTimeTypeId: 1, calculationTypeId: 4 }
      ],
      100000
    );
    assert.equal(estimate.total, 2500);
    assert.equal(estimate.omittedInterestBased, true);
  });

  it('uses the disbursement date, then later repayments, waivers, and charges', () => {
    assert.equal(isTopupUserTransaction('loanTransactionType.accrual', 'Accrual'), false);
    const last = lastTopupUserTransactionDate('01 March 2026', [
      { date: '15 February 2026', code: 'loanTransactionType.repayment', value: 'Repayment' },
      { date: '20 March 2026', code: 'loanTransactionType.repayment', value: 'Repayment' },
      {
        date: '25 March 2026',
        code: 'loanTransactionType.accrual',
        value: 'Accrual'
      },
      {
        date: '18 March 2026',
        reversed: true,
        code: 'loanTransactionType.waiver',
        value: 'Waiver'
      }
    ]);
    assert.equal(last, '20 March 2026');
  });

  it('requires the application date after disbursement and the new disbursement on or after the last transaction', () => {
    const errors = buildLoanTopupFieldErrors({
      isTopup: true,
      loanIdToClose: 88,
      close: {
        active: true,
        blocked: false,
        currencyCode: 'UGX',
        actualDisbursementDate: '01 March 2026',
        lastUserTransactionDate: '20 March 2026'
      },
      productCurrencyCode: 'UGX',
      payoffAmount: 42500,
      principal: 40000,
      submittedOnDate: '01 March 2026',
      expectedDisbursementDate: '19 March 2026'
    });
    assert.equal(errors.principal, 'Principal must cover the payoff');
    assert.equal(errors.submittedOnDate, 'Application date must be after that loan was disbursed');
    assert.equal(
      errors.expectedDisbursementDate,
      "Disbursement must be on or after that loan's last transaction"
    );
  });

  it('blocks a multi-disburse loan without interest recalculation', () => {
    const errors = buildLoanTopupFieldErrors({
      isTopup: true,
      loanIdToClose: 88,
      close: { active: true, blocked: true },
      principal: 0,
      submittedOnDate: '',
      expectedDisbursementDate: ''
    });
    assert.equal(errors.loanIdToClose, 'This loan cannot be closed by a top-up');
  });
});

describe('earliest disbursement tranche', () => {
  it('uses the tranche with the earliest expected disbursement date', () => {
    const earliest = earliestDisbursementTranche([
      { expectedDisbursementDate: '01 May 2026', principal: 20000 },
      { expectedDisbursementDate: '01 April 2026', principal: 50000 }
    ]);
    assert.equal(earliest?.principal, 50000);
  });
});
