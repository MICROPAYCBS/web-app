/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as XLSX from 'xlsx';
import {
  CLIENTS_IMPORT_COLUMNS,
  CLIENTS_IMPORT_SHEET_NAME,
  type ClientsImportColumn,
  type ClientsImportLookups,
  type ClientsImportWorkbookRawRow
} from '@/lib/clients/clients-import';
import {
  CLIENTS_LEGACY_IMPORT_COLUMNS,
  CLIENTS_LEGACY_IMPORT_SHEET_ENTITY,
  CLIENTS_LEGACY_IMPORT_SHEET_PERSON,
  type ClientsLegacyImportColumn,
  type ClientsLegacyImportLegalForm,
  type ClientsLegacyImportWorkbookRawRow
} from '@/lib/clients/clients-import-legacy';

const HEADER_ALIASES: Record<string, ClientsImportColumn> = {
  'FIRST NAME': 'First Name',
  FIRSTNAME: 'First Name',
  'LAST NAME': 'Last Name',
  LASTNAME: 'Last Name',
  'MIDDLE NAME': 'Middle Name',
  MIDDLENAME: 'Middle Name',
  'EXTERNAL ID': 'External ID',
  EXTERNALID: 'External ID',
  MOBILE: 'Mobile',
  'MOBILE NUMBER': 'Mobile',
  'MOBILE NO': 'Mobile',
  'DATE OF BIRTH': 'Date of Birth',
  DOB: 'Date of Birth',
  'OFFICE NAME': 'Office Name',
  OFFICE: 'Office Name',
  'STAFF NAME': 'Staff Name',
  STAFF: 'Staff Name',
  'RELATIONSHIP OFFICER': 'Staff Name',
  'CUSTOMER CLASS': 'Customer Class',
  CUSTOMERCLASS: 'Customer Class',
  GENDER: 'Gender',
  NATIONALITY: 'Nationality',
  'MARITAL STATUS': 'Marital Status',
  MARITALSTATUS: 'Marital Status',
  ACTIVE: 'Active',
  'SUBMITTED ON': 'Submitted On',
  SUBMITTEDON: 'Submitted On',
  'ACTIVATION DATE': 'Activation Date',
  ACTIVATIONDATE: 'Activation Date',
  'ID TYPE': 'ID Type',
  IDTYPE: 'ID Type',
  'DOCUMENT TYPE': 'ID Type',
  'ID NUMBER': 'ID Number',
  IDNUMBER: 'ID Number',
  'DOCUMENT KEY': 'ID Number',
  'FAMILY FIRST NAME': 'Family First Name',
  FAMILYFIRSTNAME: 'Family First Name',
  'FAMILY LAST NAME': 'Family Last Name',
  FAMILYLASTNAME: 'Family Last Name',
  'FAMILY RELATIONSHIP': 'Family Relationship',
  FAMILYRELATIONSHIP: 'Family Relationship',
  'FAMILY GENDER': 'Family Gender',
  FAMILYGENDER: 'Family Gender',
  'FAMILY DATE OF BIRTH': 'Family Date of Birth',
  FAMILYDATEOFBIRTH: 'Family Date of Birth',
  'ADDRESS TYPE': 'Address Type',
  ADDRESSTYPE: 'Address Type',
  STREET: 'Street',
  CITY: 'City',
  COUNTRY: 'Country',
  'POSTAL CODE': 'Postal Code',
  POSTALCODE: 'Postal Code',
  'IS PRIMARY': 'Is Primary',
  ISPRIMARY: 'Is Primary',
  'IS ACTIVE': 'Is Active',
  ISACTIVE: 'Is Active'
};

const REQUIRED_COLUMNS: ClientsImportColumn[] = [
  'First Name',
  'Last Name',
  'Mobile',
  'Date of Birth',
  'Office Name',
  'Staff Name',
  'Customer Class',
  'Gender',
  'Nationality',
  'Marital Status',
  'Submitted On',
  'ID Type',
  'ID Number',
  'Family First Name',
  'Family Last Name',
  'Family Relationship',
  'Family Gender'
];

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function mapHeader(value: unknown): ClientsImportColumn | null {
  const spaced = normalizeHeader(value);
  const compact = spaced.replace(/[\s_]+/g, '');
  return HEADER_ALIASES[spaced] ?? HEADER_ALIASES[compact] ?? null;
}

function isBlankRow(values: Partial<Record<ClientsImportColumn, unknown>>): boolean {
  return CLIENTS_IMPORT_COLUMNS.every((column) => {
    const value = values[column];
    return value == null || String(value).trim() === '';
  });
}

function lookupNames(options: ClientsImportLookups[keyof ClientsImportLookups]): string[] {
  return options.map((option) => (option.code ? `${option.name} (${option.code})` : option.name));
}

