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
  JOURNAL_ENTRIES_CREATED_BY_ALL,
  buildJournalEntrySearchParams,
  journalEntryOrderByForApi,
  parseJournalEntryListQuery
} from './journal-entry-query';

describe('parseJournalEntryListQuery', () => {
  it('defaults transaction date range to the organisation business date', () => {
    const query = parseJournalEntryListQuery(
      {},
      { defaultTransactionDate: '07 July 2026', defaultCreatedByUserId: '42' }
    );

    assert.equal(query.fromDate, '07 July 2026');
    assert.equal(query.toDate, '07 July 2026');
    assert.equal(query.createdByUserId, '42');
  });

  it('keeps explicit transaction dates from the URL', () => {
    const query = parseJournalEntryListQuery(
      {
        fromDate: '01 July 2026',
        toDate: '05 July 2026'
      },
      { defaultTransactionDate: '07 July 2026', defaultCreatedByUserId: '42' }
    );

    assert.equal(query.fromDate, '01 July 2026');
    assert.equal(query.toDate, '05 July 2026');
  });

  it('allows createdByUserId=all to mean every user', () => {
    const query = parseJournalEntryListQuery(
      { createdByUserId: JOURNAL_ENTRIES_CREATED_BY_ALL },
      { defaultCreatedByUserId: '42' }
    );
    assert.equal(query.createdByUserId, JOURNAL_ENTRIES_CREATED_BY_ALL);
    const params = buildJournalEntrySearchParams(query);
    assert.equal(params.createdByUserId, undefined);
  });
});

describe('journalEntryOrderByForApi', () => {
  it('maps debit/credit to amount', () => {
    assert.equal(journalEntryOrderByForApi('debit'), 'amount');
    assert.equal(journalEntryOrderByForApi('credit', 'desc'), 'amount');
  });

  it('tie-breaks transaction date with id using the same direction', () => {
    assert.equal(journalEntryOrderByForApi('transactionDate', 'desc'), 'transactionDate DESC, id');
    assert.equal(journalEntryOrderByForApi('transactionDate', 'asc'), 'transactionDate ASC, id');
    assert.equal(journalEntryOrderByForApi('submittedOnDate', 'desc'), 'submittedOnDate DESC, id');
  });
});
