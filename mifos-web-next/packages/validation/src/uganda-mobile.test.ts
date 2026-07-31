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
  formatUgandaPhonePresentation,
  isValidUgandaMobileInternational,
  normalizeUgandaMobileInternational,
  optionalUgandaMobileInternationalSchema,
  preparePhoneForValidation,
  ugandaMobileInternationalSchema,
  ugandaPhoneTelHref
} from './uganda-mobile';

describe('preparePhoneForValidation', () => {
  it('removes spaces before validation', () => {
    assert.equal(preparePhoneForValidation(' +256 712 345 678 '), '+256712345678');
    assert.equal(preparePhoneForValidation('+256 417 000 000'), '+256417000000');
    assert.equal(preparePhoneForValidation('0700 123 456'), '0700123456');
  });
});

describe('isValidUgandaMobileInternational', () => {
  it('accepts mobile numbers with spaces removed', () => {
    assert.equal(isValidUgandaMobileInternational('+256712345678'), true);
    assert.equal(isValidUgandaMobileInternational('+256 712 345 678'), true);
    assert.equal(isValidUgandaMobileInternational(' +256712 345678 '), true);
  });

  it('accepts landline numbers with spaces removed', () => {
    assert.equal(isValidUgandaMobileInternational('+256417000000'), true);
    assert.equal(isValidUgandaMobileInternational('+256 417 000 000'), true);
  });

  it('accepts local numbers that normalize to international format', () => {
    assert.equal(isValidUgandaMobileInternational('0700123456'), true);
    assert.equal(isValidUgandaMobileInternational('0417000000'), true);
  });

  it('rejects invalid numbers even after stripping spaces', () => {
    assert.equal(isValidUgandaMobileInternational('+25671234567'), false);
    assert.equal(isValidUgandaMobileInternational('+2567123456789'), false);
    assert.equal(isValidUgandaMobileInternational('041700000'), false);
  });
});

describe('normalizeUgandaMobileInternational', () => {
  it('normalizes spaced mobile numbers to international format', () => {
    assert.equal(normalizeUgandaMobileInternational('0700 123 456'), '+256700123456');
    assert.equal(normalizeUgandaMobileInternational('+256 712 345 678'), '+256712345678');
  });

  it('normalizes spaced landline numbers to international format', () => {
    assert.equal(normalizeUgandaMobileInternational('0417 000 000'), '+256417000000');
    assert.equal(normalizeUgandaMobileInternational('+256 417 000 000'), '+256417000000');
  });
});

describe('ugandaMobileInternationalSchema', () => {
  it('parses spaced mobile numbers to compact international format', () => {
    const result = ugandaMobileInternationalSchema.safeParse('+256 712 345 678');
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, '+256712345678');
    }
  });

  it('parses spaced landline numbers to compact international format', () => {
    const result = ugandaMobileInternationalSchema.safeParse('+256 417 000 000');
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, '+256417000000');
    }
  });
});

describe('formatUgandaPhonePresentation', () => {
  it('formats compact international numbers in groups of three', () => {
    assert.equal(formatUgandaPhonePresentation('+256712345678'), '+256 712 345 678');
    assert.equal(formatUgandaPhonePresentation('+256417000000'), '+256 417 000 000');
    assert.equal(formatUgandaPhonePresentation('+256 712 345 678'), '+256 712 345 678');
  });

  it('formats partial input while typing', () => {
    assert.equal(formatUgandaPhonePresentation('+256712'), '+256 712');
    assert.equal(formatUgandaPhonePresentation('+256'), '+256');
  });

  it('returns non-phone values unchanged', () => {
    assert.equal(formatUgandaPhonePresentation('info@acme.com'), 'info@acme.com');
  });
});

describe('ugandaPhoneTelHref', () => {
  it('returns compact E.164 for tel links', () => {
    assert.equal(ugandaPhoneTelHref('+256 712 345 678'), '+256712345678');
    assert.equal(ugandaPhoneTelHref('info@acme.com'), undefined);
  });
});

describe('optionalUgandaMobileInternationalSchema', () => {
  it('treats whitespace-only values as empty', () => {
    const result = optionalUgandaMobileInternationalSchema.safeParse('   ');
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, '');
    }
  });

  it('accepts spaced optional landline numbers', () => {
    const result = optionalUgandaMobileInternationalSchema.safeParse('+256 417 000 000');
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, '+256417000000');
    }
  });
});
