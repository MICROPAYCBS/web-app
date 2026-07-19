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
  clientListParamsForOfficeScope,
  resolveOfficeHierarchy
} from '@/lib/dashboard/office-scope';

describe('resolveOfficeHierarchy', () => {
  it('returns the hierarchy path for a known office', () => {
    assert.equal(
      resolveOfficeHierarchy(1, [
        { id: 1, name: 'Head Office', hierarchy: '.' },
        { id: 2, name: 'Branch A', hierarchy: '.1.', parentId: 1 }
      ]),
      '.'
    );
  });
});

describe('clientListParamsForOfficeScope', () => {
  it('uses underHierarchy when a hierarchy path is available', () => {
    assert.deepEqual(clientListParamsForOfficeScope(1, '.'), {
      underHierarchy: '.'
    });
  });

  it('falls back to officeId when hierarchy is unavailable', () => {
    assert.deepEqual(clientListParamsForOfficeScope(2, null), {
      officeId: '2'
    });
  });
});
