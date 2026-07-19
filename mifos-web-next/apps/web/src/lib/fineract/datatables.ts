/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader } from '@mifos/api-client';
import { validateDatatableColumnValue as validateDatatableColumnValueCore } from '@mifos/validation';
import {
  FINERACT_LOCALE,
  coerceFineractDateTime,
  formatFineractDateArray,
  formatFineractDateTimeArray
} from '@/lib/fineract/dates';

const SYSTEM_FIELDS = ['id', 'created_at', 'updated_at'];
const ENTITY_ID_FIELDS = [
  'client_id',
  'savings_account_id',
  'savings_transaction_id',
  'loan_id',
  'group_id',
  'center_id',
  'office_id',
  'product_loan_id',
  'savings_product_id',
  'share_product_id'
];

export function isSystemColumn(columnName: string): boolean {
  const normalized = columnName.trim().toLowerCase();
  return SYSTEM_FIELDS.includes(normalized) || ENTITY_ID_FIELDS.includes(normalized);
}

export function filterSystemColumns(
  columnHeaders: FineractDatatableColumnHeader[]
): FineractDatatableColumnHeader[] {
  return columnHeaders.filter((column) => !isSystemColumn(column.columnName));
}

export function getDatatableControlName(column: FineractDatatableColumnHeader): string {
  if (column.columnName.includes('_cd_')) {
    return column.columnName.split('_cd_')[0];
  }
  return column.columnName;
}

export function getDatatableCodeName(columnName: string): string | null {
  if (!columnName.includes('_cd_')) {
    return null;
  }
  const codeName = columnName.split('_cd_')[0]?.trim();
  return codeName || null;
}

export function toDatatableDisplayLabel(columnName: string): string {
  if (!columnName) {
    return '';
  }
  if (columnName.includes('_cd_')) {
    const parts = columnName.split('_cd_');
    if (parts.length > 1 && parts[1]?.trim()) {
      const displayWords = parts[1]
        .split('_')
        .filter((word) => word.trim() && word.toLowerCase() !== 'cd')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return displayWords || parts[1].trim();
    }
  }
  if (columnName.includes('_')) {
    return (
      columnName
        .split('_')
        .filter((word) => word.trim() && word.toLowerCase() !== 'cd')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || columnName
    );
  }
  return columnName;
}

export function isNumericColumn(type: string): boolean {
  return type === 'INTEGER' || type === 'DECIMAL';
}

export function isDateColumn(type: string): boolean {
  return type === 'DATE' || type === 'DATETIME';
}

export function isStringDatatableColumn(type: string): boolean {
  return type === 'STRING' || type === 'TEXT';
}

export function datatableColumnMaxLength(column: FineractDatatableColumnHeader): number | undefined {
  if (column.columnLength == null || column.columnLength === '') {
    return undefined;
  }
  const parsed = Number(column.columnLength);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function datatableColumnPlaceholder(column: FineractDatatableColumnHeader): string | undefined {
  const example = column.validationExample?.trim();
  return example || undefined;
}

/** Returns a user-facing validation error, or undefined when the value is valid. */
export function validateDatatableColumnValue(
  column: FineractDatatableColumnHeader,
  raw: unknown
): string | undefined {
  return validateDatatableColumnValueCore(
    {
      columnName: column.columnName,
      columnDisplayType: column.columnDisplayType,
      isColumnNullable: column.isColumnNullable,
      columnLength: column.columnLength,
      validationRegex: column.validationRegex,
      validationExample: column.validationExample,
      validationMessage: column.validationMessage,
      label: toDatatableDisplayLabel(column.columnName)
    },
    raw
  );
}

export function buildDatatableDataPayload(
  columns: FineractDatatableColumnHeader[],
  values: Record<string, unknown>,
  dateFormat: string,
  locale: string
): Record<string, unknown> {
  const output: Record<string, unknown> = { locale };
  let hasDate = false;

  for (const column of columns) {
    const controlName = getDatatableControlName(column);
    const raw = values[controlName];
    if (raw === '' || raw === undefined || raw === null) {
      continue;
    }
    if (isNumericColumn(column.columnDisplayType)) {
      output[column.columnName] = Number(raw);
    } else if (isDateColumn(column.columnDisplayType)) {
      output[column.columnName] = String(raw);
      hasDate = true;
    } else {
      output[column.columnName] = raw;
    }
  }

  if (hasDate) {
    output.dateFormat = dateFormat;
  }

  return output;
}

/** True when a datatable payload includes at least one user-entered column value. */
export function hasDatatablePayloadData(data: Record<string, unknown>): boolean {
  return Object.keys(data).some((key) => key !== 'locale' && key !== 'dateFormat');
}

const EMPTY_CELL = '—';

export function getDatatableCellRawValue(
  column: FineractDatatableColumnHeader,
  row: Record<string, unknown>
): unknown {
  const controlName = getDatatableControlName(column);
  return row[column.columnName] ?? row[controlName];
}

function formatDatatableBooleanValue(value: unknown): string {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return 'Yes';
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return 'No';
  }
  return EMPTY_CELL;
}

