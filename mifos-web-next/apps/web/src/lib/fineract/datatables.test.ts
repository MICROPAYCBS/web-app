/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractDatatableColumnHeader } from '@mifos/api-client';
import { formatDatatableCellValueForColumn } from './datatables';

const lookupColumn: FineractDatatableColumnHeader = {
  columnName: 'status_cd_status',
  columnDisplayType: 'CODELOOKUP',
  columnValues: [
    { id: 17, value: 'Active' },
    { id: 18, value: 'Inactive' }
  ]
};

describe('formatDatatableCellValueForColumn', () => {
  it('resolves CODELOOKUP ids to option labels', () => {
    assert.equal(formatDatatableCellValueForColumn(lookupColumn, 17), 'Active');
  });

  it('uses embedded lookup labels from API objects', () => {
    assert.equal(
      formatDatatableCellValueForColumn(lookupColumn, { id: 18, value: 'Inactive' }),
      'Inactive'
    );
  });

  it('formats booleans as Yes/No', () => {
    const column: FineractDatatableColumnHeader = {
      columnName: 'flag',
      columnDisplayType: 'BOOLEAN'
    };
    assert.equal(formatDatatableCellValueForColumn(column, true), 'Yes');
    assert.equal(formatDatatableCellValueForColumn(column, false), 'No');
  });

  it('formats Fineract date arrays', () => {
    const column: FineractDatatableColumnHeader = {
      columnName: 'start_date',
      columnDisplayType: 'DATE'
    };
    const formatted = formatDatatableCellValueForColumn(column, [2026, 3, 15]);
    assert.match(formatted, /2026/);
    assert.match(formatted, /15/);
  });

  it('formats decimals with grouping', () => {
    const column: FineractDatatableColumnHeader = {
      columnName: 'amount',
      columnDisplayType: 'DECIMAL'
    };
    assert.equal(formatDatatableCellValueForColumn(column, 1234.5), '1,234.5');
  });

  it('returns an em dash for empty values', () => {
    assert.equal(formatDatatableCellValueForColumn(lookupColumn, null), '—');
    assert.equal(formatDatatableCellValueForColumn(lookupColumn, ''), '—');
  });
});
