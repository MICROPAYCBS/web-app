/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatActionErrorMessage } from './to-fineract-action-error';

describe('formatActionErrorMessage', () => {
  it('does not surface a bare email field key as the only message', () => {
    const message = formatActionErrorMessage('email', { email: 'email' });
    assert.match(message, /Email needs attention/i);
    assert.doesNotMatch(message, /^email$/);
  });

  it('keeps a full field sentence without wrapping it as [email]', () => {
    const message = formatActionErrorMessage('Please correct the validation errors.', {
      email:
        'Could not send the password email. Confirm the address is correct and that email delivery is configured, or turn off Send password to email and set a password on the Sign-in step.'
    });
    assert.match(message, /Could not send the password email/);
    assert.doesNotMatch(message, /^\[email\]/);
  });

  it('does not duplicate the same global and field charge-tier message', () => {
    const copy = 'Add at least one charge tier when Use charge tiers is on.';
    const message = formatActionErrorMessage(copy, { chargeTiers: copy });
    assert.equal(message, copy);
  });
});
