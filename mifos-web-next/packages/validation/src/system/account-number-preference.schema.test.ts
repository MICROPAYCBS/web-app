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
  buildUpdateAccountNumberPreferencePayload,
  validateCreateAccountNumberPreference,
  validateUpdateAccountNumberPreference
} from './account-number-preference.schema';

const structuredLoan = {
  structuredEnabled: true,
  formatPattern: '{officeCode:3}{productCode:2}{sequence:9}{checkDigit:1}',
  sequenceScope: 3,
  checkDigitAlgorithm: 1
};

describe('account number preference schema', () => {
  it('requires prefix text only for prefix type 401 and allows 10 characters', () => {
    const missing = validateCreateAccountNumberPreference({
      accountType: 1,
      prefixType: 401,
      prefixCharacter: null,
      structuredEnabled: false
    });
    assert.equal(missing.success, false);
    if (!missing.success) {
      assert.ok(missing.error.issues.some((issue) => issue.message === 'Enter the prefix text.'));
    }

    const tooLong = validateCreateAccountNumberPreference({
      accountType: 1,
      prefixType: 401,
      prefixCharacter: '12345678901',
      structuredEnabled: false
    });
    assert.equal(tooLong.success, false);
    if (!tooLong.success) {
      assert.ok(
        tooLong.error.issues.some(
          (issue) => issue.message === 'Prefix text can be at most 10 characters.'
        )
      );
    }

    const accepted = validateCreateAccountNumberPreference({
      accountType: 1,
      prefixType: 401,
      prefixCharacter: '1234567890',
      structuredEnabled: false
    });
    assert.equal(accepted.success, true);

    const otherPrefix = validateCreateAccountNumberPreference({
      accountType: 1,
      prefixType: 1,
      prefixCharacter: null,
      structuredEnabled: false
    });
    assert.equal(otherPrefix.success, true);
  });

  it('sends a null prefix type and prefix text when an update clears them', () => {
    const parsed = validateUpdateAccountNumberPreference({
      prefixType: null,
      prefixCharacter: '',
      structuredEnabled: false
    });
    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }
    const payload = buildUpdateAccountNumberPreferencePayload(parsed.data);
    assert.equal(payload.prefixType, null);
    assert.equal(payload.prefixCharacter, null);
  });

  it('rejects a loan pattern the server would reject', () => {
    const parsed = validateCreateAccountNumberPreference({
      accountType: 2,
      ...structuredLoan,
      formatPattern: '{productCode:2}{sequence:4}'
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some((issue) => issue.path[0] === 'formatPattern'));
    }
  });

  it('keeps the missing sequence message', () => {
    const parsed = validateCreateAccountNumberPreference({
      accountType: 1,
      structuredEnabled: true,
      formatPattern: '{officeCode:3}{clientTypeCode:1}',
      sequenceScope: 2,
      checkDigitAlgorithm: 0
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(
        parsed.error.issues.some(
          (issue) => issue.message === 'Format pattern must include exactly one sequence segment.'
        )
      );
    }
  });
});
