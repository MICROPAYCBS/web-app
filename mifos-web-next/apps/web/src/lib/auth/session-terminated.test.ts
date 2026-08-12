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
  sessionTerminatedLoginMessage,
  sessionTerminatedLoginReason,
  SESSION_EXPIRED_LOGIN_MESSAGE,
  SESSION_SUPERSEDED_LOGIN_MESSAGE
} from './session-terminated';

describe('sessionTerminatedLoginReason', () => {
  it('maps 401 + session-superseded on a TFA request to superseded', () => {
    assert.equal(
      sessionTerminatedLoginReason(401, 'session-superseded', true),
      'superseded'
    );
  });

  it('maps a plain TFA 401 to expired (admin revoke or token expiry)', () => {
    assert.equal(sessionTerminatedLoginReason(401, null, true), 'expired');
    assert.equal(sessionTerminatedLoginReason(401, undefined, true), 'expired');
    assert.equal(sessionTerminatedLoginReason(401, 'other', true), 'expired');
  });

  it('ignores 401s when no TFA token was sent', () => {
    assert.equal(sessionTerminatedLoginReason(401, 'session-superseded', false), null);
    assert.equal(sessionTerminatedLoginReason(401, null, false), null);
  });

  it('ignores non-401 statuses', () => {
    assert.equal(sessionTerminatedLoginReason(403, 'session-superseded', true), null);
    assert.equal(sessionTerminatedLoginReason(200, 'session-superseded', true), null);
  });
});

describe('sessionTerminatedLoginMessage', () => {
  it('uses a distinct superseded message', () => {
    assert.equal(
      sessionTerminatedLoginMessage('superseded'),
      SESSION_SUPERSEDED_LOGIN_MESSAGE
    );
    assert.equal(sessionTerminatedLoginMessage('expired'), SESSION_EXPIRED_LOGIN_MESSAGE);
  });
});
