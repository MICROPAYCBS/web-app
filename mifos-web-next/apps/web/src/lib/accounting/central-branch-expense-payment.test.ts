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
  DEFAULT_CLEARING_GL_CODE,
  expandCentralBranchExpensePayment,
  formatCentralBranchExpensePaymentComments,
  mergeCentralBranchExpenseLines
} from '@/lib/accounting/central-branch-expense-payment';

const FUNDING_OFFICE_ID = 1;
const BRANCH_A_ID = 2;
const BRANCH_B_ID = 3;
const BRANCH_C_ID = 4;
const BANK_GL_ID = 100;
const CLEARING_GL_ID = 200;
const EXPENSE_A_ID = 501;
const EXPENSE_B_ID = 502;
const EXPENSE_C_ID = 503;

function baseInput(
  overrides: Partial<Parameters<typeof expandCentralBranchExpensePayment>[0]> = {}
) {
  return {
    fundingOfficeId: FUNDING_OFFICE_ID,
    bankGlAccountId: BANK_GL_ID,
    currencyCode: 'UGX',
    transactionDate: '11 July 2026',
    referenceNumber: 'XB-20260711-001',
    comments: 'Telephone utilities',
    clearingGlAccountId: CLEARING_GL_ID,
    officeNamesById: {
      [FUNDING_OFFICE_ID]: 'Head Office',
      [BRANCH_A_ID]: 'Branch A',
      [BRANCH_B_ID]: 'Branch B',
      [BRANCH_C_ID]: 'Branch C'
    },
    expenseLines: [
      {
        branchOfficeId: BRANCH_A_ID,
        expenseGlAccountId: EXPENSE_A_ID,
        amount: 100_000,
        departmentId: 3
      }
    ],
    ...overrides
  };
}

describe('expandCentralBranchExpensePayment', () => {
  it('creates branch + HO journal entries for a single branch', () => {
    const entries = expandCentralBranchExpensePayment(baseInput());
    assert.equal(entries.length, 2);

    const branchEntry = entries[0];
    assert.equal(branchEntry.role, 'branch_expense');
    assert.equal(branchEntry.officeId, BRANCH_A_ID);
    assert.equal(branchEntry.input.debits[0]?.glAccountId, EXPENSE_A_ID);
    assert.equal(branchEntry.input.debits[0]?.amount, 100_000);
    assert.equal(branchEntry.input.credits[0]?.glAccountId, CLEARING_GL_ID);
    assert.equal(branchEntry.input.departmentId, 3);
    assert.equal(branchEntry.input.referenceNumber, 'XB-20260711-001');
    assert.match(branchEntry.input.comments ?? '', /Branch: Branch A/);

    const hoEntry = entries[1];
    assert.equal(hoEntry.role, 'ho_funding');
    assert.equal(hoEntry.officeId, FUNDING_OFFICE_ID);
    assert.equal(hoEntry.input.debits[0]?.amount, 100_000);
    assert.equal(hoEntry.input.credits[0]?.glAccountId, BANK_GL_ID);
    assert.equal(hoEntry.input.credits[0]?.amount, 100_000);
    assert.match(hoEntry.input.comments ?? '', /Source/);
  });

  it('creates four journal entries for three branches and balances HO bank credit', () => {
    const entries = expandCentralBranchExpensePayment(
      baseInput({
        expenseLines: [
          { branchOfficeId: BRANCH_A_ID, expenseGlAccountId: EXPENSE_A_ID, amount: 100_000 },
          { branchOfficeId: BRANCH_B_ID, expenseGlAccountId: EXPENSE_B_ID, amount: 50_000 },
          { branchOfficeId: BRANCH_C_ID, expenseGlAccountId: EXPENSE_C_ID, amount: 25_000 }
        ]
      })
    );

    assert.equal(entries.length, 4);
    const hoEntry = entries[3];
    assert.equal(hoEntry.role, 'ho_funding');
    assert.equal(hoEntry.input.debits.length, 3);
    assert.equal(
      hoEntry.input.debits.reduce((sum, line) => sum + line.amount, 0),
      175_000
    );
    assert.equal(hoEntry.input.credits[0]?.amount, 175_000);
  });

  it('applies shared reference number to every orchestrated journal entry', () => {
    const entries = expandCentralBranchExpensePayment(
      baseInput({ referenceNumber: 'XB-20260711-XYZ' })
    );
    for (const entry of entries) {
      assert.equal(entry.input.referenceNumber, 'XB-20260711-XYZ');
    }
  });

  it('passes clearing account id on all clearing legs', () => {
    const entries = expandCentralBranchExpensePayment(baseInput());
    assert.equal(entries[0]?.input.credits[0]?.glAccountId, CLEARING_GL_ID);
    assert.equal(entries[1]?.input.debits[0]?.glAccountId, CLEARING_GL_ID);
  });

  it('merges duplicate branch and expense GL lines before expand', () => {
    const merged = mergeCentralBranchExpenseLines([
      { branchOfficeId: BRANCH_A_ID, expenseGlAccountId: EXPENSE_A_ID, amount: 40_000 },
      { branchOfficeId: BRANCH_A_ID, expenseGlAccountId: EXPENSE_A_ID, amount: 60_000 }
    ]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.amount, 100_000);
  });
});

describe('formatCentralBranchExpensePaymentComments', () => {
  it('prefixes user comments for batch linkage', () => {
    assert.equal(
      formatCentralBranchExpensePaymentComments('Telephone utilities'),
      'Cross-branch | Telephone utilities'
    );
  });
});

describe('DEFAULT_CLEARING_GL_CODE', () => {
  it('uses Micropay inter-branch clearing code', () => {
    assert.equal(DEFAULT_CLEARING_GL_CODE, 'MP-20010');
  });
});
