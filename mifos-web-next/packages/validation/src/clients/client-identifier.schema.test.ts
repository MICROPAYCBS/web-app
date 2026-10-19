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
  CLIENT_IDENTIFIER_DOCUMENT_KEY_MAX_LENGTH,
  clampDocumentKeyInput,
  clientIdentifierSchema,
  documentKeyMaxLengthForIdentityRule,
  maxLengthFromValidationRegex
} from './client-identifier.schema';

describe('maxLengthFromValidationRegex', () => {
  it('sums fixed quantifiers for National ID-style patterns', () => {
    assert.equal(maxLengthFromValidationRegex('^[A-Za-z]{2}[A-Za-z0-9]{14}$'), 16);
  });

  it('handles single fixed length classes', () => {
    assert.equal(maxLengthFromValidationRegex('^[A-Z0-9]{14}$'), 14);
  });

  it('uses the upper bound of a range quantifier', () => {
    assert.equal(maxLengthFromValidationRegex('^\\d{10,12}$'), 12);
  });

  it('counts literals and escapes', () => {
    assert.equal(maxLengthFromValidationRegex('^CM\\d{12}$'), 14);
  });

  it('returns undefined for open-ended or unsupported patterns', () => {
    assert.equal(maxLengthFromValidationRegex('^[A-Z]+$'), undefined);
    assert.equal(maxLengthFromValidationRegex('^[A-Z]{2,}$'), undefined);
    assert.equal(maxLengthFromValidationRegex('foo|bar'), undefined);
    assert.equal(maxLengthFromValidationRegex('(ab){2}'), undefined);
  });
});

describe('documentKeyMaxLengthForIdentityRule', () => {
  it('falls back to schema max when no regex', () => {
    assert.equal(documentKeyMaxLengthForIdentityRule(undefined), CLIENT_IDENTIFIER_DOCUMENT_KEY_MAX_LENGTH);
    assert.equal(
      documentKeyMaxLengthForIdentityRule({ codeValueId: 1 }),
      CLIENT_IDENTIFIER_DOCUMENT_KEY_MAX_LENGTH
    );
  });

  it('uses derived regex length when available', () => {
    assert.equal(
      documentKeyMaxLengthForIdentityRule({
        codeValueId: 1,
        validationRegex: '^[A-Za-z]{2}[A-Za-z0-9]{14}$'
      }),
      16
    );
  });
});

describe('clampDocumentKeyInput', () => {
  it('truncates to max length', () => {
    assert.equal(clampDocumentKeyInput('CM1299929292EXTRA', 16), 'CM1299929292EXTR');
    assert.equal(clampDocumentKeyInput('short', 16), 'short');
  });
});

describe('clientIdentifierSchema issuance and expiry dates', () => {
  const base = {
    documentTypeId: 1,
    status: 'Active' as const,
    documentKey: 'CM12345678'
  };

  it('accepts omitted dates', () => {
    const result = clientIdentifierSchema.safeParse(base);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.issuanceDate, undefined);
      assert.equal(result.data.expiryDate, undefined);
    }
  });

  it('accepts empty dates as unset', () => {
    const result = clientIdentifierSchema.safeParse({
      ...base,
      issuanceDate: '',
      expiryDate: ''
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.issuanceDate, undefined);
      assert.equal(result.data.expiryDate, undefined);
    }
  });

  it('accepts both dates when expiry is on or after issuance', () => {
    const result = clientIdentifierSchema.safeParse({
      ...base,
      issuanceDate: '2024-01-01',
      expiryDate: '2034-01-01'
    });
    assert.equal(result.success, true);
  });

  it('rejects expiry before issuance', () => {
    const result = clientIdentifierSchema.safeParse({
      ...base,
      issuanceDate: '2034-01-01',
      expiryDate: '2024-01-01'
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.issues[0]?.path[0], 'expiryDate');
    }
  });
});
