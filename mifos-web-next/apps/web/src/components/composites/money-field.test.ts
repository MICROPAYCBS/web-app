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
  cursorAfterDigitIndex,
  digitIndexBeforeCursor,
  formatMoneyInputDisplay,
  sanitizeMoneyInput
} from './money-field';

describe('formatMoneyInputDisplay', () => {
  it('adds grouping separators to whole numbers', () => {
    assert.equal(formatMoneyInputDisplay('1234'), '1,234');
    assert.equal(formatMoneyInputDisplay('1234567'), '1,234,567');
  });

  it('preserves in-progress decimal input', () => {
    assert.equal(formatMoneyInputDisplay('1234.'), '1,234.');
    assert.equal(formatMoneyInputDisplay('1234.5'), '1,234.5');
    assert.equal(formatMoneyInputDisplay('1234.56'), '1,234.56');
  });

  it('strips pasted grouping before formatting', () => {
    assert.equal(formatMoneyInputDisplay(sanitizeMoneyInput('1,234,567.89')), '1,234,567.89');
  });
});

describe('money input cursor helpers', () => {
  it('tracks digit index across grouping separators', () => {
    assert.equal(digitIndexBeforeCursor('1,234', 3), 2);
    assert.equal(cursorAfterDigitIndex('1,234', 2), 3);
  });
});
