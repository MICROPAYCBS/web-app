/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '@mifos/validation';
import {
  datatableMatchesLegalForm,
  legalFormIdToEntitySubType,
  normalizeEntitySubType,
  registrationEntitySubType
} from './entity-datatable-matching';

describe('normalizeEntitySubType', () => {
  it('accepts person and entity case-insensitively', () => {
    assert.equal(normalizeEntitySubType('Person'), 'person');
    assert.equal(normalizeEntitySubType('ENTITY'), 'entity');
  });

  it('returns null for empty or unknown values', () => {
    assert.equal(normalizeEntitySubType(undefined), null);
    assert.equal(normalizeEntitySubType('Fixed Deposit'), null);
  });
});

describe('registrationEntitySubType', () => {
  it('prefers entitySubType over subentityType', () => {
    assert.equal(
      registrationEntitySubType({ entitySubType: 'Person', subentityType: 'Entity' }),
      'Person'
    );
  });

  it('falls back to subentityType', () => {
    assert.equal(registrationEntitySubType({ subentityType: 'Entity' }), 'Entity');
  });
});

describe('datatableMatchesLegalForm', () => {
  const personTable = { entitySubType: 'Person' };
  const entityTable = { entitySubType: 'Entity' };
  const universalTable = {};

  it('matches explicit person and entity tables', () => {
    assert.equal(datatableMatchesLegalForm(personTable, LEGAL_FORM_PERSON), true);
    assert.equal(datatableMatchesLegalForm(personTable, LEGAL_FORM_ENTITY), false);
    assert.equal(datatableMatchesLegalForm(entityTable, LEGAL_FORM_ENTITY), true);
    assert.equal(datatableMatchesLegalForm(entityTable, LEGAL_FORM_PERSON), false);
  });

  it('includes universal tables on detail nav by default', () => {
    assert.equal(datatableMatchesLegalForm(universalTable, LEGAL_FORM_PERSON), true);
    assert.equal(datatableMatchesLegalForm(universalTable, LEGAL_FORM_ENTITY), true);
  });

  it('can exclude universal tables when filtering the full registry', () => {
    assert.equal(
      datatableMatchesLegalForm(universalTable, LEGAL_FORM_PERSON, { allowUniversal: false }),
      false
    );
    assert.equal(
      datatableMatchesLegalForm(personTable, LEGAL_FORM_PERSON, { allowUniversal: false }),
      true
    );
  });

  it('includes universal tables when filtering client template datatables', () => {
    assert.equal(
      datatableMatchesLegalForm(universalTable, LEGAL_FORM_PERSON, { allowUniversal: true }),
      true
    );
    assert.equal(
      datatableMatchesLegalForm(universalTable, LEGAL_FORM_ENTITY, { allowUniversal: true }),
      true
    );
  });

  it('maps legal form ids to subtypes', () => {
    assert.equal(legalFormIdToEntitySubType(LEGAL_FORM_PERSON), 'person');
    assert.equal(legalFormIdToEntitySubType(LEGAL_FORM_ENTITY), 'entity');
  });
});
