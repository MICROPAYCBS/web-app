/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertGlAccountFormInput } from '@mifos/validation';
import {
  GL_ACCOUNT_TYPE_ASSET,
  GL_ACCOUNT_TYPE_EQUITY,
  GL_ACCOUNT_TYPE_EXPENSE,
  GL_ACCOUNT_TYPE_INCOME,
  GL_ACCOUNT_TYPE_LIABILITY
} from '@/lib/accounting/gl-account-display';

export const CHART_OF_ACCOUNTS_IMPORT_NAME = 'Chart of Accounts';

export const CHART_OF_ACCOUNTS_IMPORT_PATH = '/accounting/chart-of-accounts/import';

export const GL_ACCOUNT_USAGE_DETAIL = 1;
export const GL_ACCOUNT_USAGE_HEADER = 2;

export const CHART_OF_ACCOUNTS_IMPORT_TEMPLATE_HINT =
  'Fill Type, Account Name, Usage, Allow Manual Entries, and GL Code for each row. Parent and Tag are optional. Header accounts are created before detail accounts.';

/** Fineract bulk-import template headers (mapped flexibly by name). */
export const CHART_OF_ACCOUNTS_IMPORT_COLUMNS = [
  'Type',
  'Account Name',
  'Usage',
  'Allow Manual Entries',
  'Parent',
  'Parent ID',
  'GL Code',
  'Tag',
  'Tag ID',
  'Description'
] as const;

export type ChartOfAccountsImportColumn = (typeof CHART_OF_ACCOUNTS_IMPORT_COLUMNS)[number];

export type ChartOfAccountsImportLookupAccount = {
  id: number;
  name: string;
  glCode: string;
  usageValue?: string;
  typeValue?: string;
};

export type ChartOfAccountsWorkbookRawRow = {
  /** 1-based spreadsheet row number. */
  rowNumber: number;
  values: Partial<Record<ChartOfAccountsImportColumn, unknown>>;
};

export type ChartOfAccountsImportAnalyzedRow = {
  rowNumber: number;
  type: string;
  accountName: string;
  usage: string;
  manualEntriesAllowed: string;
  parent: string;
  parentId: string;
  glCode: string;
  tag: string;
  tagId: string;
  description: string;
  errors: string[];
  warnings: string[];
};

export type ChartOfAccountsImportAnalysis = {
  rows: ChartOfAccountsImportAnalyzedRow[];
  rowCount: number;
  errorRowCount: number;
  warningRowCount: number;
  canCreate: boolean;
};

export type ChartOfAccountsImportPreparedRow = {
  rowNumber: number;
  accountName: string;
  glCode: string;
  typeLabel: string;
  usageLabel: string;
  input: UpsertGlAccountFormInput;
  /** Parent account name in the same import file. */
  parentNameInFile?: string;
  /** Parent GL code in the same import file. */
  parentGlCodeInFile?: string;
};

export type ChartOfAccountsImportRowProgressStatus =
  | 'pending'
  | 'creating'
  | 'success'
  | 'pending_approval'
  | 'failed';

export type ChartOfAccountsImportRowProgress = {
  status: ChartOfAccountsImportRowProgressStatus;
  message?: string;
  resourceId?: number;
};

const TYPE_LABELS: Record<string, number> = {
  ASSET: GL_ACCOUNT_TYPE_ASSET,
  LIABILITY: GL_ACCOUNT_TYPE_LIABILITY,
  EQUITY: GL_ACCOUNT_TYPE_EQUITY,
  INCOME: GL_ACCOUNT_TYPE_INCOME,
  EXPENSE: GL_ACCOUNT_TYPE_EXPENSE
};

const TYPE_ID_LABELS: Record<number, string> = {
  [GL_ACCOUNT_TYPE_ASSET]: 'Asset',
  [GL_ACCOUNT_TYPE_LIABILITY]: 'Liability',
  [GL_ACCOUNT_TYPE_EQUITY]: 'Equity',
  [GL_ACCOUNT_TYPE_INCOME]: 'Income',
  [GL_ACCOUNT_TYPE_EXPENSE]: 'Expense'
};

function cellText(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value).trim();
}

