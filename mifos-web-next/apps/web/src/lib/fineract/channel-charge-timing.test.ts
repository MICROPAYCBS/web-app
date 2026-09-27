/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractSavingsAccountCharge, SavingsAccountPaymentChannel } from '@mifos/api-client';
import {
  channelChargeTimingLabel,
  savingsChargeActions,
  withdrawalFeesForPaymentType
} from './channel-charge-timing';

function charge(
  patch: Partial<FineractSavingsAccountCharge> & Pick<FineractSavingsAccountCharge, 'id' | 'name'>
): FineractSavingsAccountCharge {
  return patch;
}

const premiumWithdrawal: SavingsAccountPaymentChannel = {
  paymentTypeId: 3,
  paymentTypeName: 'Mobile money',
  isPremium: true,
  isActive: true,
  subscribed: true,
  allowedForDeposit: true,
  charges: [{ id: 12, name: 'Channel withdrawal', chargeTimeType: { id: 5 } }]
};

describe('channel charge timing', () => {
  it('labels withdrawal and monthly fees', () => {
    assert.equal(channelChargeTimingLabel(5), 'Charged only when this channel is used.');
    assert.equal(channelChargeTimingLabel(10), 'Charged only when this channel is used.');
    assert.equal(channelChargeTimingLabel(7), 'Charged on its schedule while subscribed.');
    assert.equal(channelChargeTimingLabel(6), 'Charged on its schedule while subscribed.');
    assert.equal(channelChargeTimingLabel(16), undefined);
  });

  it('shows a channel withdrawal fee only for that payment type', () => {
    const charges = [
      charge({
        id: 1,
        name: 'Product withdrawal',
        chargeId: 8,
        chargeTimeType: { id: 5 },
        isActive: true
      }),
      charge({
        id: 2,
        name: 'Channel withdrawal',
        chargeId: 12,
        chargeTimeType: { id: 5 },
        isActive: true
      }),
      charge({
        id: 3,
        name: 'Stopped channel withdrawal',
        chargeId: 12,
        chargeTimeType: { id: 5 },
        isActive: false
      })
    ];

    const forChannel = withdrawalFeesForPaymentType(charges, [premiumWithdrawal], 3).map(
      (row) => row.name
    );
    const forCash = withdrawalFeesForPaymentType(charges, [premiumWithdrawal], 1).map(
      (row) => row.name
    );

    assert.deepEqual(forChannel, ['Product withdrawal', 'Channel withdrawal']);
    assert.deepEqual(forCash, ['Product withdrawal']);
  });

  it('labels a due monthly fee after the channel subscription ends', () => {
    const channels: SavingsAccountPaymentChannel[] = [
      {
        ...premiumWithdrawal,
        subscribed: false,
        charges: [{ id: 20, name: 'Monthly', chargeTimeType: { id: 7 } }]
      }
    ];
    const due = savingsChargeActions(
      charge({
        id: 9,
        name: 'Monthly',
        chargeId: 20,
        chargeTimeType: { id: 7 },
        isActive: true,
        amountOutstanding: 5
      }),
      channels
    );
    assert.equal(due.label, 'Subscribed period still due');
    assert.equal(due.canPay, true);
    assert.equal(due.canWaive, true);

    const stoppedDue = savingsChargeActions(
      charge({
        id: 10,
        name: 'Withdrawal',
        chargeId: 12,
        chargeTimeType: { id: 5 },
        isActive: false,
        amountOutstanding: 5
      }),
      channels
    );
    assert.equal(stoppedDue.label, 'Stopped, amount still due');
    assert.equal(stoppedDue.canPay, true);
    assert.equal(stoppedDue.canWaive, false);

    const stopped = savingsChargeActions(
      charge({
        id: 11,
        name: 'Withdrawal',
        isActive: false,
        amountOutstanding: 0
      }),
      channels
    );
    assert.equal(stopped.label, 'Stopped');
    assert.equal(stopped.canPay, false);
    assert.equal(stopped.canWaive, false);
  });
});
