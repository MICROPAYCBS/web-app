/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest';
import {
  formatChargeAmountDisplay,
  formatProductChargeOptionLabel,
  isFlatChargeCalculation,
  isPercentageChargeCalculation
} from './charge-display';

describe('charge amount display', () => {
  it('formats flat charges with ISO currency code', () => {
    expect(
      formatChargeAmountDisplay({
        amount: 1234.5,
        currency: { code: 'ugx' },
        chargeCalculationType: { id: 1 }
      })
    ).toBe('UGX\u00a01,234.50');
  });

  it('formats percentage charges without currency', () => {
    expect(
      formatChargeAmountDisplay({
        amount: 2.5,
        currency: { code: 'UGX' },
        chargeCalculationType: { id: 2 }
      })
    ).toBe('2.5%');
  });

  it('combines name and amount for product charge labels', () => {
    expect(
      formatProductChargeOptionLabel({
        name: 'Processing fee',
        amount: 500,
        currency: { code: 'USD' },
        chargeCalculationType: { id: 1 }
      })
    ).toBe('Processing fee · USD\u00a0500.00');
  });

  it('identifies flat calculation type', () => {
    expect(isFlatChargeCalculation(1)).toBe(true);
    expect(isFlatChargeCalculation(2)).toBe(false);
  });

  it('identifies percentage calculation types', () => {
    expect(isPercentageChargeCalculation(1)).toBe(false);
    expect(isPercentageChargeCalculation(2)).toBe(true);
    expect(isPercentageChargeCalculation(5)).toBe(true);
  });
});
