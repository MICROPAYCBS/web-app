/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { catalogReportParameterVariable, reportEngineParameterName } from './report-parameters';

describe('reportEngineParameterName', () => {
  it('returns catalog variable for known parameters', () => {
    assert.equal(reportEngineParameterName('OfficeIdSelectOne'), 'officeId');
    assert.equal(reportEngineParameterName('startDateSelect'), 'startDate');
  });

  it('prefers per-report override when set', () => {
    assert.equal(reportEngineParameterName('OfficeIdSelectOne', 'branchId'), 'branchId');
  });

  it('returns undefined for unknown or internal parameters', () => {
    assert.equal(reportEngineParameterName('FullReportList'), undefined);
    assert.equal(catalogReportParameterVariable('customTenantParam'), undefined);
  });
});
