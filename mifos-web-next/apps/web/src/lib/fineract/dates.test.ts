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
  fineractApiDateToFormString,
  fromFineractDateArray,
  normalizeFineractDateField,
  parseFineractDateString,
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
});
