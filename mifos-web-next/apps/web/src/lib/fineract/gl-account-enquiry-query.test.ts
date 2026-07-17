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
  buildGlAccountEnquiryReportParams,
  buildGlAccountEnquiryUrl,
  glAccountEnquiryHasRequiredFilters,
  parseGlAccountEnquiryListQuery
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
    assert.match(buildGlAccountEnquiryUrl(complete), /glAccountId=55/);
    assert.match(buildGlAccountEnquiryUrl(complete), /departmentId=7/);
    assert.doesNotMatch(buildGlAccountEnquiryUrl(complete), /page=/);
  });
});

describe('buildGlAccountEnquiryReportParams', () => {
  it('maps enquiry filters to General Ledger report R_ params', () => {
    const params = buildGlAccountEnquiryReportParams({
      glAccountId: '12',
      officeId: '1',
      departmentId: '7',
      currencyCode: 'UGX',
      fromDate: '01 July 2026',
      toDate: '15 July 2026'
    });
    assert.equal(params.R_officeId, '1');
    assert.equal(params.R_GLAccountNO, '12');
    assert.equal(params.R_departmentId, '7');
    assert.equal(params.R_currencyId, 'UGX');
    assert.equal(params.R_startDate, '2026-07-01');
    assert.equal(params.R_endDate, '2026-07-15');
    assert.equal(params.dateFormat, 'yyyy-MM-dd');
  });

  it('sends the SelectAll value when department is not filtered', () => {
    const params = buildGlAccountEnquiryReportParams({
      glAccountId: '12',
      officeId: '1',
      currencyCode: 'UGX',
      fromDate: '01 July 2026',
      toDate: '15 July 2026'
    });

    assert.equal(params.R_departmentId, '-1');
  });
});
