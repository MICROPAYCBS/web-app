/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractReportRunResult } from '@mifos/api-client';
import {
  buildReportRunQueryParams,
  formatReportRunDateValue,
  formatReportRunParameterValues,
  mergeReportRunParameters,
  parseReportParameterMetadata
} from './report-run-display';

function parameterListResult(rows: Record<string, unknown>[]): FineractReportRunResult {
  return {
    columnHeaders: Object.keys(rows[0] ?? {}).map((columnName) => ({
      columnName,
      columnType: 'VARCHAR'
    })),
    data: rows.map((row) => ({ row: Object.values(row) }))
  };
}

describe('parseReportParameterMetadata', () => {
  it('reads PostgreSQL lower-case column names and boolean flags', () => {
    const metadata = parseReportParameterMetadata(
      parameterListResult([
        {
          parameter_name: 'endDateSelect',
          parameter_label: 'End date',
          parameter_variable: 'endDate',
          parameter_displaytype: 'date',
          selectone: 'N',
          selectall: 'N'
        },
        {
          parameter_name: 'officeIdSelectOne',
          parameter_label: 'Office',
          parameter_variable: 'officeId',
          parameter_displaytype: 'select',
          selectone: 'Y',
          selectall: 'N'
        },
        {
          parameter_name: 'currencyIdSelectAll',
          parameter_label: 'Currency',
          parameter_variable: 'currencyId',
          parameter_displaytype: 'select',
          selectone: 'N',
          selectall: 'Y'
        }
      ])
    );

    assert.equal(metadata.length, 3);

    const endDate = metadata.find((entry) => entry.parameterName === 'endDateSelect');
    assert.equal(endDate?.parameterDisplayType, 'date');
    assert.equal(endDate?.selectOne, false);

    const office = metadata.find((entry) => entry.parameterName === 'officeIdSelectOne');
    assert.equal(office?.selectOne, true);
    assert.equal(office?.selectAll, false);

    const currency = metadata.find((entry) => entry.parameterName === 'currencyIdSelectAll');
    assert.equal(currency?.selectOne, false);
    assert.equal(currency?.selectAll, true);
  });

  it('infers control types from catalog parameter names when flags are missing', () => {
    const metadata = parseReportParameterMetadata(
      parameterListResult([
        {
          parameter_name: 'endDateSelect',
          parameter_label: 'End date',
          parameter_variable: 'endDate'
        },
        {
          parameter_name: 'officeIdSelectOne',
          parameter_label: 'Office',
          parameter_variable: 'officeId'
        },
        {
          parameter_name: 'currencyIdSelectAll',
          parameter_label: 'Currency',
          parameter_variable: 'currencyId'
        }
      ])
    );

    assert.equal(metadata.find((entry) => entry.parameterName === 'endDateSelect')?.parameterDisplayType, 'date');
    assert.equal(metadata.find((entry) => entry.parameterName === 'officeIdSelectOne')?.selectOne, true);
    assert.equal(metadata.find((entry) => entry.parameterName === 'currencyIdSelectAll')?.selectAll, true);
  });
});

