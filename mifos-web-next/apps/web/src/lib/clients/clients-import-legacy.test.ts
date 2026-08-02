/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ClientsImportLookups } from '@/lib/clients/clients-import';
import {
  analyzeClientsLegacyImportRows,
  prepareClientsLegacyImportRows,
  type ClientsLegacyImportWorkbookRawRow
} from '@/lib/clients/clients-import-legacy';

const lookups: ClientsImportLookups = {
  offices: [{ id: 1, name: 'Head Office' }],
  staff: [],
  customerClasses: [],
  genders: [
    { id: 1, name: 'Male' },
    { id: 2, name: 'Female' }
  ],
  nationalities: [],
  maritalStatuses: [{ id: 40, name: 'Single' }],
  identityTypes: [{ id: 50, name: 'National ID' }],
  familyRelationships: [{ id: 60, name: 'Spouse' }],
  addressTypes: [],
  countries: [{ id: 80, name: 'Uganda' }],
  clientTypes: [{ id: 90, name: 'Individual' }],
  titles: [],
  stateProvinces: []
};

function legacyRow(
  overrides: Partial<ClientsLegacyImportWorkbookRawRow['values']> = {}
): ClientsLegacyImportWorkbookRawRow {
  return {
    rowNumber: 2,
    values: {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Phone Number': '+256712345678',
      ...overrides
    }
  };
}

describe('analyzeClientsLegacyImportRows', () => {
  it('requires only first and last name', () => {
    const analysis = analyzeClientsLegacyImportRows([legacyRow()], lookups);
    assert.equal(analysis.canCreate, true);
    assert.equal(analysis.errorRowCount, 0);
  });

  it('does not require customer class, staff, or nationality', () => {
    const analysis = analyzeClientsLegacyImportRows(
      [
        legacyRow({
          Gender: 'Male',
          'Marital Status': 'Single',
          'Identification Number': 'CM1',
          'Next of Kin Name': 'Mary Doe'
        })
      ],
      lookups
    );
    assert.equal(analysis.canCreate, true);
  });

  it('flags missing names', () => {
    const analysis = analyzeClientsLegacyImportRows(
      [legacyRow({ 'First Name': '', 'Last Name': '' })],
      lookups
    );
    assert.equal(analysis.canCreate, false);
    const messages = analysis.rows[0]?.errors.join(' ') ?? '';
    assert.match(messages, /First Name/);
    assert.match(messages, /Last Name/);
  });
});

describe('prepareClientsLegacyImportRows', () => {
  it('builds a draft payload without Micropay-required fields', () => {
    const analysis = analyzeClientsLegacyImportRows(
      [
        legacyRow({
          Email: 'john@example.com',
          'Personal Customer Unique ID': 'LEG-1',
          'Customer Type': 'Individual'
        })
      ],
      lookups
    );
    const prepared = prepareClientsLegacyImportRows(analysis, lookups, 1);
    assert.equal(prepared.ok, true);
    if (!prepared.ok) {
      return;
    }
    const input = prepared.rows[0]?.input;
    assert.ok(input);
    assert.equal(input.legalFormId, 1);
    assert.equal(input.officeId, 1);
    assert.equal(input.externalId, 'LEG-1');
    assert.equal(input.customerClassId, undefined);
    assert.equal(input.staffId, undefined);
    assert.equal(input.nationalityCountryId, undefined);
    assert.equal(input.clientTypeId, 90);
  });
});
