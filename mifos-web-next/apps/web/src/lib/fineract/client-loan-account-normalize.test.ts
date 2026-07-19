/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest';
import {
  normalizeClientLoanAccountTemplate,
  normalizeLoanAccountChargeOptions
} from './client-loan-account-normalize';

describe('normalizeLoanAccountChargeOptions', () => {
  it('reads product default charges that only expose chargeId', () => {
    const charges = normalizeLoanAccountChargeOptions([
      {
        chargeId: 12,
        name: 'Processing fee',
        amount: 25000,
        currency: { code: 'UGX' },
        chargeCalculationType: { id: 1, value: 'Flat' },
        chargeTimeType: { id: 1, value: 'Disbursement' }
      }
    ]);

    expect(charges).toEqual([
      expect.objectContaining({
        id: 12,
        chargeId: 12,
        name: 'Processing fee',
        amount: 25000
      })
    ]);
  });

  it('flattens nested charge definitions from product mappings', () => {
    const charges = normalizeLoanAccountChargeOptions([
      {
        id: 99,
        charge: {
          id: 7,
          name: 'Insurance fee',
          amount: 5000,
          currencyCode: 'UGX',
          chargeCalculationType: { id: 1, value: 'Flat' },
          chargeTimeType: { id: 2, value: 'Specified due date' }
        }
      }
    ]);

    expect(charges).toEqual([
      expect.objectContaining({
        id: 7,
        chargeId: 7,
        name: 'Insurance fee',
        amount: 5000,
        currency: { code: 'UGX' }
      })
    ]);
  });

  it('unwraps loanData when normalizing the loan application template', () => {
    const template = normalizeClientLoanAccountTemplate({
      clientId: 1,
      loanData: {
        product: { id: 3, name: 'Term loan' },
        currency: { code: 'UGX' },
        charges: [
          {
            chargeId: 4,
            name: 'Commitment fee',
            amount: 1000,
            currency: { code: 'UGX' }
          }
        ],
        chargeOptions: [{ id: 5, name: 'Optional fee', currency: { code: 'UGX' }, amount: 500 }]
      }
    });

    expect(template.product?.id).toBe(3);
    expect(template.charges).toHaveLength(1);
    expect(template.chargeOptions).toHaveLength(1);
  });

  it('maps Fineract termPeriodFrequencyType onto loanTermFrequencyType', () => {
    const template = normalizeClientLoanAccountTemplate({
      clientId: 1,
      product: { id: 2, name: 'Short term loan' },
      termFrequency: 6,
      termPeriodFrequencyType: { id: 2, value: 'Months' },
      repaymentEvery: 1,
      repaymentFrequencyType: { id: 2, value: 'Months' },
      numberOfRepayments: 6,
      termFrequencyTypeOptions: [
        { id: 0, value: 'Days' },
        { id: 2, value: 'Months' }
      ]
    });

    expect(template.loanTermFrequency).toBe(6);
    expect(template.loanTermFrequencyType?.id).toBe(2);
    expect(template.loanTermFrequencyType?.value).toBe('Months');
  });
});
