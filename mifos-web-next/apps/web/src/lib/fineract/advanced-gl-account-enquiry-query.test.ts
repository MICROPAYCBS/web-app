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

describe('parseAdvancedGlAccountEnquiryListQuery', () => {
  it('parses status and currency; empty filters are inactive', () => {
    const empty = parseAdvancedGlAccountEnquiryListQuery({});
    assert.equal(advancedGlAccountEnquiryHasActiveFilters(empty), false);
    assert.equal(buildAdvancedGlAccountEnquiryApiParams(empty), null);

    const full = parseAdvancedGlAccountEnquiryListQuery({
      glPrefix: '100',
      ledgerNumber: '001',
      officeId: '2',
      currencyCode: 'ugx',
      status: 'enabled'
    });
    assert.equal(full.currencyCode, 'UGX');
    assert.equal(full.status, 'enabled');
    assert.equal(advancedGlAccountEnquiryHasActiveFilters(full), true);
  });
});

describe('buildAdvancedGlAccountEnquiryApiParams', () => {
  it('maps UI status to disabled query param and omits unset filters', () => {
    assert.deepEqual(
      buildAdvancedGlAccountEnquiryApiParams({
        glPrefix: '100',
        ledgerNumber: '',
        officeId: '',
        currencyCode: '',
        status: 'enabled'
      }),
      { glPrefix: '100', disabled: 'false' }
    );

    assert.deepEqual(
      buildAdvancedGlAccountEnquiryApiParams({
        glPrefix: '',
        ledgerNumber: '55',
        officeId: '1',
        currencyCode: 'USD',
        status: 'disabled'
      }),
      { ledgerNumber: '55', officeId: '1', currencyCode: 'USD', disabled: 'true' }
    );
  });

  it('builds URL with UI status (not API disabled) for shareable filters', () => {
    const url = buildAdvancedGlAccountEnquiryUrl({
      glPrefix: '1',
      ledgerNumber: '',
      officeId: '',
      currencyCode: '',
      status: 'disabled'
    });
    assert.match(url, /\/accounting\/gl-account-enquiry\?/);
    assert.match(url, /glPrefix=1/);
    assert.match(url, /status=disabled/);
    assert.doesNotMatch(url, /disabled=/);
  });
});
