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
  isCreateJournalEntryCheckerCommand,
  isJournalEntryCheckerEntity,
  journalEntrySubjectFromCommandAsJson
} from './journal-entry-command-review';

describe('journal-entry-command-review', () => {
  it('detects journal entry entities and CREATE commands', () => {
    assert.equal(isJournalEntryCheckerEntity('JOURNALENTRY'), true);
    assert.equal(isJournalEntryCheckerEntity('journal_entry'), true);
    assert.equal(isJournalEntryCheckerEntity('CLIENT'), false);
    assert.equal(isCreateJournalEntryCheckerCommand('CREATE', 'JOURNALENTRY'), true);
    assert.equal(isCreateJournalEntryCheckerCommand('UPDATE', 'JOURNALENTRY'), false);
  });

  it('builds a subject from narration or date/currency', () => {
    assert.equal(
      journalEntrySubjectFromCommandAsJson(
        JSON.stringify({ comments: 'Office rent', currencyCode: 'UGX' })
      ),
      'Office rent'
    );
    assert.equal(
      journalEntrySubjectFromCommandAsJson(
        JSON.stringify({ transactionDate: '11 July 2026', currencyCode: 'UGX' })
      ),
      'UGX · 11 July 2026'
    );
  });
});
