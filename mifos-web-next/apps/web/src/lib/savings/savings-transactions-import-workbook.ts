/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as XLSX from 'xlsx';
import { toFineractDate } from '@/lib/fineract/dates';
import {
  SAVINGS_TRANSACTION_IMPORT_TYPES,
  SAVINGS_TRANSACTIONS_IMPORT_COLUMNS,
  SAVINGS_TRANSACTIONS_IMPORT_REQUIRED_COLUMNS,
  SAVINGS_TRANSACTIONS_IMPORT_SHEET_NAME,
  type SavingsTransactionImportPaymentType,
  type SavingsTransactionsImportColumn,
  type SavingsTransactionsImportWorkbookRawRow
} from '@/lib/savings/savings-transactions-import';

const HEADER_ALIASES: Record<string, SavingsTransactionsImportColumn> = {
  'CLIENT NAME': 'Client Name',
  CLIENTNAME: 'Client Name',
  CUSTOMER: 'Client Name',
  'CUSTOMER NAME': 'Client Name',
  'TRANSACTION TYPE': 'Transaction Type',
  TRANSACTIONTYPE: 'Transaction Type',
  AMOUNT: 'Amount',
  DATE: 'Date',
  'TRANSACTION DATE': 'Date',
  'PAYMENT TYPE': 'Payment Type',
  PAYMENTTYPE: 'Payment Type',
  'ACCOUNT NO': 'Account No',
  ACCOUNTNO: 'Account No',
  'ACCOUNT NUMBER': 'Account No',
  ACCOUNTNUMBER: 'Account No',
  'CHECK NO': 'Check No',
  CHECKNO: 'Check No',
  'CHEQUE NO': 'Check No',
  CHEQUENO: 'Check No',
  'ROUTING CODE': 'Routing Code',
  ROUTINGCODE: 'Routing Code',
  'RECEIPT NO': 'Receipt No',
  RECEIPTNO: 'Receipt No',
  'BANK NO': 'Bank No',
  BANKNO: 'Bank No',
  NOTE: 'Note'
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/\*/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function mapHeader(value: unknown): SavingsTransactionsImportColumn | null {
  const spaced = normalizeHeader(value);
  const compact = spaced.replace(/[\s_]+/g, '');
  return HEADER_ALIASES[spaced] ?? HEADER_ALIASES[compact] ?? null;
}

function serializeCell(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toFineractDate(value);
  }
  return value;
}

function isBlankRow(values: Partial<Record<SavingsTransactionsImportColumn, unknown>>): boolean {
  return SAVINGS_TRANSACTIONS_IMPORT_COLUMNS.every((column) => {
    const value = values[column];
    return value == null || String(value).trim() === '';
  });
}

export function buildSavingsTransactionsImportTemplateWorkbook(
  paymentTypes: SavingsTransactionImportPaymentType[]
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const dataSheet = XLSX.utils.aoa_to_sheet([[...SAVINGS_TRANSACTIONS_IMPORT_COLUMNS]]);
  XLSX.utils.book_append_sheet(workbook, dataSheet, SAVINGS_TRANSACTIONS_IMPORT_SHEET_NAME);

  const paymentTypeNames = paymentTypes.map((option) => option.name);
  const lookupSections: Array<[string, string[]]> = [
    ['Payment Types', paymentTypeNames],
    ['Transaction Types', [...SAVINGS_TRANSACTION_IMPORT_TYPES]]
  ];
  const maxLen = Math.max(1, ...lookupSections.map(([, values]) => values.length));
  const lookupMatrix: string[][] = [
    lookupSections.map(([title]) => title),
    ...Array.from({ length: maxLen }, (_, rowIndex) =>
      lookupSections.map(([, values]) => values[rowIndex] ?? '')
    )
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(lookupMatrix), 'Lookups');

  const written = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as number[];
  return new Uint8Array(written).buffer;
}

export function parseSavingsTransactionsImportWorkbook(
  data: ArrayBuffer
):
  | { ok: true; rows: SavingsTransactionsImportWorkbookRawRow[] }
  | { ok: false; message: string } {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array', cellDates: true });
  } catch {
    return { ok: false, message: 'Could not read the Excel file.' };
  }

  const sheetName =
    workbook.SheetNames.find(
      (name) => name.trim().toLowerCase() === SAVINGS_TRANSACTIONS_IMPORT_SHEET_NAME.toLowerCase()
    ) ?? workbook.SheetNames[0];
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
  const columnIndex = new Map<SavingsTransactionsImportColumn, number>();
  headerRow.forEach((cell, index) => {
    const mapped = mapHeader(cell);
    if (mapped && !columnIndex.has(mapped)) {
      columnIndex.set(mapped, index);
    }
  });

  const missing = SAVINGS_TRANSACTIONS_IMPORT_REQUIRED_COLUMNS.filter(
    (column) => !columnIndex.has(column)
  );
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing required column(s): ${missing.join(', ')}. Download the template and keep its header row.`
    };
  }

  const rows: SavingsTransactionsImportWorkbookRawRow[] = [];
  for (let index = 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    const values: Partial<Record<SavingsTransactionsImportColumn, unknown>> = {};
    for (const column of SAVINGS_TRANSACTIONS_IMPORT_COLUMNS) {
      const colIndex = columnIndex.get(column);
      if (colIndex == null) {
        continue;
      }
      values[column] = serializeCell(row[colIndex]);
    }
    if (isBlankRow(values)) {
      continue;
    }
    rows.push({ rowNumber: index + 1, values });
  }

  if (rows.length === 0) {
    return { ok: false, message: 'No transaction rows found in the Excel file.' };
  }

  return { ok: true, rows };
}

export async function parseSavingsTransactionsImportFile(
  file: File
): Promise<
  | { ok: true; rows: SavingsTransactionsImportWorkbookRawRow[] }
  | { ok: false; message: string }
> {
  try {
    const buffer = await file.arrayBuffer();
    return parseSavingsTransactionsImportWorkbook(buffer);
  } catch {
    return { ok: false, message: 'Could not read the selected file.' };
  }
}
