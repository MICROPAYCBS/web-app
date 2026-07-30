/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as XLSX from 'xlsx';
import {
  CHART_OF_ACCOUNTS_IMPORT_COLUMNS,
  type ChartOfAccountsImportColumn,
  type ChartOfAccountsWorkbookRawRow
} from '@/lib/accounting/chart-of-accounts-import';

const HEADER_ALIASES: Record<string, ChartOfAccountsImportColumn> = {
  TYPE: 'Type',
  'ACCOUNT NAME': 'Account Name',
  ACCOUNTNAME: 'Account Name',
  USAGE: 'Usage',
  'ALLOW MANUAL ENTRIES': 'Allow Manual Entries',
  ALLOWMANUALENTRIES: 'Allow Manual Entries',
  PARENT: 'Parent',
  'PARENT ID': 'Parent ID',
  PARENTID: 'Parent ID',
  'GL CODE': 'GL Code',
  GLCODE: 'GL Code',
  TAG: 'Tag',
  'TAG ID': 'Tag ID',
  TAGID: 'Tag ID',
  DESCRIPTION: 'Description'
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function mapHeader(value: unknown): ChartOfAccountsImportColumn | null {
  const spaced = normalizeHeader(value);
  const compact = spaced.replace(/[\s_]+/g, '');
  return HEADER_ALIASES[spaced] ?? HEADER_ALIASES[compact] ?? null;
}

function isBlankRow(values: Partial<Record<ChartOfAccountsImportColumn, unknown>>): boolean {
  return CHART_OF_ACCOUNTS_IMPORT_COLUMNS.every((column) => {
    const value = values[column];
    return value == null || String(value).trim() === '';
  });
}

const REQUIRED_COLUMNS: ChartOfAccountsImportColumn[] = [
  'Type',
  'Account Name',
  'Usage',
  'Allow Manual Entries',
  'GL Code'
];

export function parseChartOfAccountsWorkbook(
  data: ArrayBuffer
): { ok: true; rows: ChartOfAccountsWorkbookRawRow[] } | { ok: false; message: string } {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array', cellDates: true });
  } catch {
    return { ok: false, message: 'Could not read the Excel file.' };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, message: 'The Excel file has no worksheets.' };
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { ok: false, message: 'The Excel file has no worksheets.' };
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: true
  });

  if (matrix.length === 0) {
    return { ok: false, message: 'The Excel file is empty.' };
  }

  const headerRow = matrix[0] ?? [];
  const columnIndex = new Map<ChartOfAccountsImportColumn, number>();
  headerRow.forEach((cell, index) => {
    const mapped = mapHeader(cell);
    if (mapped && !columnIndex.has(mapped)) {
      columnIndex.set(mapped, index);
    }
  });

  const missing = REQUIRED_COLUMNS.filter((column) => !columnIndex.has(column));
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing required column(s): ${missing.join(', ')}. Download the template and keep its header row.`
    };
  }

  const rows: ChartOfAccountsWorkbookRawRow[] = [];
  for (let index = 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    const values: Partial<Record<ChartOfAccountsImportColumn, unknown>> = {};
    for (const column of CHART_OF_ACCOUNTS_IMPORT_COLUMNS) {
      const colIndex = columnIndex.get(column);
      if (colIndex == null) {
        continue;
      }
      values[column] = row[colIndex];
    }
    if (isBlankRow(values)) {
      continue;
    }
    rows.push({ rowNumber: index + 1, values });
  }

  if (rows.length === 0) {
    return { ok: false, message: 'No account rows found in the Excel file.' };
  }

  return { ok: true, rows };
}

export async function parseChartOfAccountsImportFile(
  file: File
): Promise<{ ok: true; rows: ChartOfAccountsWorkbookRawRow[] } | { ok: false; message: string }> {
  try {
    const buffer = await file.arrayBuffer();
    return parseChartOfAccountsWorkbook(buffer);
  } catch {
    return { ok: false, message: 'Could not read the selected file.' };
  }
}
