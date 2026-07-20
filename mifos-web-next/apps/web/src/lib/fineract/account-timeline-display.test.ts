/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatTimelineActor,
  formatTimelineActorByRole
} from './account-timeline-display';

describe('formatTimelineActor', () => {
  it('prefers full name over username', () => {
    assert.equal(
      formatTimelineActor({
        firstname: 'Jane',
        lastname: 'Doe',
        username: 'jdoe'
      }),
      'Jane Doe'
    );
  });

  it('falls back to username when names are missing', () => {
    assert.equal(
      formatTimelineActor({
        firstname: '  ',
        lastname: null,
        username: 'jdoe'
      }),
      'jdoe'
    );
  });

  it('returns undefined when nothing usable', () => {
    assert.equal(formatTimelineActor({}), undefined);
    assert.equal(formatTimelineActor(null), undefined);
  });
});

describe('formatTimelineActorByRole', () => {
  it('reads role-prefixed fields consistently', () => {
    const timeline = {
      approvedByFirstname: 'Ada',
      approvedByLastname: 'Lovelace',
      approvedByUsername: 'ada',
      activatedByUsername: 'admin'
    };
    assert.equal(formatTimelineActorByRole(timeline, 'approved'), 'Ada Lovelace');
    assert.equal(formatTimelineActorByRole(timeline, 'activated'), 'admin');
    assert.equal(formatTimelineActorByRole(timeline, 'closed'), undefined);
  });
});
