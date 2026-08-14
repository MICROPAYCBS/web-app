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
  appendOpenEndedChargeTier,
  rechainChargeTiers,
  removeChargeTierAndRechain,
  replaceChargeTierAndRechain
} from './charge-tier-chain';

describe('appendOpenEndedChargeTier', () => {
  it('starts the first band at 0 and leaves To blank', () => {
    assert.deepEqual(appendOpenEndedChargeTier([], 99, 50), [
      { amountRangeFrom: 0, amountRangeTo: null, amount: 50 }
    ]);
  });

  it('closes the previous last at the new From', () => {
    const tiers = [{ amountRangeFrom: 0, amountRangeTo: null, amount: 50 }];
    assert.deepEqual(appendOpenEndedChargeTier(tiers, 100_000, 100), [
      { amountRangeFrom: 0, amountRangeTo: 100_000, amount: 50 },
      { amountRangeFrom: 100_000, amountRangeTo: null, amount: 100 }
    ]);
  });
});

describe('rechainChargeTiers', () => {
  it('sets next From to the edited To', () => {
    const chained = rechainChargeTiers([
      { amountRangeFrom: 0, amountRangeTo: 150_000, amount: 50 },
      { amountRangeFrom: 100_000, amountRangeTo: null, amount: 100 }
    ]);
    assert.deepEqual(chained, [
      { amountRangeFrom: 0, amountRangeTo: 150_000, amount: 50 },
      { amountRangeFrom: 150_000, amountRangeTo: null, amount: 100 }
    ]);
  });

  it('stitches a gap after deleting a middle band', () => {
    const remaining = removeChargeTierAndRechain(
      [
        { amountRangeFrom: 0, amountRangeTo: 100_000, amount: 50 },
        { amountRangeFrom: 100_000, amountRangeTo: 200_000, amount: 75 },
        { amountRangeFrom: 200_000, amountRangeTo: null, amount: 100 }
      ],
      1
    );
    assert.deepEqual(remaining, [
      { amountRangeFrom: 0, amountRangeTo: 100_000, amount: 50 },
      { amountRangeFrom: 100_000, amountRangeTo: null, amount: 100 }
    ]);
  });

  it('opens the new last band after deleting the last', () => {
    const remaining = removeChargeTierAndRechain(
      [
        { amountRangeFrom: 0, amountRangeTo: 100_000, amount: 50 },
        { amountRangeFrom: 100_000, amountRangeTo: null, amount: 100 }
      ],
      1
    );
    assert.deepEqual(remaining, [
      { amountRangeFrom: 0, amountRangeTo: null, amount: 50 }
    ]);
  });
});

describe('replaceChargeTierAndRechain', () => {
  it('follows the next From when To of a non-last band changes', () => {
    const updated = replaceChargeTierAndRechain(
      [
        { amountRangeFrom: 0, amountRangeTo: 100_000, amount: 50 },
        { amountRangeFrom: 100_000, amountRangeTo: null, amount: 100 }
      ],
      0,
      { amountRangeFrom: 0, amountRangeTo: 80_000, amount: 40 }
    );
    assert.deepEqual(updated, [
      { amountRangeFrom: 0, amountRangeTo: 80_000, amount: 40 },
      { amountRangeFrom: 80_000, amountRangeTo: null, amount: 100 }
    ]);
  });
});
