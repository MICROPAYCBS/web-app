/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCheckerInboxSearchParams } from './checker-inbox-query';

describe('buildCheckerInboxSearchParams', () => {
  it('omits blank values and trims whitespace', () => {
    assert.deepEqual(
      buildCheckerInboxSearchParams({
        maker: '  App Administrator ',
        actionName: '',
        entityName: '   '
      }),
      { maker: 'App Administrator' }
    );
  });

  it('returns an empty object when no filters are active', () => {
    assert.deepEqual(buildCheckerInboxSearchParams({}), {});
    assert.deepEqual(buildCheckerInboxSearchParams({ id: '  ' }), {});
  });
});
