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
  it('parses status, description, excludeZeroBalance, and currency; empty filters are inactive', () => {
    const empty = parseAdvancedGlAccountEnquiryListQuery({});
    assert.equal(advancedGlAccountEnquiryHasActiveFilters(empty), false);
    assert.equal(buildAdvancedGlAccountEnquiryApiParams(empty), null);
    assert.equal(empty.excludeZeroBalance, true);
    assert.equal(empty.description, '');

    const full = parseAdvancedGlAccountEnquiryListQuery({
      ledgerNumber: '001',
      description: 'cash',
      officeId: '2',
      departmentId: '3',
      currencyCode: 'ugx',
      status: 'enabled',
      excludeZeroBalance: 'false'
    });
    assert.equal(full.currencyCode, 'UGX');
    assert.equal(full.status, 'enabled');
    assert.equal(full.departmentId, '3');
    assert.equal(full.description, 'cash');
    assert.equal(full.excludeZeroBalance, false);
    assert.equal(full.glPrefix, '');
    assert.equal(advancedGlAccountEnquiryHasActiveFilters(full), true);
  });

  it('defaults excludeZeroBalance to true when omitted', () => {
    const query = parseAdvancedGlAccountEnquiryListQuery({ ledgerNumber: '100' });
    assert.equal(query.excludeZeroBalance, true);
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
      excludeZeroBalance: true
    });
    assert.deepEqual(buildAdvancedGlAccountEnquiryApiParams(prefilled), {
      officeId: '1',
      departmentId: '2',
      excludeZeroBalance: 'true'
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
        excludeZeroBalance: true
      }),
      null
    );
  });

  it('does not treat excludeZeroBalance alone as a search criterion', () => {
    assert.equal(
      buildAdvancedGlAccountEnquiryApiParams({
        glPrefix: '',
        ledgerNumber: '',
        description: '',
        officeId: '',
        departmentId: '',
        currencyCode: '',
        status: '',
        excludeZeroBalance: false
      }),
      null
    );
  });

  it('maps UI status to disabled query param and sends excludeZeroBalance', () => {
    assert.deepEqual(
      buildAdvancedGlAccountEnquiryApiParams({
        glPrefix: '',
        ledgerNumber: '55',
        description: '',
        officeId: '1',
        departmentId: '',
        currencyCode: 'USD',
        status: 'disabled',
        excludeZeroBalance: true
      }),
      {
        ledgerNumber: '55',
        officeId: '1',
        currencyCode: 'USD',
        disabled: 'true',
        excludeZeroBalance: 'true'
      }
    );
  });

  it('maps description and include-zero opt-in to API params', () => {
    assert.deepEqual(
      buildAdvancedGlAccountEnquiryApiParams({
        glPrefix: '',
        ledgerNumber: '',
        description: '  Petty cash  ',
        officeId: '',
        departmentId: '',
        currencyCode: '',
        status: '',
        excludeZeroBalance: false
      }),
      { description: 'Petty cash', excludeZeroBalance: 'false' }
    );
  });

  it('builds URL without glPrefix; only persists excludeZeroBalance when false', () => {
    const excluded = buildAdvancedGlAccountEnquiryUrl({
      glPrefix: '01-02',
      ledgerNumber: '',
      description: 'cash',
      officeId: '1',
      departmentId: '2',
      currencyCode: '',
      status: 'disabled',
      excludeZeroBalance: true
    });
    assert.match(excluded, /\/accounting\/gl-account-enquiry\?/);
    assert.match(excluded, /officeId=1/);
    assert.match(excluded, /departmentId=2/);
    assert.match(excluded, /status=disabled/);
    assert.match(excluded, /description=cash/);
    assert.doesNotMatch(excluded, /excludeZeroBalance=/);
    assert.doesNotMatch(excluded, /glPrefix=/);
    assert.doesNotMatch(excluded, /disabled=/);

    const included = buildAdvancedGlAccountEnquiryUrl({
      glPrefix: '',
      ledgerNumber: '55',
      description: '',
      officeId: '',
      departmentId: '',
      currencyCode: '',
      status: '',
      excludeZeroBalance: false
    });
    assert.match(included, /ledgerNumber=55/);
    assert.match(included, /excludeZeroBalance=false/);
  });
});
