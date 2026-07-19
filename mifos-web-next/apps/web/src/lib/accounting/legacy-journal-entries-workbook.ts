/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as XLSX from 'xlsx';
import {
  LEGACY_JOURNAL_ENTRY_COLUMNS,
  type LegacyJournalEntryColumn
} from '@/lib/accounting/legacy-journal-entries-import';

export type LegacyWorkbookRawRow = {
  /** 1-based spreadsheet row number. */
  rowNumber: number;
  values: Partial<Record<LegacyJournalEntryColumn, unknown>>;
};

const HEADER_ALIASES: Record<string, LegacyJournalEntryColumn> = {
  'ACCT TYPE': 'ACCT TYPE',
  ACCTTYPE: 'ACCT TYPE',
  ACCT_NO: 'ACCT_NO',
  'ACCT NO': 'ACCT_NO',
  ACCOUNTNUMBER: 'ACCT_NO',
  'ACCOUNT NUMBER': 'ACCT_NO',
  AMOUNT: 'Amount',
  'DEBIT/CREDIT': 'DEBIT/CREDIT',
  'DEBIT / CREDIT': 'DEBIT/CREDIT',
  DEBITCREDIT: 'DEBIT/CREDIT',
  REFERENCE: 'REFERENCE',
  COMMENT: 'COMMENT',
  COMMENTS: 'COMMENT',
  'EFFECTIVE DATE': 'EFFECTIVE DATE',
  EFFECTIVEDATE: 'EFFECTIVE DATE',
  DATE: 'EFFECTIVE DATE'
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function mapHeader(value: unknown): LegacyJournalEntryColumn | null {
  const spaced = normalizeHeader(value);
  const compact = spaced.replace(/[\s_]+/g, '');
  return HEADER_ALIASES[spaced] ?? HEADER_ALIASES[compact] ?? null;
}

function isBlankRow(values: Partial<Record<LegacyJournalEntryColumn, unknown>>): boolean {
  return LEGACY_JOURNAL_ENTRY_COLUMNS.every((column) => {
    if (column === 'ACCT TYPE') {
      return true;
    }
    const value = values[column];
    return value == null || String(value).trim() === '';
  });
}

export function parseLegacyJournalEntriesWorkbook(
  data: ArrayBuffer
): { ok: true; rows: LegacyWorkbookRawRow[] } | { ok: false; message: string } {
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
  const columnIndex = new Map<LegacyJournalEntryColumn, number>();
  headerRow.forEach((cell, index) => {
    const mapped = mapHeader(cell);
    if (mapped && !columnIndex.has(mapped)) {
      columnIndex.set(mapped, index);
    }
  });

  const required: LegacyJournalEntryColumn[] = [
    'ACCT_NO',
    'Amount',
    'DEBIT/CREDIT',
    'REFERENCE',
    'EFFECTIVE DATE'
  ];
  const missing = required.filter((column) => !columnIndex.has(column));
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing required column(s): ${missing.join(', ')}.`
    };
  }

  const rows: LegacyWorkbookRawRow[] = [];
  for (let index = 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    const values: Partial<Record<LegacyJournalEntryColumn, unknown>> = {};
    for (const column of LEGACY_JOURNAL_ENTRY_COLUMNS) {
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
    return { ok: false, message: 'No data rows found in the Excel file.' };
  }

  return { ok: true, rows };
}

export async function parseLegacyJournalEntriesFile(
  file: File
): Promise<{ ok: true; rows: LegacyWorkbookRawRow[] } | { ok: false; message: string }> {
  try {
    const buffer = await file.arrayBuffer();
    return parseLegacyJournalEntriesWorkbook(buffer);
  } catch {
    return { ok: false, message: 'Could not read the selected file.' };
  }
}