describe('mergeReportRunParameters', () => {
  it('uses professional labels when only the report definition is available', () => {
    const parameters = mergeReportRunParameters([], {
      id: 1,
      reportName: 'Balance Sheet Table',
      reportType: 'Table',
      coreReport: true,
      useReport: true,
      allowedReportTypes: [],
      allowedReportSubTypes: [],
      allowedParameters: [],
      reportParameters: [
        { parameterId: 2, parameterName: 'endDateSelect' },
        { parameterId: 5, parameterName: 'OfficeIdSelectOne' },
        { parameterId: 10, parameterName: 'currencyIdSelectAll' }
      ]
    });

    assert.deepEqual(
      parameters.map((parameter) => parameter.parameterLabel),
      ['End Date', 'Branch', 'Currency']
    );
  });

  it('uses stretchy labels for Balance Sheet Table SQL binding names', () => {
    const parameters = mergeReportRunParameters([], {
      id: 1,
      reportName: 'Balance Sheet Table',
      reportType: 'Table',
      coreReport: true,
      useReport: true,
      allowedReportTypes: [],
      allowedReportSubTypes: [],
      allowedParameters: [],
      reportParameters: [
        { parameterId: 10, parameterName: 'currencyIdSelectAll', reportParameterName: 'currencyId', parameterLabel: 'Currency' },
        { parameterId: 1009, parameterName: 'asOnDate', reportParameterName: 'date', parameterLabel: 'As On Date' },
        { parameterId: 5, parameterName: 'OfficeIdSelectOne', reportParameterName: 'branch', parameterLabel: 'Branch' }
      ]
    });

    assert.deepEqual(
      parameters.map((parameter) => parameter.parameterLabel),
      ['Currency', 'As On Date', 'Branch']
    );
    assert.deepEqual(
      parameters.map((parameter) => parameter.parameterVariable),
      ['currencyId', 'asOn', 'officeId']
    );
  });

  it('uses metadata variables when parameter metadata is available', () => {
    const parameters = mergeReportRunParameters(
      [
        {
          parameterName: 'OfficeIdSelectOne',
          parameterLabel: 'Branch',
          parameterVariable: 'officeId',
          selectOne: true
        },
        {
          parameterName: 'asOnDate',
          parameterLabel: 'As On Date',
          parameterVariable: 'asOn',
          parameterDisplayType: 'date'
        }
      ],
      {
        id: 1,
        reportName: 'Balance Sheet Table',
        reportType: 'Table',
        coreReport: true,
        useReport: true,
        allowedReportTypes: [],
        allowedReportSubTypes: [],
        allowedParameters: [],
        reportParameters: [
          { parameterId: 5, parameterName: 'OfficeIdSelectOne', reportParameterName: 'branch' },
          { parameterId: 1009, parameterName: 'asOnDate', reportParameterName: 'date' }
        ]
      }
    );

    assert.deepEqual(
      parameters.map((parameter) => parameter.parameterVariable),
      ['officeId', 'asOn']
    );
  });
});

describe('formatReportRunDateValue', () => {
  it('keeps ISO dates for stretchy report query params', () => {
    assert.equal(formatReportRunDateValue('2026-07-01'), '2026-07-01');
  });

  it('converts Fineract display dates to ISO', () => {
    assert.equal(formatReportRunDateValue('01 July 2026'), '2026-07-01');
  });
});

describe('formatReportRunParameterValues', () => {
  it('formats Balance Sheet Table parameters for Fineract input validation', () => {
    const formatted = formatReportRunParameterValues(
      [
        {
          parameterName: 'OfficeIdSelectOne',
          parameterVariable: 'officeId',
          parameterFormatType: 'number',
          selectOne: true
        },
        {
          parameterName: 'asOnDate',
          parameterVariable: 'asOn',
          parameterDisplayType: 'date',
          parameterFormatType: 'date'
        },
        {
          parameterName: 'currencyIdSelectAll',
          parameterVariable: 'currencyId',
          parameterFormatType: 'number',
          selectAll: true
        }
      ],
      {
        officeId: '1',
        asOn: '01 July 2026',
        currencyId: 'USD'
      }
    );

    assert.deepEqual(formatted, {
      officeId: '1',
      asOn: '2026-07-01',
      currencyId: 'USD'
    });
  });
});

describe('buildReportRunQueryParams', () => {
  it('prefixes stretchy variables and adds locale metadata for ISO dates', () => {
    assert.deepEqual(
      buildReportRunQueryParams({
        officeId: '1',
        asOn: '2026-07-01',
        currencyId: '-1'
      }),
      {
        R_officeId: '1',
        R_asOn: '2026-07-01',
        R_currencyId: '-1',
        locale: 'en',
        dateFormat: 'yyyy-MM-dd'
      }
    );
  });
});
