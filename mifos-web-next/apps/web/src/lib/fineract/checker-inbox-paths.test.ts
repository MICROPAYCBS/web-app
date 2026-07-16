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
  CHECKER_INBOX_LIST_PATH,
  CHECKER_INBOX_TAB_MY_SUBMISSIONS,
  CHECKER_INBOX_TAB_TO_REVIEW,
  checkerInboxListPath,
  parseCheckerInboxTab
} from './checker-inbox-paths';

describe('parseCheckerInboxTab', () => {
  it('defaults to to-review', () => {
    assert.equal(parseCheckerInboxTab(undefined), CHECKER_INBOX_TAB_TO_REVIEW);
    assert.equal(parseCheckerInboxTab('unknown'), CHECKER_INBOX_TAB_TO_REVIEW);
  });

  it('accepts my-submissions', () => {
    assert.equal(parseCheckerInboxTab(CHECKER_INBOX_TAB_MY_SUBMISSIONS), CHECKER_INBOX_TAB_MY_SUBMISSIONS);
  });
});

describe('checkerInboxListPath', () => {
  it('omits the default tab from the URL', () => {
    assert.equal(checkerInboxListPath({ tab: CHECKER_INBOX_TAB_TO_REVIEW }), CHECKER_INBOX_LIST_PATH);
  });

  it('includes my-submissions when set', () => {
    assert.equal(
      checkerInboxListPath({ tab: CHECKER_INBOX_TAB_MY_SUBMISSIONS }),
      `${CHECKER_INBOX_LIST_PATH}?tab=my-submissions`
    );
  });
});
