/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { UpsertLoanProductInput } from '@mifos/validation';
import { buildLoanProductPayload } from './loan-product-payload';

function minimalDraft(
  overrides: {
    settings?: Partial<UpsertLoanProductInput['settings']>;
    currency?: Partial<UpsertLoanProductInput['currency']>;
    accounting?: Partial<UpsertLoanProductInput['accounting']>;
  } = {}
): UpsertLoanProductInput {
  return {
    details: { name: 'Test Loan Product', shortName: 'TLP' },
    currency: {
      currencyCode: 'USD',
      digitsAfterDecimal: 2,
      inMultiplesOf: 1,
      installmentAmountInMultiplesOf: 0,
      ...overrides.currency
    },
    terms: {
      principal: 1000,
      numberOfRepayments: 12,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      interestRatePerPeriod: 5,
      interestRateFrequencyType: 2,
      isLinkedToFloatingInterestRates: false
    },
    settings: {
      amortizationType: 1,
      interestType: 0,
      interestCalculationPeriodType: 1,
      transactionProcessingStrategyCode: 'mifos-standard-strategy',
      daysInYearType: 1,
      daysInMonthType: 1,
      loanScheduleType: 1,
      useDueForRepaymentsConfigurations: false,
      allowAccrualPostingInArrears: false,
      ...overrides.settings
    },
    charges: { chargeIds: [] },
    accounting: { accountingRule: 1, ...overrides.accounting }
  };
}

describe('buildLoanProductPayload', () => {
  it('omits wizard-only repayment configuration flags', () => {
    const payload = buildLoanProductPayload(minimalDraft());

    assert.equal('useDueForRepaymentsConfigurations' in payload, false);
    assert.equal('allowAccrualPostingInArrears' in payload, false);
    assert.equal('allowAttributeConfiguration' in payload, false);
  });

  it('includes allowAttributeOverrides in the payload', () => {
    const payload = buildLoanProductPayload(
      minimalDraft({
        settings: {
          allowAttributeConfiguration: true,
          allowAttributeOverrides: {
            amortizationType: true,
            interestType: false,
            repaymentEvery: true
          }
        }
      })
    );

    assert.equal('allowAttributeConfiguration' in payload, false);
    assert.deepEqual(payload.allowAttributeOverrides, {
      amortizationType: true,
      interestType: false,
      repaymentEvery: true
    });
  });

  it('clears due-day fields when repayment configuration override is enabled', () => {
    const payload = buildLoanProductPayload(
      minimalDraft({
        settings: {
          useDueForRepaymentsConfigurations: true,
          dueDaysForRepaymentEvent: 3,
          overDueDaysForRepaymentEvent: 7
        }
      })
    );

    assert.equal('useDueForRepaymentsConfigurations' in payload, false);
    assert.equal(payload.dueDaysForRepaymentEvent, null);
    assert.equal(payload.overDueDaysForRepaymentEvent, null);
  });

  it('omits installment amount multiples when zero or unset', () => {
    const payload = buildLoanProductPayload(minimalDraft());

    assert.equal('installmentAmountInMultiplesOf' in payload, false);
  });

  it('includes installment amount multiples when greater than zero', () => {
    const payload = buildLoanProductPayload(
      minimalDraft({ currency: { installmentAmountInMultiplesOf: 5 } })
    );

    assert.equal(payload.installmentAmountInMultiplesOf, 5);
  });

  it('omits accrual activity posting for non-accrual accounting', () => {
    const payload = buildLoanProductPayload(
      minimalDraft({
        accounting: { accountingRule: 2, enableAccrualActivityPosting: true }
      })
    );

    assert.equal('enableAccrualActivityPosting' in payload, false);
  });

  it('includes accrual activity posting for accrual accounting', () => {
    const payload = buildLoanProductPayload(
      minimalDraft({
        accounting: { accountingRule: 3, enableAccrualActivityPosting: true }
      })
    );

    assert.equal(payload.enableAccrualActivityPosting, true);
  });
});
