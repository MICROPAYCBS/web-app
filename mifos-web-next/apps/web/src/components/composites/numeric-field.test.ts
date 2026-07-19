/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeNumericInput } from './numeric-field';

describe('sanitizeNumericInput', () => {
  it('strips letters and symbols from decimal input', () => {
    assert.equal(sanitizeNumericInput('12a.3%'), '12.3');
    assert.equal(sanitizeNumericInput('e10'), '10');
  });

  it('allows only one decimal point', () => {
    assert.equal(sanitizeNumericInput('1.2.3'), '1.23');
  });

  it('respects maxDecimalPlaces', () => {
    assert.equal(sanitizeNumericInput('12.3456', { maxDecimalPlaces: 2 }), '12.34');
  });

  it('sanitizes integer input', () => {
    assert.equal(sanitizeNumericInput('12a3', { integer: true }), '123');
    assert.equal(sanitizeNumericInput('12.5', { integer: true }), '12');
  });

  it('supports optional negative values', () => {
    assert.equal(sanitizeNumericInput('-12.5', { allowNegative: true }), '-12.5');
    assert.equal(sanitizeNumericInput('-', { allowNegative: true }), '-');
    assert.equal(sanitizeNumericInput('12-3', { allowNegative: true }), '123');
  });

  it('strips minus when negatives are disallowed', () => {
    assert.equal(sanitizeNumericInput('-12'), '12');
  });
});