function normalizeKey(value: unknown): string {
  return cellText(value).replace(/\s+/g, ' ').toUpperCase();
}

function parseType(value: string): { ok: true; id: number; label: string } | { ok: false; message: string } {
  if (!value) {
    return { ok: false, message: 'Type is required.' };
  }

  const numeric = Number(value);
  if (Number.isInteger(numeric) && TYPE_ID_LABELS[numeric]) {
    return { ok: true, id: numeric, label: TYPE_ID_LABELS[numeric] };
  }

  const id = TYPE_LABELS[normalizeKey(value)];
  if (id) {
    return { ok: true, id, label: TYPE_ID_LABELS[id] };
  }

  return {
    ok: false,
    message: 'Type must be Asset, Liability, Equity, Income, or Expense.'
  };
}

function parseUsage(value: string): { ok: true; id: number; label: string } | { ok: false; message: string } {
  if (!value) {
    return { ok: false, message: 'Usage is required.' };
  }

  const normalized = normalizeKey(value);
  if (normalized === 'DETAIL' || normalized === '1') {
    return { ok: true, id: GL_ACCOUNT_USAGE_DETAIL, label: 'DETAIL' };
  }
  if (normalized === 'HEADER' || normalized === '2') {
    return { ok: true, id: GL_ACCOUNT_USAGE_HEADER, label: 'HEADER' };
  }

  return { ok: false, message: 'Usage must be DETAIL or HEADER.' };
}

function parseManualEntries(value: string): { ok: true; label: string } | { ok: false; message: string } {
  if (!value) {
    return { ok: false, message: 'Allow Manual Entries is required.' };
  }

  const normalized = normalizeKey(value);
  if (['TRUE', 'YES', 'Y', '1'].includes(normalized)) {
    return { ok: true, label: 'TRUE' };
  }
  if (['FALSE', 'NO', 'N', '0'].includes(normalized)) {
    return { ok: true, label: 'FALSE' };
  }

  return { ok: false, message: 'Allow Manual Entries must be TRUE or FALSE.' };
}

function glCodePrefixForType(typeId: number): string | undefined {
  switch (typeId) {
    case GL_ACCOUNT_TYPE_ASSET:
      return '1';
    case GL_ACCOUNT_TYPE_LIABILITY:
      return '2';
    case GL_ACCOUNT_TYPE_EQUITY:
      return '3';
    case GL_ACCOUNT_TYPE_INCOME:
      return '4';
    case GL_ACCOUNT_TYPE_EXPENSE:
      return '5';
    default:
      return undefined;
  }
}

