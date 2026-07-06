/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CreateLoanAccountInput } from './create-loan-account.schema';
import {
  validateLoanApplicationChargeAmountRules,
  validateLoanApplicationProductRules
} from './loan-application-validation';

function baseInput(overrides: Partial<CreateLoanAccountInput> = {}): CreateLoanAccountInput {
  return {
    productId: 1,
    loanOfficerId: 1,
    submittedOnDate: '01 July 2026',
    expectedDisbursementDate: '01 July 2026',
    externalId: '',
    principal: 0,
    loanTermFrequency: 12,
    loanTermFrequencyType: 2,
    loanType: 'individual',
    numberOfRepayments: 0,
    repaymentEvery: 1,
    repaymentFrequencyType: 2,
    interestRatePerPeriod: 0,
    graceOnPrincipalPayment: 0,
    graceOnInterestPayment: 0,
    graceOnInterestCharged: 0,
    amortizationType: 1,
    interestType: 0,
    interestCalculationPeriodType: 1,
    transactionProcessingStrategyCode: 'mifos-standard-strategy',
    charges: [],
    collateral: [],
    guarantors: [],
    createStandingInstructionAtDisbursement: false,
    ...overrides
  };
}

describe('validateLoanApplicationProductRules ranges', () => {
  const ctx = {
    minPrincipal: 100_000,
    maxPrincipal: 5_000_000,
    minNumberOfRepayments: 3,
    maxNumberOfRepayments: 24,
    minInterestRatePerPeriod: 2,
    maxInterestRatePerPeriod: 15,
    currencyCode: 'UGX'
  };

  it('does not flag empty principal before the user enters an amount', () => {
    const errors = validateLoanApplicationProductRules(baseInput(), ctx);
    assert.equal(errors.principal, undefined);
  });

  it('flags principal below the product minimum once entered', () => {
    const errors = validateLoanApplicationProductRules(
      baseInput({ principal: 50_000 }),
      ctx
    );
    assert.match(errors.principal ?? '', /at least/i);
    assert.match(errors.principal ?? '', /UGX/);
  });

  it('flags principal above the product maximum', () => {
    const errors = validateLoanApplicationProductRules(
      baseInput({ principal: 6_000_000 }),
      ctx
    );
    assert.match(errors.principal ?? '', /not exceed/i);
  });

  it('does not flag repayments before the user enters a count', () => {
    const errors = validateLoanApplicationProductRules(baseInput(), ctx);
    assert.equal(errors.numberOfRepayments, undefined);
  });

  it('flags repayments outside the allowed count', () => {
    const tooFew = validateLoanApplicationProductRules(
      baseInput({ numberOfRepayments: 2 }),
      ctx
    );
    assert.match(tooFew.numberOfRepayments ?? '', /At least 3/);

    const tooMany = validateLoanApplicationProductRules(
      baseInput({ numberOfRepayments: 30 }),
      ctx
    );
    assert.match(tooMany.numberOfRepayments ?? '', /At most 24/);
  });

  it('flags interest rate outside the allowed range', () => {
    const tooLow = validateLoanApplicationProductRules(
      baseInput({ interestRatePerPeriod: 1 }),
      ctx
    );
    assert.match(tooLow.interestRatePerPeriod ?? '', /Minimum rate is 2%/);

    const tooHigh = validateLoanApplicationProductRules(
      baseInput({ interestRatePerPeriod: 20 }),
      ctx
    );
    assert.match(tooHigh.interestRatePerPeriod ?? '', /Maximum rate is 15%/);
  });
});

describe('validateLoanApplicationChargeAmountRules', () => {
  const flatLimit = {
    chargeId: 10,
    name: 'Processing fee',
    minCap: 50_000,
    maxCap: 200_000,
    chargeCalculationTypeId: 1,
    currencyCode: 'UGX'
  };

  const percentageLimit = {
    chargeId: 11,
    name: 'Insurance fee',
    minCap: 1,
    maxCap: 3,
    chargeCalculationTypeId: 2,
    currencyCode: 'UGX'
  };

  it('does not flag charge amounts within flat caps', () => {
    const errors = validateLoanApplicationChargeAmountRules(
      baseInput({
        charges: [{ chargeId: 10, amount: 100_000 }]
      }),
      { currencyCode: 'UGX', chargeAmountLimits: [flatLimit] }
    );
    assert.equal(errors['charges.0.amount'], undefined);
  });

  it('flags flat charge amounts below the minimum cap', () => {
    const errors = validateLoanApplicationChargeAmountRules(
      baseInput({
        charges: [{ chargeId: 10, amount: 25_000 }]
      }),
      { currencyCode: 'UGX', chargeAmountLimits: [flatLimit] }
    );
    assert.match(errors['charges.0.amount'] ?? '', /Processing fee amount must be at least/i);
    assert.match(errors['charges.0.amount'] ?? '', /UGX/);
  });

  it('flags percentage charge rates above the maximum cap', () => {
    const errors = validateLoanApplicationChargeAmountRules(
      baseInput({
        charges: [{ chargeId: 11, amount: 4 }]
      }),
      { currencyCode: 'UGX', chargeAmountLimits: [percentageLimit] }
    );
    assert.match(errors['charges.0.amount'] ?? '', /Insurance fee rate must not exceed 3%/);
  });

  it('merges charge amount validation into product rules', () => {
    const errors = validateLoanApplicationProductRules(
      baseInput({
        charges: [{ chargeId: 11, amount: 0.5 }]
      }),
      { currencyCode: 'UGX', chargeAmountLimits: [percentageLimit] }
    );
    assert.match(errors['charges.0.amount'] ?? '', /rate must be at least 1%/);
  });
});

describe('validateLoanApplicationProductRules linked savings', () => {
  it('requires a linked account before submit when account-transfer fees apply', () => {
    const errors = validateLoanApplicationProductRules(
      baseInput({
        charges: [{ chargeId: 10, amount: 100 }]
      }),
      { hasAccountTransferCharge: true, currencyCode: 'UGX' }
    );
    assert.match(errors.linkAccountId ?? '', /Link a savings account/i);
  });

  it('skips linked-account validation during schedule preview', () => {
    const errors = validateLoanApplicationProductRules(
      baseInput({
        createStandingInstructionAtDisbursement: true,
        charges: [{ chargeId: 10, amount: 100 }]
      }),
      { hasAccountTransferCharge: true, currencyCode: 'UGX' },
      { schedulePreview: true }
    );
    assert.equal(errors.linkAccountId, undefined);
  });
});
