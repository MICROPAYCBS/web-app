/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { UpsertDepositProductInput } from '@mifos/validation';
import { buildDepositProductPayload } from './deposit-product-payload';

const baseDraft: UpsertDepositProductInput = {
  variant: 'recurring',
  details: { name: 'Monthly RD', shortName: 'MRD', description: 'Test product' },
  currency: { currencyCode: 'USD', digitsAfterDecimal: 2 },
  terms: {
    depositAmount: 100,
    interestCompoundingPeriodType: 1,
    interestPostingPeriodType: 4,
    interestCalculationType: 1,
    interestCalculationDaysInYearType: 365
  },
  settings: {
    minDepositTerm: 12,
    minDepositTermTypeId: 2,
    isMandatoryDeposit: true,
    allowWithdrawal: false
  },
  interestRateChart: {
    charts: [
      {
        fromDate: '2026-01-01',
        isPrimaryGroupingByAmount: false,
        chartSlabs: [
          {
            periodType: 0,
            fromPeriod: 1,
            toPeriod: 12,
            annualInterestRate: 5.5,
            description: '1 year',
            incentives: []
          }
        ]
      }
    ]
  },
  charges: { chargeIds: [] },
  accounting: {
    accountingRule: 1,
    paymentChannelToFundSourceMappings: [],
    feeToIncomeAccountMappings: [],
    penaltyToIncomeAccountMappings: []
  }
};

describe('buildDepositProductPayload', () => {
  it('omits inMultiplesOf when unset', () => {
    const payload = buildDepositProductPayload(baseDraft);
    assert.equal(payload.inMultiplesOf, undefined);
    assert.equal(payload.locale, 'en');
    assert.ok(Array.isArray(payload.charts));
    assert.equal((payload.charts as unknown[]).length, 1);
    assert.equal(payload.charges, undefined);
  });

  it('strips recurring-only fields for fixed deposit', () => {
    const payload = buildDepositProductPayload({ ...baseDraft, variant: 'fixed' });
    assert.equal(payload.isMandatoryDeposit, undefined);
    assert.equal(payload.allowWithdrawal, undefined);
  });

  it('includes charges when selected', () => {
    const payload = buildDepositProductPayload({
      ...baseDraft,
      charges: { chargeIds: [3, 7] }
    });
    assert.deepEqual(payload.charges, [{ id: 3 }, { id: 7 }]);
  });

  it('formats chart dates for Fineract', () => {
    const payload = buildDepositProductPayload({
      ...baseDraft,
      interestRateChart: {
        charts: [
          {
            fromDate: '2026-06-06',
            isPrimaryGroupingByAmount: false,
            chartSlabs: baseDraft.interestRateChart.charts[0].chartSlabs
          }
        ]
      }
    });
    const charts = payload.charts as { fromDate: string }[];
    assert.equal(charts[0].fromDate, '06 June 2026');
  });
});
