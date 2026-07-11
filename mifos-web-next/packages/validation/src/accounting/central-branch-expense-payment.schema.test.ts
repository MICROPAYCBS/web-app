/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateCentralBranchExpensePaymentForm } from '@mifos/validation';

describe('validateCentralBranchExpensePaymentForm', () => {
  it('rejects when funding office equals branch line office', () => {
    const result = validateCentralBranchExpensePaymentForm({
      fundingOfficeId: 1,
      bankGlAccountId: 10,
      currencyCode: 'UGX',
      transactionDate: '11 July 2026',
      referenceNumber: 'XB-20260711-001',
      expenseLines: [{ branchOfficeId: 1, expenseGlAccountId: 20, amount: 100 }]
    });
    assert.equal(result.success, false);
  });

  it('requires department on branch debit lines when configured', () => {
    const result = validateCentralBranchExpensePaymentForm(
      {
        fundingOfficeId: 1,
        bankGlAccountId: 10,
        currencyCode: 'UGX',
        transactionDate: '11 July 2026',
        referenceNumber: 'XB-20260711-001',
        expenseLines: [{ branchOfficeId: 2, expenseGlAccountId: 20, amount: 100 }]
      },
      { requireDepartmentOnExpenseLines: true }
    );
    assert.equal(result.success, false);
  });
});
