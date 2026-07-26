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
  validateUpdateJournalEntryNarration
} from './journal-entry.schema';

describe('updateJournalEntryNarration schema', () => {
  it('accepts empty string narration (key present)', () => {
    const parsed = validateUpdateJournalEntryNarration({ comments: '' });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.comments, '');
    }
  });

  it('accepts narration at max length', () => {
    const comments = 'x'.repeat(JOURNAL_ENTRY_NARRATION_MAX_LENGTH);
    const parsed = validateUpdateJournalEntryNarration({ comments });
    assert.equal(parsed.success, true);
  });

  it('rejects narration over max length', () => {
    const comments = 'x'.repeat(JOURNAL_ENTRY_NARRATION_MAX_LENGTH + 1);
    const parsed = validateUpdateJournalEntryNarration({ comments });
    assert.equal(parsed.success, false);
  });

  it('rejects missing comments key', () => {
    const parsed = validateUpdateJournalEntryNarration({});
    assert.equal(parsed.success, false);
  });
});
