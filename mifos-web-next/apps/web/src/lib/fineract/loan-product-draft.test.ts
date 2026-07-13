/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LoanProductTemplate } from '@mifos/api-client';
import { loanProductDraftFromTemplate } from './loan-product-draft';

function minimalTemplate(overrides: Partial<LoanProductTemplate> = {}): LoanProductTemplate {
  return {
    name: 'Progressive loan',
    shortName: 'PL',
    currencyCode: 'UGX',
    principal: 1_000_000,
    numberOfRepayments: 12,
    repaymentEvery: 1,
    interestRatePerPeriod: 10,
    transactionProcessingStrategyCode: 'mifos-standard-strategy',
    ...overrides
  };
}

describe('loanProductDraftFromTemplate down payment', () => {
  it('maps down payment percentage and auto repayment from the edit template', () => {
    const draft = loanProductDraftFromTemplate(
      minimalTemplate({
        enableDownPayment: true,
        disbursedAmountPercentageForDownPayment: 25,
        enableAutoRepaymentForDownPayment: true
      }),
      'loan'
    );

    assert.equal(draft.settings.enableDownPayment, true);
    assert.equal(draft.settings.disbursedAmountPercentageForDownPayment, 25);
    assert.equal(draft.settings.enableAutoRepaymentForDownPayment, true);
  });

  it('parses string percentages from the API payload', () => {
    const draft = loanProductDraftFromTemplate(
      minimalTemplate({
        enableDownPayment: true,
        disbursedAmountPercentageForDownPayment: '33.333333' as unknown as number
      }),
      'loan'
    );

    assert.equal(draft.settings.disbursedAmountPercentageForDownPayment, 33.333333);
  });
});
