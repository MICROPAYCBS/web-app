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
  buildCreateJournalEntryPayload,
  isSameOfficeJournalEntry,
  type CreateJournalEntryFormInput
} from './journal-entry.schema';
import { isInterBranchJournalEntry, journalEntryLinesTotal } from './inter-branch-journal-entry';

const DEBIT_OFFICE_ID = 2;
const CREDIT_OFFICE_ID = 1;
const EXPENSE_GL_ID = 501;
const BANK_GL_ID = 200;

function baseForm(overrides: Partial<CreateJournalEntryFormInput> = {}): CreateJournalEntryFormInput {
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
    credits: [{ glAccountId: BANK_GL_ID, amount: 150_000 }],
    ...overrides
  };
}

describe('inter-branch journal entry', () => {
  it('detects inter-branch when debit and credit offices differ', () => {
    assert.equal(isInterBranchJournalEntry(baseForm()), true);
    assert.equal(isSameOfficeJournalEntry(baseForm()), false);
    assert.equal(
      isInterBranchJournalEntry({
        ...baseForm(),
        creditOfficeId: DEBIT_OFFICE_ID
      }),
      false
    );
    assert.equal(
      isSameOfficeJournalEntry({
        ...baseForm(),
        creditOfficeId: DEBIT_OFFICE_ID
      }),
      true
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

  it('builds one create payload with per-line office ids for inter-branch', () => {
    const payload = buildCreateJournalEntryPayload(baseForm(), {
      locale: 'en',
      dateFormat: 'dd MMMM yyyy'
    });

    assert.equal(payload.officeId, DEBIT_OFFICE_ID);
    assert.equal(payload.debits.length, 1);
    assert.equal(payload.credits.length, 1);
    assert.equal(payload.debits[0]?.officeId, DEBIT_OFFICE_ID);
    assert.equal(payload.debits[0]?.departmentId, 3);
    assert.equal(payload.debits[0]?.glAccountId, EXPENSE_GL_ID);
    assert.equal(payload.credits[0]?.officeId, CREDIT_OFFICE_ID);
    assert.equal(payload.credits[0]?.glAccountId, BANK_GL_ID);
    assert.equal(payload.comments, 'Utilities');
  });

  it('builds same-office payload with matching line office ids', () => {
    const payload = buildCreateJournalEntryPayload(
      baseForm({ creditOfficeId: DEBIT_OFFICE_ID }),
      { locale: 'en', dateFormat: 'dd MMMM yyyy' }
    );

    assert.equal(payload.officeId, DEBIT_OFFICE_ID);
    assert.equal(payload.debits[0]?.officeId, DEBIT_OFFICE_ID);
    assert.equal(payload.credits[0]?.officeId, DEBIT_OFFICE_ID);
  });
});
