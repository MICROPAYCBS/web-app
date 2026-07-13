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
  expandInterBranchJournalEntry,
  isInterBranchJournalEntry,
  journalEntryLinesTotal
} from './inter-branch-journal-entry';
import type { CreateJournalEntryFormInput } from './journal-entry.schema';

const DEBIT_OFFICE_ID = 2;
const CREDIT_OFFICE_ID = 1;
const CLEARING_GL_ID = 900;
const EXPENSE_GL_ID = 501;
const BANK_GL_ID = 200;

function baseForm(): CreateJournalEntryFormInput {
  return {
    debitOfficeId: DEBIT_OFFICE_ID,
    creditOfficeId: CREDIT_OFFICE_ID,
    debitDepartmentId: 3,
    creditDepartmentId: undefined,
    currencyCode: 'UGX',
    transactionDate: '11 July 2026',
    referenceNumber: 'XB-20260711-TEST',
    comments: 'Utilities',
    debits: [{ glAccountId: EXPENSE_GL_ID, amount: 150_000 }],
    credits: [{ glAccountId: BANK_GL_ID, amount: 150_000 }]
  };
}

describe('inter-branch-journal-entry', () => {
  it('detects inter-branch when debit and credit offices differ', () => {
    assert.equal(isInterBranchJournalEntry(baseForm()), true);
    assert.equal(
      isInterBranchJournalEntry({
        ...baseForm(),
        creditOfficeId: DEBIT_OFFICE_ID
      }),
      false
    );
  });

  it('sums journal entry line amounts', () => {
    assert.equal(
      journalEntryLinesTotal([
        { glAccountId: 1, amount: 100 },
        { glAccountId: 2, amount: 50 }
      ]),
      150
    );
  });

  it('expands balanced form into debit-office and credit-office entries', () => {
    const expanded = expandInterBranchJournalEntry({
      ...baseForm(),
      clearingGlAccountId: CLEARING_GL_ID,
      officeNamesById: {
        [DEBIT_OFFICE_ID]: 'Branch A',
        [CREDIT_OFFICE_ID]: 'Head Office'
      }
    });

    assert.equal(expanded.length, 2);

    const debitEntry = expanded[0];
    assert.equal(debitEntry.role, 'debit_office');
    assert.equal(debitEntry.officeId, DEBIT_OFFICE_ID);
    assert.equal(debitEntry.input.debitOfficeId, DEBIT_OFFICE_ID);
    assert.equal(debitEntry.input.creditOfficeId, DEBIT_OFFICE_ID);
    assert.equal(debitEntry.input.debits.length, 1);
    assert.equal(debitEntry.input.debits[0]?.glAccountId, EXPENSE_GL_ID);
    assert.equal(debitEntry.input.credits.length, 1);
    assert.equal(debitEntry.input.credits[0]?.glAccountId, CLEARING_GL_ID);
    assert.equal(debitEntry.input.credits[0]?.amount, 150_000);
    assert.equal(debitEntry.input.debitDepartmentId, 3);
    assert.match(debitEntry.input.comments ?? '', /Branch A/);

    const creditEntry = expanded[1];
    assert.equal(creditEntry.role, 'credit_office');
    assert.equal(creditEntry.officeId, CREDIT_OFFICE_ID);
    assert.equal(creditEntry.input.debits[0]?.glAccountId, CLEARING_GL_ID);
    assert.equal(creditEntry.input.credits[0]?.glAccountId, BANK_GL_ID);
    assert.equal(creditEntry.input.credits[0]?.amount, 150_000);
    assert.match(creditEntry.input.comments ?? '', /Head Office/);
  });
});
