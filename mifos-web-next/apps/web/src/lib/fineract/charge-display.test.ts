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
  formatChargeAmountDisplay,
  formatChargeTierRange,
  formatProductChargeOptionLabel,
  isFlatChargeCalculation,
  isPercentageChargeCalculation,
  productChargePreviewLabelById
} from './charge-display';

describe('charge amount display', () => {
  it('formats flat charges with ISO currency code', () => {
    assert.equal(
      formatChargeAmountDisplay({
        amount: 1234.5,
        currency: { code: 'ugx' },
        chargeCalculationType: { id: 1 }
      }),
      'UGX\u00a01,234.50'
    );
  });

  it('formats percentage charges without currency', () => {
    assert.equal(
      formatChargeAmountDisplay({
        amount: 2.5,
        currency: { code: 'UGX' },
        chargeCalculationType: { id: 2 }
      }),
      '2.5%'
    );
  });

  it('combines name and amount for product charge labels', () => {
    assert.equal(
      formatProductChargeOptionLabel({
        name: 'Processing fee',
        amount: 500,
        currency: { code: 'USD' },
        chargeCalculationType: { id: 1 }
      }),
      'Processing fee · USD\u00a0500.00'
    );
  });

  it('identifies flat calculation type', () => {
    assert.equal(isFlatChargeCalculation(1), true);
    assert.equal(isFlatChargeCalculation(2), false);
  });

  it('identifies percentage calculation types', () => {
    assert.equal(isPercentageChargeCalculation(1), false);
    assert.equal(isPercentageChargeCalculation(2), true);
    assert.equal(isPercentageChargeCalculation(5), true);
  });

  it('labels an open-ended tier as and above instead of zero or infinity', () => {
    assert.equal(formatChargeTierRange(0, null, 'UGX'), 'UGX\u00a00.00 and above');
    assert.equal(formatChargeTierRange(0, undefined, 'USD'), 'USD\u00a00.00 and above');
  });

  it('formats a closed tier range with ISO currency codes', () => {
    assert.equal(
      formatChargeTierRange(0, 100_000, 'UGX'),
      'UGX\u00a00.00 – UGX\u00a0100,000.00'
    );
  });

  it('shows product amount override on preview labels', () => {
    const options = [
      {
        id: 7,
        name: 'Withdrawal fee',
        amount: 1000,
        currency: { code: 'UGX' },
        chargeCalculationType: { id: 1 }
      }
    ];
    assert.equal(
      productChargePreviewLabelById(options, 7, undefined, 'UGX'),
      'Withdrawal fee · UGX\u00a01,000.00'
    );
    assert.equal(
      productChargePreviewLabelById(options, 7, { '7': 1500 }, 'UGX'),
      'Withdrawal fee · UGX\u00a01,500.00 (overridden)'
    );
  });
});
