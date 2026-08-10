/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { upsertChargeSchema } from '@mifos/validation';
import { buildChargePayload } from './charge-payload';

describe('buildChargePayload charge tiers', () => {
  it('sends a non-empty chargeTiers array with open-ended last band omitted', () => {
    const payload = buildChargePayload({
      chargeAppliesTo: 2,
      name: 'Withdrawal Fees',
      currencyCode: 'UGX',
      chargeTimeType: 5,
      chargeCalculationType: 1,
      amount: 50,
      active: true,
      penalty: false,
      minCap: 1,
      maxCap: 9,
      useChargeTiers: true,
      chargeTiers: [
        { amountRangeFrom: 0, amountRangeTo: 50000, amount: 1000 },
        { amountRangeFrom: 50000, amountRangeTo: 200000, amount: 1500 },
        { amountRangeFrom: 200000, amountRangeTo: null, amount: 3000 }
      ]
    });

    assert.equal(payload.useChargeTiers, true);
    assert.equal(payload.amount, '0');
    assert.equal(payload.minCap, undefined);
    assert.equal(payload.maxCap, undefined);
    assert.deepEqual(payload.chargeTiers, [
      { amountRangeFrom: '0', amountRangeTo: '50000', amount: '1000' },
      { amountRangeFrom: '50000', amountRangeTo: '200000', amount: '1500' },
      { amountRangeFrom: '200000', amount: '3000' }
    ]);

    const json = JSON.stringify(payload);
    assert.match(json, /"chargeTiers":\[/);
    assert.doesNotMatch(json, /"amountRangeTo":null/);
  });

  it('keeps tiers after JSON-string server-action round-trip', () => {
    const actionPayload = JSON.stringify({
      chargeAppliesTo: 2,
      name: 'Withdrawal Fees',
      currencyCode: 'UGX',
      chargeTimeType: 5,
      chargeCalculationType: 1,
      amount: 0,
      active: true,
      penalty: false,
      useChargeTiers: true,
      chargeTiers: [
        { amountRangeFrom: 0, amountRangeTo: 50000, amount: 1000 },
        { amountRangeFrom: 50000, amountRangeTo: 200000, amount: 1500 },
        { amountRangeFrom: 200000, amountRangeTo: null, amount: 3000 }
      ]
    });
    const parsed = upsertChargeSchema.parse(JSON.parse(actionPayload));
    const payload = buildChargePayload(parsed);
    assert.equal((payload.chargeTiers as unknown[]).length, 3);
  });

  it('omits chargeTiers when useChargeTiers is false', () => {
    const payload = buildChargePayload({
      chargeAppliesTo: 1,
      name: 'Flat fee',
      currencyCode: 'UGX',
      chargeTimeType: 1,
      chargeCalculationType: 1,
      amount: 50,
      active: true,
      penalty: false,
      chargePaymentMode: 0,
      useChargeTiers: false,
      chargeTiers: []
    });

    assert.equal(payload.useChargeTiers, false);
    assert.equal(payload.amount, '50');
    assert.equal(payload.chargeTiers, undefined);
  });
});
