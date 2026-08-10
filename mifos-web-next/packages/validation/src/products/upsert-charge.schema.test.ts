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
  isChargeTiersAllowed,
  upsertChargeSchema
} from './upsert-charge.schema';

const baseLoanCharge = {
  chargeAppliesTo: 1,
  name: 'Processing fee',
  currencyCode: 'UGX',
  chargeTimeType: 1,
  chargeCalculationType: 1,
  amount: 50,
  active: true,
  penalty: false,
  chargePaymentMode: 0,
  useChargeTiers: false,
  chargeTiers: []
};

describe('isChargeTiersAllowed', () => {
  it('allows loan disbursement and savings withdrawal', () => {
    assert.equal(isChargeTiersAllowed(1, 1), true);
    assert.equal(isChargeTiersAllowed(1, 12), true);
    assert.equal(isChargeTiersAllowed(2, 5), true);
    assert.equal(isChargeTiersAllowed(2, 16), true);
  });

  it('rejects calendar fees and non loan/savings applies-to', () => {
    assert.equal(isChargeTiersAllowed(1, 6), false);
    assert.equal(isChargeTiersAllowed(2, 3), false);
    assert.equal(isChargeTiersAllowed(4, 1), false);
  });
});

describe('upsertChargeSchema charge tiers', () => {
  it('accepts legacy single-amount charges', () => {
    const parsed = upsertChargeSchema.safeParse(baseLoanCharge);
    assert.equal(parsed.success, true);
  });

  it('rejects zero amount when tiers are off', () => {
    const parsed = upsertChargeSchema.safeParse({ ...baseLoanCharge, amount: 0 });
    assert.equal(parsed.success, false);
  });

  it('accepts contiguous lookup tiers', () => {
    const parsed = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      amount: 0,
      useChargeTiers: true,
      chargeTiers: [
        { amountRangeFrom: 0, amountRangeTo: 100000, amount: 50 },
        { amountRangeFrom: 100000, amountRangeTo: null, amount: 100 }
      ]
    });
    assert.equal(parsed.success, true);
  });

  it('rejects non-contiguous tiers, closed last tier, and caps with tiers', () => {
    const gap = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      amount: 0,
      useChargeTiers: true,
      chargeTiers: [
        { amountRangeFrom: 0, amountRangeTo: 100000, amount: 50 },
        { amountRangeFrom: 150000, amountRangeTo: null, amount: 100 }
      ]
    });
    assert.equal(gap.success, false);

    const closedLast = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      amount: 0,
      useChargeTiers: true,
      chargeTiers: [{ amountRangeFrom: 0, amountRangeTo: 100000, amount: 50 }]
    });
    assert.equal(closedLast.success, false);

    const withCap = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      amount: 0,
      useChargeTiers: true,
      minCap: 10,
      chargeTiers: [{ amountRangeFrom: 0, amountRangeTo: null, amount: 50 }]
    });
    assert.equal(withCap.success, false);
  });

  it('rejects tiers for annual fee time type', () => {
    const parsed = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeTimeType: 6,
      feeOnMonthDay: '06 Jun',
      amount: 0,
      useChargeTiers: true,
      chargeTiers: [{ amountRangeFrom: 0, amountRangeTo: null, amount: 50 }]
    });
    assert.equal(parsed.success, false);
  });
});