export function buildClientsImportTemplateWorkbook(lookups: ClientsImportLookups): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  const customersSheet = XLSX.utils.aoa_to_sheet([
    [...CLIENTS_IMPORT_COLUMNS],
    // Example row left blank so users start on row 2
  ]);
  XLSX.utils.book_append_sheet(workbook, customersSheet, CLIENTS_IMPORT_SHEET_NAME);

  const lookupSections: Array<[string, string[]]> = [
    ['Offices', lookupNames(lookups.offices)],
    ['Staff', lookups.staff.map((s) => (s.officeName ? `${s.name} — ${s.officeName}` : s.name))],
    ['Customer Classes', lookupNames(lookups.customerClasses)],
    ['Genders', lookupNames(lookups.genders)],
    ['Nationalities', lookupNames(lookups.nationalities)],
    ['Marital Statuses', lookupNames(lookups.maritalStatuses)],
    ['ID Types', lookupNames(lookups.identityTypes)],
    ['Family Relationships', lookupNames(lookups.familyRelationships)],
    ['Address Types', lookupNames(lookups.addressTypes)],
    ['Countries', lookupNames(lookups.countries)]
  ];

  const maxLen = Math.max(1, ...lookupSections.map(([, values]) => values.length));
  const lookupMatrix: string[][] = [
    lookupSections.map(([title]) => title),
    ...Array.from({ length: maxLen }, (_, rowIndex) =>
      lookupSections.map(([, values]) => values[rowIndex] ?? '')
    )
  ];
  const lookupsSheet = XLSX.utils.aoa_to_sheet(lookupMatrix);
  XLSX.utils.book_append_sheet(workbook, lookupsSheet, 'Lookups');

  const written = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as number[];
  return new Uint8Array(written).buffer;
}

export function parseClientsImportWorkbook(
  data: ArrayBuffer
): { ok: true; rows: ClientsImportWorkbookRawRow[] } | { ok: false; message: string } {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array', cellDates: true });
  } catch {
    return { ok: false, message: 'Could not read the Excel file.' };
  }

  const sheetName =
    workbook.SheetNames.find((name) => name.trim().toLowerCase() === CLIENTS_IMPORT_SHEET_NAME.toLowerCase()) ??
    workbook.SheetNames[0];
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
  const columnIndex = new Map<ClientsImportColumn, number>();
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

  const rows: ClientsImportWorkbookRawRow[] = [];
  for (let index = 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    const values: Partial<Record<ClientsImportColumn, unknown>> = {};
    for (const column of CLIENTS_IMPORT_COLUMNS) {
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
    return { ok: false, message: 'No customer rows found in the Excel file.' };
  }

  return { ok: true, rows };
}

export async function parseClientsImportFile(
  file: File
): Promise<{ ok: true; rows: ClientsImportWorkbookRawRow[] } | { ok: false; message: string }> {
  try {
    const buffer = await file.arrayBuffer();
    return parseClientsImportWorkbook(buffer);
  } catch {
    return { ok: false, message: 'Could not read the selected file.' };
  }
}

