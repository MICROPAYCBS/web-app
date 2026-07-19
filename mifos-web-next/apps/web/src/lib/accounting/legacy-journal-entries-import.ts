/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  areJournalEntryTotalsBalanced,
  JOURNAL_ENTRY_UNBALANCED_MESSAGE,
  parseAmount
} from '@mifos/domain';
import { format } from 'date-fns';
import {
  parseFineractDateString,
  toLocalCalendarDate
} from '@/lib/fineract/dates';

/** Static Excel template served from `apps/web/public`. */
export const LEGACY_JOURNAL_ENTRIES_TEMPLATE_PATH = '/LegacyTemplate.xlsx';

export const LEGACY_JOURNAL_ENTRIES_TEMPLATE_FILENAME = 'LegacyTemplate.xlsx';

/**
 * Header row in `LegacyTemplate.xlsx` (columns A–G).
 * `ACCT TYPE` is present in the template but ignored during import for now.
 */
export const LEGACY_JOURNAL_ENTRY_COLUMNS = [
  'ACCT TYPE',
  'ACCT_NO',
  'Amount',
  'DEBIT/CREDIT',
  'REFERENCE',
  'COMMENT',
  'EFFECTIVE DATE'
] as const;

export type LegacyJournalEntryColumn = (typeof LEGACY_JOURNAL_ENTRY_COLUMNS)[number];

/** Columns used when import parsing is implemented (`ACCT TYPE` is ignored). */
export const LEGACY_JOURNAL_ENTRY_IMPORTED_COLUMNS = [
  'ACCT_NO',
  'Amount',
  'DEBIT/CREDIT',
  'REFERENCE',
  'COMMENT',
  'EFFECTIVE DATE'
] as const satisfies readonly Exclude<LegacyJournalEntryColumn, 'ACCT TYPE'>[];

/**
 * Strict ACCT_NO mask: exactly 10 digits, read left-to-right as:
 * branch id (2) + department id (2) + GL code (6).
 * Branch/department segments are numeric ids (`01` → id 1), not alphanumeric codes.
 */
export const LEGACY_ACCT_NO_MASK = /^\d{10}$/;

export const LEGACY_ACCT_NO_BRANCH_LENGTH = 2;
export const LEGACY_ACCT_NO_DEPARTMENT_LENGTH = 2;
export const LEGACY_ACCT_NO_GL_LENGTH = 6;
export const LEGACY_ACCT_NO_LENGTH =
  LEGACY_ACCT_NO_BRANCH_LENGTH + LEGACY_ACCT_NO_DEPARTMENT_LENGTH + LEGACY_ACCT_NO_GL_LENGTH;

/** Department segment value meaning “no department” (skip department lookup). */
export const LEGACY_ACCT_NO_NO_DEPARTMENT_CODE = '00';

export function isLegacyDepartmentIgnored(departmentCode: string): boolean {
  return parseLegacyIdSegment(departmentCode) === 0;
}

export type ParsedLegacyAccountNumber = {
  /** Raw 10-digit account number. */
  accountNumber: string;
  /** 2-digit branch id segment (maps to office `id`, e.g. `01` → 1). */
  branchCode: string;
  /** 2-digit department id segment (maps to department `id`; `00` = ignore). */
  departmentCode: string;
  /** 6-digit GL account code (`glCode`). */
  glCode: string;
};

export type LegacyAccountNumberParseError = {
  ok: false;
  message: string;
};

export type LegacyAccountNumberParseSuccess = {
  ok: true;
  value: ParsedLegacyAccountNumber;
};

export type LegacyAccountNumberParseResult =
  | LegacyAccountNumberParseSuccess
  | LegacyAccountNumberParseError;

/**
 * Normalize spreadsheet cell text: trim and strip hyphens / spaces / separators
 * (e.g. `01-03-456789` → `0103456789`) before the 10-digit mask applies.
 */
export function normalizeLegacyAccountNumberInput(value: unknown): string {
  if (value == null) {
    return '';
  }
  return String(value)
    .trim()
    .replace(/[\s\-_/\u2010-\u2015\u2212]/g, '');
}

/**
 * Parse and validate a legacy account number against the strict 10-digit mask.
 * Layout: `BBDDGGGGGG` → branch id / department id / GL code.
 */
