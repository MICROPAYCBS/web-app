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
  normalizeSavingsProductPaymentChannels,
  preferSavingsProductPaymentChannels,
  withProductPaymentChannelIds
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
      { isPremium: 1, paymentTypeId: 4, isActive: 0, charges: [] },
      { isPremium: true }
    ]);

    assert.deepEqual(channels, [
      {
        paymentTypeId: 1,
        paymentTypeName: undefined,
        isPremium: false,
        isActive: true,
        paymentTypeActive: true,
        charges: []
      },
      {
        paymentTypeId: 3,
        paymentTypeName: 'Mobile money',
        isPremium: true,
        isActive: false,
        paymentTypeActive: true,
        charges: [{ id: 12, name: 'Channel fee', amount: 50, useChargeTiers: false }]
      },
      {
        paymentTypeId: 4,
        paymentTypeName: undefined,
        isPremium: true,
        isActive: false,
        paymentTypeActive: true,
        charges: []
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

  it('reads a payment type id sent as a number', () => {
    const channels = normalizeSavingsProductPaymentChannels([
      { paymentType: 3, isPremium: true, isActive: true, charges: [] }
    ]);

    assert.equal(channels[0]?.paymentTypeId, 3);
    assert.equal(channels[0]?.isPremium, true);
  });

  it('uses the templated catalog when the plain product list is empty', () => {
    const templated = normalizeSavingsProductPaymentChannels([
      { paymentTypeId: 3, paymentTypeName: 'Mobile money', isPremium: true, isActive: true }
    ]);

    assert.equal(preferSavingsProductPaymentChannels([], templated), templated);
    assert.equal(preferSavingsProductPaymentChannels(templated, []), templated);
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

  it('keeps a disabled product channel and an account block', () => {
    const channels = normalizeSavingsAccountPaymentChannels([
      {
        paymentTypeId: 3,
        isPremium: true,
        isActive: false,
        subscriptionStatus: 'SUBSCRIBED',
        blocked: true,
        blockedOnDate: [2026, 8, 20],
        allowedForDeposit: false,
        charges: []
      },
      {
        paymentTypeId: 4,
        isPremium: false,
        isActive: true,
        blocked: true,
        charges: []
      }
    ]);

    assert.equal(channels[0]?.isActive, false);
    assert.equal(channels[0]?.blocked, true);
    assert.equal(channels[0]?.subscribed, true);
    assert.deepEqual(channels[0]?.blockedOnDate, [2026, 8, 20]);
    assert.equal(channels[0]?.allowedForDeposit, false);
    assert.equal(channels[1]?.blocked, true);
    assert.equal(channels[1]?.allowedForDeposit, false);
    assert.equal(channels[1]?.blockedOnDate, undefined);
  });

  it('treats an inactive payment type as a system-wide stop', () => {
    const channels = normalizeSavingsAccountPaymentChannels([
      {
        paymentTypeId: 3,
        paymentType: { id: 3, name: 'Mobile money', isActive: false },
        isPremium: true,
        isActive: true,
        subscriptionStatus: 'SUBSCRIBED',
        blocked: false,
        charges: []
      }
    ]);

    assert.equal(channels[0]?.paymentTypeActive, false);
    assert.equal(channels[0]?.isActive, true);
    assert.equal(channels[0]?.blocked, false);
    assert.equal(channels[0]?.allowedForDeposit, false);
  });

  it('treats an omitted catalog as no channels', () => {
    assert.deepEqual(normalizeSavingsAccountPaymentChannels(undefined), []);
    assert.deepEqual(normalizeSavingsAccountPaymentChannels({}), []);
  });

  it('uses the product channel id and ignores the subscription id', () => {
    const channels = normalizeSavingsAccountPaymentChannels([
      {
        id: 99,
        productPaymentChannelId: 7,
        paymentTypeId: 3,
        isPremium: false,
        isActive: true,
        isAccountTransferChannel: true,
        maxDebitPerTxn: 0,
        maxDebitPerDay: null,
        maxCreditPerTxn: 1000,
        charges: []
      }
    ]);

    assert.equal(channels[0]?.id, 7);
    assert.equal(channels[0]?.isAccountTransferChannel, true);
    assert.equal(channels[0]?.maxDebitPerTxn, 0);
    assert.equal(channels[0]?.maxDebitPerDay, null);
    assert.equal(channels[0]?.maxCreditPerTxn, 1000);
    assert.equal(channels[0]?.maxCreditPerDay, undefined);
  });

  it('does not treat a subscription id as the catalog id', () => {
    const channels = normalizeSavingsAccountPaymentChannels([
      {
        id: 99,
        paymentTypeId: 3,
        isPremium: false,
        isActive: false,
        charges: []
      }
    ]);

    assert.equal(channels[0]?.id, undefined);
    assert.equal(
      withProductPaymentChannelIds(channels, [
        {
          id: 7,
          paymentTypeId: 3,
          isPremium: false,
          isActive: false,
          charges: []
        }
      ])[0]?.id,
      7
    );
  });
});
