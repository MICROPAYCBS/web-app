/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildDepartmentsQueryParams } from './department-query';

describe('buildDepartmentsQueryParams', () => {
  it('includes officeId when a branch is selected', () => {
    assert.deepEqual(buildDepartmentsQueryParams({ officeId: 1 }), { officeId: '1' });
    assert.deepEqual(buildDepartmentsQueryParams({ officeId: '10' }), { officeId: '10' });
  });

  it('omits params for the unfiltered master list', () => {
    assert.equal(buildDepartmentsQueryParams({}), undefined);
    assert.equal(buildDepartmentsQueryParams({ officeId: '' }), undefined);
    assert.equal(buildDepartmentsQueryParams({ officeId: 0 }), undefined);
    assert.equal(buildDepartmentsQueryParams(), undefined);
  });
});