export function parseLegacyAccountNumber(value: unknown): LegacyAccountNumberParseResult {
  const accountNumber = normalizeLegacyAccountNumberInput(value);
  if (!accountNumber) {
    return { ok: false, message: 'Account number is required.' };
  }
  if (!LEGACY_ACCT_NO_MASK.test(accountNumber)) {
    return {
      ok: false,
      message: `Account number must be exactly ${LEGACY_ACCT_NO_LENGTH} digits (branch id 2 + department id 2 + GL code 6).`
    };
  }

  const branchCode = accountNumber.slice(0, LEGACY_ACCT_NO_BRANCH_LENGTH);
  const departmentCode = accountNumber.slice(
    LEGACY_ACCT_NO_BRANCH_LENGTH,
    LEGACY_ACCT_NO_BRANCH_LENGTH + LEGACY_ACCT_NO_DEPARTMENT_LENGTH
  );
  const glCode = accountNumber.slice(LEGACY_ACCT_NO_BRANCH_LENGTH + LEGACY_ACCT_NO_DEPARTMENT_LENGTH);

  return {
    ok: true,
    value: {
      accountNumber,
      branchCode,
      departmentCode,
      glCode
    }
  };
}

function normalizeLookupCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Parse a numeric id segment (`01` → 1). Returns null if empty/invalid. */
export function parseLegacyIdSegment(segment: string): number | null {
  const trimmed = segment.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const id = Number(trimmed);
  return Number.isFinite(id) && id >= 0 ? id : null;
}

/** Match GL codes allowing leading-zero differences for numeric codes (e.g. `3` ↔ `03`). */
export function legacyCodesMatch(expected: string, actual: string | null | undefined): boolean {
  if (actual == null) {
    return false;
  }
  const left = normalizeLookupCode(expected);
  const right = normalizeLookupCode(actual);
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  if (/^\d+$/.test(left) && /^\d+$/.test(right)) {
    return Number(left) === Number(right);
  }
  return false;
}

export function findOfficeByIdSegment<T extends { id: number }>(
  offices: T[],
  branchSegment: string
): T | undefined {
  const id = parseLegacyIdSegment(branchSegment);
  if (id == null || id <= 0) {
    return undefined;
  }
  return offices.find((office) => office.id === id);
}

/** @deprecated Use {@link findOfficeByIdSegment}. */
export const findOfficeByBranchCode = findOfficeByIdSegment;

export function findDepartmentByIdSegment<
  T extends { id: number; officeId?: number; active?: boolean }
>(departments: T[], departmentSegment: string, officeId?: number): T | undefined {
  const id = parseLegacyIdSegment(departmentSegment);
  if (id == null || id <= 0) {
    return undefined;
  }
  return departments.find((department) => {
    if (department.active === false) {
      return false;
    }
    if (department.id !== id) {
      return false;
    }
    if (officeId != null && department.officeId != null && department.officeId !== officeId) {
      return false;
    }
    return true;
  });
}

/** @deprecated Use {@link findDepartmentByIdSegment}. */
export const findDepartmentByCode = findDepartmentByIdSegment;

export function findGlAccountByCode<T extends { id: number; glCode: string }>(
  glAccounts: T[],
  glCode: string
): T | undefined {
  return glAccounts.find((account) => legacyCodesMatch(glCode, account.glCode));
}

export type ResolveLegacyAccountNumberContext<
  TOffice extends { id: number },
  TDepartment extends { id: number; officeId?: number; active?: boolean },
  TGlAccount extends { id: number; glCode: string }
> = {
  offices: TOffice[];
  departments: TDepartment[];
  glAccounts: TGlAccount[];
};

export type ResolvedLegacyAccountNumber<
  TOffice extends { id: number },
  TDepartment extends { id: number; officeId?: number; active?: boolean },
  TGlAccount extends { id: number; glCode: string }
> = {
  parsed: ParsedLegacyAccountNumber;
  office: TOffice;
  /** Absent when department segment is `00` (ignored). */
  department?: TDepartment;
  glAccount: TGlAccount;
};

export function resolveLegacyAccountNumber<
  TOffice extends { id: number },
  TDepartment extends { id: number; officeId?: number; active?: boolean },
  TGlAccount extends { id: number; glCode: string }
