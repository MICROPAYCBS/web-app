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
  dedupePermissionUsageByCode,
  normalizePermissionUsage
} from '@/lib/fineract/permission-usage';

describe('permission-usage', () => {
  it('trims trailing spaces on code and entity', () => {
    const permission = normalizePermissionUsage({
      grouping: 'account_transfer',
      code: 'CREATE_STANDINGINSTRUCTION ',
      entityName: 'STANDINGINSTRUCTION ',
      actionName: 'CREATE',
      selected: true
    });

    assert.deepEqual(permission, {
      grouping: 'account_transfer',
      code: 'CREATE_STANDINGINSTRUCTION',
      entityName: 'STANDINGINSTRUCTION',
      actionName: 'CREATE',
      selected: true
    });
  });

  it('dedupes padded and clean standing-instruction codes', () => {
    const permissions = dedupePermissionUsageByCode([
      {
        grouping: 'account_transfer',
        code: 'CREATE_STANDINGINSTRUCTION',
        entityName: 'STANDINGINSTRUCTION',
        actionName: 'CREATE',
        selected: false
      },
      {
        grouping: 'account_transfer',
        code: 'CREATE_STANDINGINSTRUCTION',
        entityName: 'STANDINGINSTRUCTION',
        actionName: 'CREATE',
        selected: true
      }
    ]);

    assert.equal(permissions.length, 1);
    assert.equal(permissions[0]?.code, 'CREATE_STANDINGINSTRUCTION');
    assert.equal(permissions[0]?.selected, true);
  });
});
