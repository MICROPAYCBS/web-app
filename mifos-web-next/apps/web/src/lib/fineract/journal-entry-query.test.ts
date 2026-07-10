/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseJournalEntryListQuery } from './journal-entry-query';

describe('parseJournalEntryListQuery', () => {
  it('defaults transaction date range to the organisation business date', () => {
    const query = parseJournalEntryListQuery({}, '07 July 2026');

    assert.equal(query.fromDate, '07 July 2026');
    assert.equal(query.toDate, '07 July 2026');
  });

  it('keeps explicit transaction dates from the URL', () => {
    const query = parseJournalEntryListQuery(
      {
        fromDate: '01 July 2026',
        toDate: '05 July 2026'
      },
      '07 July 2026'
    );

    assert.equal(query.fromDate, '01 July 2026');
    assert.equal(query.toDate, '05 July 2026');
  });
});
