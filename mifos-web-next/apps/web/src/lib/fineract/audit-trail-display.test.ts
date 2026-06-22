/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatAuditTrailDateTime } from './audit-trail-display';
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
