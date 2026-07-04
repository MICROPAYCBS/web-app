/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sumCollectionSheetExpected } from '@/lib/fineract/collection-sheet-sum';
import { sumDisbursedAmountFromReportRows } from '@/lib/dashboard/dashboard-kpi-parse';

describe('sumCollectionSheetExpected', () => {
  it('totals loan and savings dues across nested groups', () => {
    const result = sumCollectionSheetExpected({
      clients: [
        {
          clientId: 1,
          loans: [{ principalDue: 100, interestDue: 20, feeDue: 5 }],
          savings: [{ dueAmount: 50 }]
        }
      ],
      groups: [
        {
          clients: [{ clientId: 2, loans: [{ principalDue: 200 }] }]
        }
      ]
    });

    assert.equal(result.totalExpected, 375);
    assert.equal(result.loanCount, 2);
  });
});

describe('sumDisbursedAmountFromReportRows', () => {
  it('sums disbursed amount column values', () => {
    const total = sumDisbursedAmountFromReportRows([
      { Currency: 'UGX', disbursed_amount: 1000 },
      { Currency: 'UGX', disbursed_amount: 250.5 }
    ]);

    assert.equal(total, 1250.5);
  });
});
