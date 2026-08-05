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
  depositProductCharts,
  formatChartSlabAmountRange,
  formatChartSlabPeriod,
  normalizeDepositProductCharts
} from './deposit-product-charts';

describe('normalizeDepositProductCharts', () => {
  it('normalizes a single active chart with date arrays and slabs', () => {
    const charts = normalizeDepositProductCharts({
      id: 9,
      name: 'Standard',
      fromDate: [2024, 1, 1],
      endDate: [2030, 12, 31],
      isPrimaryGroupingByAmount: false,
      chartSlabs: [
        {
          fromPeriod: 3,
          toPeriod: 12,
          periodType: { id: 1, value: 'Months' },
          amountRangeFrom: 1000,
          amountRangeTo: 5000,
          annualInterestRate: 7.5,
          description: 'Tier 1'
        }
      ]
    });

    assert.equal(charts.length, 1);
    assert.equal(charts[0]?.name, 'Standard');
    assert.equal(charts[0]?.fromDate, '01 January 2024');
    assert.equal(charts[0]?.endDate, '31 December 2030');
    assert.equal(charts[0]?.chartSlabs?.length, 1);
    assert.equal(charts[0]?.chartSlabs?.[0]?.annualInterestRate, 7.5);
  });

  it('normalizes an interestRateCharts array', () => {
    const charts = normalizeDepositProductCharts([
      { id: 1, fromDate: '01 January 2024', chartSlabs: [] },
      { id: 2, fromDate: '01 June 2025', chartSlabs: [] }
    ]);
    assert.equal(charts.length, 2);
    assert.equal(charts[1]?.id, 2);
  });
});

describe('depositProductCharts', () => {
  it('prefers interestRateCharts over activeChart', () => {
    const charts = depositProductCharts({
      id: 1,
      interestRateCharts: [{ id: 2, name: 'All charts' }],
      activeChart: { id: 3, name: 'Active only' }
    });
    assert.equal(charts.length, 1);
    assert.equal(charts[0]?.name, 'All charts');
  });

  it('falls back to activeChart', () => {
    const charts = depositProductCharts({
      id: 1,
      activeChart: { id: 3, name: 'Active only', chartSlabs: [] }
    });
    assert.equal(charts[0]?.name, 'Active only');
  });
});

describe('formatChartSlabPeriod / formatChartSlabAmountRange', () => {
  it('formats period and amount ranges', () => {
    assert.equal(
      formatChartSlabPeriod({
        fromPeriod: 3,
        toPeriod: 12,
        periodType: { id: 1, value: 'Months' }
      }),
      '3 – 12 Months'
    );
    assert.equal(
      formatChartSlabAmountRange({ amountRangeFrom: 1000, amountRangeTo: 5000 }),
      '1000 – 5000'
    );
    assert.equal(formatChartSlabPeriod({}), '—');
    assert.equal(formatChartSlabAmountRange({}), '—');
  });
});