>(
  value: unknown,
  context: ResolveLegacyAccountNumberContext<TOffice, TDepartment, TGlAccount>
):
  | { ok: true; value: ResolvedLegacyAccountNumber<TOffice, TDepartment, TGlAccount> }
  | { ok: false; message: string } {
  const parsed = parseLegacyAccountNumber(value);
  if (!parsed.ok) {
    return parsed;
  }

  const office = findOfficeByIdSegment(context.offices, parsed.value.branchCode);
  if (!office) {
    return {
      ok: false,
      message: `No branch found for id ${Number(parsed.value.branchCode)}.`
    };
  }

  let department: TDepartment | undefined;
  if (!isLegacyDepartmentIgnored(parsed.value.departmentCode)) {
    department = findDepartmentByIdSegment(
      context.departments,
      parsed.value.departmentCode,
      office.id
    );
    if (!department) {
      return {
        ok: false,
        message: `No department found for id ${Number(parsed.value.departmentCode)} at branch id ${office.id}.`
      };
    }
  }

  const glAccount = findGlAccountByCode(context.glAccounts, parsed.value.glCode);
  if (!glAccount) {
    return {
      ok: false,
      message: `No GL account found for code ${parsed.value.glCode}.`
    };
  }

  return {
    ok: true,
    value: {
      parsed: parsed.value,
      office,
      ...(department != null ? { department } : {}),
      glAccount
    }
  };
}

export type LegacyEntrySide = 'DR' | 'CR';

export type LegacyJournalEntryLineInput = {
  /** 1-based spreadsheet row for error messages. */
  rowNumber: number;
  accountNumber: string;
  amount: number;
  side: LegacyEntrySide;
  reference: string;
  comment?: string;
  /** Normalized ISO calendar date `yyyy-MM-dd`. */
  effectiveDate: string;
  officeId: number;
  departmentId?: number;
  glAccountId: number;
};

export type LegacyJournalEntryGroup = {
  key: string;
  effectiveDate: string;
  reference: string;
  lines: LegacyJournalEntryLineInput[];
};

/** Case-insensitive DR / CR (rejects Debit, Credit, D, C, blank). */
export function parseLegacyEntrySide(value: unknown):
  | { ok: true; value: LegacyEntrySide }
  | { ok: false; message: string } {
  const raw = value == null ? '' : String(value).trim().toUpperCase();
  if (raw === 'DR' || raw === 'CR') {
    return { ok: true, value: raw };
  }
  return {
    ok: false,
    message: 'Debit/Credit must be DR or CR.'
  };
}

export function parseLegacyAmount(value: unknown):
  | { ok: true; value: number }
  | { ok: false; message: string } {
  if (value == null || value === '') {
    return { ok: false, message: 'Amount is required.' };
  }
  const text =
    typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : String(value).trim().replace(/,/g, '');
  const decimal = parseAmount(text);
  if (!decimal) {
    return { ok: false, message: 'Amount must be a valid positive number.' };
  }
  if (decimal.lte(0)) {
    return { ok: false, message: 'Amount must be greater than zero.' };
  }
  return { ok: true, value: decimal.toNumber() };
}

/**
 * Normalize EFFECTIVE DATE to `yyyy-MM-dd` for grouping.
 * Accepts ISO dates, Fineract date strings, and Excel serial day numbers.
 */
