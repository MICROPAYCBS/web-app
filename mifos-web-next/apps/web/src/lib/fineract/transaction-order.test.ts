/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compareByDateThenId, sortByDateThenId } from './transaction-order';

describe('sortByDateThenId', () => {
  it('orders by date then id, newest first by default', () => {
    const sorted = sortByDateThenId(
      [
        { id: 4, date: [2026, 3, 1] },
        { id: 1, date: [2026, 3, 10] },
        { id: 3, date: [2026, 3, 10] },
        { id: 2, date: [2026, 3, 5] }
      ],
      (item) => item.date,
      (item) => item.id
    );

    assert.deepEqual(
      sorted.map((item) => item.id),
      [3, 1, 2, 4]
    );
  });

  it('orders oldest first when direction is asc', () => {
    const sorted = sortByDateThenId(
      [
        { id: 3, date: [2026, 3, 10] },
        { id: 1, date: [2026, 3, 10] },
        { id: 2, date: [2026, 3, 5] }
      ],
      (item) => item.date,
      (item) => item.id,
      'asc'
    );

    assert.deepEqual(
      sorted.map((item) => item.id),
      [2, 1, 3]
    );
  });

  it('compares string dates with array dates', () => {
    assert.ok(compareByDateThenId('10 March 2026', 1, [2026, 3, 5], 2) > 0);
    assert.equal(compareByDateThenId([2026, 3, 10], 1, '10 March 2026', 1), 0);
  });

  it('places missing dates after dated rows when newest first', () => {
    const sorted = sortByDateThenId(
      [
        { id: 2, date: undefined },
        { id: 1, date: [2026, 3, 1] }
      ],
      (item) => item.date,
      (item) => item.id
    );

    assert.deepEqual(
      sorted.map((item) => item.id),
      [1, 2]
    );
  });
});
