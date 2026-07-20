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
  advancedGlAccountEnquiryHasActiveFilters,
  buildAdvancedGlAccountEnquiryApiParams,
  buildAdvancedGlAccountEnquiryUrl,
  parseAdvancedGlAccountEnquiryListQuery
} from './advanced-gl-account-enquiry-query';
import { prefillFiltersFromGlAccountEnquiryPrefix } from './parse-gl-account-enquiry-prefix';

describe('parseAdvancedGlAccountEnquiryListQuery', () => {
  it('parses status, description, zeroBalance, and currency; empty filters are inactive', () => {
    const empty = parseAdvancedGlAccountEnquiryListQuery({});
    assert.equal(advancedGlAccountEnquiryHasActiveFilters(empty), false);
    assert.equal(buildAdvancedGlAccountEnquiryApiParams(empty), null);
    assert.equal(empty.zeroBalance, false);
    assert.equal(empty.description, '');

    const full = parseAdvancedGlAccountEnquiryListQuery({
      ledgerNumber: '001',
      description: 'cash',
      officeId: '2',
      departmentId: '3',
      currencyCode: 'ugx',
      status: 'enabled',
      zeroBalance: 'true'
    });
    assert.equal(full.currencyCode, 'UGX');
    assert.equal(full.status, 'enabled');
    assert.equal(full.departmentId, '3');
    assert.equal(full.description, 'cash');
    assert.equal(full.zeroBalance, true);
    assert.equal(full.glPrefix, '');
    assert.equal(advancedGlAccountEnquiryHasActiveFilters(full), true);
  });

  it('expands legacy glPrefix into office/department and drops glPrefix', () => {
    const query = parseAdvancedGlAccountEnquiryListQuery({ glPrefix: '01-02' });
    assert.equal(query.glPrefix, '');
    assert.equal(query.officeId, '1');
    assert.equal(query.departmentId, '2');
    assert.equal(advancedGlAccountEnquiryHasActiveFilters(query), true);
  });
});

describe('buildAdvancedGlAccountEnquiryApiParams', () => {
  it('never sends glPrefix; uses officeId and departmentId only', () => {
    const prefilled = prefillFiltersFromGlAccountEnquiryPrefix({
      glPrefix: '01-02',
      ledgerNumber: '',
      description: '',
      officeId: '',
      departmentId: '',
      currencyCode: '',
      status: '',
      zeroBalance: false
    });
    assert.deepEqual(buildAdvancedGlAccountEnquiryApiParams(prefilled), {
      officeId: '1',
      departmentId: '2'
    });
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        buildAdvancedGlAccountEnquiryApiParams(prefilled) ?? {},
        'glPrefix'
      ),
      false
    );
  });

  it('rejects prefix-only draft until branch/department are prefilled', () => {
    assert.equal(
      buildAdvancedGlAccountEnquiryApiParams({
        glPrefix: '01-02',
        ledgerNumber: '',
        description: '',
        officeId: '',
        departmentId: '',
        currencyCode: '',
        status: '',
        zeroBalance: false
      }),
      null
    );
  });

  it('maps UI status to disabled query param and omits unset filters', () => {
    assert.deepEqual(
      buildAdvancedGlAccountEnquiryApiParams({
        glPrefix: '',
        ledgerNumber: '55',
        description: '',
        officeId: '1',
        departmentId: '',
        currencyCode: 'USD',
        status: 'disabled',
        zeroBalance: false
      }),
      { ledgerNumber: '55', officeId: '1', currencyCode: 'USD', disabled: 'true' }
    );
  });

  it('maps description and zeroBalance to API params', () => {
    assert.deepEqual(
      buildAdvancedGlAccountEnquiryApiParams({
        glPrefix: '',
        ledgerNumber: '',
        description: '  Petty cash  ',
        officeId: '',
        departmentId: '',
        currencyCode: '',
        status: '',
        zeroBalance: true
      }),
      { description: 'Petty cash', zeroBalance: 'true' }
    );
  });

  it('builds URL without glPrefix and with description / zeroBalance', () => {
    const url = buildAdvancedGlAccountEnquiryUrl({
      glPrefix: '01-02',
      ledgerNumber: '',
      description: 'cash',
      officeId: '1',
      departmentId: '2',
      currencyCode: '',
      status: 'disabled',
      zeroBalance: true
    });
    assert.match(url, /\/accounting\/gl-account-enquiry\?/);
    assert.match(url, /officeId=1/);
    assert.match(url, /departmentId=2/);
    assert.match(url, /status=disabled/);
    assert.match(url, /description=cash/);
    assert.match(url, /zeroBalance=true/);
    assert.doesNotMatch(url, /glPrefix=/);
    assert.doesNotMatch(url, /disabled=/);
  });
});
