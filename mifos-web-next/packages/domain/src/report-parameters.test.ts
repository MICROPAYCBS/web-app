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
  isReportCurrencyCodeParameter,
  isReportParameterDate,
  isReportParameterNumeric,
  isReportParameterSelect,
  REPORT_PARAMETER_SELECT_ALL_LABEL,
  REPORT_PARAMETER_SELECT_ALL_VALUE,
  reportEngineParameterName,
  reportRunQueryParameterVariable,
  resolveReportParameterDisplayLabel,
  withReportParameterSelectAllOption
} from './report-parameters';

describe('isReportParameterNumeric', () => {
  it('detects number format types from stretchy metadata', () => {
    assert.equal(
      isReportParameterNumeric({
        parameterName: 'OfficeIdSelectOne',
        parameterDisplayType: 'select',
        parameterFormatType: 'number'
      }),
      true
    );
    assert.equal(
      isReportParameterNumeric({
        parameterName: 'asOnDate',
        parameterDisplayType: 'date',
        parameterFormatType: 'date'
      }),
      false
    );
  });
});

describe('isReportCurrencyCodeParameter', () => {
  it('identifies currency select-all parameters by name or query variable', () => {
    assert.equal(isReportCurrencyCodeParameter('currencyIdSelectAll'), true);
    assert.equal(isReportCurrencyCodeParameter(undefined, 'currencyId'), true);
    assert.equal(isReportCurrencyCodeParameter('OfficeIdSelectOne'), false);
  });
});

describe('reportRunQueryParameterVariable', () => {
  it('uses metadata variable and ignores SQL placeholder names', () => {
    assert.equal(reportRunQueryParameterVariable('OfficeIdSelectOne', 'officeId'), 'officeId');
    assert.equal(reportRunQueryParameterVariable('asOnDate', 'asOn'), 'asOn');
  });

  it('falls back to stretchy catalog when metadata variable is missing', () => {
    assert.equal(reportRunQueryParameterVariable('OfficeIdSelectOne'), 'officeId');
    assert.equal(reportRunQueryParameterVariable('currencyIdSelectAll'), 'currencyId');
  });

  it('does not treat catalog parameter name as a runtime variable', () => {
    assert.equal(reportRunQueryParameterVariable('OfficeIdSelectOne', 'OfficeIdSelectOne'), 'officeId');
  });
});

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
    assert.equal(isReportParameterSelect({ selectOne: true }), true);
    assert.equal(isReportParameterSelect({ parameterDisplayType: 'text' }), false);
  });
});

describe('withReportParameterSelectAllOption', () => {
  it('appends All (-1) only for selectAll parameters', () => {
    const options = [{ id: 1, name: 'USD' }];
    assert.deepEqual(withReportParameterSelectAllOption(options, false), options);
    assert.deepEqual(withReportParameterSelectAllOption(options, true), [
      { id: 1, name: 'USD' },
      { id: REPORT_PARAMETER_SELECT_ALL_VALUE, name: REPORT_PARAMETER_SELECT_ALL_LABEL }
    ]);
  });

  it('does not duplicate an existing -1 option', () => {
    const withNumeric = [{ id: -1, name: 'All currencies' }, { id: 1, name: 'USD' }];
    assert.equal(withReportParameterSelectAllOption(withNumeric, true), withNumeric);

    const withString = [
      { id: '-1', name: 'All' },
      { id: 'USD', name: 'US Dollar' }
    ];
    assert.equal(withReportParameterSelectAllOption(withString, true), withString);
  });
});

describe('isReportParameterDate', () => {
  it('detects date parameters by name', () => {
    assert.equal(isReportParameterDate({ parameterName: 'endDateSelect' }), true);
    assert.equal(isReportParameterDate({ parameterName: 'officeIdSelectOne' }), false);
  });
});

describe('resolveReportParameterDisplayLabel', () => {
  it('maps catalog parameter names to professional labels', () => {
    assert.equal(resolveReportParameterDisplayLabel({ parameterName: 'endDateSelect' }), 'End Date');
    assert.equal(resolveReportParameterDisplayLabel({ parameterName: 'OfficeIdSelectOne' }), 'Branch');
    assert.equal(resolveReportParameterDisplayLabel({ parameterName: 'currencyIdSelectAll' }), 'Currency');
  });

  it('normalizes legacy Office label to Branch for office parameters', () => {
    assert.equal(
      resolveReportParameterDisplayLabel({
        parameterName: 'OfficeIdSelectOne',
        parameterLabel: 'Office'
      }),
      'Branch'
    );
  });

  it('uses stretchy parameter label instead of report SQL variable name', () => {
    assert.equal(
      resolveReportParameterDisplayLabel({
        parameterName: 'OfficeIdSelectOne',
        reportParameterName: 'branch',
        parameterLabel: 'Branch'
      }),
      'Branch'
    );
    assert.equal(
      resolveReportParameterDisplayLabel({
        parameterName: 'currencyIdSelectAll',
        reportParameterName: 'currencyId',
        parameterLabel: 'Currency'
      }),
      'Currency'
    );
    assert.equal(
      resolveReportParameterDisplayLabel({
        parameterName: 'asOnDate',
        reportParameterName: 'date',
        parameterLabel: 'As On Date'
      }),
      'As On Date'
    );
  });

  it('ignores internal displayLabel values from legacy APIs', () => {
    assert.equal(
      resolveReportParameterDisplayLabel({
        parameterName: 'OfficeIdSelectOne',
        displayLabel: 'branch',
        parameterLabel: 'Branch'
      }),
      'Branch'
    );
  });

  it('formats camelCase fallback labels from metadata', () => {
    assert.equal(
      resolveReportParameterDisplayLabel({
        parameterName: 'endDateSelect',
        parameterLabel: 'endDate'
      }),
      'End Date'
    );
  });
});
