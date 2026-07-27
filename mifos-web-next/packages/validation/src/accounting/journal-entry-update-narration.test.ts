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
  JOURNAL_ENTRY_NARRATION_MAX_LENGTH,
  validateUpdateJournalEntryLineNarration,
  validateUpdateJournalEntryLineNarrations,
  validateUpdateJournalEntryNarration
} from './journal-entry.schema';

describe('updateJournalEntryNarration schema', () => {
  it('accepts empty string transactionComments (key present)', () => {
    const parsed = validateUpdateJournalEntryNarration({ transactionComments: '' });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.transactionComments, '');
    }
  });

  it('accepts narration at max length', () => {
    const transactionComments = 'x'.repeat(JOURNAL_ENTRY_NARRATION_MAX_LENGTH);
    const parsed = validateUpdateJournalEntryNarration({ transactionComments });
    assert.equal(parsed.success, true);
  });

  it('rejects narration over max length', () => {
    const transactionComments = 'x'.repeat(JOURNAL_ENTRY_NARRATION_MAX_LENGTH + 1);
    const parsed = validateUpdateJournalEntryNarration({ transactionComments });
    assert.equal(parsed.success, false);
  });

  it('rejects missing transactionComments key', () => {
    const parsed = validateUpdateJournalEntryNarration({});
    assert.equal(parsed.success, false);
  });

  it('rejects legacy comments-only payload', () => {
    const parsed = validateUpdateJournalEntryNarration({ comments: 'old field' });
    assert.equal(parsed.success, false);
  });
});

describe('updateJournalEntryLineNarration schema', () => {
  it('accepts line comments', () => {
    const parsed = validateUpdateJournalEntryLineNarration({ comments: 'IT Salaries' });
    assert.equal(parsed.success, true);
  });

  it('rejects oversized line comments', () => {
    const parsed = validateUpdateJournalEntryLineNarration({
      comments: 'x'.repeat(JOURNAL_ENTRY_NARRATION_MAX_LENGTH + 1)
    });
    assert.equal(parsed.success, false);
  });
});

describe('updateJournalEntryLineNarrations schema', () => {
  it('accepts a batch of line narrations', () => {
    const parsed = validateUpdateJournalEntryLineNarrations({
      entries: [
        { id: 101, comments: 'IT Salaries' },
        { id: 102, comments: 'Ops Salaries' }
      ]
    });
    assert.equal(parsed.success, true);
  });

  it('rejects empty entries', () => {
    const parsed = validateUpdateJournalEntryLineNarrations({ entries: [] });
    assert.equal(parsed.success, false);
  });
});
