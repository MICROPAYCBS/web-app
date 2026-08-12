/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeUserSession } from './user-session-normalize';
import {
  truncateUserAgent,
  userSessionStatusLabel,
  userSessionStatusVariant
} from './user-session-display';

describe('truncateUserAgent', () => {
  it('renders a dash for missing user agents', () => {
    assert.equal(truncateUserAgent(null), '—');
    assert.equal(truncateUserAgent(undefined), '—');
    assert.equal(truncateUserAgent(''), '—');
  });

  it('keeps short strings and truncates long ones', () => {
    assert.equal(truncateUserAgent('Mozilla/5.0'), 'Mozilla/5.0');
    const long = 'M'.repeat(80);
    const truncated = truncateUserAgent(long);
    assert.equal(truncated.endsWith('…'), true);
    assert.ok(truncated.length <= 48);
  });
});

describe('userSessionStatusLabel', () => {
  it('labels active, expired, superseded, and revoked sessions', () => {
    assert.equal(userSessionStatusLabel({ active: true, revocationReason: null }), 'Active');
    assert.equal(userSessionStatusLabel({ active: false, revocationReason: null }), 'Expired');
    assert.equal(
      userSessionStatusLabel({ active: false, revocationReason: 'SUPERSEDED_BY_NEW_LOGIN' }),
      'Signed in on another device'
    );
    assert.equal(
      userSessionStatusLabel({ active: false, revocationReason: 'REVOKED_BY_ADMIN' }),
      'Revoked'
    );
  });
});

describe('userSessionStatusVariant', () => {
  it('uses distinct badges for live vs ended sessions', () => {
    assert.equal(userSessionStatusVariant({ active: true, revocationReason: null }), 'default');
    assert.equal(userSessionStatusVariant({ active: false, revocationReason: null }), 'secondary');
    assert.equal(
      userSessionStatusVariant({ active: false, revocationReason: 'REVOKED_BY_ADMIN' }),
      'destructive'
    );
  });
});

describe('normalizeUserSession', () => {
  it('accepts nullable ip and user agent without crashing', () => {
    const session = normalizeUserSession({
      id: 42,
      userId: 7,
      username: 'jdoe',
      validFrom: [2026, 8, 12, 9, 30, 0],
      validTo: [2026, 8, 12, 17, 30, 0],
      ipAddress: null,
      userAgent: null,
      active: true,
      revocationReason: null
    });
    assert.ok(session);
    assert.equal(session?.ipAddress, null);
    assert.equal(session?.userAgent, null);
    assert.equal(truncateUserAgent(session?.userAgent), '—');
  });
});
