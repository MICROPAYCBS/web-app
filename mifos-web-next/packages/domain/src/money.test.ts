/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('uses ISO currency code instead of the locale symbol', () => {
    const usd = formatMoney(1234.5, 'USD', 'en-US');
    assert.ok(usd);
    assert.match(usd, /USD/);
    assert.doesNotMatch(usd, /^\$/);

    const ugx = formatMoney(50000, 'UGX', 'en-US');
    assert.ok(ugx);
    assert.match(ugx, /UGX/);
  });
});
