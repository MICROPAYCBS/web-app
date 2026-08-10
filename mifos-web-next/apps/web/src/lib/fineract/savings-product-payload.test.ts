/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { UpsertSavingsProductInput } from '@mifos/validation';
import { buildSavingsProductPayload } from './savings-product-payload';

function minimalDraft(
  overrides: Partial<UpsertSavingsProductInput> = {}
): UpsertSavingsProductInput {
  return {
    details: { name: 'Test Savings', shortName: 'TSV', ...overrides.details },
    currency: {
      currencyCode: 'USD',
      digitsAfterDecimal: 2,
      inMultiplesOf: 1,
      ...overrides.currency
    },
    terms: {
      nominalAnnualInterestRate: 5,
      interestCompoundingPeriodType: 1,
      interestPostingPeriodType: 4,
      interestCalculationType: 1,
      interestCalculationDaysInYearType: 365,
      ...overrides.terms
    },
    settings: {
      enableLockinPeriod: false,
      allowOverdraft: false,
      withHoldTax: false,
      isDormancyTrackingActive: false,
      ...overrides.settings
    },
    charges: { chargeIds: [], chargeAmounts: {}, ...overrides.charges },
    accounting: { accountingRule: 1, ...overrides.accounting }
  };
}

describe('buildSavingsProductPayload', () => {
  it('omits lock-in fields when disabled', () => {
    const payload = buildSavingsProductPayload(minimalDraft());

    assert.equal('lockinPeriodFrequency' in payload, false);
    assert.equal('lockinPeriodFrequencyType' in payload, false);
  });

  it('omits GL accounts when accounting is none', () => {
    const payload = buildSavingsProductPayload(minimalDraft());

    assert.equal('savingsReferenceAccountId' in payload, false);
    assert.equal('incomeFromInterestId' in payload, false);
  });

  it('includes charges as id objects', () => {
    const payload = buildSavingsProductPayload(
      minimalDraft({ charges: { chargeIds: [3, 7] } })
    );

    assert.deepEqual(payload.charges, [{ id: 3 }, { id: 7 }]);
  });

  it('includes optional product charge amount overrides', () => {
    const payload = buildSavingsProductPayload(
      minimalDraft({ charges: { chargeIds: [3, 7], chargeAmounts: { '7': 2.5 } } })
    );

    assert.deepEqual(payload.charges, [{ id: 3 }, { id: 7, amount: 2.5 }]);
  });

  it('includes dateFormat and availability dates when set', () => {
    const payload = buildSavingsProductPayload(
      minimalDraft({
        details: {
          name: 'Test Savings',
          shortName: 'TSV',
          startDate: '01 January 2024',
          closeDate: '31 December 2030'
        }
      })
    );

    assert.equal(payload.dateFormat, 'dd MMMM yyyy');
    assert.equal(payload.locale, 'en');
    assert.equal(payload.startDate, '01 January 2024');
    assert.equal(payload.closeDate, '31 December 2030');
  });

  it('omits empty availability dates', () => {
    const payload = buildSavingsProductPayload(minimalDraft());

    assert.equal('startDate' in payload, false);
    assert.equal('closeDate' in payload, false);
    assert.equal(payload.dateFormat, 'dd MMMM yyyy');
  });
});
