/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/** Mirrors private helper in cashiers.ts — keep in sync when changing list parsing. */
function extractCashierRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    const cashiers = (raw as Record<string, unknown>).cashiers;
    if (Array.isArray(cashiers)) {
      return cashiers;
    }
  }
  return [];
}

describe('extractCashierRows', () => {
  it('unwraps Fineract CashiersForTeller payload', () => {
    const rows = extractCashierRows({
      tellerId: 1,
      tellerName: 'Teller One',
      officeId: 1,
      officeName: 'Head Office',
      cashiers: [
        { id: 10, staffId: 2, staffName: 'Mike Mugerwa', startDate: [2026, 7, 3], endDate: [2026, 12, 31] }
      ]
    });

    assert.equal(rows.length, 1);
    assert.equal((rows[0] as { staffName?: string }).staffName, 'Mike Mugerwa');
  });

  it('accepts legacy bare array responses', () => {
    const rows = extractCashierRows([{ id: 5, staffName: 'Legacy row' }]);
    assert.equal(rows.length, 1);
  });

  it('returns empty list for unknown shapes', () => {
    assert.deepEqual(extractCashierRows(null), []);
    assert.deepEqual(extractCashierRows({ tellerId: 1 }), []);
  });
});

/** Mirrors private helpers in cashiers.ts — keep in sync when changing summary parsing. */
function coerceSummaryAmount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function extractCashierTransactionPageItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    const pageItems = (raw as Record<string, unknown>).pageItems;
    if (Array.isArray(pageItems)) {
      return pageItems;
    }
  }
  return [];
}

function normalizeSummary(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const pageItems = extractCashierTransactionPageItems(row.cashierTransactions);
  return {
    netCash: coerceSummaryAmount(row.netCash),
    sumCashAllocation: coerceSummaryAmount(row.sumCashAllocation),
    sumCashSettlement: coerceSummaryAmount(row.sumCashSettlement),
    sumInwardCash: coerceSummaryAmount(row.sumInwardCash),
    sumOutwardCash: coerceSummaryAmount(row.sumOutwardCash),
    cashierTransactions: { pageItems }
  };
}

describe('normalizeSummary', () => {
  it('parses Fineract summaryandtransactions payload', () => {
    const summary = normalizeSummary({
      sumCashAllocation: 0,
      sumInwardCash: 500,
      sumOutwardCash: 0,
      sumCashSettlement: 0,
      netCash: 500,
      cashierTransactions: {
        pageItems: [{ id: 1, txnAmount: 500 }]
      }
    });

    assert.equal(summary.sumInwardCash, 500);
    assert.equal(summary.netCash, 500);
    assert.equal(summary.cashierTransactions.pageItems.length, 1);
  });

  it('coerces string amounts from BigDecimal serialization', () => {
    const summary = normalizeSummary({
      sumInwardCash: '500.000000',
      sumOutwardCash: '0',
      netCash: '500.000000'
    });

    assert.equal(summary.sumInwardCash, 500);
    assert.equal(summary.sumOutwardCash, 0);
    assert.equal(summary.netCash, 500);
  });

  it('accepts legacy bare transaction arrays', () => {
    const summary = normalizeSummary({
      sumInwardCash: 100,
      cashierTransactions: [{ id: 2 }]
    });

    assert.equal(summary.sumInwardCash, 100);
    assert.equal(summary.cashierTransactions.pageItems.length, 1);
  });
});
