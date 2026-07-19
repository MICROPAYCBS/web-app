/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CreateLoanAccountInput } from '@mifos/validation';
import { buildLoanAccountPayload } from '@/lib/fineract/client-loan-account-payload';

function baseInput(overrides: Partial<CreateLoanAccountInput> = {}): CreateLoanAccountInput {
  return {
    productId: 1,
    loanOfficerId: 1,
    submittedOnDate: '01 July 2026',
    expectedDisbursementDate: '01 July 2026',
    externalId: '',
    principal: 100_000,
    loanTermFrequency: 12,
    loanTermFrequencyType: 2,
    loanType: 'individual',
    numberOfRepayments: 12,
    repaymentEvery: 1,
    repaymentFrequencyType: 2,
    interestRatePerPeriod: 5,
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

describe('buildLoanAccountPayload enableDownPayment', () => {
  it('includes enableDownPayment when set on the application', () => {
    const payload = buildLoanAccountPayload(baseInput({ enableDownPayment: true }), {
      clientId: 42
    });
    assert.equal(payload.enableDownPayment, true);
  });

  it('includes enableDownPayment false when explicitly disabled', () => {
    const payload = buildLoanAccountPayload(baseInput({ enableDownPayment: false }), {
      clientId: 42
    });
    assert.equal(payload.enableDownPayment, false);
  });

  it('omits enableDownPayment when undefined', () => {
    const payload = buildLoanAccountPayload(baseInput(), { clientId: 42 });
    assert.equal('enableDownPayment' in payload, false);
  });
});
