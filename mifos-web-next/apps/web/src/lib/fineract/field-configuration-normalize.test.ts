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
  normalizeFieldConfiguration,
  normalizeFieldConfigurationList
} from './field-configuration-normalize';

describe('normalizeFieldConfiguration', () => {
  it('normalizes camelCase payloads', () => {
    const row = normalizeFieldConfiguration({
      fieldConfigurationId: 12,
      entity: 'ADDRESS',
      subentity: 'CLIENT',
      field: 'latitude',
      isEnabled: true,
      isMandatory: false,
      validationRegex: '^-?\\d+'
    });

    assert.equal(row.fieldConfigurationId, 12);
    assert.equal(row.entity, 'ADDRESS');
    assert.equal(row.subentity, 'CLIENT');
    assert.equal(row.field, 'latitude');
    assert.equal(row.isEnabled, true);
    assert.equal(row.isMandatory, false);
    assert.equal(row.validationRegex, '^-?\\d+');
  });

  it('normalizes snake_case postgres-style keys', () => {
    const row = normalizeFieldConfiguration({
      field_configuration_id: 3,
      entity: 'ADDRESS',
      subentity: 'CLIENT',
      field: 'addressLine1',
      is_enabled: true,
      is_mandatory: true,
      validation_regex: null
    });

    assert.equal(row.fieldConfigurationId, 3);
    assert.equal(row.isEnabled, true);
    assert.equal(row.isMandatory, true);
    assert.equal(row.validationRegex, '');
  });
});

describe('normalizeFieldConfigurationList', () => {
  it('returns an empty array for nullish values', () => {
    assert.deepEqual(normalizeFieldConfigurationList(null), []);
    assert.deepEqual(normalizeFieldConfigurationList(undefined), []);
  });
});
