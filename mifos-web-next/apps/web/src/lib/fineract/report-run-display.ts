/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportDetail,
  FineractReportListItem,
  FineractReportRunParameter,
  FineractReportRunParameterMetadata,
  FineractReportRunResult
} from '@mifos/api-client';
import { reportEngineParameterName } from '@mifos/domain';
import { parseFineractDateString } from '@/lib/fineract/dates';
import { fineractDateToIso } from '@/lib/fineract/date-input';

export function listRunnableReports(reports: FineractReportListItem[]): FineractReportListItem[] {
  return reports.filter((report) => report.useReport).sort((a, b) => a.reportName.localeCompare(b.reportName));
}

export function reportCatalogCategories(reports: FineractReportListItem[]): string[] {
  return Array.from(
    new Set(reports.map((report) => report.reportCategory?.trim() || 'Other'))
  ).sort((a, b) => a.localeCompare(b));
}

export function sanitizeReportRunRows(result: FineractReportRunResult | null | undefined): Record<string, unknown>[] {
  if (!result?.columnHeaders?.length || !Array.isArray(result.data)) {
    return [];
  }
  return result.data.map((entry) => {
    if (entry && typeof entry === 'object' && 'row' in entry && Array.isArray(entry.row)) {
      const rowValues = entry.row as unknown[];
      const row: Record<string, unknown> = {};
      result.columnHeaders.forEach((column, index) => {
        row[column.columnName] = rowValues[index];
      });
      return row;
    }
    return entry as Record<string, unknown>;
  });
}

function readMetadataField(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return undefined;
}

export function parseReportParameterMetadata(
  result: FineractReportRunResult | null | undefined
): FineractReportRunParameterMetadata[] {
  const metadata: FineractReportRunParameterMetadata[] = [];

  for (const row of sanitizeReportRunRows(result)) {
    const parameterName = String(
      readMetadataField(row, ['parameter_name', 'parameterName']) ?? ''
    ).trim();
    if (!parameterName) {
      continue;
    }

    const selectOneRaw = readMetadataField(row, ['selectOne']);
    const selectAllRaw = readMetadataField(row, ['selectAll']);
    const parameterLabel = String(
      readMetadataField(row, ['parameter_label', 'parameterLabel', 'label']) ?? parameterName
    );
    const parameterVariable = String(
      readMetadataField(row, ['parameter_variable', 'parameterVariable', 'variable']) ??
        parameterName
    );
    const parameterDisplayType = String(
      readMetadataField(row, ['parameter_displayType', 'parameterDisplayType', 'displayType']) ?? ''
    );
    const parameterFormatType = String(
      readMetadataField(row, ['parameter_FormatType', 'parameterFormatType', 'formatType']) ?? ''
    );
    const parameterType = String(readMetadataField(row, ['parameterType', 'parameter_type']) ?? '');
    const defaultVal = String(
      readMetadataField(row, ['parameter_default', 'parameterDefault', 'defaultVal']) ?? ''
    );
    const parentParameterName = String(
      readMetadataField(row, ['parentParameterName', 'parentParameter']) ?? ''
    ).trim();

    metadata.push({
      parameterName,
      parameterLabel,
      parameterVariable,
      parameterDisplayType: parameterDisplayType || undefined,
      parameterFormatType: parameterFormatType || undefined,
      parameterType: parameterType || undefined,
      defaultVal: defaultVal || undefined,
      selectOne: selectOneRaw === 'Y' || selectOneRaw === true,
      selectAll: selectAllRaw === 'Y' || selectAllRaw === true,
      parentParameterName: parentParameterName || undefined
    });
  }

  return metadata;
}

export function parseReportParameterOptions(
  result: FineractReportRunResult | null | undefined
): Array<{ id: string | number; name: string }> {
  return sanitizeReportRunRows(result).map((row) => {
    const values = Object.values(row);
    return {
      id: values[0] as string | number,
      name: String(values[1] ?? values[0] ?? '')
    };
  });
}

export function mergeReportRunParameters(
  metadata: FineractReportRunParameterMetadata[],
  definition?: FineractReportDetail
): FineractReportRunParameter[] {
  if (!metadata.length) {
    return (definition?.reportParameters ?? []).map((parameter) => {
      const parameterName = parameter.parameterName ?? String(parameter.parameterId);
      return {
        parameterName,
        parameterLabel: parameterName,
        parameterVariable:
          reportEngineParameterName(parameterName, parameter.reportParameterName) ?? parameterName,
        id: parameter.id,
        reportParameterName: parameter.reportParameterName
      };
    });
  }

  return metadata.map((meta) => {
    const reportParam = definition?.reportParameters?.find(
      (parameter) => parameter.parameterName === meta.parameterName
    );
    const catalogName = reportParam?.parameterName ?? meta.parameterName;
    return {
      ...reportParam,
      ...meta,
      id: reportParam?.id,
      parameterName: meta.parameterName,
      parameterLabel: meta.parameterLabel || reportParam?.parameterName || meta.parameterName,
      parameterVariable:
        meta.parameterVariable ||
        (catalogName
          ? reportEngineParameterName(catalogName, reportParam?.reportParameterName)
          : undefined) ||
        meta.parameterName,
      selectAll: Boolean(meta.selectAll),
      selectOne: Boolean(meta.selectOne),
      parentParameterName: meta.parentParameterName || undefined,
      reportParameterName: reportParam?.reportParameterName
    };
  });
}

const NUMERIC_COLUMN_TYPES = new Set([
  'decimal',
  'double',
  'float',
  'real',
  'numeric',
  'bigint',
  'integer',
  'smallint',
  'int',
  'long',
  'bigdecimal'
]);

export function isReportColumnNumeric(columnType: string): boolean {
  const normalized = columnType.toLowerCase();
  return NUMERIC_COLUMN_TYPES.has(normalized) || columnType === 'BigDecimal';
}

export function isReportColumnDate(columnType: string): boolean {
  const normalized = columnType.toLowerCase();
  return normalized.includes('date') || normalized === 'timestamp' || normalized === 'datetime';
}

export function formatReportRunCellValue(value: unknown, columnType: string): string {
  if (value == null || value === '') {
    return '—';
  }

  if (isReportColumnDate(columnType)) {
    if (Array.isArray(value)) {
      const [year, month, day] = value.map(Number);
      if (year && month && day) {
        return fineractDateToIso(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
    }
    const parsed = parseFineractDateString(String(value));
    if (parsed) {
      return fineractDateToIso(String(value)) || String(value);
    }
    return String(value);
  }

  if (isReportColumnNumeric(columnType)) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return String(value);
    }
    if (columnType.toLowerCase() === 'integer' || columnType.toLowerCase() === 'int') {
      return new Intl.NumberFormat().format(number);
    }
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  }

  return String(value);
}

export function isTabularReportType(reportType: string): boolean {
  return reportType === 'Table' || reportType === 'SMS';
}

export function buildReportRunQueryParams(values: Record<string, string>): Record<string, string> {
  const queryParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!value) {
      continue;
    }
    queryParams[key.startsWith('R_') ? key : `R_${key}`] = value;
  }
  return queryParams;
}
