/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeUserSessionDraft } from './session-draft';
import type { UserWizardDraft } from './types';

function sampleDraft(overrides: Partial<UserWizardDraft> = {}): UserWizardDraft {
  return {
    username: 'ada',
    email: 'ada@example.com',
    firstname: 'Ada',
    lastname: 'Lovelace',
    sendPasswordToEmail: false,
    passwordNeverExpires: false,
    isLoginRetriesEnabled: false,
    isPasswordResetAllowed: false,
    password: 'secret',
    repeatPassword: 'secret',
    officeId: '1',
    staffId: '2',
    roles: [3],
    ...overrides
  };
}

describe('sanitizeUserSessionDraft', () => {
  it('strips passwords so they are not written to sessionStorage', () => {
    const sanitized = sanitizeUserSessionDraft(sampleDraft());
    assert.equal(sanitized.password, '');
    assert.equal(sanitized.repeatPassword, '');
    assert.equal(sanitized.username, 'ada');
    assert.equal(sanitized.staffId, '2');
  });
});