export function analyzeChartOfAccountsImportRows(
  rawRows: ChartOfAccountsWorkbookRawRow[],
  existingAccounts: ChartOfAccountsImportLookupAccount[]
): ChartOfAccountsImportAnalysis {
  const accountsByGlCode = new Map(
    existingAccounts.map((account) => [account.glCode.trim(), account] as const)
  );
  const accountsById = new Map(existingAccounts.map((account) => [account.id, account] as const));
  const accountsByName = new Map(
    existingAccounts.map((account) => [account.name.trim().toLowerCase(), account] as const)
  );
  const glCodesInFile = new Map<string, number>();
  const accountNamesInFile = new Set(
    rawRows
      .map(({ values }) => cellText(values['Account Name']).toLowerCase())
      .filter((name) => name.length > 0)
  );
  const glCodesByAccountNameInFile = new Map(
    rawRows
      .map(({ values }) => {
        const name = cellText(values['Account Name']).toLowerCase();
        const glCode = cellText(values['GL Code']);
        return name && glCode ? ([name, glCode] as const) : null;
      })
      .filter((entry): entry is readonly [string, string] => entry != null)
  );

  const rows: ChartOfAccountsImportAnalyzedRow[] = rawRows.map(({ rowNumber, values }) => {
    const type = cellText(values.Type);
    const accountName = cellText(values['Account Name']);
    const usage = cellText(values.Usage);
    const manualEntriesAllowed = cellText(values['Allow Manual Entries']);
    const parent = cellText(values.Parent);
    const parentId = cellText(values['Parent ID']);
    const glCode = cellText(values['GL Code']);
    const tag = cellText(values.Tag);
    const tagId = cellText(values['Tag ID']);
    const description = cellText(values.Description);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!accountName) {
      errors.push('Account Name is required.');
    }

    const parsedType = parseType(type);
    if (!parsedType.ok) {
      errors.push(parsedType.message);
    }

    const parsedUsage = parseUsage(usage);
    if (!parsedUsage.ok) {
      errors.push(parsedUsage.message);
    }

    const parsedManualEntries = parseManualEntries(manualEntriesAllowed);
    if (!parsedManualEntries.ok) {
      errors.push(parsedManualEntries.message);
    }

    if (!glCode) {
      errors.push('GL Code is required.');
    } else {
      const duplicateRow = glCodesInFile.get(glCode);
      if (duplicateRow != null) {
        errors.push(`Duplicate GL Code in file (also on row ${duplicateRow}).`);
      } else {
        glCodesInFile.set(glCode, rowNumber);
      }

      if (accountsByGlCode.has(glCode)) {
        errors.push(`GL Code ${glCode} already exists in the chart of accounts.`);
      }

      if (parsedType.ok) {
        const expectedPrefix = glCodePrefixForType(parsedType.id);
        if (expectedPrefix && !glCode.startsWith(expectedPrefix)) {
          warnings.push(
            `${parsedType.label} accounts usually start with ${expectedPrefix}; this code starts differently.`
          );
        }
      }
    }

    if (!description) {
      warnings.push('Description is empty; the account name will be used when creating the account.');
    }

    if (parentId) {
      const numericParentId = Number(parentId);
      if (!Number.isFinite(numericParentId)) {
        errors.push('Parent ID must be a number.');
      } else {
        const parentAccount = accountsById.get(numericParentId);
        if (!parentAccount) {
          errors.push(`Parent ID ${numericParentId} was not found.`);
        } else if (parentAccount.usageValue !== 'HEADER') {
          errors.push(`Parent ID ${numericParentId} is not a header account.`);
        }
      }
    } else if (parent) {
      const parentKey = parent.toLowerCase();
      const parentInFile = accountNamesInFile.has(parentKey);
      const parentAccount = accountsByName.get(parentKey);
      if (!parentInFile && !parentAccount) {
        errors.push(`Parent "${parent}" was not found in the chart of accounts or this file.`);
      } else if (parentAccount && parentAccount.usageValue !== 'HEADER') {
        errors.push(`Parent "${parent}" is not a header account.`);
      } else if (parentInFile) {
        const parentGlCodeInFile = glCodesByAccountNameInFile.get(parentKey);
        if (parsedType.ok && parentGlCodeInFile) {
          const parentRowTypePrefix = glCodePrefixForType(parsedType.id);
          if (parentRowTypePrefix && !parentGlCodeInFile.startsWith(parentRowTypePrefix)) {
            warnings.push(`Parent "${parent}" in this file may belong to a different account class.`);
          }
        }
      }
    }

    if (tag && !tagId) {
      warnings.push('Tag is set without Tag ID. The import may ignore the tag name.');
    }

    if (tagId && !/^\d+$/.test(tagId)) {
      errors.push('Tag ID must be a whole number when provided.');
    }

    return {
      rowNumber,
      type,
      accountName,
      usage,
      manualEntriesAllowed,
      parent,
      parentId,
      glCode,
      tag,
      tagId,
      description,
      errors,
      warnings
    };
  });

  const errorRowCount = rows.filter((row) => row.errors.length > 0).length;
  const warningRowCount = rows.filter((row) => row.warnings.length > 0).length;

  return {
    rows,
    rowCount: rows.length,
    errorRowCount,
    warningRowCount,
    canCreate: rows.length > 0 && errorRowCount === 0
  };
}

