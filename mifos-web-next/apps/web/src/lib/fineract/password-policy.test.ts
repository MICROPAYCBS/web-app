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
  isSecurePasswordPolicy,
  isStrongPasswordPolicy,
  isWeakestPasswordPolicy,
  rulesForActivePasswordPreference,
  type FineractPasswordPreference
} from './password-policy-resolve';

/** Captured from GET /passwordpreferences/template on sandbox.mifos.community */
const SANDBOX_TEMPLATE: FineractPasswordPreference[] = [
  {
    id: 1,
    key: 'simple',
    active: false,
    description: 'Password most be at least 1 character and not more that 50 characters long'
  },
  {
    id: 2,
    key: 'secure',
    active: false,
    description:
      'Password must be at least 6 characters, no more than 50 characters long, must include at least one upper case letter, one lower case letter, one numeric digit and no space'
  },
  {
    id: 3,
    key: 'strong',
    active: true,
    description:
      'Password must be 12 to 50 characters long, containing at least one uppercase letter, one lowercase letter, one numeric digit, and one special character, with no spaces or consecutive repeating characters'
  }
];

describe('Fineract password policy template', () => {
  it('identifies strong policy with 12-character requirement', () => {
    const strong = SANDBOX_TEMPLATE[2]!;
    assert.equal(isStrongPasswordPolicy(strong), true);
    assert.match(strong.description ?? '', /12 to 50 characters/i);
  });

  it('identifies secure (middle) policy separately from strong', () => {
    const secure = SANDBOX_TEMPLATE[1]!;
    assert.equal(isSecurePasswordPolicy(secure), true);
    assert.equal(isStrongPasswordPolicy(secure), false);
    assert.equal(secure.key, 'secure');
  });

  it('applies 12-char rules when strong is active', () => {
    const rules = rulesForActivePasswordPreference(SANDBOX_TEMPLATE);
    assert.equal(rules.minLength, 12);
    assert.equal(rules.requireSpecialChar, true);
    assert.match(rules.hint, /12/i);
  });

  it('overrides simple active with 12-char app rules', () => {
    const simpleActive = SANDBOX_TEMPLATE.map((p) => ({
      ...p,
      active: p.key === 'simple'
    }));
    const rules = rulesForActivePasswordPreference(simpleActive);
    assert.equal(rules.minLength, 12);
    assert.equal(isWeakestPasswordPolicy(simpleActive.find((p) => p.active)!), true);
  });

  it('uses 6-char rules when secure is active', () => {
    const secureActive = SANDBOX_TEMPLATE.map((p) => ({
      ...p,
      active: p.key === 'secure'
    }));
    const rules = rulesForActivePasswordPreference(secureActive);
    assert.equal(rules.minLength, 6);
    assert.equal(rules.requireSpecialChar, false);
  });
});
