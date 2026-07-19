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
  legacyJournalEntryGroupToPostGroup,
  legacyPostGroupToCreateJournalEntryForm
} from './legacy-journal-entries-post';
import type { LegacyJournalEntryGroup } from './legacy-journal-entries-import';

describe('legacy journal entry post mapping', () => {
  const group: LegacyJournalEntryGroup = {
    key: '2026-07-14\u0000REF-1',
    effectiveDate: '2026-07-14',
    reference: 'REF-1',
    lines: [
      {
        rowNumber: 2,
        accountNumber: '0101110001',
        amount: 70000,
        side: 'DR',
        reference: 'REF-1',
        comment: 'Cash in',
        effectiveDate: '2026-07-14',
        officeId: 1,
        departmentId: 1,
        glAccountId: 10
      },
      {
        rowNumber: 3,
        accountNumber: '0100100002',
        amount: 70000,
        side: 'CR',
        reference: 'REF-1',
        effectiveDate: '2026-07-14',
        officeId: 1,
        glAccountId: 20
      }
    ]
  };

  it('maps a group to create-journal form input with per-line departments', () => {
    const postGroup = legacyJournalEntryGroupToPostGroup(group);
    const form = legacyPostGroupToCreateJournalEntryForm(postGroup, 'UGX');

    assert.equal(form.debitOfficeId, 1);
    assert.equal(form.creditOfficeId, 1);
    assert.equal(form.currencyCode, 'UGX');
    assert.equal(form.transactionDate, '14 July 2026');
    assert.equal(form.referenceNumber, 'REF-1');
    assert.equal(form.comments, 'Cash in');
    assert.deepEqual(form.debits, [{ glAccountId: 10, amount: 70000, departmentId: 1 }]);
    assert.deepEqual(form.credits, [{ glAccountId: 20, amount: 70000 }]);
    assert.equal(form.debitDepartmentId, 1);
    assert.equal(form.creditDepartmentId, undefined);
  });
});
