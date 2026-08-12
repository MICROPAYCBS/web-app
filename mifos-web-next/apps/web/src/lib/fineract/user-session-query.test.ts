/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseUserSessionHistoryQuery } from './user-session-query';

describe('parseUserSessionHistoryQuery', () => {
  it('defaults limit to 50 and ignores invalid dates', () => {
    const query = parseUserSessionHistoryQuery({
      page: '2',
      userId: '7',
      fromDate: 'not-a-date',
      toDate: '2026-08-12'
    });
    assert.equal(query.limit, 50);
    assert.equal(query.offset, 100);
    assert.equal(query.userId, 7);
    assert.equal(query.fromDate, undefined);
    assert.equal(query.toDate, '2026-08-12');
  });

  it('caps limit at 200', () => {
    const query = parseUserSessionHistoryQuery({ limit: '500' });
    assert.equal(query.limit, 200);
    assert.equal(query.offset, 0);
  });
});
