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
  departmentActiveFormValue,
  departmentActiveFromFormValue,
  normalizeDepartmentActiveOption
} from './department-options';

describe('normalizeDepartmentActiveOption', () => {
  it('maps Fineract EnumOptionData code to boolean form values', () => {
    assert.deepEqual(normalizeDepartmentActiveOption({ id: 1, code: 'true', value: 'Active' }), {
      value: 'true',
      label: 'Active'
    });
    assert.deepEqual(normalizeDepartmentActiveOption({ id: 0, code: 'false', value: 'Inactive' }), {
      value: 'false',
      label: 'Inactive'
    });
  });
});

describe('department active form helpers', () => {
  it('round-trips active state for the status select', () => {
    assert.equal(departmentActiveFormValue(true), 'true');
    assert.equal(departmentActiveFormValue(false), 'false');
    assert.equal(departmentActiveFromFormValue('true'), true);
    assert.equal(departmentActiveFromFormValue('false'), false);
    assert.equal(departmentActiveFromFormValue('Active'), false);
  });
});
