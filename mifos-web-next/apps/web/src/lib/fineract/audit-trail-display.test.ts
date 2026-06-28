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
  computeChangedAuditFieldKeys,
  formatAuditTrailDateTime,
  formatAuditTrailFieldLabel,
  parseAuditTrailCommandFields,
  parseAuditTrailCommandFieldsWithDiff,
  sortAuditTrailsChronologically,
  sortAuditTrailsNewestFirst
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

describe('audit trail chronological ordering', () => {
  it('sorts oldest-first by madeOnDate then id', () => {
    const sorted = sortAuditTrailsChronologically([
      { id: 3, madeOnDate: [2026, 6, 22, 12, 0, 0] },
      { id: 1, madeOnDate: [2026, 6, 20, 12, 0, 0] },
      { id: 2, madeOnDate: [2026, 6, 21, 12, 0, 0] }
    ]);

    assert.deepEqual(
      sorted.map((audit) => audit.id),
      [1, 2, 3]
    );
  });

  it('sorts newest-first by madeOnDate then id', () => {
    const sorted = sortAuditTrailsNewestFirst([
      { id: 1, madeOnDate: [2026, 6, 20, 12, 0, 0] },
      { id: 3, madeOnDate: [2026, 6, 22, 12, 0, 0] },
      { id: 2, madeOnDate: [2026, 6, 21, 12, 0, 0] }
    ]);

    assert.deepEqual(
      sorted.map((audit) => audit.id),
      [3, 2, 1]
    );
  });
});

describe('audit trail field diff', () => {
  it('highlights keys that differ from the previous entry', () => {
    const previous = JSON.stringify({ firstName: 'Jane', city: 'Kampala' });
    const current = JSON.stringify({ firstName: 'Janet', city: 'Kampala', active: true });

    const changed = computeChangedAuditFieldKeys(current, previous);
    assert.ok(changed.has('firstName'));
    assert.ok(changed.has('active'));
    assert.equal(changed.has('city'), false);
  });

  it('returns no changed keys for the first entry', () => {
    const changed = computeChangedAuditFieldKeys(JSON.stringify({ firstName: 'Jane' }), undefined);
    assert.equal(changed.size, 0);
  });

  it('builds was/now values for changed and added fields', () => {
    const previous = JSON.stringify({ firstName: 'Jane', city: 'Kampala' });
    const current = JSON.stringify({ firstName: 'Janet', city: 'Kampala', active: true });

    const fields = parseAuditTrailCommandFieldsWithDiff(current, previous);
    const firstName = fields.find((field) => field.key === 'firstName');
    const active = fields.find((field) => field.key === 'active');
    const city = fields.find((field) => field.key === 'city');

    assert.equal(firstName?.changeType, 'changed');
    assert.equal(firstName?.previousDisplay, 'Jane');
    assert.equal(firstName?.display, 'Janet');

    assert.equal(active?.changeType, 'added');
    assert.equal(active?.previousDisplay, '—');
    assert.equal(active?.display, 'Yes');

    assert.equal(city?.changeType, 'unchanged');
    assert.equal(city?.previousDisplay, undefined);
  });

  it('includes removed fields from the previous payload', () => {
    const previous = JSON.stringify({ firstName: 'Jane', nickname: 'JJ' });
    const current = JSON.stringify({ firstName: 'Jane' });

    const fields = parseAuditTrailCommandFieldsWithDiff(current, previous);
    const removed = fields.find((field) => field.key === 'nickname');

    assert.equal(removed?.changeType, 'removed');
    assert.equal(removed?.previousDisplay, 'JJ');
    assert.equal(removed?.display, '—');
  });
});
