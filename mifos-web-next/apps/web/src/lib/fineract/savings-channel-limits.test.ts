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
  channelLimitCeilingErrors,
  channelLimitCustomerSaveErrors,
  channelLimitOrderErrors
} from '@mifos/validation';
import {
  channelLimitIsEnforced,
  formatChannelCap,
  formatChannelRemaining,
  normalizeSavingsAccountChannelLimits
} from './savings-channel-limits';

describe('normalizeSavingsAccountChannelLimits', () => {
  it('keeps null remaining as unlimited and zero as blocked', () => {
    const [limit] = normalizeSavingsAccountChannelLimits([
      {
        id: null,
        productPaymentChannelId: 7,
        paymentTypeId: 3,
        direction: 'DEBIT',
        ceilingPerTxn: null,
        maxPerTxn: null,
        effectivePerTxn: 0,
        remainingToday: null,
        usedToday: 0
      }
    ]);

    assert.equal(limit?.id, null);
    assert.equal(limit?.ceilingPerTxn, null);
    assert.equal(limit?.effectivePerTxn, 0);
    assert.equal(limit?.remainingToday, null);
    assert.equal(limit?.usedToday, 0);
    assert.equal(formatChannelCap(limit?.effectivePerTxn ?? null, 'amount', 'UGX'), 'Blocked');
    assert.equal(formatChannelRemaining(limit?.remainingToday ?? null, 'amount', 'UGX'), 'No limit');
    assert.equal(formatChannelCap(null, 'amount', 'UGX'), 'No limit');
    assert.equal(channelLimitIsEnforced(limit!), true);
  });
});

describe('channel limit ordering', () => {
  it('skips a comparison when either side is blank and rejects a value above the ceiling', () => {
    assert.deepEqual(
      channelLimitOrderErrors({
        perTxn: 100,
        perDay: null,
        perMonth: 50,
        perTxnField: 'maxPerTxn',
        perDayField: 'maxPerDay',
        perMonthField: 'maxPerMonth',
        countPerDayField: 'maxCountPerDay',
        countPerMonthField: 'maxCountPerMonth'
      }),
      { maxPerTxn: 'This amount cannot be above the monthly amount.' }
    );
    assert.deepEqual(
      channelLimitCeilingErrors({
        values: { maxPerTxn: 500, maxPerDay: null },
        ceilings: { maxPerTxn: 400, maxPerDay: null }
      }),
      { maxPerTxn: 'This value is above the bank ceiling.' }
    );
    assert.deepEqual(
      channelLimitCeilingErrors({
        values: { maxPerTxn: 500 },
        ceilings: { maxPerTxn: null }
      }),
      {}
    );
  });

  it('rejects a customer day that is under its ceiling but above the monthly ceiling', () => {
    assert.deepEqual(
      channelLimitCustomerSaveErrors({
        values: { maxPerDay: 500, maxPerMonth: null },
        ceilings: { maxPerDay: 1000, maxPerMonth: 200 }
      }),
      { maxPerDay: 'This amount cannot be above the monthly amount.' }
    );
  });

  it('keeps a customer value that is within the ceiling when the effective cap is ordered', () => {
    assert.deepEqual(
      channelLimitCustomerSaveErrors({
        values: { maxPerDay: 150, maxPerMonth: null },
        ceilings: { maxPerDay: 1000, maxPerMonth: 200 }
      }),
      {}
    );
  });
});
