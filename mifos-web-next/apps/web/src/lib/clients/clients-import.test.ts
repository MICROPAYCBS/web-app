/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as XLSX from 'xlsx';
import {
  analyzeClientsImportRows,
  CLIENTS_IMPORT_COLUMNS,
  CLIENTS_IMPORT_SHEET_NAME,
  prepareClientsImportRows,
  type ClientsImportLookups,
  type ClientsImportWorkbookRawRow
} from '@/lib/clients/clients-import';
import {
  buildClientsImportTemplateWorkbook,
  parseClientsImportWorkbook
} from '@/lib/clients/clients-import-workbook';

const lookups: ClientsImportLookups = {
  offices: [{ id: 1, name: 'Head Office' }],
  staff: [{ id: 10, name: 'Jane Officer', officeId: 1, officeName: 'Head Office' }],
  customerClasses: [{ id: 20, name: 'Retail', code: 'RETAIL' }],
  genders: [
    { id: 1, name: 'Male' },
    { id: 2, name: 'Female' }
  ],
  nationalities: [{ id: 30, name: 'Ugandan' }],
  maritalStatuses: [{ id: 40, name: 'Single' }],
  identityTypes: [{ id: 50, name: 'National ID' }],
  familyRelationships: [{ id: 60, name: 'Spouse' }],
  addressTypes: [{ id: 70, name: 'Home' }],
  countries: [{ id: 80, name: 'Uganda' }],
  clientTypes: [{ id: 90, name: 'Individual' }],
  titles: [{ id: 100, name: 'Mr' }],
  stateProvinces: [{ id: 110, name: 'Central' }]
};

function validRow(
  overrides: Partial<ClientsImportWorkbookRawRow['values']> = {}
): ClientsImportWorkbookRawRow {
  return {
    rowNumber: 2,
    values: {
      'First Name': 'John',
      'Last Name': 'Doe',
      Mobile: '+256712345678',
      'Date of Birth': '01 January 1990',
      'Office Name': 'Head Office',
      'Staff Name': 'Jane Officer',
      'Customer Class': 'RETAIL',
      Gender: 'Male',
      Nationality: 'Ugandan',
      'Marital Status': 'Single',
      'Submitted On': '01 January 2026',
      'ID Type': 'National ID',
      'ID Number': 'CM12345678',
      'Family First Name': 'Mary',
      'Family Last Name': 'Doe',
      'Family Relationship': 'Spouse',
      'Family Gender': 'Female',
      ...overrides
    }
  };
}

describe('clients-import workbook', () => {
  it('builds a template and parses filled rows with header aliases', () => {
    const empty = parseClientsImportWorkbook(buildClientsImportTemplateWorkbook(lookups));
    assert.equal(empty.ok, false);
    if (!empty.ok) {
      assert.match(empty.message, /No customer rows/);
    }

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['FirstName', 'Last Name', 'Mobile', 'Date of Birth', 'Office Name', 'Staff Name', 'Customer Class', 'Gender', 'Nationality', 'Marital Status', 'Submitted On', 'ID Type', 'ID Number', 'Family First Name', 'Family Last Name', 'Family Relationship', 'Family Gender'],
      ['John', 'Doe', '+256712345678', '01 January 1990', 'Head Office', 'Jane Officer', 'Retail', 'Male', 'Ugandan', 'Single', '01 January 2026', 'National ID', 'CM12345678', 'Mary', 'Doe', 'Spouse', 'Female']
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, CLIENTS_IMPORT_SHEET_NAME);
    const written = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as number[];
    const parsed = parseClientsImportWorkbook(new Uint8Array(written).buffer);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    assert.equal(parsed.rows.length, 1);
    assert.equal(parsed.rows[0]?.values['First Name'], 'John');
    assert.ok(CLIENTS_IMPORT_COLUMNS.includes('First Name'));
  });
});

describe('analyzeClientsImportRows', () => {
  it('flags missing customer class, officer, id, and family fields', () => {
    const analysis = analyzeClientsImportRows(
      [
        validRow({
          'Customer Class': '',
          'Staff Name': '',
          'ID Type': '',
          'ID Number': '',
          'Family First Name': '',
          'Family Relationship': ''
        })
      ],
      lookups
    );

    assert.equal(analysis.canCreate, false);
    const messages = analysis.rows[0]?.errors.join(' ') ?? '';
    assert.match(messages, /Customer Class/);
    assert.match(messages, /Staff Name/);
    assert.match(messages, /ID Type/);
    assert.match(messages, /ID Number/);
    assert.match(messages, /Family First Name/);
    assert.match(messages, /Family Relationship/);
  });

  it('detects duplicate external ids in the file', () => {
    const analysis = analyzeClientsImportRows(
      [
        { ...validRow({ 'External ID': 'EXT-1' }), rowNumber: 2 },
        { ...validRow({ 'External ID': 'EXT-1', Mobile: '+256700000001' }), rowNumber: 3 }
      ],
      lookups
    );
    assert.equal(analysis.canCreate, false);
    assert.match(analysis.rows[1]?.errors.join(' ') ?? '', /Duplicate External ID/);
  });
});

describe('prepareClientsImportRows', () => {
  it('builds CreateClientInput for a valid person row', () => {
    const analysis = analyzeClientsImportRows([validRow()], lookups);
    assert.equal(analysis.canCreate, true);
    const prepared = prepareClientsImportRows(analysis, lookups);
    assert.equal(prepared.ok, true);
    if (!prepared.ok) {
      return;
    }
    assert.equal(prepared.rows.length, 1);
    const input = prepared.rows[0]?.input;
    assert.ok(input);
    assert.equal(input.legalFormId, 1);
    assert.equal(input.officeId, 1);
    assert.equal(input.staffId, 10);
    assert.equal(input.customerClassId, 20);
    assert.equal(input.clientIdentifiers?.[0]?.documentTypeId, 50);
    assert.equal(input.familyMembers?.[0]?.relationshipId, 60);
  });
});
