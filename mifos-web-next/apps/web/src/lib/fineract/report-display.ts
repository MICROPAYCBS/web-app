/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportAllowedParameter, FineractReportParameter } from '@mifos/api-client';
import { REPORT_CATEGORIES } from '@mifos/validation';

export { REPORT_CATEGORIES };

const SQL_OPTIONAL_REPORT_TYPES = new Set(['Pentaho', 'BIRT']);

export function formatReportCategory(value: string | undefined): string {
  if (!value || value === '(NULL)') {
    return '—';
  }
  return value;
}

export function yesNoLabel(value: boolean | undefined): string {
  return value ? 'Yes' : 'No';
}

export function isSqlDisabledForReportType(reportType: string): boolean {
  return SQL_OPTIONAL_REPORT_TYPES.has(reportType);
}

export function isSubTypeEnabledForReportType(reportType: string): boolean {
  return reportType === 'Chart';
}

export function allowedParameterLabel(
  allowedParameters: FineractReportAllowedParameter[],
  parameterId: number
): string {
  return (
    allowedParameters.find((parameter) => parameter.id === parameterId)?.parameterName ??
    String(parameterId)
  );
}

export function toReportParameterRows(
  parameters: FineractReportParameter[] | undefined,
  allowedParameters: FineractReportAllowedParameter[]
): Array<FineractReportParameter & { parameterName: string }> {
  return (parameters ?? []).map((parameter) => ({
    ...parameter,
    parameterName: allowedParameterLabel(allowedParameters, parameter.parameterId)
  }));
}
