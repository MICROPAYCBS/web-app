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
  catalogReportParameterVariable,
  inferReportParameterPresentation,
  isReportParameterDate,
  isReportParameterSelect,
  reportEngineParameterName
} from './report-parameters';

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

describe('inferReportParameterPresentation', () => {
  it('infers date controls from catalog parameter names', () => {
    assert.deepEqual(inferReportParameterPresentation('endDateSelect'), {
      parameterDisplayType: 'date',
      selectOne: false,
      selectAll: false
    });
  });

  it('infers select-one and select-all from parameter names', () => {
    assert.deepEqual(inferReportParameterPresentation('officeIdSelectOne'), {
      selectOne: true
    });
    assert.deepEqual(inferReportParameterPresentation('currencyIdSelectAll'), {
      selectAll: true
    });
  });
});

describe('isReportParameterSelect', () => {
  it('treats select-all parameters as select controls', () => {
    assert.equal(isReportParameterSelect({ selectAll: true }), true);
  });
});

describe('isReportParameterDate', () => {
  it('detects date parameters by name', () => {
    assert.equal(isReportParameterDate({ parameterName: 'endDateSelect' }), true);
    assert.equal(isReportParameterDate({ parameterName: 'officeIdSelectOne' }), false);
  });
});
