/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export interface DatatableColumnValidationContext {
  columnName: string;
  columnDisplayType: string;
  isColumnNullable?: boolean;
  columnLength?: number | string;
  validationRegex?: string;
  validationExample?: string;
  validationMessage?: string;
  label?: string;
}

export const clientDatatableValuesSchema = z.record(z.unknown());

export type ClientDatatableValuesInput = z.infer<typeof clientDatatableValuesSchema>;

export interface DatatableColumnRule extends DatatableColumnValidationContext {
  controlName: string;
  label: string;
}

function isStringDatatableColumn(type: string): boolean {
  return type === 'STRING' || type === 'TEXT';
}

function datatableColumnMaxLength(column: DatatableColumnValidationContext): number | undefined {
  if (column.columnLength == null || column.columnLength === '') {
    return undefined;
  }
  const parsed = Number(column.columnLength);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function validateDatatableColumnValue(
  column: DatatableColumnValidationContext,
  raw: unknown
): string | undefined {
  const label = column.label ?? column.columnName;
  const value = raw === null || raw === undefined ? '' : String(raw).trim();

  if (!column.isColumnNullable && value === '') {
    return `${label} is required`;
  }
  if (value === '') {
    return undefined;
  }

  const maxLength = datatableColumnMaxLength(column);
  if (maxLength != null && value.length > maxLength) {
    return `${label} must be at most ${maxLength} characters`;
  }

  if (isStringDatatableColumn(column.columnDisplayType) && column.validationRegex?.trim()) {
    try {
      const regex = new RegExp(column.validationRegex);
      if (!regex.test(value)) {
        return column.validationMessage?.trim() || `${label} format is invalid`;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function validateClientDatatableValues(
  columns: DatatableColumnRule[],
  values: Record<string, unknown>
): { ok: true; data: Record<string, unknown> } | { ok: false; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  for (const column of columns) {
    const validationError = validateDatatableColumnValue(column, values[column.controlName]);
    if (validationError) {
      fieldErrors[column.controlName] = validationError;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, data: values };
}
