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
  formatGlAccountEnquiryPrefixedCode,
  isCompleteGlAccountEnquiryPrefix,
  parseGlAccountEnquiryPrefix,
  prefillFiltersFromGlAccountEnquiryPrefix
} from './parse-gl-account-enquiry-prefix';

describe('formatGlAccountEnquiryPrefixedCode', () => {
  it('pads branch and department then prepends to gl code', () => {
    assert.equal(
      formatGlAccountEnquiryPrefixedCode({
        officeId: 1,
        departmentId: 2,
        glCode: '100001'
      }),
      '01-02-100001'
    );
    assert.equal(
      formatGlAccountEnquiryPrefixedCode({
        officeId: '10',
        departmentId: '3',
        glCode: '200010'
      }),
      '10-03-200010'
    );
  });

  it('uses 00 for unassigned department', () => {
    assert.equal(
      formatGlAccountEnquiryPrefixedCode({
        officeId: 1,
        departmentId: 0,
        glCode: '100001'
      }),
      '01-00-100001'
    );
    assert.equal(
      formatGlAccountEnquiryPrefixedCode({
        officeId: 1,
        glCode: '100001'
      }),
      '01-00-100001'
    );
  });
});

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

  it('resolves branch after the first two digits, then department from the rest', () => {
    assert.deepEqual(parseGlAccountEnquiryPrefix('0'), {});
    assert.deepEqual(parseGlAccountEnquiryPrefix('01'), { officeId: 1 });
    assert.deepEqual(parseGlAccountEnquiryPrefix('01-'), { officeId: 1 });
    assert.deepEqual(parseGlAccountEnquiryPrefix('0102'), {
      officeId: 1,
      departmentId: 2
    });
    assert.deepEqual(parseGlAccountEnquiryPrefix('01-02'), {
      officeId: 1,
      departmentId: 2
    });
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
  it('prefills branch as soon as two digits are present', () => {
    assert.equal(isCompleteGlAccountEnquiryPrefix('01'), false);
    assert.equal(isCompleteGlAccountEnquiryPrefix('01-02'), true);

    assert.deepEqual(
      prefillFiltersFromGlAccountEnquiryPrefix({
        glPrefix: '01',
        officeId: '',
        departmentId: ''
      }),
      { glPrefix: '01', officeId: '1', departmentId: '' }
    );

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
        glPrefix: '01-',
        officeId: '1',
        departmentId: '3'
      }),
      { glPrefix: '01-', officeId: '1', departmentId: '' }
    );
  });
});