function resolveCodeLookupLabel(
  column: FineractDatatableColumnHeader,
  value: unknown
): string | null {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'object') {
    const lookup = value as { id?: number; value?: string; name?: string };
    if (lookup.value?.trim()) {
      return lookup.value.trim();
    }
    if (lookup.name?.trim()) {
      return lookup.name.trim();
    }
    if (lookup.id != null && column.columnValues?.length) {
      const match = column.columnValues.find((option) => option.id === lookup.id);
      if (match) {
        return match.value;
      }
    }
    return null;
  }

  const lookupId = Number(value);
  if (Number.isFinite(lookupId) && column.columnValues?.length) {
    const match = column.columnValues.find((option) => option.id === lookupId);
    if (match) {
      return match.value;
    }
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return null;
}

function formatDatatableDateValue(
  column: FineractDatatableColumnHeader,
  value: unknown
): string | null {
  const coerced = coerceFineractDateTime(value);
  if (coerced == null) {
    return null;
  }
  if (typeof coerced === 'number') {
    const date = new Date(coerced);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return column.columnDisplayType === 'DATETIME'
      ? new Intl.DateTimeFormat(FINERACT_LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(
          date
        )
      : new Intl.DateTimeFormat(FINERACT_LOCALE, { dateStyle: 'medium' }).format(date);
  }
  if (column.columnDisplayType === 'DATETIME') {
    return formatFineractDateTimeArray(coerced, FINERACT_LOCALE);
  }
  return formatFineractDateArray(coerced, FINERACT_LOCALE);
}

function formatDatatableNumericValue(
  column: FineractDatatableColumnHeader,
  value: unknown
): string | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (column.columnDisplayType === 'DECIMAL') {
    return new Intl.NumberFormat(FINERACT_LOCALE, {
      maximumFractionDigits: 10
    }).format(numeric);
  }
  return new Intl.NumberFormat(FINERACT_LOCALE, {
    maximumFractionDigits: 0
  }).format(numeric);
}

/** Format a raw API/form value for read-only datatable display. */
export function formatDatatableCellValue(value: unknown): string {
  if (value == null || value === '') {
    return EMPTY_CELL;
  }
  if (typeof value === 'object') {
    const obj = value as { value?: string; name?: string };
    return obj.value ?? obj.name ?? EMPTY_CELL;
  }
  return String(value);
}

/** Format a cell using column metadata so lookups, dates, and booleans read naturally. */
export function formatDatatableCellValueForColumn(
  column: FineractDatatableColumnHeader,
  value: unknown
): string {
  if (value == null || value === '') {
    return EMPTY_CELL;
  }

  switch (column.columnDisplayType) {
    case 'CODELOOKUP': {
      const label = resolveCodeLookupLabel(column, value);
      return label ?? formatDatatableCellValue(value);
    }
    case 'BOOLEAN':
      return formatDatatableBooleanValue(value);
    case 'DATE':
    case 'DATETIME': {
      const formatted = formatDatatableDateValue(column, value);
      return formatted ?? formatDatatableCellValue(value);
    }
    case 'INTEGER':
    case 'DECIMAL': {
      const formatted = formatDatatableNumericValue(column, value);
      return formatted ?? formatDatatableCellValue(value);
    }
    default:
      return formatDatatableCellValue(value);
  }
}
