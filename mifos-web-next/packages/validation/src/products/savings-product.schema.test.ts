/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { savingsProductPaymentChannelsStepSchema } from './savings-product.schema';

describe('savingsProductPaymentChannelsStepSchema', () => {
  it('allows an empty catalog', () => {
    const result = savingsProductPaymentChannelsStepSchema.safeParse({ channels: [] });
    assert.equal(result.success, true);
  });

  it('rejects a payment type listed twice', () => {
    const result = savingsProductPaymentChannelsStepSchema.safeParse({
      channels: [
        { paymentTypeId: 1, isPremium: false, isActive: true },
        { paymentTypeId: 1, isPremium: true, isActive: true }
      ]
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.issues[0]?.message, 'Each payment type can be listed once.');
    }
  });

  it('rejects the same fee twice on one channel', () => {
    const result = savingsProductPaymentChannelsStepSchema.safeParse({
      channels: [
        { paymentTypeId: 3, isPremium: true, isActive: true, chargeIds: [12, 12] }
      ]
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.issues[0]?.message, 'Each fee can be mapped once on a channel.');
    }
  });

  it('rejects fees on a standard channel', () => {
    const result = savingsProductPaymentChannelsStepSchema.safeParse({
      channels: [
        { paymentTypeId: 3, isPremium: false, isActive: true, chargeIds: [12] }
      ]
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error.issues[0]?.message ?? '', /premium channels/);
    }
  });
});
