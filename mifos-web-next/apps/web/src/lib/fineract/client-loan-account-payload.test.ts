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
import {
  buildLoanAccountPayload,
  buildLoanGuarantorPayload,
  buildLoanGuarantorUpdatePayload
} from '@/lib/fineract/client-loan-account-payload';

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
    originators: [],
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

describe('buildLoanAccountPayload originators', () => {
  it('includes originator ids on create', () => {
    const payload = buildLoanAccountPayload(
      baseInput({ originators: [{ id: 7 }, { id: 7 }, { id: 9 }] }),
      { clientId: 42 }
    );
    assert.deepEqual(payload.originators, [{ id: 7 }, { id: 9 }]);
  });

  it('omits originators on modify', () => {
    const payload = buildLoanAccountPayload(baseInput({ originators: [{ id: 7 }] }), {
      clientId: 42,
      forUpdate: true
    });
    assert.equal('originators' in payload, false);
  });

  it('omits originators on schedule preview', () => {
    const payload = buildLoanAccountPayload(baseInput({ originators: [{ id: 7 }] }), {
      clientId: 42,
      forSchedulePreview: true
    });
    assert.equal('originators' in payload, false);
  });
});

describe('buildLoanGuarantorPayload', () => {
  it('sends a national ID only for an external guarantor', () => {
    const external = buildLoanGuarantorPayload({
      guarantorTypeId: 3,
      firstname: 'Amina',
      lastname: 'Okello',
      nationalIdNumber: 'CM1234567890123'
    });
    assert.equal(external.nationalIdNumber, 'CM1234567890123');
    assert.equal('entityId' in external, false);

    const customer = buildLoanGuarantorPayload({
      guarantorTypeId: 1,
      entityId: 15,
      nationalIdNumber: 'CM1234567890123'
    });
    assert.equal(customer.entityId, 15);
    assert.equal('nationalIdNumber' in customer, false);
  });

  it('sends the stored national ID back on an external update', () => {
    const payload = buildLoanGuarantorUpdatePayload({
      firstname: 'Amina',
      lastname: 'Okello',
      nationalIdNumber: 'CM1234567890123',
      clientRelationshipTypeId: 3
    });
    assert.equal(payload.nationalIdNumber, 'CM1234567890123');
    assert.equal(payload.firstname, 'Amina');
    assert.equal('guarantorTypeId' in payload, false);
    assert.equal('savingsId' in payload, false);
  });
});
