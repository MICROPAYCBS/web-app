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
  FINANCIAL_REPORTS,
  getFinancialReportBySlug,
  isFinancialReportSlug
} from '@/lib/fineract/financial-reports';

describe('financial-reports', () => {
  it('maps slugs to exact Fineract report names', () => {
    assert.equal(FINANCIAL_REPORTS['balance-sheet'].reportName, 'Balance Sheet Table');
    assert.equal(FINANCIAL_REPORTS['income-statement'].reportName, 'Income Statement Table');
    assert.equal(FINANCIAL_REPORTS['trial-balance'].reportName, 'Trial Balance Table');
  });

  it('rejects unknown slugs', () => {
    assert.equal(isFinancialReportSlug('cash-flow'), false);
    assert.equal(getFinancialReportBySlug('cash-flow'), undefined);
  });
});
