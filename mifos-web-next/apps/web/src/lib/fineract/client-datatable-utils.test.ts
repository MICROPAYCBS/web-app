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
import {
  isManyToOneDatatableColumns,
  normalizeSingleRowDatatableRecord,
  shouldUseSingleRowClientDatatableView,
  singleRowDatatableRowExists
} from './client-datatable-utils';

describe('normalizeSingleRowDatatableRecord', () => {
  it('returns null for empty input', () => {
    assert.equal(normalizeSingleRowDatatableRecord(null), null);
    assert.equal(normalizeSingleRowDatatableRecord([]), null);
    assert.equal(normalizeSingleRowDatatableRecord({}), null);
  });

  it('unwraps a single-element array', () => {
    assert.deepEqual(normalizeSingleRowDatatableRecord([{ client_id: 3, note: 'x' }]), {
      client_id: 3,
      note: 'x'
    });
  });

  it('returns object responses as-is', () => {
    assert.deepEqual(normalizeSingleRowDatatableRecord({ client_id: 3, note: 'x' }), {
      client_id: 3,
      note: 'x'
    });
  });
});

describe('singleRowDatatableRowExists', () => {
  it('detects rows that only have client_id', () => {
    assert.equal(singleRowDatatableRowExists({ client_id: 3 }), true);
    assert.equal(singleRowDatatableRowExists([{ client_id: 3 }]), true);
  });

  it('detects rows with custom field values', () => {
    assert.equal(singleRowDatatableRowExists({ client_id: 3, note: 'saved' }), true);
  });

  it('returns false when no row is present', () => {
    assert.equal(singleRowDatatableRowExists(null), false);
    assert.equal(singleRowDatatableRowExists([]), false);
    assert.equal(singleRowDatatableRowExists({}), false);
  });
});

describe('isManyToOneDatatableColumns', () => {
  it('requires an integer id column first', () => {
    const multiRow: FineractDatatableColumnHeader[] = [
      { columnName: 'id', columnDisplayType: 'INTEGER' },
      { columnName: 'note', columnDisplayType: 'STRING' }
    ];
    const singleRow: FineractDatatableColumnHeader[] = [
      { columnName: 'client_id', columnDisplayType: 'INTEGER' },
      { columnName: 'note', columnDisplayType: 'STRING' }
    ];
    const falsePositive: FineractDatatableColumnHeader[] = [
      { columnName: 'id', columnDisplayType: 'STRING' },
      { columnName: 'note', columnDisplayType: 'STRING' }
    ];

    assert.equal(isManyToOneDatatableColumns(multiRow), true);
    assert.equal(isManyToOneDatatableColumns(singleRow), false);
    assert.equal(isManyToOneDatatableColumns(falsePositive), false);
  });
});

describe('shouldUseSingleRowClientDatatableView', () => {
  it('uses single-row view for one-to-one tables', () => {
    assert.equal(
      shouldUseSingleRowClientDatatableView(
        {
          columnHeaderData: [
            { columnName: 'client_id', columnDisplayType: 'INTEGER' },
            { columnName: 'note', columnDisplayType: 'STRING' }
          ]
        },
        { client_id: 3 }
      ),
      true
    );
  });

  it('uses single-row view when misclassified multi-row data is keyed by client_id only', () => {
    assert.equal(
      shouldUseSingleRowClientDatatableView(
        {
          columnHeaderData: [
            { columnName: 'id', columnDisplayType: 'INTEGER' },
            { columnName: 'note', columnDisplayType: 'STRING' }
          ]
        },
        { client_id: 3, note: 'saved' }
      ),
      true
    );
  });

  it('uses multi-row view when rows include a multi-row id', () => {
    assert.equal(
      shouldUseSingleRowClientDatatableView(
        {
          columnHeaderData: [
            { columnName: 'id', columnDisplayType: 'INTEGER' },
            { columnName: 'note', columnDisplayType: 'STRING' }
          ]
        },
        [{ id: 9, client_id: 3, note: 'saved' }]
      ),
      false
    );
  });
});
