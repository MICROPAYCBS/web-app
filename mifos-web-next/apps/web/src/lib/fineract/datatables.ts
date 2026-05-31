/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader } from '@mifos/api-client';

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
  return SYSTEM_FIELDS.includes(columnName) || ENTITY_ID_FIELDS.includes(columnName);
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
