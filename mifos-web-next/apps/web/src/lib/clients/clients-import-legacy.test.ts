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
  staff: [{ id: 10, name: 'Jane Officer', officeId: 1, officeName: 'Head Office' }],
  customerClasses: [],
  genders: [
    { id: 1, name: 'Male' },
    { id: 2, name: 'Female' }
  ],
  nationalities: [],
  maritalStatuses: [],
  identityTypes: [],
  familyRelationships: [],
  addressTypes: [{ id: 70, name: 'Home' }],
  countries: [{ id: 80, name: 'Uganda' }],
  clientTypes: [{ id: 90, name: 'Individual' }],
  titles: [],
  stateProvinces: [],
  savingProducts: [{ id: 200, name: 'Voluntary Savings' }],
  constitutions: [{ id: 300, name: 'Private Limited Company' }],
  mainBusinessLines: [{ id: 400, name: 'Agriculture' }]
};

function legacyPersonRow(
  overrides: Partial<ClientsLegacyImportWorkbookRawRow['values']> = {}
): ClientsLegacyImportWorkbookRawRow {
  return {
    rowNumber: 2,
    values: {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Office Name': 'Head Office',
      Active: 'TRUE',
      'Submitted On Date': '01 January 2026',
      'Activation Date': '02 January 2026',
      'Mobile Number': '+256712345678',
      ...overrides
    }
  };
}

function legacyEntityRow(
  overrides: Partial<ClientsLegacyImportWorkbookRawRow['values']> = {}
): ClientsLegacyImportWorkbookRawRow {
  return {
    rowNumber: 2,
    values: {
      Name: 'Acme Holdings',
      'Office Name': 'Head Office',
      Constitution: 'Private Limited Company',
      Active: 'TRUE',
      'Submitted On Date': '01 January 2026',
      'Activation Date': '02 January 2026',
      'Mobile Number': '+256712345678',
      ...overrides
    }
  };
}

describe('analyzeClientsLegacyImportRows', () => {
  it('accepts Fineract person columns without Micropay-required fields', () => {
    const analysis = analyzeClientsLegacyImportRows([legacyPersonRow()], lookups, {
      selectedOfficeId: 1,
      legalForm: 'Person'
    });
    assert.equal(analysis.canCreate, true);
    assert.equal(analysis.errorRowCount, 0);
  });

  it('falls back to selected branch when office name is empty', () => {
    const analysis = analyzeClientsLegacyImportRows(
      [legacyPersonRow({ 'Office Name': '' })],
      lookups,
      { selectedOfficeId: 1, legalForm: 'Person' }
    );
    assert.equal(analysis.canCreate, true);
    assert.match(analysis.rows[0]?.warnings.join(' ') ?? '', /selected branch/);
  });

  it('requires Active TRUE and activation date', () => {
    const inactive = analyzeClientsLegacyImportRows(
      [legacyPersonRow({ Active: 'FALSE' })],
      lookups,
      { selectedOfficeId: 1, legalForm: 'Person' }
    );
    assert.equal(inactive.canCreate, false);
    assert.match(inactive.rows[0]?.errors.join(' ') ?? '', /Active must be TRUE/);

    const missingActivation = analyzeClientsLegacyImportRows(
      [legacyPersonRow({ 'Activation Date': '' })],
      lookups,
      { selectedOfficeId: 1, legalForm: 'Person' }
    );
    assert.equal(missingActivation.canCreate, false);
    assert.match(missingActivation.rows[0]?.errors.join(' ') ?? '', /Activation Date/);
  });

  it('requires constitution for entity rows', () => {
    const analysis = analyzeClientsLegacyImportRows(
      [legacyEntityRow({ Constitution: '' })],
      lookups,
      { selectedOfficeId: 1, legalForm: 'Entity' }
    );
    assert.equal(analysis.canCreate, false);
    assert.match(analysis.rows[0]?.errors.join(' ') ?? '', /Constitution/);
  });
});

describe('prepareClientsLegacyImportRows', () => {
  it('builds an active create payload with optional savings product', () => {
    const analysis = analyzeClientsLegacyImportRows(
      [
        legacyPersonRow({
          'External ID': 'LEG-1',
          Gender: 'Male',
          'Client Type': 'Individual'
        })
      ],
      lookups,
      { selectedOfficeId: 1, legalForm: 'Person' }
    );
    const prepared = prepareClientsLegacyImportRows(analysis, lookups, {
      selectedOfficeId: 1,
      legalForm: 'Person',
      savingsProductId: 200
    });
    assert.equal(prepared.ok, true);
    if (!prepared.ok) {
      return;
    }
    const input = prepared.rows[0]?.input;
    assert.ok(input);
    assert.equal(input.officeId, 1);
    assert.equal(input.externalId, 'LEG-1');
    assert.equal(input.active, true);
    assert.equal(input.submittedOnDate, '01 January 2026');
    assert.equal(input.activationDate, '02 January 2026');
    assert.equal(input.savingsProductId, 200);
    assert.equal(input.clientTypeId, 90);
    if (input.legalFormId === 1) {
      assert.equal(input.firstname, 'John');
      assert.equal(input.lastname, 'Doe');
    }
  });

  it('maps entity name and constitution', () => {
    const analysis = analyzeClientsLegacyImportRows([legacyEntityRow()], lookups, {
      selectedOfficeId: 1,
      legalForm: 'Entity'
    });
    assert.equal(analysis.canCreate, true);
    const prepared = prepareClientsLegacyImportRows(analysis, lookups, {
      selectedOfficeId: 1,
      legalForm: 'Entity'
    });
    assert.equal(prepared.ok, true);
    if (!prepared.ok) {
      return;
    }
    const input = prepared.rows[0]?.input;
    assert.ok(input);
    assert.equal(input.active, true);
    assert.equal(input.legalFormId, 2);
    if (input.legalFormId === 2) {
      assert.equal(input.fullname, 'Acme Holdings');
      assert.equal(input.clientNonPersonDetails.constitutionId, 300);
    }
  });
});
