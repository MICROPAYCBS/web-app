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
  journalEntryTransactionPath,
  savingsJournalTransactionId
} from './journal-entry-links';

describe('savingsJournalTransactionId', () => {
  it('prefixes savings transaction id for journal lookup', () => {
    assert.equal(savingsJournalTransactionId(42), 'S42');
  });
});

describe('journalEntryTransactionPath', () => {
  it('builds accounting transaction view URL', () => {
    assert.equal(
      journalEntryTransactionPath('S42'),
      '/accounting/journal-entries/transactions/S42'
    );
  });
});
