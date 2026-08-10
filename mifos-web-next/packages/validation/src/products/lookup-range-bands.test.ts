/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectLookupRangeBandIssues } from './lookup-range-bands';
import { depositProductChartSchema } from './deposit-product.schema';
import { upsertChargeSchema } from './upsert-charge.schema';

const bandOptions = {
  pathPrefix: ['bands'] as (string | number)[],
  fromField: 'from',
  toField: 'to',
  entityLabel: 'band',
  emptyMessage: 'Add at least one band.'
};

describe('collectLookupRangeBandIssues', () => {
  it('requires zero start, open last, and contiguous bands', () => {
    assert.equal(
      collectLookupRangeBandIssues(
        [
          { from: 0, to: 100 },
          { from: 100, to: null }
        ],
        bandOptions
      ).length,
      0
    );

    const closedLast = collectLookupRangeBandIssues([{ from: 0, to: 100 }], bandOptions);
    assert.ok(closedLast.some((issue) => issue.message.includes('open-ended')));

    const overlap = collectLookupRangeBandIssues(
      [
        { from: 0, to: 100 },
        { from: 50, to: null }
      ],
      bandOptions
    );
    assert.ok(overlap.some((issue) => issue.message.includes('Overlaps')));
  });
});

describe('charge and chart band rules', () => {
  it('rejects a closed final charge tier', () => {
    const parsed = upsertChargeSchema.safeParse({
      chargeAppliesTo: 1,
      name: 'Tiered fee',
      currencyCode: 'UGX',
      chargeTimeType: 1,
      chargeCalculationType: 1,
      amount: 0,
      active: true,
      penalty: false,
      chargePaymentMode: 0,
      useChargeTiers: true,
      chargeTiers: [{ amountRangeFrom: 0, amountRangeTo: 100000, amount: 50 }]
    });
    assert.equal(parsed.success, false);
  });

  it('rejects a closed final period slab', () => {
    const parsed = depositProductChartSchema.safeParse({
      fromDate: '2026-01-01',
      isPrimaryGroupingByAmount: false,
      chartSlabs: [
        {
          periodType: 0,
          fromPeriod: 0,
          toPeriod: 12,
          annualInterestRate: 5,
          description: 'Closed',
          incentives: []
        }
      ]
    });
    assert.equal(parsed.success, false);
  });

  it('accepts an open-ended final amount slab starting at 0', () => {
    const parsed = depositProductChartSchema.safeParse({
      fromDate: '2026-01-01',
      isPrimaryGroupingByAmount: true,
      chartSlabs: [
        {
          periodType: 0,
          fromPeriod: 0,
          amountRangeFrom: 0,
          amountRangeTo: 10000,
          annualInterestRate: 5,
          description: 'Low',
          incentives: []
        },
        {
          periodType: 0,
          fromPeriod: 0,
          amountRangeFrom: 10000,
          amountRangeTo: undefined,
          annualInterestRate: 6,
          description: 'High',
          incentives: []
        }
      ]
    });
    assert.equal(parsed.success, true);
  });
});