export function parseLegacyEffectiveDate(value: unknown):
  | { ok: true; value: string }
  | { ok: false; message: string } {
  if (value == null || value === '') {
    return { ok: false, message: 'Effective date is required.' };
  }

  // xlsx with cellDates:true returns Date instances for Excel date cells.
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) {
      return { ok: false, message: 'Effective date is invalid.' };
    }
    return {
      ok: true,
      value: format(toLocalCalendarDate(value), 'yyyy-MM-dd')
    };
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(1899, 11, 30);
    date.setDate(date.getDate() + Math.round(value));
    if (!Number.isFinite(date.getTime())) {
      return { ok: false, message: 'Effective date is invalid.' };
    }
    return {
      ok: true,
      value: format(toLocalCalendarDate(date), 'yyyy-MM-dd')
    };
  }

  const text = String(value).trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (isoMatch) {
    return { ok: true, value: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` };
  }

  const slashMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return { ok: false, message: 'Effective date is invalid.' };
    }
    return { ok: true, value: format(date, 'yyyy-MM-dd') };
  }

  const fineract = parseFineractDateString(text);
  if (fineract) {
    return { ok: true, value: format(fineract, 'yyyy-MM-dd') };
  }

  return { ok: false, message: 'Effective date is invalid.' };
}

export function normalizeLegacyReference(value: unknown): string {
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

/** One journal entry per unique EFFECTIVE DATE + REFERENCE. */
export function legacyJournalEntryGroupKey(effectiveDate: string, reference: string): string {
  return `${effectiveDate}\u0000${normalizeLegacyReference(reference)}`;
}

export function groupLegacyJournalEntryLines(
  lines: LegacyJournalEntryLineInput[]
): LegacyJournalEntryGroup[] {
  const groups = new Map<string, LegacyJournalEntryGroup>();
  for (const line of lines) {
    const key = legacyJournalEntryGroupKey(line.effectiveDate, line.reference);
    const existing = groups.get(key);
    if (existing) {
      existing.lines.push(line);
      continue;
    }
    groups.set(key, {
      key,
      effectiveDate: line.effectiveDate,
      reference: normalizeLegacyReference(line.reference),
      lines: [line]
    });
  }
  return [...groups.values()];
}

export type LegacyJournalEntryGroupValidationIssue = {
  groupKey: string;
  effectiveDate: string;
  reference: string;
  message: string;
};

export function validateLegacyJournalEntryGroup(
  group: LegacyJournalEntryGroup
): LegacyJournalEntryGroupValidationIssue[] {
  const issues: LegacyJournalEntryGroupValidationIssue[] = [];
  const base = {
    groupKey: group.key,
    effectiveDate: group.effectiveDate,
    reference: group.reference
  };

  const debits = group.lines.filter((line) => line.side === 'DR');
  const credits = group.lines.filter((line) => line.side === 'CR');

  if (debits.length === 0) {
    issues.push({ ...base, message: 'Add at least one debit line (DR).' });
  }
  if (credits.length === 0) {
    issues.push({ ...base, message: 'Add at least one credit line (CR).' });
  }
  if (debits.length > 0 && credits.length > 0 && !areJournalEntryTotalsBalanced(debits, credits)) {
    issues.push({ ...base, message: JOURNAL_ENTRY_UNBALANCED_MESSAGE });
  }

  const officeIds = new Set(group.lines.map((line) => line.officeId));
  if (officeIds.size > 1) {
    issues.push({
      ...base,
      message: 'All lines in the same date and reference must belong to the same branch.'
    });
  }

  return issues;
}

export function validateLegacyJournalEntryGroups(
  lines: LegacyJournalEntryLineInput[]
): LegacyJournalEntryGroupValidationIssue[] {
  return groupLegacyJournalEntryLines(lines).flatMap(validateLegacyJournalEntryGroup);
}

export type LegacyImportLookupOffice = {
  id: number;
  name: string;
};

export type LegacyImportLookupDepartment = {
  id: number;
  departmentName: string;
  officeId?: number;
  active?: boolean;
};

export type LegacyImportLookupGlAccount = {
  id: number;
  glCode: string;
  name: string;
};

export type LegacyImportAnalyzedMatch = {
  accountNumber: string;
  branchId: number;
  branchName: string;
  departmentId?: number;
  departmentName?: string;
  departmentIgnored: boolean;
  glAccountId: number;
  glCode: string;
  glAccountName: string;
  amount: number;
  side: LegacyEntrySide;
  reference: string;
  comment?: string;
  effectiveDate: string;
};

export type LegacyImportAnalyzedRow = {
  rowNumber: number;
  rawAccountNumber: string;
  rawAmount: string;
  rawSide: string;
  rawReference: string;
  rawComment: string;
  rawEffectiveDate: string;
  errors: string[];
  match?: LegacyImportAnalyzedMatch;
  groupKey?: string;
  groupErrors: string[];
};

export type LegacyImportAnalysis = {
  rows: LegacyImportAnalyzedRow[];
  groups: LegacyJournalEntryGroup[];
  groupIssues: LegacyJournalEntryGroupValidationIssue[];
  validLineCount: number;
  errorRowCount: number;
  canPost: boolean;
};

function displayCell(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (value instanceof Date) {
    return format(value, 'yyyy-MM-dd');
  }
  return String(value).trim();
}

export function analyzeLegacyJournalImportRows(
  rawRows: Array<{
    rowNumber: number;
    values: Partial<Record<(typeof LEGACY_JOURNAL_ENTRY_COLUMNS)[number], unknown>>;
  }>,
  context: ResolveLegacyAccountNumberContext<
    LegacyImportLookupOffice,
    LegacyImportLookupDepartment,
    LegacyImportLookupGlAccount
  >
): LegacyImportAnalysis {
  const rows: LegacyImportAnalyzedRow[] = [];
  const validLines: LegacyJournalEntryLineInput[] = [];

  for (const rawRow of rawRows) {
    const values = rawRow.values;
    const errors: string[] = [];
    const rawAccountNumber = displayCell(values['ACCT_NO']);
    const rawAmount = displayCell(values.Amount);
    const rawSide = displayCell(values['DEBIT/CREDIT']);
    const rawReference = displayCell(values.REFERENCE);
    const rawComment = displayCell(values.COMMENT);
    const rawEffectiveDate = displayCell(values['EFFECTIVE DATE']);

    const sideResult = parseLegacyEntrySide(values['DEBIT/CREDIT']);
    if (!sideResult.ok) {
      errors.push(sideResult.message);
    }

    const amountResult = parseLegacyAmount(values.Amount);
    if (!amountResult.ok) {
      errors.push(amountResult.message);
    }

    const dateResult = parseLegacyEffectiveDate(values['EFFECTIVE DATE']);
    if (!dateResult.ok) {
      errors.push(dateResult.message);
    }

    const accountResult = resolveLegacyAccountNumber(values['ACCT_NO'], context);
    if (!accountResult.ok) {
      errors.push(accountResult.message);
    }

    const reference = normalizeLegacyReference(values.REFERENCE);
    const comment = rawComment || undefined;

    let match: LegacyImportAnalyzedMatch | undefined;
    let groupKey: string | undefined;

    if (errors.length === 0 && sideResult.ok && amountResult.ok && dateResult.ok && accountResult.ok) {
      const resolved = accountResult.value;
      match = {
        accountNumber: resolved.parsed.accountNumber,
        branchId: resolved.office.id,
        branchName: resolved.office.name,
        departmentId: resolved.department?.id,
        departmentName: resolved.department?.departmentName,
        departmentIgnored: isLegacyDepartmentIgnored(resolved.parsed.departmentCode),
        glAccountId: resolved.glAccount.id,
        glCode: resolved.glAccount.glCode,
        glAccountName: resolved.glAccount.name,
        amount: amountResult.value,
        side: sideResult.value,
        reference,
        comment,
        effectiveDate: dateResult.value
      };
      groupKey = legacyJournalEntryGroupKey(dateResult.value, reference);
      validLines.push({
        rowNumber: rawRow.rowNumber,
        accountNumber: resolved.parsed.accountNumber,
        amount: amountResult.value,
        side: sideResult.value,
        reference,
        comment,
        effectiveDate: dateResult.value,
        officeId: resolved.office.id,
        departmentId: resolved.department?.id,
        glAccountId: resolved.glAccount.id
      });
    }

    rows.push({
      rowNumber: rawRow.rowNumber,
      rawAccountNumber,
      rawAmount,
      rawSide,
      rawReference,
      rawComment,
      rawEffectiveDate,
      errors,
      match,
      groupKey,
      groupErrors: []
    });
  }

  const groups = groupLegacyJournalEntryLines(validLines);
  const groupIssues = validateLegacyJournalEntryGroups(validLines);
  const issuesByKey = new Map<string, string[]>();
  for (const issue of groupIssues) {
    const list = issuesByKey.get(issue.groupKey) ?? [];
    list.push(issue.message);
    issuesByKey.set(issue.groupKey, list);
  }

  for (const row of rows) {
    if (!row.groupKey) {
      continue;
    }
    row.groupErrors = issuesByKey.get(row.groupKey) ?? [];
  }

  const errorRowCount = rows.filter((row) => row.errors.length > 0 || row.groupErrors.length > 0).length;

  return {
    rows,
    groups,
    groupIssues,
    validLineCount: validLines.length,
    errorRowCount,
    canPost: rows.length > 0 && errorRowCount === 0 && groupIssues.length === 0 && validLines.length > 0
  };
}
