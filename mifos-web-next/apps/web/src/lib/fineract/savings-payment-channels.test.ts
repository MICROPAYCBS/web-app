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
  normalizeSavingsAccountPaymentChannels,
  normalizeSavingsProductPaymentChannels
} from './savings-payment-channels';

describe('normalizeSavingsProductPaymentChannels', () => {
  it('reads the product catalog and ignores incomplete rows', () => {
    const channels = normalizeSavingsProductPaymentChannels([
      { paymentTypeId: 1, isPremium: false, isActive: true, charges: [] },
      {
        paymentType: { id: 3, name: 'Mobile money' },
        isPremium: true,
        isActive: false,
        charges: [{ id: 12, name: 'Channel fee', amount: 50, useChargeTiers: false }]
      },
      { isPremium: true }
    ]);

    assert.deepEqual(channels, [
      {
        paymentTypeId: 1,
        paymentTypeName: undefined,
        isPremium: false,
        isActive: true,
        charges: []
      },
      {
        paymentTypeId: 3,
        paymentTypeName: 'Mobile money',
        isPremium: true,
        isActive: false,
        charges: [{ id: 12, name: 'Channel fee', amount: 50, useChargeTiers: false }]
      }
    ]);
  });

  it('keys charges by the charge definition and ignores link-row ids', () => {
    const channels = normalizeSavingsProductPaymentChannels({
      paymentChannels: [
        {
          id: 1,
          paymentTypeId: 3,
          paymentType: { id: 3, name: 'Mobile Money' },
          isPremium: true,
          isActive: true,
          name: null,
          description: null,
          charges: [
            {
              id: 10,
              chargeId: 12,
              amount: 75,
              charge: {
                id: 12,
                name: 'Premium channel fee',
                amount: 50,
                useChargeTiers: false
              }
            },
            {
              id: 11,
              chargeId: 12,
              amount: 10,
              charge: { id: 12, name: 'Premium channel fee', amount: 50, useChargeTiers: false }
            }
          ]
        },
        {
          id: 2,
          paymentTypeId: 3,
          paymentType: { id: 3, name: 'Mobile Money' },
          isPremium: false,
          isActive: true,
          charges: []
        }
      ]
    });

    assert.equal(channels.length, 1);
    assert.equal(channels[0]?.paymentTypeName, 'Mobile Money');
    assert.deepEqual(channels[0]?.charges, [
      {
        id: 12,
        name: 'Premium channel fee',
        amount: 75,
        definitionAmount: 50,
        useChargeTiers: false
      }
    ]);
  });
});

describe('normalizeSavingsAccountPaymentChannels', () => {
  it('maps subscription status and deposit allowance', () => {
    const channels = normalizeSavingsAccountPaymentChannels({
      paymentChannels: [
        {
          paymentTypeId: 1,
          paymentTypeName: 'Cash',
          isPremium: false,
          isActive: true,
          subscriptionStatus: false,
          allowedForDeposit: true,
          charges: []
        },
        {
          paymentTypeId: 3,
          paymentTypeName: 'Mobile money',
          isPremium: true,
          isActive: true,
          subscriptionStatus: { code: 'paymentChannel.subscribed', value: 'Subscribed' },
          charges: [{ id: 12, amount: 50 }]
        }
      ]
    });

    assert.equal(channels[0]?.subscribed, false);
    assert.equal(channels[0]?.allowedForDeposit, true);
    assert.equal(channels[1]?.subscribed, true);
    assert.equal(channels[1]?.allowedForDeposit, true);
    assert.equal(channels[1]?.charges[0]?.id, 12);
  });

  it('reads active and string subscription statuses', () => {
    const channels = normalizeSavingsAccountPaymentChannels([
      {
        paymentTypeId: 3,
        isPremium: true,
        subscriptionStatus: { code: 'subscriptionStatus.active', value: 'Active' }
      },
      {
        paymentTypeId: 4,
        isPremium: true,
        subscriptionStatus: 'SUBSCRIBED'
      },
      {
        paymentTypeId: 5,
        isPremium: true,
        subscription: { active: true }
      }
    ]);

    assert.equal(channels[0]?.subscribed, true);
    assert.equal(channels[1]?.subscribed, true);
    assert.equal(channels[2]?.subscribed, true);
  });

  it('treats an omitted catalog as no channels', () => {
    assert.deepEqual(normalizeSavingsAccountPaymentChannels(undefined), []);
    assert.deepEqual(normalizeSavingsAccountPaymentChannels({}), []);
  });
});
