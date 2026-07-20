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
  buildGlAccountEnquiryDetailsUrl,
  buildGlAccountEnquiryUrl,
  glAccountEnquiryHasRequiredFilters,
  isLegacyGlAccountHistoryTab,
  parseGlAccountDetailReturnTo,
  parseGlAccountEnquiryListQuery,
  parseGlAccountHistoryQuery
} from './gl-account-enquiry-query';

describe('parseGlAccountEnquiryListQuery', () => {
  it('requires account, branch, and currency', () => {
    const incomplete = parseGlAccountEnquiryListQuery(
      {},
      { defaultCurrencyCode: 'UGX', defaultOfficeId: '1', defaultTransactionDate: '01 July 2026' }
    );
    assert.equal(incomplete.currencyCode, 'UGX');
    assert.equal(incomplete.officeId, '1');
    assert.equal(glAccountEnquiryHasRequiredFilters(incomplete), false);

    const complete = parseGlAccountEnquiryListQuery(
      { glAccountId: '55', officeId: '2', currencyCode: 'USD', departmentId: '7' },
      { defaultCurrencyCode: 'UGX', defaultOfficeId: '1', defaultTransactionDate: '01 July 2026' }
    );
    assert.equal(complete.departmentId, '7');
    assert.equal(glAccountEnquiryHasRequiredFilters(complete), true);
    assert.match(buildGlAccountEnquiryUrl(complete), /gl-account-enquiry\/55/);
    assert.doesNotMatch(buildGlAccountEnquiryUrl(complete), /tab=history/);
    assert.match(buildGlAccountEnquiryUrl(complete), /departmentId=7/);
    assert.doesNotMatch(buildGlAccountEnquiryUrl(complete), /page=/);
  });
});

describe('parseGlAccountHistoryQuery', () => {
  it('locks account from path and does not default branch or currency', () => {
    const query = parseGlAccountHistoryQuery(
      {},
      42,
      { defaultTransactionDate: '01 July 2026' }
    );
    assert.equal(query.glAccountId, '42');
    assert.equal(query.officeId, '');
    assert.equal(query.currencyCode, '');
    assert.equal(query.fromDate, '01 June 2026');
    assert.equal(query.toDate, '01 July 2026');
    assert.equal(glAccountEnquiryHasRequiredFilters(query), false);
    assert.equal(isLegacyGlAccountHistoryTab({ tab: 'history' }), true);
    assert.equal(isLegacyGlAccountHistoryTab({}), false);
  });

  it('builds enquiry details URLs without repeating glAccountId in the query', () => {
    const url = buildGlAccountEnquiryDetailsUrl(15, {
      officeId: '1',
      currencyCode: 'UGX'
    });
    assert.match(url, /\/accounting\/gl-account-enquiry\/15\?/);
    assert.doesNotMatch(url, /tab=history/);
    assert.match(url, /officeId=1/);
    assert.match(url, /currencyCode=UGX/);
    assert.doesNotMatch(url, /glAccountId=/);
  });

  it('includes departmentId 0 for unassigned rows', () => {
    const url = buildGlAccountEnquiryDetailsUrl(15, {
      officeId: '1',
      currencyCode: 'UGX',
      departmentId: '0'
    });
    assert.match(url, /departmentId=0/);
  });

  it('attaches a safe returnTo for enquiry back links', () => {
    const url = buildGlAccountEnquiryDetailsUrl(
      15,
      { officeId: '1', currencyCode: 'UGX' },
      { returnTo: '/accounting/gl-account-enquiry?officeId=1' }
    );
    assert.match(url, /returnTo=/);
    assert.match(decodeURIComponent(url), /\/accounting\/gl-account-enquiry\?officeId=1/);
    assert.equal(
      parseGlAccountDetailReturnTo({
        returnTo: '/accounting/gl-account-enquiry?officeId=2'
      }),
      '/accounting/gl-account-enquiry?officeId=2'
    );
    assert.equal(parseGlAccountDetailReturnTo({ returnTo: 'https://evil.example/' }), null);
    assert.equal(
      parseGlAccountDetailReturnTo({
        returnTo: '/accounting/gl-account-enquiry/15?officeId=1'
      }),
      null
    );
  });
});
