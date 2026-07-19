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
  isCheckerInboxItemMaker,
  resolveCheckerInboxSelfApprovalBlock
} from './checker-inbox-self-approval';

describe('isCheckerInboxItemMaker', () => {
  it('matches maker username case-insensitively', () => {
    assert.equal(
      isCheckerInboxItemMaker('App.Administrator', { username: 'app.administrator' }),
      true
    );
    assert.equal(isCheckerInboxItemMaker('maker', { username: 'checker' }), false);
  });
});

describe('resolveCheckerInboxSelfApprovalBlock', () => {
  it('blocks when the current user is the maker', () => {
    const block = resolveCheckerInboxSelfApprovalBlock('maker', { username: 'maker' });
    assert.equal(block.blocked, true);
    assert.match(block.reason ?? '', /Another checker must approve or reject it/);
  });

  it('allows when the current user is not the maker', () => {
    assert.deepEqual(resolveCheckerInboxSelfApprovalBlock('maker', { username: 'checker' }), {
      blocked: false
    });
  });
});