/** Normalize Fineract ClientPerson headers (trailing spaces / asterisks). */
function normalizeLegacyHeaderKey(value: unknown): string {
  return String(value ?? '')
    .replace(/\*/g, '')
    .replace(/\?/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

const LEGACY_HEADER_ALIASES: Record<string, ClientsLegacyImportColumn> = {
  'FIRST NAME': 'First Name',
  FIRSTNAME: 'First Name',
  'LAST NAME': 'Last Name',
  LASTNAME: 'Last Name',
  'MIDDLE NAME': 'Middle Name',
  MIDDLENAME: 'Middle Name',
  NAME: 'Name',
  'OFFICE NAME': 'Office Name',
  OFFICENAME: 'Office Name',
  'STAFF NAME': 'Staff Name',
  STAFFNAME: 'Staff Name',
  'EXTERNAL ID': 'External ID',
  EXTERNALID: 'External ID',
  ACTIVE: 'Active',
  'SUBMITTED ON DATE': 'Submitted On Date',
  SUBMITTEDONDATE: 'Submitted On Date',
  'SUBMITTED ON': 'Submitted On Date',
  'ACTIVATION DATE': 'Activation Date',
  ACTIVATIONDATE: 'Activation Date',
  'MOBILE NUMBER': 'Mobile Number',
  MOBILENUMBER: 'Mobile Number',
  MOBILE: 'Mobile Number',
  'DATE OF BIRTH': 'Date of Birth',
  DATEOFBIRTH: 'Date of Birth',
  DOB: 'Date of Birth',
  'CLIENT TYPE': 'Client Type',
  CLIENTTYPE: 'Client Type',
  GENDER: 'Gender',
  'CLIENT CLASSIFICATION': 'Client Classification',
  CLIENTCLASSIFICATION: 'Client Classification',
  'IS A STAFF MEMEBER': 'Is Staff Member',
  'IS A STAFF MEMBER': 'Is Staff Member',
  ISSTAFFMEMBER: 'Is Staff Member',
  CONSTITUTION: 'Constitution',
  'INCORPORATION NUMBER': 'Incorporation Number',
  INCORPORATIONNUMBER: 'Incorporation Number',
  'INCORPORATION VALIDITY TILL DATE': 'Incorporation Validity Till Date',
  INCORPORATIONVALIDITYTILLDATE: 'Incorporation Validity Till Date',
  'MAIN BUSINESS LINE': 'Main Business Line',
  MAINBUSINESSLINE: 'Main Business Line',
  REMARKS: 'Remarks',
  'ADDRESS ENABLED': 'Address Enabled',
  ADDRESSENABLED: 'Address Enabled',
  'ADDRESS TYPE': 'Address Type',
  ADDRESSTYPE: 'Address Type',
  STREET: 'Street',
  'ADDRESS LINE 1': 'Address Line 1',
  ADDRESSLINE1: 'Address Line 1',
  'ADDRESS LINE 2': 'Address Line 2',
  ADDRESSLINE2: 'Address Line 2',
  'ADDRESS LINE 3': 'Address Line 3',
  ADDRESSLINE3: 'Address Line 3',
  CITY: 'City',
  'STATE/ PROVINCE': 'State / Province',
  'STATE / PROVINCE': 'State / Province',
  'STATE/PROVINCE': 'State / Province',
  STATEPROVINCE: 'State / Province',
  COUNTRY: 'Country',
  'POSTAL CODE': 'Postal Code',
  POSTALCODE: 'Postal Code',
  'IS ACTIVE ADDRESS': 'Is Active Address',
  ISACTIVEADDRESS: 'Is Active Address'
};

function legacyRequiredColumns(
  legalForm: ClientsLegacyImportLegalForm
): ClientsLegacyImportColumn[] {
  return legalForm === 'Entity' ? ['Name', 'Constitution'] : ['First Name', 'Last Name'];
}

function pickLegacySheetName(
  sheetNames: string[],
  legalForm: ClientsLegacyImportLegalForm
): string | undefined {
  const preferred =
    legalForm === 'Entity'
      ? CLIENTS_LEGACY_IMPORT_SHEET_ENTITY
      : CLIENTS_LEGACY_IMPORT_SHEET_PERSON;
  const needle = legalForm === 'Entity' ? 'entity' : 'person';
  return (
    sheetNames.find((name) => name.trim().toLowerCase() === preferred.toLowerCase()) ??
    sheetNames.find((name) => name.trim().toLowerCase().includes(needle)) ??
    sheetNames[0]
  );
}

function mapLegacyHeader(value: unknown): ClientsLegacyImportColumn | null {
  const spaced = normalizeLegacyHeaderKey(value);
  if (spaced.startsWith('ALL ') && spaced.includes('COMPULSORY')) {
    return null;
  }
  if (spaced.startsWith('LOOKUP ')) {
    return null;
  }
  const compact = spaced.replace(/[\s_/]+/g, '');
  return LEGACY_HEADER_ALIASES[spaced] ?? LEGACY_HEADER_ALIASES[compact] ?? null;
}

function isBlankLegacyRow(values: Partial<Record<ClientsLegacyImportColumn, unknown>>): boolean {
  return CLIENTS_LEGACY_IMPORT_COLUMNS.every((column) => {
    const value = values[column];
    return value == null || String(value).trim() === '';
  });
}

export function parseClientsLegacyImportWorkbook(
  data: ArrayBuffer,
  options?: { legalForm?: ClientsLegacyImportLegalForm }
): { ok: true; rows: ClientsLegacyImportWorkbookRawRow[] } | { ok: false; message: string } {
  const legalForm = options?.legalForm ?? 'Person';
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array', cellDates: true });
  } catch {
    return { ok: false, message: 'Could not read the Excel file.' };
  }

  const sheetName = pickLegacySheetName(workbook.SheetNames, legalForm);
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
  const columnIndex = new Map<ClientsLegacyImportColumn, number>();
  headerRow.forEach((cell, index) => {
    const mapped = mapLegacyHeader(cell);
    if (mapped && !columnIndex.has(mapped)) {
      columnIndex.set(mapped, index);
    }
  });

  const missing = legacyRequiredColumns(legalForm).filter((column) => !columnIndex.has(column));
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing required column(s): ${missing.join(', ')}. Download the legacy platform template and keep its header row.`
    };
  }

  const rows: ClientsLegacyImportWorkbookRawRow[] = [];
  for (let index = 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    const values: Partial<Record<ClientsLegacyImportColumn, unknown>> = {};
    for (const column of CLIENTS_LEGACY_IMPORT_COLUMNS) {
      const colIndex = columnIndex.get(column);
      if (colIndex == null) {
        continue;
      }
      values[column] = row[colIndex];
    }
    if (isBlankLegacyRow(values)) {
      continue;
    }
    rows.push({ rowNumber: index + 1, values });
  }

  if (rows.length === 0) {
    return { ok: false, message: 'No customer rows found in the Excel file.' };
  }

  return { ok: true, rows };
}

export async function parseClientsLegacyImportFile(
  file: File,
  options?: { legalForm?: ClientsLegacyImportLegalForm }
): Promise<{ ok: true; rows: ClientsLegacyImportWorkbookRawRow[] } | { ok: false; message: string }> {
  try {
    const buffer = await file.arrayBuffer();
    return parseClientsLegacyImportWorkbook(buffer, options);
  } catch {
    return { ok: false, message: 'Could not read the selected file.' };
  }
}
