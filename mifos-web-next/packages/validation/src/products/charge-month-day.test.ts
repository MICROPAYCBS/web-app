/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chargeMonthDayFromApi } from './charge-month-day';

describe('chargeMonthDayFromApi', () => {
  it('reads the shapes a charge record uses for its due date', () => {
    assert.equal(chargeMonthDayFromApi('04 Mar'), '04 Mar');
    assert.equal(chargeMonthDayFromApi('1 January'), '01 Jan');
    assert.equal(chargeMonthDayFromApi([6, 15]), '15 Jun');
    assert.equal(chargeMonthDayFromApi([2024, 6, 15]), '15 Jun');
    assert.equal(chargeMonthDayFromApi('--03-04'), '04 Mar');
    assert.equal(chargeMonthDayFromApi({ monthValue: 3, dayOfMonth: 4 }), '04 Mar');
    assert.equal(chargeMonthDayFromApi({ month: 'JUNE', day: 6 }), '06 Jun');
  });
});
