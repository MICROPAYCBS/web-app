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
  coerceFineractDateTime,
  fineractApiDateToFormString,
  formatFineractDateTimeArray,
  formatFineractDateValue,
  fromFineractDateArray,
  normalizeFineractDateField,
  parseFineractDateString,
  parseFineractDateTimeString,
  toFineractDate
} from './dates';

describe('fineract date serialization', () => {
  it('round-trips Fineract date arrays without day shift', () => {
    const form = fineractApiDateToFormString([2026, 3, 1]);
    assert.equal(form, '01 March 2026');
    const parsed = parseFineractDateString(form!);
    assert.equal(parsed?.getFullYear(), 2026);
    assert.equal(parsed?.getMonth(), 2);
    assert.equal(parsed?.getDate(), 1);
  });

  it('normalizes unpadded Fineract strings to dd MMMM yyyy', () => {
    assert.equal(normalizeFineractDateField('1 March 2026'), '01 March 2026');
    assert.equal(normalizeFineractDateField('01 March 2026'), '01 March 2026');
  });

  it('formats local calendar dates with zero-padded day', () => {
    assert.equal(toFineractDate(fromFineractDateArray([2026, 3, 1])!), '01 March 2026');
  });

  it('formats Fineract date arrays for schedule display', () => {
    assert.match(formatFineractDateValue([2026, 8, 1]) ?? '', /Aug.*1.*2026|1.*Aug.*2026/i);
    assert.equal(formatFineractDateValue('01 August 2026'), 'Aug 1, 2026');
  });

  it('formats Fineract datetime arrays with time', () => {
    const formatted = formatFineractDateTimeArray([2026, 3, 1, 14, 30, 0], 'en');
    assert.ok(formatted?.includes('Mar'));
    assert.ok(formatted?.includes('1'));
    assert.ok(formatted?.includes('2:30') || formatted?.includes('14:30'));
  });

  it('coerces epoch millis from Fineract ZonedDateTime serialization', () => {
    assert.equal(coerceFineractDateTime(1_718_000_000_000), 1_718_000_000_000);
  });

  it('parses Fineract datetime strings', () => {
    const parsed = parseFineractDateTimeString('22 June 2026 12:46:47');
    assert.equal(parsed?.getFullYear(), 2026);
    assert.equal(parsed?.getMonth(), 5);
    assert.equal(parsed?.getDate(), 22);
    assert.equal(parsed?.getHours(), 12);
    assert.equal(parsed?.getMinutes(), 46);
  });
});
