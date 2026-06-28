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
  formatAuditTrailDateTime,
  formatAuditTrailFieldLabel,
  parseAuditTrailCommandFields
} from './audit-trail-display';
import { coerceFineractDateTime } from './dates';

describe('audit trail datetime display', () => {
  it('formats ZonedDateTime epoch millis from Fineract audits API', () => {
    const epochMs = Date.UTC(2026, 5, 22, 9, 46, 47);
    assert.equal(coerceFineractDateTime(epochMs), epochMs);
    const formatted = formatAuditTrailDateTime(epochMs);
    assert.notEqual(formatted, '—');
    assert.ok(formatted.includes('2026') || formatted.includes('Jun'));
  });

  it('formats LocalDateTime arrays with time', () => {
    const formatted = formatAuditTrailDateTime([2026, 6, 22, 12, 46, 47]);
    assert.notEqual(formatted, '—');
    assert.ok(formatted.includes('Jun') || formatted.includes('22'));
  });

  it('formats ISO datetime strings', () => {
    const formatted = formatAuditTrailDateTime('2026-06-22T09:46:47Z');
    assert.notEqual(formatted, '—');
  });
});

describe('audit trail field labels', () => {
  it('converts camelCase keys to human-readable labels', () => {
    assert.equal(formatAuditTrailFieldLabel('firstName'), 'First Name');
    assert.equal(formatAuditTrailFieldLabel('nationalityCountryId'), 'Nationality Country Id');
    assert.equal(formatAuditTrailFieldLabel('address.city'), 'Address · City');
    assert.equal(
      formatAuditTrailFieldLabel('familyMembers[0].firstName'),
      'Family Members [1] · First Name'
    );
  });
});

describe('audit trail command fields', () => {
  it('parses flat and nested JSON with labelled fields', () => {
    const fields = parseAuditTrailCommandFields(
      JSON.stringify({
        firstName: 'Jane',
        active: true,
        address: { city: 'Kampala' },
        locale: 'en'
      })
    );

    assert.equal(fields.find((field) => field.key === 'firstName')?.label, 'First Name');
    assert.equal(fields.find((field) => field.key === 'firstName')?.display, 'Jane');
    assert.equal(fields.find((field) => field.key === 'active')?.display, 'Yes');
    assert.equal(fields.find((field) => field.key === 'address.city')?.label, 'Address · City');
    assert.equal(fields.find((field) => field.key === 'address.city')?.display, 'Kampala');
  });
});