export function prepareChartOfAccountsImportRows(
  analysis: ChartOfAccountsImportAnalysis,
  existingAccounts: ChartOfAccountsImportLookupAccount[]
): { ok: true; rows: ChartOfAccountsImportPreparedRow[] } | { ok: false; message: string } {
  if (!analysis.canCreate) {
    return { ok: false, message: 'Fix the highlighted rows before creating accounts.' };
  }

  const accountsById = new Map(existingAccounts.map((account) => [account.id, account] as const));
  const accountsByName = new Map(
    existingAccounts.map((account) => [account.name.trim().toLowerCase(), account] as const)
  );
  const glCodeByAccountNameInFile = new Map(
    analysis.rows.map((row) => [row.accountName.trim().toLowerCase(), row.glCode] as const)
  );

  const prepared: ChartOfAccountsImportPreparedRow[] = [];

  for (const row of analysis.rows) {
    const parsedType = parseType(row.type);
    const parsedUsage = parseUsage(row.usage);
    const parsedManualEntries = parseManualEntries(row.manualEntriesAllowed);

    if (!parsedType.ok || !parsedUsage.ok || !parsedManualEntries.ok) {
      return { ok: false, message: `Row ${row.rowNumber} has invalid data.` };
    }

    let parentId: number | undefined;
    let parentNameInFile: string | undefined;
    let parentGlCodeInFile: string | undefined;

    if (row.parentId) {
      parentId = Number(row.parentId);
    } else if (row.parent) {
      const parentKey = row.parent.trim().toLowerCase();
      const existingParent = accountsByName.get(parentKey);
      if (existingParent) {
        parentId = existingParent.id;
      } else {
        parentNameInFile = row.parent.trim();
        parentGlCodeInFile = glCodeByAccountNameInFile.get(parentKey);
        if (!parentGlCodeInFile) {
          return {
            ok: false,
            message: `Row ${row.rowNumber}: parent "${row.parent}" must appear earlier in the file or already exist.`
          };
        }
      }
    }

    const tagId = row.tagId ? Number(row.tagId) : undefined;

    prepared.push({
      rowNumber: row.rowNumber,
      accountName: row.accountName,
      glCode: row.glCode,
      typeLabel: parsedType.label,
      usageLabel: parsedUsage.label,
      parentNameInFile,
      parentGlCodeInFile,
      input: {
        type: parsedType.id,
        name: row.accountName,
        usage: parsedUsage.id,
        glCode: row.glCode,
        parentId,
        tagId: Number.isFinite(tagId) ? tagId : undefined,
        manualEntriesAllowed: parsedManualEntries.label === 'TRUE',
        description: row.description || row.accountName
      }
    });
  }

  return { ok: true, rows: orderChartOfAccountsImportRows(prepared) };
}

export function orderChartOfAccountsImportRows(
  rows: ChartOfAccountsImportPreparedRow[]
): ChartOfAccountsImportPreparedRow[] {
  const byGlCode = new Map(rows.map((row) => [row.input.glCode, row] as const));
  const sorted: ChartOfAccountsImportPreparedRow[] = [];
  const visited = new Set<string>();

  function visit(row: ChartOfAccountsImportPreparedRow) {
    if (visited.has(row.input.glCode)) {
      return;
    }

    if (row.parentGlCodeInFile) {
      const parentRow = byGlCode.get(row.parentGlCodeInFile);
      if (parentRow) {
        visit(parentRow);
      }
    }

    visited.add(row.input.glCode);
    sorted.push(row);
  }

  const seed = [...rows].sort((left, right) => {
    if (left.input.usage !== right.input.usage) {
      return right.input.usage - left.input.usage;
    }
    return left.rowNumber - right.rowNumber;
  });

  for (const row of seed) {
    visit(row);
  }

  return sorted;
}

export function resolveChartOfAccountsImportParentId(
  row: ChartOfAccountsImportPreparedRow,
  createdByGlCode: ReadonlyMap<string, number>,
  existingAccounts: ChartOfAccountsImportLookupAccount[]
): number | undefined {
  if (row.input.parentId != null) {
    return row.input.parentId;
  }

  if (row.parentGlCodeInFile) {
    const createdId = createdByGlCode.get(row.parentGlCodeInFile);
    if (createdId != null) {
      return createdId;
    }
    const existing = existingAccounts.find((account) => account.glCode === row.parentGlCodeInFile);
    return existing?.id;
  }

  if (row.parentNameInFile) {
    const existing = existingAccounts.find(
      (account) => account.name.trim().toLowerCase() === row.parentNameInFile!.trim().toLowerCase()
    );
    return existing?.id;
  }

  return undefined;
}
