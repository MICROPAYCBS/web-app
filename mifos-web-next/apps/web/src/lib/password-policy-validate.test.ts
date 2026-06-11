/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPasswordPolicyChecks,
  DEFAULT_PASSWORD_POLICY,
  passwordMeetsPolicy
} from './password-policy-validate';

const SECURE_POLICY = {
  ...DEFAULT_PASSWORD_POLICY,
  minLength: 6,
  requireSpecialChar: false,
  disallowConsecutiveRepeats: false
};

describe('buildPasswordPolicyChecks', () => {
  it('marks strong-policy rules as they are satisfied', () => {
    const checks = buildPasswordPolicyChecks('Abcdef1!ghij', DEFAULT_PASSWORD_POLICY);
    assert.equal(checks.every((c) => c.met), true);
  });

  it('leaves pending rules unchecked for partial passwords', () => {
    const checks = buildPasswordPolicyChecks('abc', DEFAULT_PASSWORD_POLICY);
    const byId = Object.fromEntries(checks.map((c) => [c.id, c.met]));
    assert.equal(byId.minLength, false);
    assert.equal(byId.uppercase, false);
    assert.equal(byId.digit, false);
    assert.equal(byId.specialChar, false);
  });

  it('omits special character when secure policy is active', () => {
    const checks = buildPasswordPolicyChecks('Abcdef1', SECURE_POLICY);
    assert.equal(checks.some((c) => c.id === 'specialChar'), false);
    assert.equal(passwordMeetsPolicy('Abcdef1', SECURE_POLICY), true);
  });
});
