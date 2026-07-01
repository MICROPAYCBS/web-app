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
import {
  inferReportParameterPresentation,
  isReportCurrencyCodeParameter,
  isReportParameterDate,
  isReportParameterNumeric,
  reportRunQueryParameterVariable,
  resolveReportParameterDisplayLabel
} from '@mifos/domain';
import { parseFineractDateString } from '@/lib/fineract/dates';
import { fineractDateToIso } from '@/lib/fineract/date-input';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

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

function normalizeMetadataRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

function readMetadataField(row: Record<string, unknown>, keys: string[]): unknown {
  const normalizedRow = normalizeMetadataRowKeys(row);
  for (const key of keys) {
    const value = normalizedRow[key.toLowerCase()];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function parseReportBooleanFlag(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  if (value === false || value === 0 || value == null) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized === 'y' ||
    normalized === 'yes' ||
    normalized === 'true' ||
    normalized === 't' ||
    normalized === '1'
  );
}

export function enrichReportParameterMetadata(
  meta: FineractReportRunParameterMetadata
): FineractReportRunParameterMetadata {
  const inferred = inferReportParameterPresentation(meta.parameterName, {
    parameterDisplayType: meta.parameterDisplayType,
    selectOne: meta.selectOne,
    selectAll: meta.selectAll
  });

  return {
    ...meta,
    parameterDisplayType: inferred.parameterDisplayType ?? meta.parameterDisplayType,
    selectOne: inferred.selectOne ?? meta.selectOne,
    selectAll: inferred.selectAll ?? meta.selectAll
  };
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
    const parameterLabel = resolveReportParameterDisplayLabel({
      parameterName,
      parameterLabel: String(
        readMetadataField(row, ['parameter_label', 'parameterLabel', 'label']) ?? ''
      )
    });
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

    metadata.push(
      enrichReportParameterMetadata({
        parameterName,
        parameterLabel,
        parameterVariable,
        parameterDisplayType: parameterDisplayType || undefined,
        parameterFormatType: parameterFormatType || undefined,
        parameterType: parameterType || undefined,
        defaultVal: defaultVal || undefined,
        selectOne: parseReportBooleanFlag(selectOneRaw),
        selectAll: parseReportBooleanFlag(selectAllRaw),
        parentParameterName: parentParameterName || undefined
      })
    );
  }

  return metadata;
}

export function parseReportParameterOptions(
  result: FineractReportRunResult | null | undefined
): Array<{ id: string | number; name: string }> {
  if (!result?.columnHeaders?.length || !Array.isArray(result.data)) {
    return [];
  }

  const idColumn = result.columnHeaders[0]?.columnName;
  const nameColumn = result.columnHeaders[1]?.columnName;
  if (!idColumn) {
    return [];
  }

  return sanitizeReportRunRows(result).map((row) => ({
    id: row[idColumn] as string | number,
    name: String(nameColumn ? row[nameColumn] : row[idColumn] ?? '')
  }));
}

export function mergeReportRunParameters(
  metadata: FineractReportRunParameterMetadata[],
  definition?: FineractReportDetail
): FineractReportRunParameter[] {
  if (!metadata.length) {
    return (definition?.reportParameters ?? []).map((parameter) => {
      const parameterName = parameter.parameterName ?? String(parameter.parameterId);
      return {
        ...enrichReportParameterMetadata({
          parameterName,
          parameterLabel: resolveReportParameterDisplayLabel({
            parameterName,
            parameterLabel: parameter.parameterLabel,
            displayLabel: parameter.displayLabel,
            reportParameterName: parameter.reportParameterName
          }),
          parameterVariable:
            reportRunQueryParameterVariable(parameterName) ?? parameterName
        }),
        id: parameter.id,
        reportParameterName: parameter.reportParameterName
      };
    });
  }

  return metadata.map((meta) => {
    const reportParam = definition?.reportParameters?.find(
      (parameter) => parameter.parameterName === meta.parameterName
    );
    return {
      ...reportParam,
      ...enrichReportParameterMetadata({
        ...meta,
        parameterName: meta.parameterName,
        parameterLabel: resolveReportParameterDisplayLabel({
          parameterName: meta.parameterName,
          parameterLabel: meta.parameterLabel,
          displayLabel: reportParam?.displayLabel,
          reportParameterName: reportParam?.reportParameterName
        }),
        parameterVariable:
          reportRunQueryParameterVariable(meta.parameterName, meta.parameterVariable) ??
          meta.parameterName,
        selectAll: Boolean(meta.selectAll),
        selectOne: Boolean(meta.selectOne),
        parentParameterName: meta.parentParameterName || undefined
      }),
      id: reportParam?.id,
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

/** Table/SMS stretchy reports expect ISO dates in query params (legacy web-app parity). */
export const REPORT_RUN_DATE_FORMAT = 'yyyy-MM-dd';

export function formatReportRunDateValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return fineractDateToIso(trimmed) || trimmed;
}

export function coerceReportNumericParameterValue(value: string): string {
  const trimmed = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(-?\d+)/);
  return match?.[1] ?? trimmed;
}

export function formatReportRunParameterValues(
  parameters: FineractReportRunParameter[],
  values: Record<string, string>
): Record<string, string> {
  const formatted: Record<string, string> = {};

  for (const parameter of parameters) {
    const fieldName = parameter.parameterVariable || parameter.parameterName;
    const raw = values[fieldName];
    if (raw == null || raw === '') {
      continue;
    }

    if (isReportParameterDate(parameter)) {
      formatted[fieldName] = formatReportRunDateValue(raw);
      continue;
    }

    if (
      isReportParameterNumeric(parameter) &&
      !isReportCurrencyCodeParameter(parameter.parameterName, fieldName)
    ) {
      formatted[fieldName] = coerceReportNumericParameterValue(raw);
      continue;
    }

    formatted[fieldName] = raw.trim();
  }

  return formatted;
}

export function buildReportRunQueryParams(values: Record<string, string>): Record<string, string> {
  const queryParams: Record<string, string> = {};
  let includesDates = false;

  for (const [key, value] of Object.entries(values)) {
    if (!value) {
      continue;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      includesDates = true;
    }
    queryParams[key.startsWith('R_') ? key : `R_${key}`] = value;
  }

  if (includesDates) {
    queryParams.locale = FINERACT_LOCALE;
    queryParams.dateFormat = REPORT_RUN_DATE_FORMAT;
  }

  return queryParams;
}
