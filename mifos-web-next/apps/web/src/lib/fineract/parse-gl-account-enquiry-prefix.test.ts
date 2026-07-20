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
  isCompleteGlAccountEnquiryPrefix,
  parseGlAccountEnquiryPrefix,
  prefillFiltersFromGlAccountEnquiryPrefix
} from './parse-gl-account-enquiry-prefix';

describe('parseGlAccountEnquiryPrefix', () => {
  it('maps XX-XX to office then department ids', () => {
    assert.deepEqual(parseGlAccountEnquiryPrefix('01-02'), {
      officeId: 1,
      departmentId: 2
    });
    assert.deepEqual(parseGlAccountEnquiryPrefix('10-03'), {
      officeId: 10,
      departmentId: 3
    });
  });

  it('resolves department first when the prefix is incomplete', () => {
    assert.deepEqual(parseGlAccountEnquiryPrefix('02'), { departmentId: 2 });
    assert.deepEqual(parseGlAccountEnquiryPrefix('01-'), { departmentId: 1 });
    assert.deepEqual(parseGlAccountEnquiryPrefix('-07'), { departmentId: 7 });
    assert.deepEqual(parseGlAccountEnquiryPrefix(''), {});
    assert.deepEqual(parseGlAccountEnquiryPrefix('  '), {});
  });

  it('ignores non-digit noise inside segments', () => {
    assert.deepEqual(parseGlAccountEnquiryPrefix('01a-02b'), {
      officeId: 1,
      departmentId: 2
    });
  });
});

describe('prefillFiltersFromGlAccountEnquiryPrefix', () => {
  it('prefills office and department only when the prefix is complete', () => {
    assert.equal(isCompleteGlAccountEnquiryPrefix('01-02'), true);
    assert.equal(isCompleteGlAccountEnquiryPrefix('02'), false);

    assert.deepEqual(
      prefillFiltersFromGlAccountEnquiryPrefix({
        glPrefix: '01-02',
        officeId: '',
        departmentId: ''
      }),
      { glPrefix: '01-02', officeId: '1', departmentId: '2' }
    );

    assert.deepEqual(
      prefillFiltersFromGlAccountEnquiryPrefix({
        glPrefix: '07',
        officeId: '9',
        departmentId: '3'
      }),
      { glPrefix: '07', officeId: '9', departmentId: '3' }
    );
  });
});
