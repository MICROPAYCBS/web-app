/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  sumCollectionSheetRowTotals,
  transformCollectionSheetRows
} from '@/lib/collections/collection-sheet-rows';

describe('transformCollectionSheetRows', () => {
  it('flattens nested clients and sums loan and savings dues', () => {
    const rows = transformCollectionSheetRows({
      dueDate: '01 July 2026',
      clients: [
        {
          clientId: 1,
          clientName: 'Alice',
          loans: [{ principalDue: 100, interestDue: 10 }],
          savings: [{ dueAmount: 25 }]
        }
      ],
      groups: [
        {
          clients: [
            {
              clientId: 2,
              clientName: 'Bob',
              loans: [{ principalDue: 50 }]
            }
          ]
        }
      ]
    });

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.clientName, 'Alice');
    assert.equal(rows[0]?.totalAmountDue, 135);
    assert.equal(rows[1]?.totalAmountDue, 50);

    const totals = sumCollectionSheetRowTotals(rows);
    assert.equal(totals.clientCount, 2);
    assert.equal(totals.totalDue, 185);
  });
});
