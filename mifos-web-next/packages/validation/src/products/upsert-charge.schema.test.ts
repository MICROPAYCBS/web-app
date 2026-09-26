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

  it('locks penalty to the charge time', () => {
    const disbursementPenalty = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      penalty: true
    });
    assert.equal(disbursementPenalty.success, false);

    const overdue = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeTimeType: 9,
      chargeCalculationType: 2,
      penalty: false
    });
    assert.equal(overdue.success, false);

    const overdueOk = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeTimeType: 9,
      chargeCalculationType: 2,
      penalty: true
    });
    assert.equal(overdueOk.success, true);
  });

  it('requires payment mode only for loans', () => {
    const workingCapital = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeAppliesTo: 5,
      chargeTimeType: 2,
      chargeCalculationType: 1,
      chargePaymentMode: undefined
    });
    assert.equal(workingCapital.success, true);
  });

  it('requires a month-day and a 1–12 interval for savings monthly fees', () => {
    const missing = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeAppliesTo: 2,
      chargeTimeType: 7,
      chargeCalculationType: 1,
      chargePaymentMode: undefined
    });
    assert.equal(missing.success, false);

    const ok = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeAppliesTo: 2,
      chargeTimeType: 7,
      chargeCalculationType: 1,
      chargePaymentMode: undefined,
      feeOnMonthDay: '01 Jan',
      feeInterval: 1
    });
    assert.equal(ok.success, true);
  });

  it('accepts February 29 and rejects days the month does not have', () => {
    const february = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeAppliesTo: 2,
      chargeTimeType: 6,
      chargeCalculationType: 1,
      chargePaymentMode: undefined,
      feeOnMonthDay: '29 Feb'
    });
    assert.equal(february.success, true);

    const june = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeAppliesTo: 2,
      chargeTimeType: 7,
      chargeCalculationType: 1,
      chargePaymentMode: undefined,
      feeOnMonthDay: '31 Jun',
      feeInterval: 1
    });
    assert.equal(june.success, false);
  });

  it('rejects percent of amount on savings times other than withdrawal and no-activity', () => {
    const parsed = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeAppliesTo: 2,
      chargeTimeType: 3,
      chargeCalculationType: 2,
      chargePaymentMode: undefined
    });
    assert.equal(parsed.success, false);
  });

  it('rejects percent of disbursement outside tranche disbursement', () => {
    const parsed = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeCalculationType: 5
    });
    assert.equal(parsed.success, false);
  });

  it('requires the free-withdrawal trio and a payment type when those toggles are on', () => {
    const missing = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeAppliesTo: 2,
      chargeTimeType: 5,
      chargeCalculationType: 1,
      chargePaymentMode: undefined,
      enableFreeWithdrawalCharge: true,
      enablePaymentType: true
    });
    assert.equal(missing.success, false);

    const ok = upsertChargeSchema.safeParse({
      ...baseLoanCharge,
      chargeAppliesTo: 2,
      chargeTimeType: 5,
      chargeCalculationType: 1,
      chargePaymentMode: undefined,
      enableFreeWithdrawalCharge: true,
      freeWithdrawalFrequency: 2,
      restartCountFrequency: 1,
      countFrequencyType: 2,
      enablePaymentType: true,
      paymentTypeId: 3
    });
    assert.equal(ok.success, true);
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
